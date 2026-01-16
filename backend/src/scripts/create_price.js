
import Stripe from 'stripe';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../../.env') });

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

async function createProPrice() {
    try {
        console.log('🔑 Using Secret Key:', process.env.STRIPE_SECRET_KEY ? '...'+process.env.STRIPE_SECRET_KEY.slice(-4) : 'MISSING');
        
        // 1. Create Product
        const product = await stripe.products.create({
            name: 'Pro Plan (v2)',
            description: 'For growing teams & power users'
        });
        console.log('✅ Created Product:', product.id);

        // 2. Create Price
        const price = await stripe.prices.create({
            product: product.id,
            unit_amount: 4999, // $49.99
            currency: 'usd',
            recurring: { interval: 'month' },
            metadata: { type: 'pro' }
        });
        
        console.log('✅ Created Price:', price.id);
        
        // 3. Print ENV update string
        console.log('\n 👇 UPDATE .ENV WITH THIS: 👇');
        console.log(`STRIPE_PRICE_ID_PRO=${price.id}`);

    } catch (error) {
        console.error('❌ Error creating price:', error.message);
    }
}

createProPrice();
