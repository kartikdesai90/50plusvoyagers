<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Database\Connection;
use Illuminate\Support\Facades\DB;
use Throwable;

/**
 * Moves this application's data from the MySQL database it used to live in
 * into the PostgreSQL one it lives in now.
 *
 * Two kinds of table arrive here and they are handled differently on purpose:
 *
 *   - Tables the migration files still describe are created by `artisan
 *     migrate` before this command runs, so their PostgreSQL shape is whatever
 *     Laravel itself would build. This command only fills them. That matters:
 *     introspecting a shape the framework already knows how to build is a
 *     second opinion nobody asked for, and the two opinions would eventually
 *     disagree.
 *
 *   - Tables left over from work that was reverted have no migration file, but
 *     they do have rows. Those are read out of MySQL's information schema and
 *     rebuilt here, because losing them would be losing data.
 *
 * Foreign keys are added only once every table is full, and sequences are set
 * from the data rather than left at one — a copied row carries its own id, and
 * a sequence that never saw it would hand the same id out again on the next
 * insert.
 */
class TransferMysqlToPostgres extends Command
{
    protected $signature = 'db:transfer-mysql
        {--source=mysql_legacy : The connection to read from}
        {--target=pgsql : The connection to write to}
        {--chunk=500 : Rows read per batch}
        {--skip-ephemeral : Leave sessions, cache and queue tables behind}
        {--pretend : Report what would move without writing anything}';

    protected $description = 'Copy every table and row from the legacy MySQL database into PostgreSQL';

    /**
     * Tables whose contents are per-installation rather than per-application.
     *
     * A session row is a browser's cookie, a cache row is a copy of something
     * that can be worked out again, and a queued job is addressed to a worker
     * that has already stopped listening. They are still copied by default —
     * "preserve everything" is the safer promise to keep — but `--skip-ephemeral`
     * is there for a cutover that would rather not resurrect old jobs.
     */
    private const EPHEMERAL = [
        'sessions',
        'cache',
        'cache_locks',
        'jobs',
        'job_batches',
        'failed_jobs',
    ];

    public function handle(): int
    {
        $source = DB::connection($this->option('source'));
        $target = DB::connection($this->option('target'));

        if ($source->getDriverName() !== 'mysql') {
            $this->error('The source connection is not MySQL.');

            return self::FAILURE;
        }

        if ($target->getDriverName() !== 'pgsql') {
            $this->error('The target connection is not PostgreSQL.');

            return self::FAILURE;
        }

        $schema = $source->getDatabaseName();
        $tables = $this->sourceTables($source, $schema);

        if ($tables === []) {
            $this->error("No tables found in the source database `{$schema}`.");

            return self::FAILURE;
        }

        $existing = $this->targetTables($target);
        $missing = array_values(array_diff($tables, $existing));

        $this->line(sprintf(
            'Source `%s`: %d tables. Target already has %d of them; %d to build.',
            $schema,
            count($tables),
            count($tables) - count($missing),
            count($missing),
        ));

        if ($this->option('pretend')) {
            foreach ($tables as $table) {
                $this->line(sprintf(
                    '  %-32s %8d rows  %s',
                    $table,
                    $source->table($table)->count(),
                    $this->option('skip-ephemeral') && in_array($table, self::EPHEMERAL, true)
                        ? '(skipped, ephemeral)'
                        : (in_array($table, $missing, true) ? '(build + copy)' : '(copy)'),
                ));
            }

            return self::SUCCESS;
        }

        /*
         * Build first, fill second, constrain third. A foreign key added before
         * the rows it points at exist would reject the very rows it was created
         * to protect, and the order rows arrive in is the source's, not one
         * chosen to satisfy a dependency graph.
         */
        foreach ($missing as $table) {
            $this->buildTable($source, $target, $schema, $table);
        }

        /*
         * A table the migrations still build can still have drifted: work that
         * was later reverted left `users` with columns no current migration
         * creates, and those columns hold data. Adding them back is the only
         * reading of "preserve everything" that is actually true — dropping a
         * populated column because no file describes it any more would be
         * losing data to tidy up a filing system.
         */
        foreach (array_diff($tables, $missing) as $table) {
            $this->reconcileColumns($source, $target, $schema, $table);
        }

        $copied = 0;
        $carrying = array_values(array_filter(
            $tables,
            fn (string $table) => !$this->option('skip-ephemeral') || !in_array($table, self::EPHEMERAL, true),
        ));

        $this->emptyTargets($target, $carrying);
        $enforcing = $this->suspendForeignKeys($target);

        try {
            foreach ($tables as $table) {
                if ($this->option('skip-ephemeral') && in_array($table, self::EPHEMERAL, true)) {
                    $this->line(sprintf('  %-32s skipped (ephemeral)', $table));

                    continue;
                }

                $copied += $this->copyTable($source, $target, $schema, $table);
            }
        } finally {
            $this->restoreForeignKeys($target, $enforcing);
        }

        foreach ($missing as $table) {
            $this->addForeignKeys($source, $target, $schema, $table);
        }

        $this->resetSequences($target);

        $this->newLine();
        $this->info("Transfer complete: {$copied} rows across ".count($tables).' tables.');

        return self::SUCCESS;
    }

