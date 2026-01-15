const asyncHandler = require('express-async-handler');
const Product = require('../models/Product');
const Review = require('../models/Review');

// @desc    Create new review
// @route   POST /api/products/:id/reviews
// @access  Private
const createProductReview = asyncHandler(async (req, res) => {
    const { rating, comment } = req.body;
    const product = await Product.findById(req.params.id);

    if (req.user && req.user.isAdmin) {
        res.status(403);
        throw new Error('Administrators are not allowed to review products');
    }

    if (product) {
        const reviewCount = await Review.countDocuments({
            product: req.params.id,
            user: req.user._id,
        });

        if (reviewCount >= 2) {
            res.status(400).json({ message: 'You have already reviewed this product twice' });
            return;
        }

        const review = await Review.create({
            name: req.user.name,
            rating: Number(rating),
            comment,
            user: req.user._id,
            product: req.params.id,
        });

        // Update Product Stats
        // Ideally this is done via aggregation or a signal, but simple calculation is fine for MVP
        const reviews = await Review.find({ product: req.params.id });

        product.numReviews = reviews.length;
        product.rating =
            reviews.reduce((acc, item) => item.rating + acc, 0) / reviews.length;
        product.reviews.push(review._id);

        await product.save();
        res.status(201).json({ message: 'Review added' });
    } else {
        res.status(404);
        throw new Error('Product not found');
    }
});

// @desc    Get product reviews
// @route   GET /api/products/:id/reviews
// @access  Public
const getProductReviews = asyncHandler(async (req, res) => {
    const reviews = await Review.find({ product: req.params.id });
    res.json(reviews);
});

module.exports = { createProductReview, getProductReviews };
