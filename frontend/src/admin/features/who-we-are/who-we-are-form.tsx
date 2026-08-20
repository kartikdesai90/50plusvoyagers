import { ChevronDown, ChevronUp, Plus, Trash2 } from 'lucide-react';
import { useId, useState } from 'react';

import { FileUploadField } from '@/admin/components/file-upload-field';
import { FormActions } from '@/admin/components/form-actions';
import { Field, FormGrid, FormSection } from '@/admin/components/form-section';
import { ToggleField } from '@/admin/components/toggle-field';
import { blankCard } from '@/admin/features/who-we-are/defaults';
import type { CardInput } from '@/admin/features/who-we-are/types';
import { paths } from '@/routes/paths';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Textarea } from '@/shared/ui/textarea';

/** Four is the design; past this the row stops being a row. */
const MAX_CARDS = 8;

type WhoWeAreFormProps = {
    initial: CardInput[];
    isSaving: boolean;
    /** Keyed the way the server keys them — `cards.0.title` — so a 422 lands. */
    fieldErrors: Record<string, string>;
    onSubmit: (cards: CardInput[]) => void;
};

/**
 * The four cards under "Who we are".
 *
 * All of them on one screen, because that is how they are read: they sit side
 * by side on the homepage and are written as a group. It is also what settles
 * the ordering without anybody typing a number — a card's position in this list
 * is its position on the page, so moving one is moving it.
 *
 * A card removed here is removed from the homepage when the form is saved, not
 * before. Nothing on this screen changes anything until the save.
 */
export function WhoWeAreForm({ initial, isSaving, fieldErrors, onSubmit }: WhoWeAreFormProps) {
    const [cards, setCards] = useState<CardInput[]>(initial);
    const ids = useId();

    const update = (index: number, patch: Partial<CardInput>) =>
        setCards((current) =>
            current.map((card, at) => (at === index ? { ...card, ...patch } : card)),
        );

    const remove = (index: number) =>
        setCards((current) => current.filter((_, at) => at !== index));

    /** Swaps a card with its neighbour, which is all reordering four things needs. */
    const move = (index: number, by: -1 | 1) =>
        setCards((current) => {
            const target = index + by;
            if (target < 0 || target >= current.length) return current;

            const reordered = [...current];
            [reordered[index], reordered[target]] = [reordered[target], reordered[index]];

            return reordered;
        });

    return (
        <form
            className="flex flex-col gap-4"
            onSubmit={(event) => {
                event.preventDefault();
                if (!isSaving) onSubmit(cards);
            }}
            noValidate
        >
            {/* The whole-set errors — too many cards, or none at all — have no
                row of their own to sit under. */}
            {fieldErrors.cards ? (
                <p role="alert" className="text-xs font-medium text-destructive">
                    {fieldErrors.cards}
                </p>
            ) : null}

            {cards.map((card, index) => (
                <FormSection
                    key={card.key}
                    title={card.title.trim() || `Card ${index + 1}`}
                    description={`Position ${index + 1} of ${cards.length} on the homepage.`}
                >
                    <div className="flex flex-wrap gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            disabled={isSaving || index === 0}
                            aria-label={`Move ${card.title || `card ${index + 1}`} earlier`}
                            onClick={() => move(index, -1)}
                        >
                            <ChevronUp className="size-4" />
                            Earlier
                        </Button>
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            disabled={isSaving || index === cards.length - 1}
                            aria-label={`Move ${card.title || `card ${index + 1}`} later`}
                            onClick={() => move(index, 1)}
                        >
                            <ChevronDown className="size-4" />
                            Later
                        </Button>
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            disabled={isSaving || cards.length === 1}
                            aria-label={`Remove ${card.title || `card ${index + 1}`}`}
                            onClick={() => remove(index)}
                            className="ml-auto text-muted-foreground hover:text-destructive"
                        >
                            <Trash2 className="size-4" />
                            Remove
                        </Button>
                    </div>

                    <FileUploadField
                        id={`${ids}-${card.key}-image`}
                        label="Picture"
                        kind="image"
                        file={card.image_file}
                        onFileChange={(file) => update(index, { image_file: file })}
                        existingUrl={card.image_url}
                        existingCaption="On the homepage now"
                        hint="JPG, PNG or WebP, up to 10 MB. Landscape works best."
                        error={fieldErrors[`cards.${index}.image_file`]}
                        required={!card.image_url}
                        disabled={isSaving}
                    />

                    <FormGrid>
                        <Field
                            label="Title"
                            htmlFor={`${ids}-${card.key}-title`}
                            error={fieldErrors[`cards.${index}.title`]}
                            required
                            hint="A few words. Set in small capitals over the text."
                        >
                            <Input
                                id={`${ids}-${card.key}-title`}
                                placeholder="Small groups"
                                value={card.title}
                                disabled={isSaving}
                                aria-invalid={Boolean(fieldErrors[`cards.${index}.title`])}
                                onChange={(event) => update(index, { title: event.target.value })}
                            />
                        </Field>
                    </FormGrid>

                    <Field
                        label="Text"
                        htmlFor={`${ids}-${card.key}-body`}
                        error={fieldErrors[`cards.${index}.body`]}
                        hint="A sentence or two under the title."
                    >
                        <Textarea
                            id={`${ids}-${card.key}-body`}
                            value={card.body}
                            disabled={isSaving}
                            aria-invalid={Boolean(fieldErrors[`cards.${index}.body`])}
                            onChange={(event) => update(index, { body: event.target.value })}
                        />
                    </Field>

                    <ToggleField
                        id={`${ids}-${card.key}-active`}
                        label="Show this card"
                        description={
                            card.is_active
                                ? 'Travellers can see this on the homepage.'
                                : 'Hidden until you switch this on.'
                        }
                        checked={card.is_active}
                        disabled={isSaving}
                        onChange={(is_active) => update(index, { is_active })}
                    />
                </FormSection>
            ))}

            {cards.length < MAX_CARDS ? (
                <div>
                    <Button
                        type="button"
                        variant="outline"
                        disabled={isSaving}
                        onClick={() => setCards((current) => [...current, blankCard()])}
                    >
                        <Plus className="size-4" />
                        Add a card
                    </Button>
                </div>
            ) : null}

            <FormActions
                cancelHref={paths.admin.dashboard}
                submitLabel="Save these cards"
                isSaving={isSaving}
            />
        </form>
    );
}
