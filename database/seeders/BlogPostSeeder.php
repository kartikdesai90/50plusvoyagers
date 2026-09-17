<?php

namespace Database\Seeders;

use App\Enums\PostStatus;
use App\Models\BlogPost;
use Illuminate\Database\Seeder;
use Illuminate\Support\Carbon;

/**
 * The journal, seeded with exactly what the approved design shows.
 *
 * The point is that the first dynamic render is identical to the static one it
 * replaces: same articles, same writers, same order. Anything else would be a
 * design change arriving disguised as a migration.
 *
 * `author_name` rather than `author_id` throughout: every one of these was
 * written by a member of the club, and a member has no account in this admin
 * panel and should never be given one so that a byline can be printed.
 *
 * Idempotent, keyed on the slug — the slug is the article's address, so a post
 * that already lives at one is that post, and running this again rewrites it
 * rather than publishing a second copy at a suffixed address.
 */
class BlogPostSeeder extends Seeder
{
    public function run(): void
    {
        foreach ($this->posts() as $order => $post) {
            BlogPost::updateOrCreate(
                ['slug' => $post['slug']],
                [
                    ...$post,
                    'content' => implode("\n\n", $post['content']),
                    'published_at' => Carbon::createFromFormat('j M Y', $post['published_at'])
                        ->startOfDay(),
                    'status' => PostStatus::Published,
                    'display_order' => $order,
                ],
            );
        }
    }

