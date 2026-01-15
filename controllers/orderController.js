const asyncHandler = require('express-async-handler');
const Order = require('../models/Order');
const User = require('../models/User');
const Notification = require('../models/Notification');

// @desc    Create new order
// @route   POST /api/orders
// @access  Private
const addOrderItems = asyncHandler(async (req, res) => {
    console.log('POST /orders by user:', req.user && req.user._id);
    const {
        orderItems,
        shippingAddress,
        paymentMethod,
        itemsPrice,
        taxPrice,
        shippingPrice,
        totalPrice,
    } = req.body;

    if (orderItems && orderItems.length === 0) {
        res.status(400);
        throw new Error('No order items');
        return;
    } else {

        const order = new Order({
            orderItems,
            user: req.user._id,
            shippingAddress,
            paymentMethod,
            itemsPrice,
            taxPrice,
            shippingPrice,
            totalPrice,
        });
        //console.log('Order created with user:', order.user);

        const createdOrder = await order.save();

        // Notify vendor
        try {
            const sendEmail = require('../utils/sendEmail');
            await sendEmail({
                email: 'Miniboutique043@gmail.com',
                subject: 'New Order Placed - Boutique Mini Mart',
                message: `A new order (${createdOrder._id}) has been placed by ${req.user.name}.\n\nTotal: ${createdOrder.totalPrice}\nPayment Method: ${createdOrder.paymentMethod}\n\nPlease check the admin dashboard for details.`
            });
        } catch (e) {
            console.error('Failed to send order notification email:', e);
        }

        // Create In-App Notification for Admins
        try {
            const admins = await User.find({ isAdmin: true });
            const notifications = admins.map(admin => ({
                user: admin._id,
                title: 'New Order Received! 🎉',
                message: `Order #${createdOrder._id.toString().slice(-6).toUpperCase()} has been placed by ${req.user.name}. Sum: Kshs ${createdOrder.totalPrice.toFixed(2)}`,
                type: 'ORDER_PLACED',
                orderId: createdOrder._id
            }));
            await Notification.insertMany(notifications);
        } catch (e) {
            console.error('Failed to create in-app notification for admins:', e);
        }

        res.status(201).json(createdOrder);
    }
});

// @desc    Get order by ID
// @route   GET /api/orders/:id
// @access  Private
const getOrderById = asyncHandler(async (req, res) => {
    const order = await Order.findById(req.params.id).populate(
        'user',
        'name email'
    );

    if (order) {
        res.json(order);
    } else {
        res.status(404);
        throw new Error('Order not found');
    }
});

// @desc    Update order to paid
// @route   PUT /api/orders/:id/pay
// @access  Private
const updateOrderToPaid = asyncHandler(async (req, res) => {
    const order = await Order.findById(req.params.id);

    if (order) {
        order.isPaid = true;
        order.paidAt = Date.now();
        order.paymentResult = {
            id: req.body.id,
            status: req.body.status,
            update_time: req.body.update_time,
            email_address: req.body.email_address,
        };

        const updatedOrder = await order.save();

        res.json(updatedOrder);
    } else {
        res.status(404);
        throw new Error('Order not found');
    }
});

// @desc    Update order to delivered
// @route   PUT /api/orders/:id/deliver
// @access  Private/Admin
const updateOrderToDelivered = asyncHandler(async (req, res) => {
    const order = await Order.findById(req.params.id);

    if (order) {
        // Check if user is admin OR the owner of the order
        const isAdmin = req.user && req.user.isAdmin;
        const isOwner = req.user && order.user.toString() === req.user._id.toString();

        if (!isAdmin && !isOwner) {
            res.status(401);
            throw new Error('Not authorized to update this order');
        }

        order.isDelivered = true;
        order.deliveredAt = Date.now();
        order.status = 'Delivered';

        const updatedOrder = await order.save();

        // Notify admins if user marked as delivered
        if (isOwner && !isAdmin) {
            try {
                const admins = await User.find({ isAdmin: true });
                const notifications = admins.map(admin => ({
                    user: admin._id,
                    title: 'Order Status Updated: Delivered ✅',
                    message: `Customer ${req.user.name} has marked Order #${updatedOrder._id.toString().slice(-6).toUpperCase()} as delivered.`,
                    type: 'ORDER_STATUS_UPDATE',
                    orderId: updatedOrder._id
                }));
                await Notification.insertMany(notifications);
            } catch (e) {
                console.error('Failed to create in-app notification for admins:', e);
            }
        }

        res.json(updatedOrder);
    } else {
        res.status(404);
        throw new Error('Order not found');
    }
});

