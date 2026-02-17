const { onRequest } = require("firebase-functions/v2/https");
const admin = require("firebase-admin");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

admin.initializeApp();

// Calculate Deposit Helper
const calculateDeposit = (guests) => {
    let deposit = 0;
    // Basic rule: ¥5,000 per car.
    // 1-3 guests = 1 car
    // 4-6 guests = 2 cars
    // 7-9 guests = 3 cars
    // ...
    const carCount = Math.ceil(guests / 3);
    deposit = carCount * 5000;
    return deposit;
};

exports.createPaymentIntent = onRequest({ cors: true }, async (req, res) => {
    if (req.method !== 'POST') {
        return res.status(405).send('Method Not Allowed');
    }

    try {
        const { guests, tourType } = req.body;

        console.log("Received payment request:", { guests, tourType });

        // Calculate deposit amount server-side for security
        const depositAmount = calculateDeposit(guests);

        // Create a PaymentIntent with the order amount and currency
        const paymentIntent = await stripe.paymentIntents.create({
            amount: depositAmount,
            currency: "jpy",
            metadata: {
                tourType: tourType,
                guests: guests,
                integration_check: 'accept_a_payment'
            },
            payment_method_types: ['card'], // Enforce Card only to simplify UI (removes Link/Options)
            /* automatic_payment_methods: {
                enabled: true,
            }, */
        });

        console.log("PaymentIntent created:", paymentIntent.id);

        res.status(200).send({
            clientSecret: paymentIntent.client_secret,
            amount: depositAmount
        });

    } catch (error) {
        console.error("Stripe Error:", error);
        res.status(500).send({ error: error.message });
    }
});
