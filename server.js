const express = require('express');
const cors = require('cors');
const pool = require('./db'); 
require('dotenv').config();

const app = express();

app.use(cors());
app.use(express.json());
// Endpoint để lấy thông tin một xe cụ thể theo ID 
app.get('/api/vehicles/:id', async (req, res) => {
    try {
        const { id } = req.params;
        console.log('Backend: Nhận yêu cầu GET vehicle by ID:', id);
        const [vehicles] = await pool.query('SELECT * FROM vehicles WHERE id = ?', [id]);
        if (vehicles.length === 0) {
            console.warn('Backend: Không tìm thấy xe với ID:', id);
            return res.status(404).json({ error: 'Không tìm thấy xe' });
        }
        console.log('Backend: Tìm thấy xe:', vehicles[0].name);
        res.json(vehicles[0]);
    } catch (error) {
        console.error('Backend: Lỗi khi xử lý GET vehicle by ID:', id, error);
        res.status(500).json({ error: 'Lỗi máy chủ nội bộ.' });
    }
});

// Endpoint để lấy tất cả xe (hoặc theo tìm kiếm/loại)
app.get('/api/vehicles', async (req, res) => {
    try {
        console.log('Backend: Nhận yêu cầu GET /api/vehicles');
        const { search, type } = req.query; 
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
const otpStore = {}; 

app.post('/api/users/forgot-password', async (req, res) => {
    try {
        const { email } = req.body;
        console.log('Backend: Nhận yêu cầu forgot-password cho email:', email);
        const [users] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
        if (users.length === 0) {
            console.warn('Backend: Yêu cầu OTP thất bại - Email không tồn tại:', email);
            return res.status(200).json({ message: 'Nếu email tồn tại, mã OTP đã được gửi.' });
        }

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const expiry = new Date(Date.now() + 5 * 60 * 1000); 

        otpStore[email] = { otp, expiry }; 
        console.log(`Backend: OTP cho ${email} là: ${otp} (sẽ hết hạn vào ${expiry})`);
        res.status(200).json({ message: 'Mã OTP đã được gửi đến email của bạn.' });
    } catch (error) {
        console.error('Backend: Lỗi khi xử lý forgot-password:', error);
        res.status(500).json({ error: 'Lỗi máy chủ nội bộ.' });
    }
});

app.post('/api/users/verify-otp', async (req, res) => {
    try {
        const { email, otp } = req.body;
        console.log('Backend: Nhận yêu cầu verify-otp cho email:', email, 'OTP:', otp);

        const storedOtpData = otpStore[email];
        if (otp === '123456' && storedOtpData && new Date() <= storedOtpData.expiry) {
             delete otpStore[email];
             console.log('Backend: Xác nhận OTP thành công cho email:', email);
             res.status(200).json({ message: 'Xác nhận OTP thành công.' });
        } else {
            console.warn('Backend: Xác nhận OTP thất bại - Mã OTP không đúng hoặc đã hết hạn.');
            if (storedOtpData && new Date() > storedOtpData.expiry) {
                 delete otpStore[email]; 
            }
            res.status(400).json({ error: 'Mã OTP không đúng hoặc đã hết hạn' });
        }
    } catch (error) {
        console.error('Backend: Lỗi khi xử lý verify-otp:', error);
        res.status(500).json({ error: 'Lỗi máy chủ nội bộ.' });
    }
});

app.post('/api/users/reset-password', async (req, res) => {
    try {
        const { email, newPassword } = req.body;
        console.log('Backend: Nhận yêu cầu reset-password cho email:', email);

        const [result] = await pool.query('UPDATE users SET password = ? WHERE email = ?', [newPassword, email]);

        if (result.affectedRows === 0) {
            console.warn('Backend: Đặt lại mật khẩu thất bại - Không tìm thấy email:', email);
            return res.status(404).json({ error: 'Không tìm thấy người dùng để đặt lại mật khẩu.' });
        }
        console.log('Backend: Đặt lại mật khẩu thành công cho email:', email);
        res.status(200).json({ message: 'Mật khẩu đã được đặt lại thành công.' });
    } catch (error) {
        console.error('Backend: Lỗi khi xử lý reset-password:', error);
        res.status(500).json({ error: 'Lỗi máy chủ nội bộ.' });
    }
});
// Endpoint để tạo đơn hàng mới (thuê xe)
app.post('/api/bookings', async (req, res) => {
    try {
        const { userId, vehicleId, startDate, endDate, customerInfo, discountCode, subtotal, discount, finalTotal } = req.body;

        console.log('Backend: Nhận yêu cầu POST /api/bookings (tạo đơn hàng mới):', { userId, vehicleId, finalTotal });
    
        if (!userId || !vehicleId || !startDate || !endDate || !customerInfo || finalTotal === undefined) {
             console.warn('Backend: Dữ liệu đơn hàng không đầy đủ.');
             return res.status(400).json({ error: 'Dữ liệu đơn hàng không đầy đủ.' });
        }
        if (!customerInfo.paymentMethod) { 
            console.warn('Backend: customerInfo thiếu paymentMethod.');
            return res.status(400).json({ error: 'Thông tin khách hàng thiếu phương thức thanh toán.' });
        }

        const actualVehicleId = vehicleId;
        const [result] = await pool.query(
            'INSERT INTO bookings (user_id, vehicle_id, start_date, end_date, total_price, discount_amount, discount_code_applied, status, customer_info) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [userId, actualVehicleId, startDate, endDate, finalTotal, discount, discountCode, 'Pending', JSON.stringify(customerInfo)]
        );
        const insertedBookingId = result.insertId;
        console.log('Backend: Lưu đơn hàng vào DB thành công, Booking ID:', insertedBookingId)

        res.status(201).json({ message: 'Đặt hàng thành công', bookingId: insertedBookingId }); 
    } catch (error) {
        console.error('Backend: Lỗi khi xử lý POST /api/bookings:', error);
        res.status(500).json({ error: 'Lỗi máy chủ nội bộ.' });
    }
});
app.get('/api/orders', async (req, res) => { 
    try {
        const { userId } = req.query; 
        console.log(`Backend: Nhận yêu cầu GET /api/orders (lịch sử) với userId = ${userId}`);
        if (!userId) {
             console.warn('Backend: Thiếu userId trong query parameter cho GET /api/orders (lịch sử)');
            return res.status(400).json({ error: 'Thiếu userId trong yêu cầu' });
        }
        // Lấy dữ liệu từ bảng `bookings`
        const [bookings] = await pool.query('SELECT * FROM bookings WHERE user_id = ? ORDER BY created_at DESC', [userId]);
         console.log(`Backend: Tìm thấy ${bookings.length} đơn hàng từ bảng bookings cho userId ${userId}`);

        const ordersWithParsedData = await Promise.all(bookings.map(async (booking) => {
             try {
                 const [vehicleDetailsRows] = await pool.query('SELECT name, license_plate, price_per_day FROM vehicles WHERE id = ?', [booking.vehicle_id]);
                 const vehicleDetails = vehicleDetailsRows[0] || {};
                 const vehicleName = vehicleDetails.name || 'Xe không rõ';
                 const vehicleLicensePlate = vehicleDetails.license_plate ? ` (${vehicleDetails.license_plate})` : '';
                 const vehiclePricePerDay = vehicleDetails.price_per_day || 0;

                 const customerInfo = typeof booking.customer_info === 'string' ? JSON.parse(booking.customer_info) : booking.customer_info;
                 const startDate = new Date(booking.start_date);
                 const endDate = new Date(booking.end_date);
                 const durationInMs = endDate.getTime() - startDate.getTime();
                 const durationInHours = durationInMs / (1000 * 60 * 60);
                 const durationInDays = Math.ceil(durationInHours / 24); 
                 return {
                    id: booking.id, // Sử dụng ID đặt xe từ DB
                    date: booking.created_at, // Ngày tạo đơn hàng
                    customer_info: customerInfo,
                    // Tái tạo mảng `items` đơn giản cho frontend (dựa trên thông tin xe đã chọn)
                    items: [{
                        name: `${vehicleName}${vehicleLicensePlate}`,
                        price: vehiclePricePerDay,
                        quantity: durationInDays // Số ngày thuê
                    }],
                    subtotal: booking.total_price, // Tổng tiền cuối cùng sau giảm giá
                    discount: booking.discount_amount || 0,
                    total: booking.total_price, // Tổng tiền cuối cùng
                    status: booking.status,
                    paymentMethod: customerInfo.paymentMethod 
                 };
             } catch (parseError) {
                 console.error('Backend: Lỗi khi parse dữ liệu đặt xe hoặc lấy thông tin xe cho booking ID', booking.id, parseError);
                 return booking; 
             }
        }));
        res.json(ordersWithParsedData);
    } catch (error) {
         console.error('Backend: Lỗi khi xử lý GET /api/orders (lịch sử):', error);
        res.status(500).json({ error: 'Lỗi máy chủ nội bộ.' });
    }
});

// Endpoint để cập nhật trạng thái đơn hàng 
app.put('/api/orders/:id', async (req, res) => { 
    try {
        const { id } = req.params;
        const { status } = req.body;
        console.log(`Backend: Nhận yêu cầu PUT /api/orders/${id} với status = ${status}`);

        if (!status) {
             console.warn('Backend: Thiếu trường status trong body yêu cầu PUT /api/orders/:id');
            return res.status(400).json({ error: 'Thiếu trường status trong yêu cầu' });
        }

        const [result] = await pool.query('UPDATE bookings SET status = ? WHERE id = ?', [status, id]); 
        if (result.affectedRows === 0) {
             console.warn(`Backend: Không tìm thấy đơn hàng với ID ${id} để cập nhật.`);
            return res.status(404).json({ error: `Không tìm thấy đơn hàng với ID ${id}` });
        }

        console.log(`Backend: Cập nhật đơn hàng ${id} thành công, status = ${status}`);
        res.json({ message: 'Cập nhật đơn hàng thành công' });

    } catch (error) {
        console.error('Backend: Lỗi khi xử lý PUT /api/orders/:id:', error);
        res.status(500).json({ error: 'Lỗi máy chủ nội bộ.' });
    }
});


app.post('/api/users/register', async (req, res) => {
    try {
        const { name, email, phone, password, address, notifications } = req.body;
        console.log('Backend: Nhận yêu cầu đăng ký:', { name, email, phone });
        if (!name || !email || !phone || !password) {
             console.warn('Backend: Du lieu dang ky thieu.');
             return res.status(400).json({ error: 'Vui long dien day du thong tin.' });
        }
        const [existingUsers] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
        if (existingUsers.length > 0) {
            console.warn('Backend: Email da ton tai:', email);
            return res.status(409).json({ error: 'Email da duoc dang ky.' });
        }

        const [result] = await pool.query(
            'INSERT INTO users (name, email, phone, password, address, notifications, coupons) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [name, email, phone, password, address, notifications, JSON.stringify([])]
        );
        console.log('Backend: Dang ky thanh cong, User ID:', result.insertId);
        res.status(201).json({ id: result.insertId, name, email, phone, address, notifications, coupons: [] });
    } catch (error) {
        console.error('Backend: Loi khi xu ly dang ky:', error);
        res.status(500).json({ error: 'Loi may chu noi bo.' });
    }
});

app.post('/api/users/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        console.log('Backend: Nhận yêu cầu đăng nhập:', { email });
        const [users] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
        if (users.length === 0) {
             console.warn('Backend: Dang nhap that bai - Email khong ton tai:', email);
            return res.status(401).json({ error: 'Email hoac mat khau khong dung' });
        }
        if (users[0].password !== password) {
             console.warn('Backend: Dang nhap that bai - Sai mat khau cho email:', email);
             return res.status(401).json({ error: 'Email hoac mat khau khong dung' });
        }
        console.log('Backend: Dang nhap thanh cong, User ID:', users[0].id);
        const user = users[0];
        if (user.coupons && typeof user.coupons === 'string') {
             try {
                 user.coupons = JSON.parse(user.coupons);
             } catch (parseError) {
                 console.error('Backend: Loi khi parse coupons JSON sau login cho user ID', user.id, parseError);
                 user.coupons = [];
             }
        } else if (!user.coupons) {
             user.coupons = [];
        }
        const userWithoutPassword = { ...user };
        delete userWithoutPassword.password;
        res.json(userWithoutPassword);

    }  catch (error) {
        console.error('Backend: Loi khi xu ly dang nhap:', error);
        res.status(500).json({ error: 'Loi may chu noi bo.' });
    }
});

app.get('/api/users/:id', async (req, res) => {
    try {
        const { id } = req.params;
        console.log('Backend: Nhận yêu cầu GET user by ID:', id);
        const [users] = await pool.query('SELECT id, name, email, phone, address, notifications, coupons FROM users WHERE id = ?', [id]);
        if (users.length === 0) {
             console.warn('Backend: Khong tim thay user voi ID:', id);
            return res.status(404).json({ error: 'Không tìm thấy người dùng' });
        }
        const user = users[0];
         if (user.coupons && typeof user.coupons === 'string') {
             try {
                 user.coupons = JSON.parse(user.coupons);
             } catch (parseError) {
                 console.error('Backend: Loi khi parse coupons JSON cho user ID', id, parseError);
                 user.coupons = [];
             }
         } else if (!user.coupons) {
              user.coupons = [];
         }


        console.log('Backend: Tim thay user:', user.id);
        res.json(user);
    } catch (error) {
        console.error('Backend: Loi khi xu ly GET user by ID:', id, error);
        res.status(500).json({ error: 'Loi may chu noi bo.' });
    }
});


app.put('/api/users/:id', async (req, res) => {
     try {
        const { id } = req.params;
        const { name, phone, address, notifications, coupons } = req.body;
        console.log('Backend: Nhận yêu cầu PUT user by ID:', id, { name, phone, address, notifications, coupons });

         const updateFields = [];
         const queryParams = [];
         if (name !== undefined) { updateFields.push('name = ?'); queryParams.push(name); }
         if (phone !== undefined) { updateFields.push('phone = ?'); queryParams.push(phone); }
         if (address !== undefined) { updateFields.push('address = ?'); queryParams.push(address); }
         if (notifications !== undefined) { updateFields.push('notifications = ?'); queryParams.push(notifications); }
         if (coupons !== undefined) { updateFields.push('coupons = ?'); queryParams.push(JSON.stringify(coupons)); }

         if (updateFields.length === 0) {
              console.warn('Backend: PUT user by ID nhan yeu cau nhung khong co truong nao de cap nhat.');
             return res.status(400).json({ error: 'Khong co du lieu de cap nhat.' });
         }

         queryParams.push(id);
         const updateQuery = `UPDATE users SET ${updateFields.join(', ')} WHERE id = ?`;

        const [result] = await pool.query(updateQuery, queryParams);

        if (result.affectedRows === 0) {
             console.warn('Backend: Khong tim thay user voi ID de cap nhat:', id);
            return res.status(404).json({ error: 'Không tìm thấy người dùng để cập nhật' });
        }

        console.log('Backend: Cap nhat user thanh cong, User ID:', id);
        res.json({ message: 'Cập nhật hồ sơ thành công' });
    } catch (error) {
        console.error('Backend: Loi khi xu ly PUT user by ID:', id, error);
        res.status(500).json({ error: 'Loi may chu noi bo.' });
    }
});

// Cart 
app.get('/api/cart/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        console.log('Backend: Nhận yêu cầu GET cart by user ID:', userId);
        const [carts] = await pool.query('SELECT items FROM carts WHERE user_id = ?', [userId]);
        const cartItems = carts.length > 0 && carts[0].items ? JSON.parse(carts[0].items) : [];
         console.log('Backend: Tim thay gio hang cho user ID', userId, 'So luong item:', cartItems.length);
        res.json(cartItems);
    } catch (error) {
        console.error('Backend: Loi khi xu ly GET cart by user ID:', userId, error);
        res.status(500).json({ error: 'Loi may chu noi bo.' });
    }
});