// @desc    Get logged in user orders
// @route   GET /api/orders/myorders
// @access  Private
const getMyOrders = asyncHandler(async (req, res) => {
    console.log('GET /orders/myorders for user:', req.user && req.user._id);
    const orders = await Order.find({ user: req.user._id });
    console.log('Orders found:', orders.length);
    res.json(orders);
});

// @desc    Update order status
// @route   PUT /api/orders/:id/status
// @access  Private/Admin
const updateOrderStatus = asyncHandler(async (req, res) => {
    const order = await Order.findById(req.params.id);

    if (order) {
        order.status = req.body.status || order.status;

        // Handle manual payment status toggle by admin
        if (req.body.isPaid !== undefined) {
            order.isPaid = req.body.isPaid;
            if (order.isPaid && !order.paidAt) {
                order.paidAt = Date.now();
            }
        }

        if (req.body.status === 'Delivered') {
            order.isDelivered = true;
            order.deliveredAt = Date.now();
        }

        if (req.body.status === 'Cancelled') {
            await Order.findByIdAndDelete(req.params.id);

            // Notify user about cancellation/removal
            try {
                await Notification.create({
                    user: order.user,
                    title: `Order Removed: Cancelled ❌`,
                    message: `Your order #${order._id.toString().slice(-6).toUpperCase()} has been cancelled and removed.`,
                    type: 'ORDER_STATUS_UPDATE',
                });
            } catch (e) {
                console.error('Failed to notify user removal:', e);
            }
            return res.json({ message: 'Order removed' });
        }

        const updatedOrder = await order.save();

        // Create In-App Notification for User
        try {
            await Notification.create({
                user: order.user,
                title: `Order Status Updated: ${updatedOrder.status} 📦`,
                message: `Your order #${updatedOrder._id.toString().slice(-6).toUpperCase()} is now ${updatedOrder.status}.`,
                type: 'ORDER_STATUS_UPDATE',
                orderId: updatedOrder._id
            });
        } catch (e) {
            console.error('Failed to create in-app notification for user:', e);
        }

        res.json(updatedOrder);
    } else {
        res.status(404);
        throw new Error('Order not found');
    }
});

// @desc    Get all orders
// @route   GET /api/orders
// @access  Private/Admin
const getOrders = asyncHandler(async (req, res) => {
    const orders = await Order.find({}).populate('user', 'id name');
    res.json(orders);
});

// @desc    Cancel an order
// @route   PUT /api/orders/:id/cancel
// @access  Private
const cancelOrder = asyncHandler(async (req, res) => {
    const order = await Order.findById(req.params.id);

    if (order) {
        const isOwner = order.user.toString() === req.user._id.toString();
        const isAdmin = req.user.isAdmin;

        if (!isAdmin && !isOwner) {
            res.status(401);
            throw new Error('Not authorized to cancel this order');
        }

        if (!isAdmin && order.status !== 'Pending') {
            res.status(400);
            throw new Error('Cannot cancel an order that is already being processed or shipped');
        }

        await Order.findByIdAndDelete(req.params.id);

        // Notify admins if customer cancelled (and thus deleted)
        if (!isAdmin) {
            try {
                const admins = await User.find({ isAdmin: true });
                const notifications = admins.map(admin => ({
                    user: admin._id,
                    title: 'Order Deleted by Customer 🗑️',
                    message: `Customer ${req.user.name} has deleted their Pending Order #${req.params.id.toString().slice(-6).toUpperCase()}.`,
                    type: 'ORDER_STATUS_UPDATE',
                }));
                await Notification.insertMany(notifications);
            } catch (e) {
                console.error('Failed to create notification for admin:', e);
            }
        }

        res.json({ message: 'Order removed' });
    } else {
        res.status(404);
        throw new Error('Order not found');
    }
});

module.exports = {
    addOrderItems,
    getOrderById,
    updateOrderToPaid,
    updateOrderToDelivered,
    updateOrderStatus,
    getMyOrders,
    getOrders,
    cancelOrder,
};
