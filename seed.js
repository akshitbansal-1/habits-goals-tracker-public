// Run once: node seed.js
// Make sure schema.sql has been run first

const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }  // required for Supabase
});

const items = [
  // ─── MEALS ────────────────────────────────────────────────────────────────
  {
    category: 'meal',
    name: '🍌 Pre-Workout',
    sort_order: 10,
    description: '1 banana + 1.5 tbsp Pintola natural PB + MuscleBlaze WRatX pre-workout.\nTiming: 7:45AM, 30 mins before training.\nPB blunts banana glucose spike. Pre-workout on semi-empty stomach for best absorption.'
  },
  {
    category: 'meal',
    name: '🥣 Post-Workout Breakfast',
    sort_order: 20,
    description: '80g Pintola high-protein oats + 400ml unsweetened soy milk + 25-30g whey isolate + 20g almonds + 10g pumpkin seeds + 1 tbsp chia seeds + 100g blueberries.\nTiming: 11:00AM, within 30 mins of shower.\nSoy milk over dairy to reduce acne triggers. Pumpkin seeds for zinc (acne control). Blueberries for antioxidants/PIH.'
  },
  {
    category: 'meal',
    name: '💊 Omega-3 + Collagen',
    sort_order: 30,
    description: 'Omega-3: 1500mg EPA+DHA (anti-inflammatory, skin barrier support).\nCollagen: as per dose on label (pores, skin texture, joints).\nTake with food — always after breakfast, never on empty stomach.\nCriteria: Both taken, not skipped.'
  },
  {
    category: 'meal',
    name: '🍱 Lunch',
    sort_order: 40,
    description: 'Rotate these 3 options — avoid same option back-to-back:\nA) Soya chunks curry (100g dry) + 2 whole wheat rotis + salad → ~59g protein ✅ Best\nB) 3 Besan chillas (spinach/onion/tomato) + small yogurt + salad → ~23g protein\nC) 3 eggs scrambled + 1 cup brown rice + salad → ~25g protein\nTiming: 2–4PM. Salad every day — cucumber, carrot, tomato minimum.\nCriteria: Salad included. If Option B, compensate protein at dinner.'
  },
  {
    category: 'meal',
    name: '🥜 Evening Snack',
    sort_order: 50,
    description: '2 slices high-protein bread + 2 tbsp Pintola natural PB + 5 walnuts.\nTiming: 7:00PM.\nWalnuts = plant omega-3 + zinc. PB = protein + healthy fats.\nCriteria: Natural PB only (no Kissan/Sundrop — added sugar defeats the purpose).'
  },
  {
    category: 'meal',
    name: '🍳 Dinner',
    sort_order: 60,
    description: 'Rotate these options:\nA) Egg bhurji (4 eggs) + 2 whole wheat rotis → 31g protein ✅ Best for skin\nB) Soya chunks bhurji (75g dry) + 2 rotis → 44g protein ✅ Best for protein\nC) Paneer bhurji (150g) + 2 rotis → 33g protein ⚠️ Max 2x/week (dairy)\nTiming: 9–10PM.\nCriteria: Add turmeric to every bhurji — anti-inflammatory. No paneer if already had dairy earlier in day.'
  },

  // ─── SKINCARE ─────────────────────────────────────────────────────────────
  {
    category: 'skincare',
    name: '☀️ Morning Sunlight',
    sort_order: 10,
    description: '10 minutes of direct morning sunlight exposure (7:30–8:30AM window).\nFace + arms exposed, no sunscreen for this window.\nVitamin D synthesis, circadian rhythm reset, mood regulation.\nCriteria: Outdoors, not through glass, minimum 10 minutes.'
  },
  {
    category: 'skincare',
    name: '🧴 AM Cleanser',
    sort_order: 20,
    description: 'Gentle, low-pH face wash in the morning.\nAvoid anything with SLS, harsh sulfates, or alcohol.\nDo NOT over-cleanse — strips skin barrier and worsens oiliness.\nCriteria: Used once in AM. Patted dry, not rubbed.'
  },
  {
    category: 'skincare',
    name: '🧴 AM Vitamin C',
    sort_order: 21,
    description: 'For skin barrier and glowing skin.'
  },
  {
    category: 'skincare',
    name: '🧴 AM Niacinamide',
    sort_order: 22,
    description: 'For reducing oil production.'
  },
  {
    category: 'skincare',
    name: '💧 AM Moisturiser',
    sort_order: 30,
    description: 'Non-comedogenic moisturiser after AM cleanse.\nLook for: niacinamide, hyaluronic acid, ceramides — all help with dullness + PIH.\nAvoid: heavy oils (coconut, olive) on face — comedogenic.\nCriteria: Applied to damp skin within 60 seconds of washing.'
  },
  {
    category: 'skincare',
    name: '🛡️ Sunscreen',
    sort_order: 40,
    description: 'SPF 30–50 PA+++ broad spectrum. Apply EVERY day, even indoors.\nThis is the #1 non-negotiable for PIH (dark spots) and uneven texture.\nWithout sunscreen, all other skincare is reduced effectiveness.\nReapply if outdoors for 2+ hours.\nCriteria: Applied after moisturiser, before leaving home. No skipping on cloudy days.'
  },
  {
    category: 'skincare',
    name: '🌙 PM Cleanser or Salicylic Acid Face wash',
    sort_order: 50,
    description: 'Double cleanse at night if worn sunscreen:\n1. Oil/balm cleanser to break down sunscreen\n2. Gentle water-based cleanser\nIf no sunscreen (rare) — single cleanse is fine.\nCriteria: Both steps if sunscreen was applied. No going to bed without cleansing. No salicylic acid on retinol day.'
  },
  {
    category: 'skincare',
    name: '🌙 Retinol | Niacinamide | AHA + BHA',
    sort_order: 50,
    description: 'Retinol/Niacinamide on alternate days. AHA+BHA on sunday and no retinol on night before AHA+BHA.'
  },
  {
    category: 'skincare',
    name: '🌙 PM Moisturiser / Active',
    sort_order: 60,
    description: 'Night is when skin repairs. Use your actives here:\nFor PIH/dark spots: Niacinamide (10%) or Vitamin C (apply earlier)\nFor texture/acne: Retinol OR BHA salicylic acid (not both same night)\nAlways: Finish with moisturiser to seal.\nCriteria: Active applied + moisturiser on top. No sleeping with bare skin.'
  },
  {
    category: 'skincare',
    name: '🛏️ Clean Pillowcase',
    sort_order: 70,
    description: 'Change pillowcase at least every 3 days. Silk or 100% cotton preferred.\nDirty pillowcase transfers bacteria, sebum, and dead skin directly to cheeks/jawline — prime acne territory for you.\nCriteria: Mentally note last change. If 3+ days, flip or change tonight.'
  },
  {
    category: 'skincare',
    name: '🚫 No Face Touching',
    sort_order: 80,
    description: 'Conscious effort to not touch, pick, or rest hand on face throughout the day.\nJawline + cheek acne is heavily worsened by unconscious hand-face contact (especially during office/screen time).\nNo picking at active papules — causes PIH.\nCriteria: Honest self-check. Did you touch your face unnecessarily today?'
  },
  {
    category: 'skincare',
    name: '💧 Water Intake',
    sort_order: 90,
    description: 'Minimum 3–3.5 litres of water daily, especially on gym days.\nDehydration = dull skin, congested pores, slower cell turnover.\nSpread across the day — not just at meals.\nCriteria: At least 3 litres tracked. More on 2hr+ gym days.'
  },

  // ─── HABITS ────────────────────────────────────────────────────────────────
  {
    category: 'habit',
    name: '⏰ Wake Up by 7:30AM',
    sort_order: 10,
    description: 'Out of bed by 7:30AM, no snoozing.\nConsistent wake time is the anchor of your circadian rhythm — affects cortisol, sleep quality, and skin repair cycles.\nCriteria: Phone out of hand, feet on floor by 7:30AM.'
  },
  {
    category: 'habit',
    name: '🏋️ Calisthenics Done',
    sort_order: 20,
    description: 'Complete home calisthenics session before gym:\nDead hang → Scapula pull-ups → Pull-ups\nWarm-up first: arm circles, shoulder swings, wall slides, cat-cow.\nCriteria: All three movements completed. Scapula fully activated before pull-ups.'
  },
  {
    category: 'habit',
    name: '🏟️ Gym Session Done',
    sort_order: 30,
    description: 'Complete planned gym session (today: Pull Day).\nFor 2hr+ sessions: fuel at the 60–90 min mark with banana or dates.\nLog your exercises — progressive overload is how you reach 75kg lean.\nCriteria: Full session completed, no early bail without valid reason.'
  },
{
  category: 'habit',
  name: '📋 Plan the Day',
  sort_order: 35,
  description: 'Write down top 3 priorities before starting work.\nReduces decision fatigue — keeps you executing instead of reacting all day.\nCriteria: 3 tasks written (paper, Notion, Notes — anywhere). Done before 9AM ideally.'
},
  {
    category: 'habit',
    name: '🥛 No Dairy Milk Today',
    sort_order: 40,
    description: 'Dairy milk is a suspected primary trigger for your cheek/jawline acne (IGF-1, hormones).\nThis means: no chai with milk, no milk in oats, no paneer if already had dairy elsewhere.\nSoy milk or oat milk as substitutes.\nCriteria: Zero cow milk consumed today. Strict tracking for first 4 weeks to test hypothesis.'
  },
    {
    category: 'habit',
    name: '🚶 Post-Dinner Walk',
    sort_order: 45,
    description: '15–20 min light walk after dinner.\nImproves glucose disposal, digestion, and sleep quality.\nNo intense exercise — just a stroll.\nCriteria: Done within 30–60 mins of finishing dinner. Even 10 mins counts.'
  },
{
  category: 'habit',
  name: '💘 Use Hinge',
  sort_order: 75,
  description: 'Spend 10–15 mins intentionally on Hinge — send a thoughtful opener or reply to matches.\nNot mindless swiping. Quality over quantity.\nCriteria: At least 1 genuine message sent or 1 real conversation progressed.'
},

{
  category: 'habit',
  name: '🎸 Learn Guitar',
  sort_order: 80,
  description: 'Practice guitar for at least 15–20 mins.\nConsistency beats duration — 15 mins daily beats 2 hours once a week.\nCriteria: Structured practice (scales, a song, a lesson) — not just noodling.'
},
  {
    category: 'habit',
    name: '🧠 Protein Target Hit',
    sort_order: 81,
    description: 'Hit 140–165g protein for the day.\nRoughly track: Breakfast oats+whey (~64g) + Lunch (~25-59g) + Dinner (~31-44g) + Snacks (~15g) = ~135–182g.\nDo not obsess — within range is fine.\nCriteria: Honest estimate puts you in the 140–165g window.'
  },
  {
    category: 'habit',
    name: '📵 Screen Wind-Down',
    sort_order: 82,
    description: 'Reduce screen brightness after 10PM. Blue light blocking mode on.\nIdeal: Put phone down 30 mins before sleep target.\nYour sleep is inconsistent — this is one of the biggest levers.\nCriteria: No active scrolling after 11:00PM. Phone face-down or on do-not-disturb.'
  },
{
  category: 'habit',
  name: '📖 Read Book',
  sort_order: 85,
  description: 'Read at least 10–20 pages of an actual book — not articles or social media.\nBuilds focus, reduces screen time before bed, compounds knowledge over time.\nCriteria: Physical or Kindle book, 10 pages minimum. Audiobooks count if no other option.'
},
  {
    category: 'habit',
    name: '🌙 Sleep by 11:30PM',
    sort_order: 100,
    description: 'Lights out, eyes closed by 11:30PM.\nSleep is when GH (growth hormone) peaks — critical for muscle gain and skin repair. You cannot out-supplement bad sleep.\nCriteria: In bed with intention to sleep, not scrolling. Consistent time matters more than total hours.'
  },

];

async function seed() {
  const client = await pool.connect();
  try {
    console.log('🌱 Seeding items...');
    await client.query('BEGIN');

    // Clear existing items
    await client.query('DELETE FROM daily_logs');
    await client.query('DELETE FROM items');
    await client.query('ALTER SEQUENCE items_id_seq RESTART WITH 1');

    for (const item of items) {
      await client.query(
        'INSERT INTO items (name, description, category, sort_order) VALUES ($1, $2, $3, $4)',
        [item.name, item.description, item.category, item.sort_order]
      );
    }

    await client.query('COMMIT');
    console.log(`✅ Seeded ${items.length} items successfully.`);
    console.log('   Meals:', items.filter(i => i.category === 'meal').length);
    console.log('   Skincare:', items.filter(i => i.category === 'skincare').length);
    console.log('   Habits:', items.filter(i => i.category === 'habit').length);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Seed failed:', err.message);
  } finally {
    client.release();
    pool.end();
  }
}

seed();
