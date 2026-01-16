
import Stripe from 'stripe';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../../.env') });

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

async function listPrices() {
    try {
        console.log('🔑 Using Secret Key:', process.env.STRIPE_SECRET_KEY ? '...'+process.env.STRIPE_SECRET_KEY.slice(-4) : 'MISSING');
        
        console.log('\nFetching prices from Stripe...');
        const prices = await stripe.prices.list({
            limit: 10,
            expand: ['data.product']
        });

        if (prices.data.length === 0) {
            console.log('❌ No prices found in this Stripe account.');
            return;
        }

        console.log('\n✅ Available Prices:');
        prices.data.forEach(p => {
            const productName = typeof p.product === 'string' ? p.product : p.product.name;
            console.log(`----------------------------------------`);
            console.log(`Product: ${productName}`);
            console.log(`Price ID: ${p.id}  <-- USE THIS ID`);
            console.log(`Amount: ${(p.unit_amount / 100).toFixed(2)} ${p.currency.toUpperCase()}`);
            console.log(`Active: ${p.active}`);
        });
        console.log(`----------------------------------------`);

    } catch (error) {
        console.error('❌ Error fetching prices:', error.message);
    }
}

listPrices();