    /* ------------------------------------------------------------ discovery */

    /** @return list<string> */
    private function sourceTables(Connection $source, string $schema): array
    {
        return array_map(
            fn (object $row) => (string) $row->name,
            $source->select(
                'select table_name as name from information_schema.tables
                 where table_schema = ? and table_type = \'BASE TABLE\'
                 order by table_name',
                [$schema],
            ),
        );
    }

    /** @return list<string> */
    private function targetTables(Connection $target): array
    {
        return array_map(
            fn (object $row) => (string) $row->name,
            $target->select(
                'select tablename as name from pg_tables where schemaname = current_schema()',
            ),
        );
    }

    /* ---------------------------------------------------------------- build */

    /**
     * Rebuild one MySQL table in PostgreSQL from its information schema entry.
     *
     * Only reached for tables no migration file describes any more. Anything
     * the framework still knows how to create has already been created by it.
     */
    private function buildTable(Connection $source, Connection $target, string $schema, string $table): void
    {
        $columns = $source->select(
            'select column_name as name, data_type as type, column_type as full_type,
                    is_nullable as nullable, column_default as `default`, extra as extra,
                    character_maximum_length as length
             from information_schema.columns
             where table_schema = ? and table_name = ?
             order by ordinal_position',
            [$schema, $table],
        );

        $definitions = [];

        foreach ($columns as $column) {
            $definitions[] = $this->columnDefinition($column);
        }

        foreach ($this->sourceIndexes($source, $schema, $table) as $index) {
            if ($index['name'] === 'PRIMARY') {
                $definitions[] = 'primary key ('.$this->quoteList($index['columns']).')';
            } elseif ($index['unique']) {
                $definitions[] = 'unique ('.$this->quoteList($index['columns']).')';
            }
        }

        $target->statement(sprintf(
            'create table %s (%s)',
            $this->quote($table),
            implode(', ', $definitions),
        ));

        // Non-unique indexes are separate statements in PostgreSQL, and the
        // unique ones are already carried by the constraints above.
        foreach ($this->sourceIndexes($source, $schema, $table) as $index) {
            if ($index['name'] === 'PRIMARY' || $index['unique']) {
                continue;
            }

            $target->statement(sprintf(
                'create index %s on %s (%s)',
                $this->quote($index['name']),
                $this->quote($table),
                $this->quoteList($index['columns']),
            ));
        }

        $this->line(sprintf('  %-32s built', $table));
    }

    /**
     * Give an already-built table any source column it is missing.
     *
     * Added nullable and without a default whatever the source said, because
     * the rows already in the destination — there are none yet, but a re-run
     * is a supported thing to do — cannot be asked for a value retroactively.
     * The source's own nullability is not lost: it is still enforced by
     * whatever wrote the data in the first place.
     */
    private function reconcileColumns(Connection $source, Connection $target, string $schema, string $table): void
    {
        $sourceColumns = $source->select(
            'select column_name as name, data_type as type, column_type as full_type,
                    is_nullable as nullable, column_default as `default`, extra as extra,
                    character_maximum_length as length
             from information_schema.columns
             where table_schema = ? and table_name = ?',
            [$schema, $table],
        );

        $present = array_keys($this->targetCasts($target, $table));

        foreach ($sourceColumns as $column) {
            if (in_array((string) $column->name, $present, true)) {
                continue;
            }

            $target->statement(sprintf(
                'alter table %s add column %s %s null',
                $this->quote($table),
                $this->quote((string) $column->name),
                $this->postgresType($column, false),
            ));

            $this->line(sprintf('  %-32s restored column %s', $table, $column->name));
        }
    }

