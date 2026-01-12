const express = require('express');
const router = express.Router();
const {
    getProducts,
    getProductById,
    deleteProduct,
    updateProduct,
    createProduct,
} = require('../controllers/productController');
const { createProductReview, getProductReviews } = require('../controllers/reviewController');
const { protect, admin } = require('../middleware/authMiddleware');

router.route('/').get(getProducts).post(protect, admin, createProduct);

// Specific routes first to avoid ID collision
router.route('/:id/reviews').post(protect, createProductReview).get(getProductReviews);

router
    .route('/:id')
    .get(getProductById)
    .delete(protect, admin, deleteProduct)
    .put(protect, admin, updateProduct);

module.exports = router;
