const Razorpay = require("razorpay");

export default async function handler(req, res) {
    if (req.method === "POST") {
        const { amount, currency } = req.body;

        try {
            // Validate input
            if (!amount || amount <= 0) {
                return res.status(400).json({ error: "Invalid amount. Amount must be greater than 0." });
            }

            // Check if Razorpay keys are configured
            const keyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
            const keySecret = process.env.NEXT_PUBLIC_RAZORPAY_KEY_SECRET;

            if (!keyId || !keySecret) {
                console.error("Razorpay keys not configured");
                return res.status(500).json({ 
                    error: "Payment gateway not configured",
                    message: "Please contact support to enable payments." 
                });
            }

            const razorpay = new Razorpay({
                key_id: keyId,
                key_secret: keySecret,
            });

            const options = {
                amount: Math.round(amount * 100), // Amount in paise (multiply by 100 for INR), rounded to avoid decimals
                currency: currency || "INR",
                receipt: `receipt_${Date.now()}`,
                notes: {
                    created_at: new Date().toISOString(),
                    platform: "Brahmand AI"
                }
            };

            console.log(`Creating Razorpay order: ${JSON.stringify(options)}`);
            
            const order = await razorpay.orders.create(options);
            
            console.log(`Order created successfully: ${order.id}`);
            
            res.status(200).json({
                success: true,
                order: order,
                key_id: keyId // Send key_id to frontend for checkout
            });
        } catch (error) {
            console.error("Razorpay order creation error:", error);
            
            // Handle specific Razorpay errors
            if (error.statusCode === 401) {
                return res.status(500).json({ 
                    error: "Payment gateway authentication failed",
                    message: "Invalid API credentials. Please contact support."
                });
            }
            
            if (error.statusCode === 400) {
                return res.status(400).json({ 
                    error: "Invalid payment request",
                    message: error.message || "Please check your payment details and try again."
                });
            }
            
            res.status(500).json({ 
                error: "Failed to create payment order",
                message: "An unexpected error occurred. Please try again or contact support.",
                details: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    } else {
        res.status(405).json({ error: "Method not allowed" });
    }
}
