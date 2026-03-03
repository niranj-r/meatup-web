const { onRequest, onCall, HttpsError } = require("firebase-functions/v2/https");
const logger = require("firebase-functions/logger");
const admin = require("firebase-admin");
const Razorpay = require("razorpay");

admin.initializeApp();

// Replace these with your actual Razorpay API keys or use Firebase Environment variables
const RAZORPAY_KEY_ID = process.env.EXPO_PUBLIC_RAZORPAY_KEY_ID || "";
const RAZORPAY_KEY_SECRET = process.env.EXPO_PUBLIC_RAZORPAY_KEY_SECRET || "";

const razorpay = new Razorpay({
    key_id: RAZORPAY_KEY_ID,
    key_secret: RAZORPAY_KEY_SECRET,
});

exports.createRazorpayOrder = onCall({ cors: ["http://localhost:3000", "https://meatup-f8c49.web.app", "https://meatup-f8c49.firebaseapp.com"] }, async (request) => {
    // Authentication extraction from context
    if (!request.auth) {
        throw new HttpsError(
            "unauthenticated",
            "The function must be called while authenticated."
        );
    }

    const amount = request.data.amount;
    const currency = request.data.currency || "INR";

    if (!amount) {
        throw new HttpsError("invalid-argument", "The function must be called with an 'amount'.");
    }

    const options = {
        amount: Math.round(amount * 100), // amount in the smallest currency unit (paise)
        currency,
        receipt: `receipt_order_${Date.now()}`,
    };

    try {
        const order = await razorpay.orders.create(options);
        logger.info("Razorpay Order Created", { orderId: order.id });
        return {
            id: order.id,
            amount: order.amount,
            currency: order.currency,
        };
    } catch (error) {
        logger.error("Error creating Razorpay order:", error);
        throw new HttpsError("internal", "Failed to create Razorpay order.");
    }
});
