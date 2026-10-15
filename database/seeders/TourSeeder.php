<?php

namespace Database\Seeders;

use App\Enums\FeedbackType;
use App\Models\Feedback;
use App\Models\GalleryItem;
use App\Models\Tour;
use App\Models\TourBookingStep;
use App\Models\TourItineraryDay;
use App\Models\TourListItem;
use Illuminate\Database\Seeder;

/**
 * Two tours with their pages written out in full.
 *
 * Unlike the other seeders, this is sample data rather than the design's own
 * content: the real pages are migrated from the old site with `tour:import`,
 * and until a tour has been through that it renders from the shipped
 * catalogue. What this gives is a database that exercises every part of the
 * tour module -- all five child tables, both regions, a published tour and a
 * draft -- so the admin screens and the public page have something to show on
 * a fresh install.
 *
 * The slugs deliberately match two entries in `frontend/src/site/data/tours.ts`.
 * A tour page prefers the database and falls back to that catalogue, so seeding
 * these two demonstrates the upgrade from a generated itinerary to a written
 * one, which is the whole point of the module.
 *
 * Idempotent on `tour_code`, and the child rows are rebuilt rather than added
 * to, so running it twice does not give a tour twenty-six days.
 */
class TourSeeder extends Seeder
{
    public function run(): void
    {
        foreach ($this->tours() as $order => $definition) {
            $content = $definition['content'];
            unset($definition['content']);

            $tour = Tour::updateOrCreate(
                ['tour_code' => $definition['tour_code']],
                [...$definition, 'display_order' => $order],
            );

            $this->rebuild($tour, $content);
        }

        $this->attachTestimonials();
    }

    /**
     * Give the published tour some quotes to show.
     *
     * The page reads its testimonials from `feedback` rather than a table of
     * its own, so a seeded tour with nothing pointed at it renders that section
     * empty. Rather than seed more feedback, this points a couple of the rows
     * `FeedbackSeeder` already made at the published tour — which is what an
     * editor does in the panel, and it exercises the same join.
     */
    private function attachTestimonials(): void
    {
        $tour = Tour::where('tour_code', 'SPAINPORT23092026')->first();

        if (!$tour) {
            return;
        }

        /*
         * The first two written quotes, chosen by id rather than by whichever
         * rows happen to be unattached. Picking the unattached ones would take
         * two more every time this ran, which is how a re-run quietly grows the
         * testimonial list.
         */
        $quotes = Feedback::query()
            ->where('type', FeedbackType::Text)
            ->orderBy('id')
            ->limit(2)
            ->pluck('id');

        Feedback::whereIn('id', $quotes)->update(['tour_id' => $tour->id]);
    }

    /**
     * Replace every list this tour carries.
     *
     * Deleted first because these are ordered lists keyed by nothing an editor
     * typed: matching row-for-row on a re-run would need an identity the
     * content does not have, and appending would duplicate it.
     *
     * @param  array<string, mixed>  $content
     */
    private function rebuild(Tour $tour, array $content): void
    {
        $tour->images()->delete();
        $tour->highlights()->delete();
        $tour->itineraryDays()->delete();
        $tour->inclusions()->delete();
        $tour->exclusions()->delete();
        $tour->bookingSteps()->delete();

        /*
         * The carousel is `gallery_items` filed against this tour. `title` is
         * the gallery's own required field — a tour's pictures are on the
         * public wall too, and a photograph there is captioned by its title.
         */
        foreach ($content['images'] as $order => $image) {
            GalleryItem::create([
                ...$image,
                'tour_id' => $tour->id,
                'title' => $tour->heading(),
                'display_order' => $order,
            ]);
        }

        foreach ($content['highlights'] as $order => $body) {
            TourListItem::create([
                'tour_id' => $tour->id,
                'kind' => TourListItem::KIND_HIGHLIGHT,
                'content' => $body,
                'display_order' => $order,
            ]);
        }

        foreach ($content['itinerary'] as $order => $day) {
            TourItineraryDay::create([...$day, 'tour_id' => $tour->id, 'display_order' => $order]);
        }

        foreach ($content['inclusions'] as $order => $body) {
            TourListItem::create([
                'tour_id' => $tour->id,
                'kind' => TourListItem::KIND_INCLUSION,
                'content' => $body,
                'display_order' => $order,
            ]);
        }

        foreach ($content['exclusions'] as $order => $body) {
            TourListItem::create([
                'tour_id' => $tour->id,
                'kind' => TourListItem::KIND_EXCLUSION,
                'content' => $body,
                'display_order' => $order,
            ]);
        }

        foreach ($content['numbered'] as $kind => $steps) {
            foreach ($steps as $order => $body) {
                TourBookingStep::create([
                    'tour_id' => $tour->id,
                    'kind' => $kind,
                    'step_number' => $order + 1,
                    'content' => $body,
                    'display_order' => $order,
                ]);
            }
        }
    }