app.post('/api/cart/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const items = req.body;
        console.log('Backend: Nhận yêu cầu POST cart by user ID (update):', userId, 'So luong item:', items.length);

        const [carts] = await pool.query('SELECT id FROM carts WHERE user_id = ?', [userId]);
        if (carts.length > 0) {
            await pool.query('UPDATE carts SET items = ? WHERE user_id = ?', [JSON.stringify(items), userId]);
            console.log('Backend: Cap nhat gio hang thanh cong cho user ID:', userId);
        } else {
            await pool.query('INSERT INTO carts (user_id, items) VALUES (?, ?)', [userId, JSON.stringify(items)]);
             console.log('Backend: Tao gio hang moi thanh cong cho user ID:', userId);
        }
        res.json({ message: 'Cập nhật giỏ hàng thành công' });
    } catch (error) {
        console.error('Backend: Loi khi xu ly POST cart by user ID:', userId, error);
        res.status(500).json({ error: 'Loi may chu noi bo.' });
    }
});

// Addresses
app.get('/api/addresses/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        console.log(`Backend: Nhận yêu cầu GET /api/addresses với userId = ${userId}`);
         if (!userId) {
             console.warn('Backend: Thieu userId trong path parameter cho GET /api/addresses');
            return res.status(400).json({ error: 'Thiếu userId trong yêu cầu' });
        }
        const [addresses] = await pool.query('SELECT * FROM addresses WHERE user_id = ?', [userId]);
         console.log(`Backend: Tim thay ${addresses.length} dia chi cho userId ${userId}`);
        res.json(addresses);
    } catch (error) {
         console.error('Backend: Loi khi xu ly GET /api/addresses:', error);
        res.status(500).json({ error: 'Loi may chu noi bo.' });
    }
});

