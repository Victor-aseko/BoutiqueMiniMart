const asyncHandler = require('express-async-handler');
const Order = require('../models/Order');
const User = require('../models/User');
const Notification = require('../models/Notification');
const { generateToken } = require('../controllers/authController');

// @desc    Create new order
// @route   POST /api/orders
// @access  Private/Public (Guest allowed)
const addOrderItems = asyncHandler(async (req, res) => {
    console.log('POST /orders. Authenticated:', !!req.user);
    const {
        orderItems,
        shippingAddress,
        paymentMethod,
        itemsPrice,
        taxPrice,
        shippingPrice,
        totalPrice,
        guestUser
    } = req.body;

    let user = req.user;
    let authData = null;

    // Normalize address keys for model compatibility
    const normalizedShippingAddress = shippingAddress ? {
        ...shippingAddress,
        address: shippingAddress.address || shippingAddress.street || 'N/A',
        street: shippingAddress.street || shippingAddress.address || 'N/A'
    } : null;

    // Handle Guest Checkout
    if (!user) {
        if (!guestUser || !guestUser.email || !guestUser.name) {
            res.status(400);
            throw new Error('Please provide guest details (name and email)');
        }

        const email = guestUser.email.toLowerCase();
        let existingUser = await User.findOne({ email });

        if (!existingUser) {
            console.log('Creating guest account for:', email);
            const crypto = require('crypto');
            existingUser = await User.create({
                name: guestUser.name,
                email: email,
                password: crypto.randomBytes(12).toString('hex'), // Random password
                addresses: [normalizedShippingAddress]
            });
        } else {
            console.log('Guest checkout for existing email:', email);
            // Optionally update address if not present
            if (existingUser.addresses.length === 0) {
                existingUser.addresses.push(normalizedShippingAddress);
                await existingUser.save();
            }
        }

        user = existingUser;
        authData = {
            _id: user._id,
            name: user.name,
            email: user.email,
            isAdmin: user.isAdmin,
            addresses: user.addresses,
            token: generateToken(user._id)
        };
    }

    if (orderItems && orderItems.length === 0) {
        res.status(400);
        throw new Error('No order items');
        return;
    } else {
        const order = new Order({
            orderItems,
            user: user._id,
            shippingAddress: normalizedShippingAddress,
            paymentMethod,
            itemsPrice,
            taxPrice,
            shippingPrice,
            totalPrice,
        });

        const createdOrder = await order.save();

        // Increment order stats for analytics (Background Process)
        const updateProductStats = async () => {
            try {
                const Product = require('../models/Product');
                for (const item of orderItems) {
                    await Product.findByIdAndUpdate(item.product, {
                        $inc: { ordersCount: item.qty }
                    });
                }
            } catch (e) {
                console.error('Failed to update product order stats:', e);
            }
        };
        updateProductStats();

        // Send response with order and potential auth data for automatic login
        res.status(201).json({
            ...createdOrder.toObject(),
            auth: authData
        });

        // Notify vendor (Background Process)
        const notifyVendor = async () => {
            try {
                const sendEmail = require('../utils/sendEmail');
                await sendEmail({
                    email: 'miniboutique043@gmail.com',
                    subject: 'New Order Placed - Boutique Mini Mart',
                    message: `A new order (${createdOrder._id}) has been placed by ${user.name}.\n\nTotal: ${createdOrder.totalPrice}\nPayment Method: ${createdOrder.paymentMethod}\n\nPlease check the admin dashboard for details.`
                });
            } catch (e) {
                console.error('Failed to send order notification email:', e);
            }
        };
        notifyVendor();

        // Create In-App Notification for Admins (Background Process)
        const notifyAdmins = async () => {
            try {
                const admins = await User.find({ isAdmin: true });
                const notifications = admins.map(admin => ({
                    user: admin._id,
                    title: 'New Order Received! 🎉',
                    message: `Order #${createdOrder._id.toString().slice(-6).toUpperCase()} has been placed by ${user.name}. Sum: Kshs ${createdOrder.totalPrice.toFixed(2)}`,
                    type: 'ORDER_PLACED',
                    orderId: createdOrder._id
                }));
                await Notification.insertMany(notifications);

                // Push Notifications for Admins
                const sendPushNotification = require('../utils/pushNotifications');
                const adminTokens = admins.map(admin => admin.pushToken).filter(token => !!token);
                if (adminTokens.length > 0) {
                    await sendPushNotification(
                        adminTokens,
                        'New Order Received! 🎉',
                        `Order #${createdOrder._id.toString().slice(-6).toUpperCase()} placed by ${user.name}`,
                        { screen: 'Orders' }
                    );
                }
            } catch (e) {
                console.error('Failed to create notification for admins:', e);
            }
        };
        notifyAdmins();

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
        order.statusUpdatedAt = Date.now();

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
        if (req.body.status && req.body.status !== order.status) {
            order.status = req.body.status;
            order.statusUpdatedAt = Date.now();
        }

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
            order.statusUpdatedAt = Date.now();
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

            // Push Notification for User
            const targetUser = await User.findById(order.user);
            if (targetUser && targetUser.pushToken) {
                const sendPushNotification = require('../utils/pushNotifications');
                await sendPushNotification(
                    [targetUser.pushToken],
                    `Order Status Updated: ${updatedOrder.status} 📦`,
                    `Your order #${updatedOrder._id.toString().slice(-6).toUpperCase()} is now ${updatedOrder.status}.`,
                    { screen: 'Orders', orderId: updatedOrder._id }
                );
            }
        } catch (e) {
            console.error('Failed to create notification for user:', e);
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

// @desc    Get sales analytics
// @route   GET /api/orders/analytics
// @access  Private/Admin
const getSalesAnalytics = asyncHandler(async (req, res) => {
    const { startDate, endDate } = req.query;
    
    // Only count orders that have been officially confirmed or moved towards delivery
    let query = { status: { $in: ['Confirmed', 'Processing', 'Shipped', 'Delivered'] } };
    if (startDate || endDate) {
        query.createdAt = {};
        if (startDate) {
            const start = new Date(startDate);
            start.setHours(0, 0, 0, 0);
            query.createdAt.$gte = start;
        }
        if (endDate) {
            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999);
            query.createdAt.$lte = end;
        }
    }

    const orders = await Order.find(query).populate('user', 'name email');
    
    const totalSales = orders.length;
    const totalRevenue = orders.reduce((acc, order) => acc + (order.itemsPrice || 0), 0);

    // Dynamic Product Sales Analytics (Top products based on orders in this date range)
    const productSalesMap = {};
    orders.forEach(order => {
        order.orderItems.forEach(item => {
            const id = item.product.toString();
            if (!productSalesMap[id]) {
                productSalesMap[id] = { 
                    _id: item.product, 
                    name: item.name, 
                    image: item.image, 
                    ordersCount: 0 
                };
            }
            productSalesMap[id].ordersCount += item.qty;
        });
    });

    const topProductsBySales = Object.values(productSalesMap)
        .sort((a, b) => b.ordersCount - a.ordersCount)
        .slice(0, 5);

    // Global Product View Analytics (View history is cumulative)
    const Product = require('../models/Product');
    const topProductsByViews = await Product.find({ views: { $gt: 0 } }).sort('-views').limit(5);

    res.json({
        totalSales,
        totalRevenue,
        orders,
        topProductsBySales,
        topProductsByViews,
    });
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
    getSalesAnalytics,
};