    /**
     * The three tours.
     *
     * Two with addresses — one international, one domestic — so the homepage
     * calendar has more than a single month to file them under, and one still
     * without a slug, so the public route has a tour it must refuse to serve.
     * Live vs hidden on the calendar is tb_group_tour.tour_status, not a flag
     * on this table.
     *
     * @return array<int, array<string, mixed>>
     */
    private function tours(): array
    {
        return [
            [
                'tour_code' => 'SpainPortugal23092026',
                'tour_name' => 'Spain & Portugal 23 Sep - 5 Oct 2026',
                'slug' => 'spain-and-portugal',
                'page_title' => 'Spain & Portugal - Iberia at a Human Pace',
                'subtitle' => 'Porto, Lisbon, Seville, Barcelona, Madrid',
                'summary' => 'Iberia at a pace that lets you sit in the square rather than march past it. Five cities, long lunches, and trains instead of coach marathons.',
                'ribbon_text' => 'Only 4 seats left',
                'visa_content' => '<p>A Schengen visa is required. We book the appointment, complete the forms and travel with you to the centre. The fee is not included.</p>',
                'meta_title' => 'Spain & Portugal Group Tour for 50+ Travellers | 50 Plus Voyagers',
                'meta_description' => 'Thirteen days across Porto, Lisbon, Seville, Barcelona and Madrid, hosted end to end for travellers over fifty. Small group, unhurried pace.',
                'meta_keywords' => 'spain tour, portugal tour, senior group travel, 50 plus travel india',
                'og_title' => 'Spain & Portugal - 13 days, fully hosted',
                'og_description' => 'Five cities, long lunches and trains instead of coach marathons.',
                'og_image_path' => '/images/home/cappadocia.webp',
                'canonical_url' => 'https://50plusvoyagers.com/group-tours/spain-and-portugal',
                'route_map_path' => '/images/home/divider-kenya-equator.webp',
                'content' => [
                    'images' => [
                        [
                            'image_path' => '/images/home/cappadocia.webp',
                            'alt' => 'A wide landscape at golden hour',
                            'caption' => 'The evening we arrived',
                            'is_cover' => true,
                        ],
                        /*
                         * The design's own library, standing in until the real
                         * photographs are brought across from the old server.
                         *
                         * The captions say what the picture is rather than
                         * naming a place it is not: the library has nothing
                         * shot in Iberia, and a Bhutanese valley captioned
                         * "between Seville and Barcelona" is worse than a
                         * caption that admits it is a stand-in.
                         */
                        [
                            'image_path' => '/images/home/kerala-backwaters.webp',
                            'alt' => 'Water and low hills at the end of the afternoon',
                            'caption' => 'Long afternoons, and no schedule to keep',
                            'is_cover' => false,
                        ],
                        [
                            'image_path' => '/images/home/paro-valley.webp',
                            'alt' => 'A wide valley seen from the road',
                            'caption' => 'The view from the road, somewhere between two cities',
                            'is_cover' => false,
                        ],
                    ],
                    'highlights' => [
                        'A port lodge tasting on the Douro, seated and shaded',
                        'Seville in the cool of the evening, when the city wakes up',
                        'Barcelona with pre-booked timed entries, so there is no standing in line',
                        'The Prado with a guide who knows which twelve paintings to stop at',
                        'Trains between every city, no coach days longer than two hours',
                    ],
                    'itinerary' => [
                        [
                            'day_number' => 1,
                            'heading' => 'Day 1: Arrive Porto',
                            'title' => 'Portugal at the river',
                            'content' => '<p>Met at the airport and driven to the hotel. The afternoon is yours to sleep off the flight. We meet at seven for dinner by the river, and nobody is asked to do anything else.</p>',
                            'stay' => '4* Hotel in Porto',
                            'meals' => 'Dinner',
                        ],
                        [
                            'day_number' => 2,
                            'heading' => 'Day 2: Porto and the Douro',
                            'title' => 'Port, seated',
                            'content' => '<p>A slow morning walk through the Ribeira, then a port lodge across the river. The tasting is seated and shaded. The evening is free.</p>',
                            'stay' => '4* Hotel in Porto',
                            'meals' => 'Breakfast, Lunch',
                        ],
                        [
                            'day_number' => 3,
                            'heading' => 'Day 3: Train to Lisbon',
                            'title' => 'Three hours, one coffee',
                            'content' => '<p>A late-morning train south. Bags are handled at both ends. The afternoon is a gentle orientation walk and an early night.</p>',
                            'stay' => '4* Hotel in Lisbon',
                            'meals' => 'Breakfast',
                        ],
                        [
                            'day_number' => 4,
                            'heading' => 'Day 4: Lisbon and Belem',
                            'title' => 'Custard tarts, properly',
                            'content' => '<p>Belem in the morning while it is quiet, the tower and the monastery, and the original pasteis. Trams back. The afternoon is free.</p>',
                            'stay' => '4* Hotel in Lisbon',
                            'meals' => 'Breakfast, Lunch',
                        ],
                        [
                            'day_number' => 5,
                            'heading' => 'Day 5: Seville',
                            'title' => 'Into Andalucia',
                            'content' => '<p>Across the border by coach, the one long drive of the trip, broken with a proper lunch stop. Seville by evening, when it is finally cool.</p>',
                            'stay' => '4* Hotel in Seville',
                            'meals' => 'Breakfast, Lunch, Dinner',
                        ],
                        [
                            'day_number' => 6,
                            'heading' => 'Day 6: The Alcazar and the Cathedral',
                            'title' => 'Timed entries, no queues',
                            'content' => '<p>Both booked for the morning slots. Seats are found at every stop. Flamenco in a small room after dinner, for those who want it.</p>',
                            'stay' => '4* Hotel in Seville',
                            'meals' => 'Breakfast',
                        ],
                        [
                            'day_number' => 7,
                            'heading' => 'Day 7: Train to Barcelona',
                            'title' => 'The long, comfortable one',
                            'content' => '<p>A high-speed train the length of the country, in reserved seats with a table. Lunch on board. Barcelona by late afternoon.</p>',
                            'stay' => '4* Hotel in Barcelona',
                            'meals' => 'Breakfast, Lunch',
                        ],
                        [
                            'day_number' => 8,
                            'heading' => 'Day 8: Gaudi',
                            'title' => 'Sagrada Familia, unhurried',
                            'content' => '<p>Timed entry mid-morning, lifts booked. Park Guell after the heat has gone. Both at a pace that allows sitting down.</p>',
                            'stay' => '4* Hotel in Barcelona',
                            'meals' => 'Breakfast, Dinner',
                        ],
                        [
                            'day_number' => 9,
                            'heading' => 'Day 9: Barcelona at leisure',
                            'title' => 'A day with nothing in it',
                            'content' => '<p>Deliberately empty. The Gothic Quarter, the market, or the hotel terrace. We suggest three things and book none of them.</p>',
                            'stay' => '4* Hotel in Barcelona',
                            'meals' => 'Breakfast',
                        ],
                        [
                            'day_number' => 10,
                            'heading' => 'Day 10: Train to Madrid',
                            'title' => 'The capital',
                            'content' => '<p>Mid-morning train. The afternoon is a walk through Retiro when the light is long, and dinner near the hotel.</p>',
                            'stay' => '4* Hotel in Madrid',
                            'meals' => 'Breakfast, Dinner',
                        ],
                        [
                            'day_number' => 11,
                            'heading' => 'Day 11: The Prado',
                            'title' => 'Twelve paintings, not four hundred',
                            'content' => '<p>A guide who knows what to skip. Two hours inside, seats found throughout, and lunch afterwards rather than a rushed sandwich.</p>',
                            'stay' => '4* Hotel in Madrid',
                            'meals' => 'Breakfast, Lunch',
                        ],
                        [
                            'day_number' => 12,
                            'heading' => 'Day 12: Toledo, and the last dinner',
                            'title' => 'One hill town',
                            'content' => '<p>A half day in Toledo with the coach waiting at the top rather than the bottom. Back for the farewell dinner.</p>',
                            'stay' => '4* Hotel in Madrid',
                            'meals' => 'Breakfast, Dinner',
                        ],
                        [
                            'day_number' => 13,
                            'heading' => 'Day 13: Fly home',
                            'title' => 'Late checkout',
                            'content' => '<p>Checkout is held until the afternoon. Transfers timed to each flight, in small groups rather than one coach at dawn.</p>',
                            'stay' => null,
                            'meals' => 'Breakfast',
                        ],
                    ],
                    'inclusions' => [
                        '<p>Twelve nights in centrally located 4-star hotels, twin sharing, with lifts in every property.</p>',
                        '<p>All rail between cities in reserved seats, and porterage at every station.</p>',
                        '<p>Daily breakfast, plus the lunches and dinners marked in the itinerary.</p>',
                        '<p>An Indian tour manager travelling with the group from Mumbai and back.</p>',
                        '<p>All entrance fees and timed-entry bookings named in the day-by-day.</p>',
                    ],
                    'exclusions' => [
                        '<p>International airfare to Porto and home from Madrid.</p>',
                        '<p>Schengen visa fee and the travel to the appointment centre.</p>',
                        '<p>Travel insurance, which is compulsory and which we will help you arrange.</p>',
                        '<p>Meals not named in the itinerary, and anything from the minibar.</p>',
                        '<p>Tips for local guides and drivers.</p>',
                    ],
                    'numbered' => [
                        'booking' => [
                            '<p>Call us, or send the enquiry form. We will talk through the itinerary before anything is paid.</p>',
                            '<p>Pay the booking fee of Rs. 50,000 to hold your seat.</p>',
                            '<p>Send your documents for the visa application within two weeks.</p>',
                            '<p>The balance is due 45 days before departure.</p>',
                        ],
                        'documents' => [
                            '<p>Passport valid for six months beyond the return date, with two blank pages.</p>',
                            '<p>Two recent photographs to Schengen specification, we will tell you where to have them taken.</p>',
                            '<p>Six months of bank statements, stamped by the branch.</p>',
                            '<p>Income tax returns for the last two years.</p>',
                        ],
                        'guidelines' => [
                            '<p>Pack one suitcase you can manage yourself, and comfortable shoes you have already worn in.</p>',
                            '<p>Carry your regular medication in the cabin bag, in its original packaging with the prescription.</p>',
                            '<p>September in Iberia is warm by day and cool after dark, a light jacket is enough.</p>',
                        ],
                    ],
                ],
            ],
            [
                'tour_code' => 'kerala26102026',
                'tour_name' => 'Kerala 26 October - 2 November 2026',
                'slug' => 'kerala-munnar-alleppey',
                'page_title' => 'Kerala - Munnar Hills and the Alleppey Backwaters',
                'subtitle' => 'Kochi, Munnar, Thekkady, Alleppey',
                'summary' => 'Tea gardens in the morning cool, a houseboat with a cook aboard, and no day that starts before eight.',
                'ribbon_text' => null,
                'visa_content' => null,
                'meta_title' => 'Kerala Group Tour for 50+ Travellers | 50 Plus Voyagers',
                'meta_description' => 'Seven days through Kochi, Munnar, Thekkady and the Alleppey backwaters, hosted throughout for travellers over fifty.',
                'meta_keywords' => 'kerala tour, munnar, alleppey houseboat, senior group travel',
                'og_title' => 'Kerala - seven unhurried days',
                'og_description' => 'Tea gardens, a houseboat, and no early starts.',
                'og_image_path' => '/images/home/kerala-backwaters.webp',
                'canonical_url' => null,
                'route_map_path' => null,
                'content' => [
                    'images' => [
                        [
                            'image_path' => '/images/home/kerala-backwaters.webp',
                            'alt' => 'A houseboat moored on the Alleppey backwaters at dusk',
                            'caption' => 'The houseboat, the evening we boarded',
                            'is_cover' => true,
                        ],
                        [
                            'image_path' => '/images/home/trip-ladakh.webp',
                            'alt' => 'Tea terraces stepping down a hillside in Munnar',
                            'caption' => 'Munnar, before the mist lifts',
                            'is_cover' => false,
                        ],
                    ],
                    'highlights' => [
                        'A working tea estate walked at first light, when it is still cool',
                        'One full night on a private houseboat, with a cook aboard',
                        'A spice plantation where you are given time to sit down',
                        'Kathakali with the make-up explained beforehand, so it makes sense',
                    ],
                    'itinerary' => [
                        [
                            'day_number' => 1,
                            'heading' => 'Day 1: Arrive Kochi',
                            'title' => 'Fort Kochi, gently',
                            'content' => '<p>Met at the airport and driven to Fort Kochi. The afternoon is free. A short walk to the Chinese fishing nets at sunset, for those who want it.</p>',
                            'stay' => 'Heritage hotel, Fort Kochi',
                            'meals' => 'Dinner',
                        ],
                        [
                            'day_number' => 2,
                            'heading' => 'Day 2: Kochi to Munnar',
                            'title' => 'Up into the hills',
                            'content' => '<p>Four hours by road with two proper stops. The air changes as you climb. The evening is at the hotel, which is the point.</p>',
                            'stay' => 'Resort in Munnar',
                            'meals' => 'Breakfast, Dinner',
                        ],
                        [
                            'day_number' => 3,
                            'heading' => 'Day 3: The tea gardens',
                            'title' => 'First light, then nothing',
                            'content' => '<p>An early but short walk through a working estate, back for a long breakfast. The rest of the day is deliberately empty.</p>',
                            'stay' => 'Resort in Munnar',
                            'meals' => 'Breakfast, Lunch',
                        ],
                        [
                            'day_number' => 4,
                            'heading' => 'Day 4: Thekkady',
                            'title' => 'Spices, seated',
                            'content' => '<p>A plantation walk with benches at every stop, and a boat on the lake in the late afternoon.</p>',
                            'stay' => 'Resort in Thekkady',
                            'meals' => 'Breakfast, Dinner',
                        ],
                        [
                            'day_number' => 5,
                            'heading' => 'Day 5: Down to Alleppey',
                            'title' => 'Aboard by lunch',
                            'content' => '<p>The road down, then onto the houseboat before lunch. The afternoon is spent moving slowly through the backwaters. Dinner is cooked aboard.</p>',
                            'stay' => 'Private houseboat',
                            'meals' => 'Breakfast, Lunch, Dinner',
                        ],
                        [
                            'day_number' => 6,
                            'heading' => 'Day 6: Back to Kochi',
                            'title' => 'The last evening',
                            'content' => '<p>Off the boat after breakfast and back to Kochi. Kathakali in the evening, with the make-up explained first. Farewell dinner after.</p>',
                            'stay' => 'Heritage hotel, Fort Kochi',
                            'meals' => 'Breakfast, Dinner',
                        ],
                        [
                            'day_number' => 7,
                            'heading' => 'Day 7: Fly home',
                            'title' => 'No early start',
                            'content' => '<p>Late checkout, and transfers timed to each flight.</p>',
                            'stay' => null,
                            'meals' => 'Breakfast',
                        ],
                    ],
                    'inclusions' => [
                        '<p>Six nights twin sharing, including one full night on a private houseboat.</p>',
                        '<p>All road transfers in an air-conditioned vehicle with a driver who stays with the group.</p>',
                        '<p>Daily breakfast and the meals marked in the itinerary.</p>',
                    ],
                    'exclusions' => [
                        '<p>Airfare to and from Kochi.</p>',
                        '<p>Travel insurance.</p>',
                        '<p>Camera fees at the monuments, where they apply.</p>',
                    ],
                    'numbered' => [
                        'booking' => [
                            '<p>Call us or send the enquiry form.</p>',
                            '<p>Pay the booking fee of Rs. 15,000 to hold your seat.</p>',
                            '<p>The balance is due 30 days before departure.</p>',
                        ],
                        'documents' => [
                            '<p>A photo identity card: Aadhaar, passport or driving licence.</p>',
                            '<p>Your medical note if you carry prescription medication.</p>',
                        ],
                        'guidelines' => [
                            '<p>November in Kerala is warm and humid. Cotton, and a light shawl for the hill evenings.</p>',
                            '<p>The houseboat has a step up from the jetty; there is a hand to help you.</p>',
                        ],
                    ],
                ],
            ],
            /*
             * The draft. Deliberately thinner than the other two: a tour an
             * editor has started and not finished is the state the admin has to
             * render and the public route has to refuse, and padding it out
             * would only make it a third published tour that happens to say
             * draft.
             */
            [
                'tour_code' => 'Japan18112026',
                'tour_name' => 'Japan 18 - 27 November 2026',
                'slug' => null,
                'page_title' => 'Japan in Autumn - Maples, Trains and Onsen',
                'subtitle' => 'Tokyo, Hakone, Kyoto, Nara',
                'summary' => 'The maples at their reddest, bullet trains between cities, and an onsen evening with nothing scheduled after it.',
                'ribbon_text' => null,
                'visa_content' => '<p>A Japan tourist visa is required. We complete the paperwork and submit it on your behalf.</p>',
                'meta_title' => null,
                'meta_description' => null,
                'meta_keywords' => null,
                'og_title' => null,
                'og_description' => null,
                'og_image_path' => null,
                'canonical_url' => null,
                'route_map_path' => null,
                'content' => [
                    'images' => [
                        [
                            'image_path' => '/images/home/paro-valley.webp',
                            'alt' => 'A maple in full autumn colour over a temple path',
                            'caption' => null,
                            'is_cover' => true,
                        ],
                    ],
                    'highlights' => [
                        'The Kyoto temple gardens at their reddest, early enough to have them quiet',
                        'A night in a ryokan with an onsen and nothing scheduled after it',
                    ],
                    'itinerary' => [
                        [
                            'day_number' => 1,
                            'heading' => 'Day 1: Arrive Tokyo',
                            'title' => null,
                            'content' => '<p>Met at Haneda and driven to the hotel. Nothing else is asked of the first day.</p>',
                            'stay' => 'Hotel in Shinjuku',
                            'meals' => 'Dinner',
                        ],
                    ],
                    'inclusions' => [
                        '<p>Twelve nights twin sharing, including one night in a traditional ryokan.</p>',
                    ],
                    'exclusions' => [
                        '<p>International airfare.</p>',
                        '<p>Japan visa fee.</p>',
                    ],
                    'numbered' => [
                        'booking' => [
                            '<p>Call us or send the enquiry form.</p>',
                            '<p>Pay the booking fee of Rs. 60,000 to hold your seat.</p>',
                        ],
                        'documents' => [
                            '<p>Passport valid for six months beyond the return date.</p>',
                        ],
                        'guidelines' => [
                            '<p>November in Japan is cold in the mornings. Layers, and shoes you can slip off at temple doors.</p>',
                        ],
                    ],
                ],
            ],
        ];
    }
}