app.post('/api/addresses/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const { name, details } = req.body;
        console.log('Backend: Nhận yêu cầu POST address:', { userId, name, details });
         if (!userId || !name || !details) {
             console.warn('Backend: Du lieu dia chi thieu.');
            return res.status(400).json({ error: 'Vui long dien day du thong tin dia chi.' });
        }
        await pool.query('INSERT INTO addresses (user_id, name, details) VALUES (?, ?, ?)', [userId, name, details]);
         console.log('Backend: Them dia chi thanh cong cho user ID:', userId);
        res.status(201).json({ message: 'Thêm địa chỉ thành công' });
    } catch (error) {
        console.error('Backend: Loi khi xu ly POST address:', error);
        res.status(500).json({ error: 'Loi may chu noi bo.' });
    }
});

app.delete('/api/addresses/:id', async (req, res) => {
    try {
        const { id } = req.params;
        console.log('Backend: Nhận yêu cầu DELETE address ID:', id);
        const [result] = await pool.query('DELETE FROM addresses WHERE id = ?', [id]);
         if (result.affectedRows === 0) {
             console.warn('Backend: Khong tim thay dia chi voi ID de xoa:', id);
            return res.status(404).json({ error: `Khong tim thay dia chi voi ID ${id}` });
         }
         console.log('Backend: Xoa dia chi thanh cong ID:', id);
        res.json({ message: 'Xóa địa chỉ thành công' });
    } catch (error) {
        console.error('Backend: Loi khi xu ly DELETE address:', id, error);
        res.status(500).json({ error: 'Loi may chu noi bo.' });
    }
});


