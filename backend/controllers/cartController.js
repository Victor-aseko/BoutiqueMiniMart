const asyncHandler = require('express-async-handler');
const Cart = require('../models/Cart');

// @desc    Get user cart
// @route   GET /api/cart
// @access  Private
const getCart = asyncHandler(async (req, res) => {
    const cart = await Cart.findOne({ user: req.user._id });

    if (cart) {
        res.json(cart);
    } else {
        // If no cart exists, return empty items instead of 404 for better UX
        res.json({ cartItems: [] });
    }
});

// @desc    Add/Update item in cart
// @route   POST /api/cart
// @access  Private
const addToCart = asyncHandler(async (req, res) => {
    const { product, name, image, price, qty, color, size } = req.body;

    let cart = await Cart.findOne({ user: req.user._id });

    if (cart) {
        // Check if product with SAME color and SAME size already exists in cart
        const itemIndex = cart.cartItems.findIndex(
            (p) => p.product.toString() === product && p.color === color && p.size === size
        );

        if (itemIndex > -1) {
            // Product variant exists in the cart, update the quantity
            cart.cartItems[itemIndex].qty = qty;
        } else {
            // Product variant does not exist in cart, add new item
            cart.cartItems.push({ product, name, image, price, qty, color, size });
        }
        cart = await cart.save();
        return res.status(201).json(cart);
    } else {
        // No cart for user, create new cart
        const newCart = await Cart.create({
            user: req.user._id,
            cartItems: [{ product, name, image, price, qty, color, size }],
        });

        return res.status(201).json(newCart);
    }
});

// @desc    Remove item from cart
// @route   DELETE /api/cart/:itemId
// @access  Private
// Note: itemId here refers to the product ID to be removed
const removeFromCart = asyncHandler(async (req, res) => {
    const productId = req.params.itemId;
    let cart = await Cart.findOne({ user: req.user._id });

    if (cart) {
        cart.cartItems = cart.cartItems.filter(
            (item) => item.product.toString() !== productId
        );
        await cart.save();
        res.json(cart);
    } else {
        res.status(404);
        throw new Error('Cart not found');
    }
});

// @desc    Clear cart
// @route   DELETE /api/cart
// @access  Private
const clearCart = asyncHandler(async (req, res) => {
    let cart = await Cart.findOne({ user: req.user._id });
    if (cart) {
        cart.cartItems = [];
        await cart.save();
        res.json({ message: 'Cart cleared' });
    } else {
        res.status(404);
        throw new Error('Cart not found');
    }
});

module.exports = {
    getCart,
    addToCart,
    removeFromCart,
    clearCart,
};