    private function columnDefinition(object $column): string
    {
        $auto = str_contains(strtolower((string) $column->extra), 'auto_increment');
        $type = $this->postgresType($column, $auto);

        $definition = $this->quote((string) $column->name).' '.$type;

        if (strtolower((string) $column->nullable) === 'no') {
            $definition .= ' not null';
        }

        $default = $this->postgresDefault($column, $auto);

        if ($default !== null) {
            $definition .= ' default '.$default;
        }

        return $definition;
    }

    /**
     * The MySQL type this column has, said in PostgreSQL.
     *
     * The mapping deliberately matches what Laravel's own PostgreSQL grammar
     * produces for the equivalent Blueprint call, so a table rebuilt here and a
     * table a future migration creates come out the same shape.
     */
    private function postgresType(object $column, bool $auto): string
    {
        $type = strtolower((string) $column->type);
        $full = strtolower((string) $column->full_type);
        $length = $column->length !== null ? (int) $column->length : null;

        if ($auto) {
            return $type === 'bigint' ? 'bigserial' : 'serial';
        }

        return match (true) {
            // MySQL has no boolean; Laravel writes one as tinyint(1) and reads
            // it back as one, so that exact width is the signal.
            $full === 'tinyint(1)' => 'boolean',
            $type === 'tinyint', $type === 'smallint' => 'smallint',
            $type === 'mediumint', $type === 'int' => 'integer',
            $type === 'bigint' => 'bigint',
            $type === 'decimal', $type === 'numeric' => $this->numericType($full),
            $type === 'float' => 'real',
            $type === 'double' => 'double precision',
            $type === 'char' => 'char('.($length ?: 255).')',
            $type === 'varchar' => 'varchar('.($length ?: 255).')',
            // Every width of MySQL text is one unbounded PostgreSQL text.
            in_array($type, ['tinytext', 'text', 'mediumtext', 'longtext'], true) => 'text',
            in_array($type, ['blob', 'tinyblob', 'mediumblob', 'longblob', 'binary', 'varbinary'], true) => 'bytea',
            $type === 'json' => 'json',
            $type === 'date' => 'date',
            $type === 'time' => 'time(0) without time zone',
            $type === 'year' => 'smallint',
            in_array($type, ['datetime', 'timestamp'], true) => 'timestamp(0) without time zone',
            // An ENUM becomes the string it always was. A PostgreSQL enum type
            // would be a new thing to migrate every time a value is added.
            $type === 'enum', $type === 'set' => 'varchar(255)',
            default => 'text',
        };
    }

    private function numericType(string $full): string
    {
        preg_match('/\((\d+),\s*(\d+)\)/', $full, $matches);

        return sprintf('numeric(%s, %s)', $matches[1] ?? '8', $matches[2] ?? '2');
    }

    private function postgresDefault(object $column, bool $auto): ?string
    {
        // A serial column already defaults to its sequence.
        if ($auto || $column->default === null) {
            return null;
        }

        $default = (string) $column->default;
        $full = strtolower((string) $column->full_type);

        if (strtoupper($default) === 'CURRENT_TIMESTAMP' || str_starts_with(strtolower($default), 'current_timestamp')) {
            return 'CURRENT_TIMESTAMP';
        }

        if ($full === 'tinyint(1)') {
            return $default === '1' ? 'true' : 'false';
        }

        if (is_numeric($default)) {
            return $default;
        }

        // MySQL 8 quotes expression defaults; a literal arrives bare.
        return "'".str_replace("'", "''", trim($default, "'"))."'";
    }

    /** @return list<array{name: string, unique: bool, columns: list<string>}> */
    private function sourceIndexes(Connection $source, string $schema, string $table): array
    {
        $rows = $source->select(
            'select index_name as name, non_unique as non_unique, column_name as `column`
             from information_schema.statistics
             where table_schema = ? and table_name = ?
             order by index_name, seq_in_index',
            [$schema, $table],
        );

        $indexes = [];

        foreach ($rows as $row) {
            $name = (string) $row->name;

            $indexes[$name] ??= ['name' => $name, 'unique' => (int) $row->non_unique === 0, 'columns' => []];
            $indexes[$name]['columns'][] = (string) $row->column;
        }

        return array_values($indexes);
    }

