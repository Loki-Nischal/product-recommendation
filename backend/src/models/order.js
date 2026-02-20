import mongoose from "mongoose";

const orderItemSchema = new mongoose.Schema({
    product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
    name: { type: String, required: true },
    price: { type: Number, required: true },
    quantity: { type: Number, required: true, default: 1 },
    image: { type: String },
});

const orderSchema = new mongoose.Schema(
    {
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        items: [orderItemSchema],
        deliveryInfo: {
            fullName: { type: String, required: true },
            region: { type: String, required: true },
            phoneNumber: { type: String, required: true },
            city: { type: String, required: true },
            address: { type: String, required: true },
        },
        subtotal: { type: Number, required: true },
        shippingFee: { type: Number, required: true },
        total: { type: Number, required: true },
        status: {
            type: String,
            enum: ["pending", "processing", "shipped", "delivered", "cancelled"],
            default: "pending",
        },
        paymentStatus: {
            type: String,
            enum: ["unpaid", "paid", "failed", "refunded"],
            default: "unpaid",
        },
        paymentMethod: { type: String, default: "" },
        transactionId: { type: String, default: "" },
    },
    { timestamps: true }
);

export default mongoose.model("Order", orderSchema);
