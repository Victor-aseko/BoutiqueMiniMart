const asyncHandler = require('express-async-handler');
const Product = require('../models/Product');

// @desc    Fetch all products
// @route   GET /api/products
// @access  Public
// @desc    Fetch all products with filters and sorting
// @route   GET /api/products
// @access  Public
const getProducts = asyncHandler(async (req, res) => {
    // 1. Filtering
    const queryObj = { ...req.query };
    const excludeFields = ['page', 'sort', 'limit', 'fields', 'keyword'];
    excludeFields.forEach((el) => delete queryObj[el]);

    // Advanced filtering (gte, lte, etc. for price/rating)
    let queryStr = JSON.stringify(queryObj);
    queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, (match) => `$${match}`);

    let query = Product.find(JSON.parse(queryStr));

    // Keyword Search (Name or Description)
    if (req.query.keyword) {
        const keyword = {
            $or: [
                { name: { $regex: req.query.keyword, $options: 'i' } },
                { description: { $regex: req.query.keyword, $options: 'i' } },
            ],
        };
        query = query.find(keyword);
    }

    // 2. Sorting
    if (req.query.sort) {
        const sortBy = req.query.sort.split(',').join(' ');
        query = query.sort(sortBy);
    } else {
        query = query.sort('-createdAt'); // Default sort: Newest
    }

    // 3. Field Limiting (Projecting)
    if (req.query.fields) {
        const fields = req.query.fields.split(',').join(' ');
        query = query.select(fields);
    } else {
        query = query.select('-__v');
    }

    // 4. Pagination
    const page = req.query.page * 1 || 1;
    const limit = req.query.limit * 1 || 100;
    const skip = (page - 1) * limit;

    query = query.skip(skip).limit(limit);

    const products = await query;
    res.json(products);
});

// @desc    Fetch single product
// @route   GET /api/products/:id
// @access  Public
const getProductById = asyncHandler(async (req, res) => {
    const product = await Product.findById(req.params.id);

    if (product) {
        res.json(product);
    } else {
        res.status(404);
        throw new Error('Product not found');
    }
});

// @desc    Delete a product
// @route   DELETE /api/products/:id
// @access  Private/Admin
const deleteProduct = asyncHandler(async (req, res) => {
    const product = await Product.findById(req.params.id);

    if (product) {
        await product.deleteOne();
        res.json({ message: 'Product removed' });
    } else {
        res.status(404);
        throw new Error('Product not found');
    }
});

// @desc    Create a product
// @route   POST /api/products
// @access  Private/Admin
const createProduct = asyncHandler(async (req, res) => {
    const {
        name,
        price,
        description,
        image,
        brand,
        category,
        countInStock,
        colors,
        sizes,
        isOffer,
    } = req.body;

    const product = new Product({
        name,
        price,
        user: req.user._id,
        image,
        brand,
        category,
        countInStock,
        colors: colors || [],
        sizes: sizes || [],
        description,
        isOffer: isOffer || false,
    });

    const createdProduct = await product.save();

    // Notify all users about new arrival or special offer (Background Process)
    const notifyAllUsers = async () => {
        try {
            const User = require('../models/User');
            const Notification = require('../models/Notification');
            const sendPushNotification = require('../utils/pushNotifications');

            const users = await User.find({ isAdmin: false });
            const title = createdProduct.isOffer ? 'Special Offer! 🏷️' : 'New Arrival! 👗';
            const message = `${createdProduct.name} is now available in our ${createdProduct.category} collection.`;

            // In-app notifications
            const notifications = users.map(u => ({
                user: u._id,
                title: title,
                message: message,
                type: 'INFO'
            }));
            await Notification.insertMany(notifications);

            // Push notifications
            const tokens = users.map(u => u.pushToken).filter(token => !!token);
            if (tokens.length > 0) {
                await sendPushNotification(tokens, title, message, { screen: 'Shop' });
            }
        } catch (e) {
            console.error('Failed to notify users about product update:', e);
        }
    };
    notifyAllUsers();

    res.status(201).json(createdProduct);
});

// @desc    Update a product
// @route   PUT /api/products/:id
// @access  Private/Admin
const updateProduct = asyncHandler(async (req, res) => {
    const {
        name,
        price,
        description,
        image,
        brand,
        category,
        countInStock,
        colors,
        sizes,
        isOffer,
    } = req.body;

    const product = await Product.findById(req.params.id);

    if (product) {
        const wasInStock = product.countInStock === 0;
        product.name = name;
        product.price = price;
        product.description = description;
        product.image = image;
        product.brand = brand;
        product.category = category;
        product.countInStock = countInStock;
        product.colors = colors || [];
        product.sizes = sizes || [];
        product.isOffer = isOffer;

        const updatedProduct = await product.save();

        // Notify users if restocked or newly put on offer
        if ((wasInStock && updatedProduct.countInStock > 0) || (updatedProduct.isOffer && !product.isOffer)) {
            const notifyProductUpdate = async () => {
                try {
                    const User = require('../models/User');
                    const Notification = require('../models/Notification');
                    const sendPushNotification = require('../utils/pushNotifications');

                    const users = await User.find({ isAdmin: false });
                    const title = updatedProduct.isOffer ? 'Huge Discount! 🏷️' : 'Back in Stock! ✨';
                    const message = `${updatedProduct.name} is now ${updatedProduct.isOffer ? 'on special offer!' : 'back in stock!'}`;

                    const notifications = users.map(u => ({ user: u._id, title, message, type: 'INFO' }));
                    await Notification.insertMany(notifications);

                    const tokens = users.map(u => u.pushToken).filter(t => !!t);
                    if (tokens.length > 0) {
                        await sendPushNotification(tokens, title, message, { screen: 'Shop' });
                    }
                } catch (e) {
                    console.error('Failed to notify users about product update:', e);
                }
            };
            notifyProductUpdate();
        }

        res.json(updatedProduct);
    } else {
        res.status(404);
        throw new Error('Product not found');
    }
});

module.exports = {
    getProducts,
    getProductById,
    deleteProduct,
    createProduct,
    updateProduct,
};