    /* -------------------------------------------------- clearing the way */

    /**
     * Empty every table that is about to be filled, in one statement.
     *
     * One statement, not one per table, and that is the whole point. `truncate
     * ... cascade` empties everything that references the table as well — so
     * truncating them one at a time works on a first run, when no foreign key
     * exists yet, and quietly destroys already-copied tables on the second,
     * when they do. Naming them all together makes the cascade a no-op: there
     * is nothing outside the list for it to reach.
     *
     * Emptying at all is what makes the transfer repeatable, and a transfer you
     * cannot repeat is a transfer you cannot check.
     *
     * @param  list<string>  $tables
     */
    private function emptyTargets(Connection $target, array $tables): void
    {
        if ($tables === []) {
            return;
        }

        $target->statement('truncate table '.$this->quoteList($tables).' cascade');
    }

    /**
     * Stop foreign keys being checked row by row while the copy runs.
     *
     * The rows arrive in the source's order, which is alphabetical by table and
     * owes nothing to a dependency graph — a child can land before its parent.
     * On a first run that is harmless, because the keys are added afterwards.
     * On a re-run the keys already exist and would reject perfectly good data
     * for arriving in the wrong order.
     *
     * `session_replication_role` is the standard way to load data past that,
     * and it lasts only for this connection. It needs a superuser, so a
     * transfer run as an ordinary role carries on without it and relies on the
     * keys being added at the end as before — correct on a first run, and
     * reported honestly rather than failing halfway.
     *
     * @return bool whether it was actually switched off, and so needs restoring
     */
    private function suspendForeignKeys(Connection $target): bool
    {
        try {
            $target->statement("set session_replication_role = 'replica'");

            return true;
        } catch (Throwable $exception) {
            $this->warn('  foreign keys stay enforced during the copy ('.$exception->getMessage().')');

            return false;
        }
    }

    private function restoreForeignKeys(Connection $target, bool $suspended): void
    {
        if ($suspended) {
            $target->statement("set session_replication_role = 'origin'");
        }
    }

    /**
     * Foreign keys, added once every table has its rows.
     *
     * `not valid` is deliberately not used: the data came from a database that
     * was already enforcing these, so anything the check rejects is something
     * worth being told about rather than something to wave through.
     */
    private function addForeignKeys(Connection $source, Connection $target, string $schema, string $table): void
    {
        $rows = $source->select(
            'select k.constraint_name as name, k.column_name as `column`,
                    k.referenced_table_name as foreign_table,
                    k.referenced_column_name as foreign_column,
                    r.delete_rule as on_delete, r.update_rule as on_update
             from information_schema.key_column_usage k
             join information_schema.referential_constraints r
                  on r.constraint_schema = k.constraint_schema
                 and r.constraint_name = k.constraint_name
             where k.table_schema = ? and k.table_name = ?
               and k.referenced_table_name is not null
             order by k.constraint_name, k.ordinal_position',
            [$schema, $table],
        );

        $keys = [];

        foreach ($rows as $row) {
            $name = (string) $row->name;

            $keys[$name] ??= [
                'columns' => [],
                'foreign_table' => (string) $row->foreign_table,
                'foreign_columns' => [],
                'on_delete' => (string) $row->on_delete,
                'on_update' => (string) $row->on_update,
            ];

            $keys[$name]['columns'][] = (string) $row->column;
            $keys[$name]['foreign_columns'][] = (string) $row->foreign_column;
        }

        foreach ($keys as $name => $key) {
            try {
                $target->statement(sprintf(
                    'alter table %s add constraint %s foreign key (%s) references %s (%s) on delete %s on update %s',
                    $this->quote($table),
                    $this->quote($name),
                    $this->quoteList($key['columns']),
                    $this->quote($key['foreign_table']),
                    $this->quoteList($key['foreign_columns']),
                    $key['on_delete'],
                    $key['on_update'],
                ));
            } catch (Throwable $exception) {
                $this->warn("  foreign key {$name} on {$table} was not added: ".$exception->getMessage());
            }
        }
    }

    /* ----------------------------------------------------------------- copy */

