const express = require('express');
const cors = require('cors');
const pool = require('./db');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// API Routes
// Users
app.post('/api/users/register', async (req, res) => {
    try {
        const { name, email, phone, password, address, notifications } = req.body;
        const [result] = await pool.query(
            'INSERT INTO users (name, email, phone, password, address, notifications, coupons) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [name, email, phone, password, address, notifications, JSON.stringify([])]
        );
        res.status(201).json({ id: result.insertId, name, email, phone, address, notifications, coupons: [] });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

app.post('/api/users/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const [users] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
        if (users.length === 0 || users[0].password !== password) {
            return res.status(401).json({ error: 'Email hoặc mật khẩu không đúng' });
        }
        res.json(users[0]);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

app.put('/api/users/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { name, phone, address, notifications } = req.body;
        await pool.query(
            'UPDATE users SET name = ?, phone = ?, address = ?, notifications = ? WHERE id = ?',
            [name, phone, address, notifications, id]
        );
        res.json({ message: 'Cập nhật hồ sơ thành công' });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Cart
app.get('/api/cart/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const [carts] = await pool.query('SELECT items FROM carts WHERE user_id = ?', [userId]);
        res.json(carts.length > 0 ? JSON.parse(carts[0].items) : []);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

app.post('/api/cart/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const items = req.body;
        const [carts] = await pool.query('SELECT id FROM carts WHERE user_id = ?', [userId]);
        if (carts.length > 0) {
            await pool.query('UPDATE carts SET items = ? WHERE user_id = ?', [JSON.stringify(items), userId]);
        } else {
            await pool.query('INSERT INTO carts (user_id, items) VALUES (?, ?)', [userId, JSON.stringify(items)]);
        }
        res.json({ message: 'Cập nhật giỏ hàng thành công' });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Orders
app.get('/api/orders/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const [orders] = await pool.query('SELECT * FROM orders WHERE user_id = ?', [userId]);
        res.json(orders.map(order => ({
            ...order,
            customer_info: JSON.parse(order.customer_info),
            items: JSON.parse(order.items)
        })));
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

app.post('/api/orders', async (req, res) => {
    try {
        const { userId, id, date, customer_info, items, subtotal, gift, gift_fee, shipping_fee, discount, total, status } = req.body;
        await pool.query(
            'INSERT INTO orders (id, user_id, date, customer_info, items, subtotal, gift, gift_fee, shipping_fee, discount, total, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [id, userId, date, JSON.stringify(customer_info), JSON.stringify(items), subtotal, gift, gift_fee, shipping_fee, discount, total, status]
        );
        await pool.query('DELETE FROM carts WHERE user_id = ?', [userId]); // Xóa giỏ hàng sau khi đặt hàng
        res.status(201).json({ message: 'Đặt hàng thành công' });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Addresses
app.get('/api/addresses/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const [addresses] = await pool.query('SELECT * FROM addresses WHERE user_id = ?', [userId]);
        res.json(addresses);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

app.post('/api/addresses/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const { name, details } = req.body;
        await pool.query('INSERT INTO addresses (user_id, name, details) VALUES (?, ?, ?)', [userId, name, details]);
        res.status(201).json({ message: 'Thêm địa chỉ thành công' });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

app.delete('/api/addresses/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await pool.query('DELETE FROM addresses WHERE id = ?', [id]);
        res.json({ message: 'Xóa địa chỉ thành công' });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Reviews
app.get('/api/reviews/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const [reviews] = await pool.query('SELECT * FROM reviews WHERE user_id = ?', [userId]);
        res.json(reviews);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

app.post('/api/reviews/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const { product, rating, comment } = req.body;
        await pool.query('INSERT INTO reviews (user_id, product, rating, comment) VALUES (?, ?, ?, ?)', [userId, product, rating, comment]);
        res.status(201).json({ message: 'Thêm đánh giá thành công' });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

app.delete('/api/reviews/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await pool.query('DELETE FROM reviews WHERE id = ?', [id]);
        res.json({ message: 'Xóa đánh giá thành công' });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// New endpoint for vehicles
app.get('/api/vehicles', async (req, res) => {
    try {
        console.log('Backend: Nhận yêu cầu GET /api/vehicles');
        // Retrieve optional search and filter parameters from query
        const { search, type } = req.query; // e.g., ?search=honda&type=Xe may

        let query = 'SELECT * FROM vehicles';
        const queryParams = [];
        const conditions = [];

        if (search) {
            conditions.push('(name LIKE ? OR license_plate LIKE ?)');
            queryParams.push(`%${search}%`, `%${search}%`);
        }
        if (type) {
            conditions.push('type = ?');
            queryParams.push(type);
        }

        if (conditions.length > 0) {
            query += ' WHERE ' + conditions.join(' AND ');
        }

        const [vehicles] = await pool.query(query, queryParams);
        console.log(`Backend: Tim thay ${vehicles.length} xe.`);

        res.json(vehicles);
    } catch (error) {
        console.error('Backend: Lỗi khi xử lý GET /api/vehicles:', error);
        res.status(500).json({ error: 'Loi may chu noi bo.' });
    }
});


// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));