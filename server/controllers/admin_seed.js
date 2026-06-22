const Supabase = require('../services/supabaseService');
const { v4: uuidv4 } = require('uuid');

async function seed() {
    console.log('🌱 Starting Admin Seed...');

    // 1. Seed Billing Settings
    const { data: bSettings } = await Supabase.select('billing_settings');
    if (!bSettings || bSettings.length === 0) {
        await Supabase.insert('billing_settings', {
            id: 'billing-config',
            credit_value_usd: 0.01,
            minimum_credit_charge: 1.0,
            global_ai_markup_multiplier: 4.0,
            updated_at: new Date().toISOString()
        });
        console.log('✅ Seeded billing_settings');
    }

    // 2. Seed Gateway Settings
    const { data: gSettings } = await Supabase.select('gateway_settings');
    if (!gSettings || gSettings.length === 0) {
        await Supabase.insert('gateway_settings', {
            id: 'gateway-config',
            price: 9900,
            currency: 'NGN',
            durationMonths: 12,
            active: true
        });
        console.log('✅ Seeded gateway_settings');
    }

    // 3. Seed Model Catalog
    const { data: mCatalog } = await Supabase.select('model_catalog');
    if (!mCatalog || mCatalog.length === 0) {
        await Supabase.insert('model_catalog', {
            id: 'model-catalog',
            customModels: {},
            updated_at: new Date().toISOString()
        });
        console.log('✅ Seeded model_catalog');
    }

    // 4. Seed Credit Packs
    const { data: cPacks } = await Supabase.select('credit_packs');
    if (!cPacks || cPacks.length === 0) {
        const packs = [
            { id: uuidv4(), name: 'Starter Pack', amount: 100, price: 1500, currency: 'NGN' },
            { id: uuidv4(), name: 'Pro Pack', amount: 500, price: 6500, currency: 'NGN' },
            { id: uuidv4(), name: 'Power Pack', amount: 1000, price: 12000, currency: 'NGN' }
        ];
        await Supabase.insert('credit_packs', packs);
        console.log('✅ Seeded credit_packs');
    }

    // 5. Seed Baseline Model Pricing
    const { data: mPricing } = await Supabase.select('model_pricing');
    if (!mPricing || mPricing.length === 0) {
        const pricing = [
            { provider: 'openai', model: 'gpt-4o-mini', input_cost_per_million: 0.15, output_cost_per_million: 0.60, markup_multiplier: 4.0 },
            { provider: 'openai', model: 'gpt-4o', input_cost_per_million: 2.50, output_cost_per_million: 10.00, markup_multiplier: 3.0 },
            { provider: 'openrouter', model: 'deepseek/deepseek-r1', input_cost_per_million: 0.55, output_cost_per_million: 2.19, markup_multiplier: 3.0 }
        ];
        await Supabase.insert('model_pricing', pricing.map(p => ({ ...p, id: uuidv4() })));
        console.log('✅ Seeded model_pricing');
    }

    console.log('🏁 Seed completed.');
}

seed().catch(err => {
    console.error('❌ Seed failed:', err);
    process.exit(1);
});