    private function copyTable(Connection $source, Connection $target, string $schema, string $table): int
    {
        $total = $source->table($table)->count();

        if ($total === 0) {
            $this->line(sprintf('  %-32s %8d rows', $table, 0));

            return 0;
        }

        // Already emptied, along with every other table, by `emptyTargets`.
        $casts = $this->targetCasts($target, $table);
        $order = $this->orderColumns($source, $schema, $table);

        $moved = 0;
        $chunk = max(1, (int) $this->option('chunk'));

        $source->table($table)->orderBy($order)->chunk($chunk, function ($rows) use ($target, $table, $casts, &$moved) {
            $batch = [];

            foreach ($rows as $row) {
                $batch[] = $this->castRow((array) $row, $casts);
            }

            $target->table($table)->insert($batch);
            $moved += count($batch);
        });

        $this->line(sprintf('  %-32s %8d rows', $table, $moved));

        return $moved;
    }

    /**
     * How the destination wants each column, keyed by column name.
     *
     * Read from PostgreSQL rather than MySQL because the destination is the one
     * with the opinion: a column Laravel created as `boolean` will not accept
     * the 1 that MySQL hands back for it, whatever MySQL calls the type.
     *
     * @return array<string, string>
     */
    private function targetCasts(Connection $target, string $table): array
    {
        $casts = [];

        foreach ($target->select(
            'select column_name as name, data_type as type
             from information_schema.columns
             where table_schema = current_schema() and table_name = ?',
            [$table],
        ) as $column) {
            $casts[(string) $column->name] = strtolower((string) $column->type);
        }

        return $casts;
    }

    /**
     * @param  array<string, mixed>  $row
     * @param  array<string, string>  $casts
     * @return array<string, mixed>
     */
    private function castRow(array $row, array $casts): array
    {
        foreach ($row as $column => $value) {
            if ($value === null) {
                continue;
            }

            $row[$column] = match ($casts[$column] ?? '') {
                'boolean' => (bool) $value,
                // MySQL's zero date is not a moment; PostgreSQL is right to
                // refuse it, and null is what it always meant.
                'timestamp without time zone', 'timestamp with time zone', 'date' => str_starts_with((string) $value, '0000-00-00') ? null : $value,
                default => $value,
            };
        }

        return $row;
    }

    /**
     * A stable column to page by.
     *
     * `chunk` needs a deterministic order or rows repeat and rows vanish
     * between pages. The primary key is the natural choice; a table without one
     * falls back to its first column, which is stable enough for a one-off
     * copy of a table that has no better answer.
     */
    private function orderColumns(Connection $source, string $schema, string $table): string
    {
        $primary = $source->select(
            'select column_name as name from information_schema.statistics
             where table_schema = ? and table_name = ? and index_name = \'PRIMARY\'
             order by seq_in_index limit 1',
            [$schema, $table],
        );

        if ($primary !== []) {
            return (string) $primary[0]->name;
        }

        $first = $source->select(
            'select column_name as name from information_schema.columns
             where table_schema = ? and table_name = ? order by ordinal_position limit 1',
            [$schema, $table],
        );

        return (string) $first[0]->name;
    }

    /* ------------------------------------------------------------ sequences */

    /**
     * Point every sequence at the highest id its table actually holds.
     *
     * Copied rows carry their own ids and never touch the sequence, so without
     * this the next insert into any table would be handed 1 and collide.
     */
    private function resetSequences(Connection $target): void
    {
        $sequences = $target->select(
            "select s.relname as sequence, t.relname as \"table\", a.attname as \"column\"
             from pg_class s
             join pg_depend d on d.objid = s.oid and d.deptype in ('a', 'i')
             join pg_class t on t.oid = d.refobjid
             join pg_attribute a on a.attrelid = t.oid and a.attnum = d.refobjsubid
             where s.relkind = 'S'",
        );

        foreach ($sequences as $sequence) {
            $target->statement(sprintf(
                'select setval(%s, coalesce((select max(%s) from %s), 0) + 1, false)',
                "'".$sequence->sequence."'",
                $this->quote((string) $sequence->column),
                $this->quote((string) $sequence->table),
            ));
        }

        $this->line('  sequences reset: '.count($sequences));
    }

    /* --------------------------------------------------------------- quoting */

    private function quote(string $identifier): string
    {
        return '"'.str_replace('"', '""', $identifier).'"';
    }

    /** @param  list<string>  $identifiers */
    private function quoteList(array $identifiers): string
    {
        return implode(', ', array_map(fn (string $identifier) => $this->quote($identifier), $identifiers));
    }
}
