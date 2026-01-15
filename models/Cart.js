const mongoose = require('mongoose');

const cartSchema = mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: 'User',
            unique: true, // One cart per user
        },
        cartItems: [
            {
                product: {
                    type: mongoose.Schema.Types.ObjectId,
                    required: true,
                    ref: 'Product',
                },
                name: { type: String, required: true },
                image: { type: String, required: true },
                price: { type: Number, required: true },
                qty: { type: Number, required: true, default: 1 },
                color: { type: String },
                size: { type: String },
            },
        ],
    },
    {
        timestamps: true,
    }
);

const Cart = mongoose.model('Cart', cartSchema);

module.exports = Cart;
