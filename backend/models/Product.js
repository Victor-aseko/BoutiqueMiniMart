const mongoose = require('mongoose');

const productSchema = mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: 'User',
        },
        name: {
            type: String,
            required: true,
        },
        image: {
            type: String, // URL to the image
            required: true,
        },
        brand: {
            type: String,
            required: true,
        },
        category: {
            type: String, // Keeping as string for flexibility, or could be ObjectId ref
            required: true,
        },
        categoryRef: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Category'
        },
        reviews: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Review'
            }
        ],
        colors: [
            {
                name: { type: String, required: true },
                image: { type: String, required: true },
                colorCode: { type: String } // Hex code for color dot
            }
        ],
        sizes: [
            { type: String }
        ],
        rating: {
            type: Number,
            required: true,
            default: 0,
        },
        numReviews: {
            type: Number,
            required: true,
            default: 0,
        },
        description: {
            type: String,
            required: true,
        },
        price: {
            type: Number,
            required: true,
            default: 0,
        },
        countInStock: {
            type: Number,
            required: true,
            default: 0,
        },
        isOffer: {
            type: Boolean,
            required: true,
            default: false,
        },
        originalPrice: {
            type: Number,
        },
        offerPercentage: {
            type: Number,
        },
        offerEndDate: {
            type: Date,
        },
        offerStartDate: {
            type: Date,
        },
        isHotDeal: {
            type: Boolean,
            required: true,
            default: false,
        },
        isTrending: {
            type: Boolean,
            required: true,
            default: false,
        },
        status: {
            type: String,
            required: true,
            enum: ['In Stock', 'Out of Stock', 'Sold'],
            default: 'In Stock',
        },
    },
    {
        timestamps: true,
    }
);

const Product = mongoose.model('Product', productSchema);

module.exports = Product;