    /**
     * The fifteen articles the design ships with, newest first.
     *
     * `image_path` is a public path rather than an uploaded one: these files
     * are part of the front end's build, so they need no upload to keep
     * working, and `FileStore` hands a path like this straight back.
     *
     * The body is an array here purely for legibility — fifteen articles as
     * single quoted blobs would be unreadable — and is joined into the one
     * text column on the way in. Reading time is not stored: the model counts
     * the words, so it cannot fall out of step with what is actually written.
     *
     * @return array<int, array<string, mixed>>
     */
    private function posts(): array
    {
        return [
            [
                'slug' => 'hornbill-festival-nagaland',
                'title' => 'The Hornbill Festival of Nagaland',
                'author_name' => 'Chitra Warrier',
                'published_at' => '12 Dec 2025',
                'category' => 'Travelogue',
                'is_featured' => true,
                'excerpt' => 'Every December, sixteen Naga tribes gather at Kisama for ten days of song, dance and log drums. This is what it is like to be there in your seventies.',
                'image_path' => '/images/home/divider-zanskar-rafting.webp',
                'content' => [
                    'Kisama sits a short drive out of Kohima, and for ten days each December it stops being a heritage village and becomes the loudest, warmest place in the north-east. Sixteen tribes, each with its own morung, its own dress, its own way of holding a spear.',
                    'We had been warned about the cold and not at all about the noise. The log drums start early. So do the songs — long, layered, sung by men who have been singing them since they were boys, and who will keep singing them long after the tourists have gone back to their hotels.',
                    'What struck me most was how little of it was for us. The dancing was not a performance in the way a hotel lobby show is a performance. People were showing each other who they were, and we were allowed to watch.',
                    'If you are going: go slowly. There are benches everywhere and no reason to stand for six hours. Take a shawl. And stay for the evening — the festival changes character entirely once the sun is down.',
                ],
            ],
            [
                'slug' => 'bhutan-pursuit-of-happiness',
                'title' => 'Bhutan: The Pursuit of Happiness',
                'author_name' => 'Tandrani Raj',
                'published_at' => '28 Oct 2025',
                'category' => 'Travelogue',
                'is_featured' => true,
                'excerpt' => 'Fourteen of us, average age sixty-six, went up to Tiger’s Nest together. Adventure, it turns out, knows no age limit.',
                'image_path' => '/images/home/trip-bhutan.webp',
                'content' => [
                    'The climb to Taktsang is not long by the standards of the young. It is 900 metres of ascent, and everyone who has ever done it will tell you about the last set of steps down and then up again across the gorge.',
                    'We started at seven. Two of us took ponies for the first stretch. One turned back at the cafeteria and had, by her own account, the best morning of the trip sitting there with a flask of tea and that view. Nobody thought less of her, least of all her.',
                    'The rest of us got there at half past eleven. Somebody produced a packet of biscuits. Our tour manager, who had climbed it forty times, looked as pleased as if it were his first.',
                    'Bhutan measures itself in happiness, which sounds like a slogan until you have spent a week there and realise that nobody is in a hurry. Not the driver, not the monk, not the woman selling chillies by the road. It is contagious.',
                ],
            ],
            [
                'slug' => 'day-out-at-wine-country',
                'title' => 'A Day Out at Wine Country',
                'author_name' => 'Sangita Bhattacharyya',
                'published_at' => '3 Oct 2025',
                'category' => 'Travelogue',
                'is_featured' => false,
                'excerpt' => 'An hour out of Bengaluru, a vineyard, a tasting and a lunch that ran until four. Proof that a good trip need not involve a suitcase.',
                'image_path' => '/images/home/why-travellers-together.webp',
                'content' => [
                    'We left the city at nine, which for this group counts as an early start, and were among the vines by half past ten.',
                    'The tasting was properly done — five glasses, small pours, and a young sommelier who did not once talk down to a room full of people old enough to be her grandparents. Several of us bought bottles. One of us bought six.',
                    'Lunch was outdoors under a trellis and ran considerably longer than scheduled, which is always the sign of a successful day-out. We were home by seven.',
                ],
            ],
            [
                'slug' => 'kerala-a-travelogue',
                'title' => 'Kerala — A Travelogue',
                'author_name' => 'Sulekha Patanka',
                'published_at' => '19 Sep 2025',
                'category' => 'Travelogue',
                'is_featured' => true,
                'excerpt' => 'Houseboats, spice plantations and tea gardens, kept as a diary across eight days in God’s own country.',
                'image_path' => '/images/home/kerala-backwaters.webp',
                'content' => [
                    'Day one, Kochi. Chinese fishing nets at sunset, a Kathakali performance where we arrived early enough to watch the make-up being applied, and a hotel courtyard with a frangipani tree in it.',
                    'Day three, Munnar. Tea in every direction, in that particular green that photographs never manage. We walked a level path through the estate for an hour and stopped four times, which was three times more than necessary and exactly right.',
                    'Day five, Thekkady. Cardamom, pepper, clove. Our guide crushed a leaf between his fingers and held it out to each of us in turn.',
                    'Day six, Alleppey, and the houseboat. I had thought it would be a gimmick. It was the best night of the trip: the engine off, the water flat, somebody’s radio playing two boats away, and dinner cooked on board by a man who had been doing it for twenty years.',
                    'Day eight, home. I have been to Kerala three times now. I will go again.',
                ],
            ],
            [
                'slug' => 'benefit-of-hiking-for-elderly',
                'title' => 'The Benefits of Hiking After Sixty',
                'author_name' => 'Sangita Bhattacharyya',
                'published_at' => '5 Sep 2025',
                'category' => 'Wellbeing',
                'is_featured' => false,
                'excerpt' => 'What walking uphill does for the heart, the knees and the head — and how our members with diabetes and hypertension actually manage it on the trail.',
                'image_path' => '/images/home/hero-mountain-lake.webp',
                'content' => [
                    'Hiking is the rare exercise that does not feel like exercise. You are looking at something, talking to somebody, and only realise afterwards that you climbed for two hours.',
                    'The evidence is unambiguous: regular uphill walking improves cardiovascular fitness, bone density and balance, and there is now good research on its effect on mood and sleep. For anyone managing blood sugar, a walk after a meal is worth more than most things in a pill bottle.',
                    'The knees are the usual objection, and the usual answer is poles. Two of them, not one, set to the right height. They take a real fraction of the load off the descent, which is the part that hurts.',
                    'On our departures we grade every walk and say so in advance — level, gentle, moderate — and there is always an alternative for anyone who would rather sit it out. Nobody is ever asked to prove anything.',
                ],
            ],
            [
                'slug' => 'chikmagalur-diary',
                'title' => 'Chikmagalur Diary',
                'author_name' => 'Nirmala Reddy',
                'published_at' => '22 Aug 2025',
                'category' => 'Travelogue',
                'is_featured' => false,
                'excerpt' => 'Three days in the coffee hills, with a detour to Belur and Halebidu and one very good filter coffee.',
                'image_path' => '/images/home/value-unhurried-pace.webp',
                'content' => [
                    'The drive up is the first pleasure — the plains give way, the air changes, and somewhere past Hassan it starts to smell of coffee.',
                    'We stayed on an estate. Our host walked us through the rows in the morning and explained the difference between arabica and robusta in a way that finally stuck.',
                    'The second day was Belur and Halebidu, which no photograph prepares you for. The Hoysala carvers worked in soapstone, soft enough to cut like wood, and the results are closer to jewellery than to architecture.',
                    'On the last morning somebody made us filter coffee from beans picked forty feet from where we were sitting. I have not enjoyed a cup as much since.',
                ],
            ],
            [
                'slug' => 'the-unstoppable',
                'title' => 'The Unstoppable',
                'author_name' => 'Sangita Bhattacharyya',
                'published_at' => '8 Mar 2025',
                'category' => 'Inspiration',
                'is_featured' => false,
                'excerpt' => 'For International Women’s Day: the women of this club who took their first flight at sixty-two, and have not stopped since.',
                'image_path' => '/images/home/face-malika.webp',
                'content' => [
                    'She had never travelled without her husband. He died in 2019, and in 2022 she booked Ladakh, alone, because he had always wanted to see Pangong and she decided she would see it for both of them.',
                    'Another had never held a passport. At sixty-eight she got one, used it in Bhutan, and has since filled four pages of it.',
                    'A third had raised three children and looked after two sets of parents, and told us on the second evening in Rajasthan that this was the first week of her life that nobody had needed anything from her.',
                    'We hear a version of this story on almost every departure. It is the reason the club exists.',
                ],
            ],
            [
                'slug' => 'rediscover-hobbies-through-travel',
                'title' => 'Rediscovering Hobbies Through Travel',
                'author_name' => 'Sangita Bhattacharyya',
                'published_at' => '14 Feb 2025',
                'category' => 'Inspiration',
                'is_featured' => false,
                'excerpt' => 'Painting, birding, photography, cooking. The things you set aside in your thirties are waiting, and a trip is a good excuse to pick them up.',
                'image_path' => '/images/home/value-kindred-company.webp',
                'content' => [
                    'Retirement hands back the one resource that was always short: unstructured time. What most people discover is that they have forgotten how to spend it.',
                    'Travel is a useful way back in. A sketchbook gives you a reason to sit somewhere for an hour. A pair of binoculars turns a dull hotel garden into a morning.',
                    'Several of our workshop regulars started painting on a trip, in the way you start anything at that age — badly, cheerfully, and then rather well.',
                ],
            ],
            [
                'slug' => 'singapore-travelogue',
                'title' => 'Singapore: A First Trip Abroad',
                'author_name' => 'Kamaldeep Singh Pawar',
                'published_at' => '30 Jan 2025',
                'category' => 'Travelogue',
                'is_featured' => false,
                'excerpt' => 'At sixty-five, my first stamp. Sentosa, Universal Studios, and the surprising discovery that going abroad is easier than going to Delhi.',
                'image_path' => '/images/home/cappadocia.webp',
                'content' => [
                    'I had put it off for years on the grounds that it would be complicated. It was not complicated. Somebody met us at the airport, the signs were in English, and the trains ran to the minute.',
                    'Sentosa took a full day and I would give it two. Universal Studios I went to for the grandchildren’s sake and enjoyed more than they would believe.',
                    'What I did not expect was the food courts — clean, cheap, and better than half the restaurants I have paid for.',
                    'The passport now has three stamps in it. I intend to fill it.',
                ],
            ],
            [
                'slug' => 'fairytale-destinations',
                'title' => 'Fairytale Destinations',
                'author_name' => 'Shatakshi Misra',
                'published_at' => '11 Dec 2024',
                'category' => 'Inspiration',
                'is_featured' => false,
                'excerpt' => 'The castles behind Disney, the platform behind Harry Potter, the coastline behind Game of Thrones — and which of them are genuinely worth the journey.',
                'image_path' => '/images/home/paro-valley.webp',
                'content' => [
                    'Neuschwanstein is the one everybody knows, and it is every bit as improbable as the drawings suggest. Go early; the coach parties arrive at eleven.',
                    'Dubrovnik, standing in for King’s Landing, is best in the shoulder season when the cruise ships thin out and the old town belongs to the people who live in it.',
                    'Alnwick, in Northumberland, was the first Hogwarts. It is also a real castle with a real family in it, which is more interesting than the film connection.',
                ],
            ],
            [
                'slug' => 'festivals-of-ladakh',
                'title' => 'The Festivals of Ladakh',
                'author_name' => 'Shatakshi Misra',
                'published_at' => '20 Nov 2024',
                'category' => 'Travelogue',
                'is_featured' => false,
                'excerpt' => 'Mask dances, archery, polo and traditional music — the monastery festival calendar, and how to plan a trip around it.',
                'image_path' => '/images/home/trip-ladakh.webp',
                'content' => [
                    'The cham dances are the reason to time a Ladakh trip to a festival. Monks in silk and carved masks, moving to horns you feel in your chest rather than hear.',
                    'Hemis in summer is the largest and the most crowded. Spituk and Stok in winter are colder, smaller and, most people who have seen both will tell you, better.',
                    'Around the edges of the religious calendar sit the secular festivals: archery contests that go on all afternoon, and polo played the way it was played before anyone wrote the rules down.',
                ],
            ],
            [
                'slug' => 'exquisite-river-cruises',
                'title' => 'Exquisite River Cruises',
                'author_name' => 'Sangita Bhattacharyya',
                'published_at' => '2 Oct 2024',
                'category' => 'Practical',
                'is_featured' => false,
                'excerpt' => 'The Danube, the Mekong, the Brahmaputra and the Amazon. Why a river ship suits an older traveller better than almost anything else.',
                'image_path' => '/images/home/trip-pangong.webp',
                'content' => [
                    'You unpack once. That is the whole argument, and for many people it is enough.',
                    'River ships are small — a hundred and fifty passengers rather than three thousand — they dock in the centre of town rather than at an industrial port, and the water is flat, which matters if you are prone to seasickness.',
                    'The Danube between Passau and Budapest is the classic. The Mekong from Siem Reap is the most interesting. The Brahmaputra is the one nobody expects and everybody talks about afterwards.',
                ],
            ],
            [
                'slug' => 'trekking-destinations-for-seniors',
                'title' => 'Treks Worth Doing After Sixty',
                'author_name' => 'Sangita Bhattacharyya',
                'published_at' => '15 Aug 2024',
                'category' => 'Practical',
                'is_featured' => false,
                'excerpt' => 'Short, graded, well-supported trails in India and Nepal that reward the walking without demanding the mountaineering.',
                'image_path' => '/images/home/divider-kenya-equator.webp',
                'content' => [
                    'A good senior trek has three properties: a short daily distance, a bail-out point, and somewhere warm to sleep. Plenty of routes have all three.',
                    'The Poon Hill circuit in Nepal is the obvious first: four days, teahouses throughout, and a sunrise over Annapurna that justifies every step.',
                    'Closer to home, the Kuari Pass in Uttarakhand and the Dzongri trail in Sikkim are both walkable in five days with porters and a slow schedule.',
                    'Whatever you choose, spend the two months beforehand walking hills at home. The trek is not the training.',
                ],
            ],
            [
                'slug' => 'travel-is-the-best-medicine',
                'title' => 'Travel Is the Best Medicine',
                'author_name' => '50+ Voyagers Team',
                'published_at' => '6 Jun 2024',
                'category' => 'Wellbeing',
                'is_featured' => false,
                'excerpt' => 'The research on travel and health after fifty — cardiovascular risk, metabolic markers, and the part that matters most, which is loneliness.',
                'image_path' => '/images/home/value-fully-hosted.webp',
                'content' => [
                    'The physical findings are real but modest: people who travel regularly walk more, sleep differently and show measurably better cardiovascular and metabolic markers than people who do not.',
                    'The larger effect is social. Sustained loneliness after sixty carries a mortality risk comparable to smoking, and it is the single thing a group trip is best at fixing.',
                    'We are not going to claim that a week in Bhutan will fix your blood pressure. We will claim, from ten years of watching it happen, that people come home from these trips lighter than they left.',
                ],
            ],
            [
                'slug' => 'a-perfect-bonding-destination',
                'title' => 'A Perfect Bonding Destination',
                'author_name' => 'Swarna Latha',
                'published_at' => '18 Apr 2024',
                'category' => 'Travelogue',
                'is_featured' => false,
                'excerpt' => 'A quiet stretch of coast, four old friends, and four days with nothing scheduled in them at all.',
                'image_path' => '/images/home/face-ranjini.webp',
                'content' => [
                    'We had known each other since college and had not been in the same room in eleven years.',
                    'The place we chose had almost nothing to do in it, which was the point. A beach, a shack that made good fish, and four cottages in a row.',
                    'By the second evening we had stopped filling the silences. By the fourth we had booked the same week for next year.',
                ],
            ],
        ];
    }
}