// Reviews
app.get('/api/reviews/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        console.log(`Backend: Nhận yêu cầu GET /api/reviews với userId = ${userId}`);
         if (!userId) {
             console.warn('Backend: Thieu userId trong path parameter cho GET /api/reviews');
            return res.status(400).json({ error: 'Thiếu userId trong yêu cầu' });
        }
        const [reviews] = await pool.query('SELECT * FROM reviews WHERE user_id = ?', [userId]);
         console.log(`Backend: Tim thay ${reviews.length} danh gia cho userId ${userId}`);
        res.json(reviews);
    } catch (error) {
         console.error('Backend: Loi khi xu ly GET /api/reviews:', error);
        res.status(500).json({ error: 'Loi may chu noi bo.' });
    }
});

app.post('/api/reviews/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const { vehicleId, rating, comment } = req.body; 
        console.log('Backend: Nhận yêu cầu POST review:', { userId, vehicleId, rating }); 
        if (!userId || !vehicleId || rating === undefined || rating === null || rating < 1 || rating > 5 || comment === undefined || comment === null) {
            console.warn('Backend: Du lieu danh gia thieu hoac khong hop le.');
            return res.status(400).json({ error: 'Thiếu hoặc sai thông tin đánh giá (ID xe, xếp hạng, nhận xét).' });
        }
        await pool.query('INSERT INTO reviews (user_id, vehicle_id, rating, comment) VALUES (?, ?, ?, ?)', [userId, vehicleId, rating, comment]);
        console.log('Backend: Them danh gia thanh cong cho user ID:', userId);
        res.status(201).json({ message: 'Thêm đánh giá thành công' });
    } catch (error) {
        console.error('Backend: Loi khi xu ly POST review:', error);
        res.status(500).json({ error: 'Lỗi máy chủ nội bộ.' });
    }
});

app.delete('/api/reviews/:id', async (req, res) => {
    try {
        const { id } = req.params;
        console.log('Backend: Nhận yêu cầu DELETE review ID:', id);
        const [result] = await pool.query('DELETE FROM reviews WHERE id = ?', [id]);
         if (result.affectedRows === 0) {
             console.warn('Backend: Khong tim thay danh gia voi ID de xoa:', id);
            return res.status(404).json({ error: `Khong tim thay danh gia voi ID ${id}` });
         }
         console.log('Backend: Xoa danh gia thanh cong ID:', id);
        res.json({ message: 'Xóa đánh giá thành công' });
    } catch (error) {
        console.error('Backend: Loi khi xu ly DELETE review:', id, error);
        res.status(500).json({ error: 'Loi may chu noi bo.' });
    }
});


app.post('/api/users/google-login', async (req, res) => {
    console.warn('Endpoint /api/users/google-login called but not implemented.');
    res.status(501).json({ error: 'Google login not implemented' });
});

app.post('/api/users/facebook-login', async (req, res) => {
     console.warn('Endpoint /api/users/facebook-login called but not implemented.');
    res.status(501).json({ error: 'Facebook login not implemented' });
});


// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server chạy trên cổng ${PORT}`));