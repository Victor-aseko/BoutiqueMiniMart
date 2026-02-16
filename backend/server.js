const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const path = require('path');
const http = require('http');
const { Server } = require('socket.io');
const connectDB = require('./config/db');
const initScheduler = require('./utils/scheduler');

dotenv.config();

connectDB();
initScheduler();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

app.use(express.json());
app.use(cors());

// Socket.IO Logic
const onlineUsers = new Map();

io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    socket.on('join', (userId) => {
        socket.join(userId);
        onlineUsers.set(userId, socket.id);

        // Send current online users list to the user who just joined
        socket.emit('initialOnlineUsers', Array.from(onlineUsers.keys()));

        io.emit('userStatus', { userId, status: 'online' });
        console.log(`User ${userId} joined their private room`);
    });

    socket.on('sendMessage', (data) => {
        const { recipientId, senderId, text, image, createdAt, _id } = data;
        io.to(recipientId).emit('receiveMessage', {
            _id,
            text,
            image,
            senderId,
            recipientId,
            createdAt
        });
    });

    socket.on('disconnect', () => {
        let disconnectedUserId;
        for (const [userId, socketId] of onlineUsers.entries()) {
            if (socketId === socket.id) {
                disconnectedUserId = userId;
                break;
            }
        }
        if (disconnectedUserId) {
            onlineUsers.delete(disconnectedUserId);
            io.emit('userStatus', { userId: disconnectedUserId, status: 'offline' });
        }
        console.log('User disconnected');
    });
});

app.get('/', (req, res) => {
    res.send('API is running with Socket.IO support...');
});

app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/products', require('./routes/productRoutes'));
app.use('/api/categories', require('./routes/categoryRoutes'));
app.use('/api/cart', require('./routes/cartRoutes'));
app.use('/api/orders', require('./routes/orderRoutes'));
app.use('/api/inquiries', require('./routes/inquiryRoutes'));
app.use('/api/notifications', require('./routes/notificationRoutes'));
app.use('/api/messages', require('./routes/messageRoutes'));
app.use('/api/upload', require('./routes/uploadRoutes'));
app.use('/api/test-email', require('./routes/testRoutes'));

app.use('/uploads', express.static(path.join(__dirname, '/uploads')));

const { notFound, errorHandler } = require('./middleware/errorMiddleware');

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

server.listen(PORT, '0.0.0.0', () => console.log(`Server running on port ${PORT}`));
