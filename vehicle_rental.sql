CREATE DATABASE IF NOT EXISTS vehicle_rental;
USE vehicle_rental;

-- Bảng users: Giữ nguyên cấu trúc cơ bản
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20),
    password VARCHAR(255), -- Lưu ý: Nên mã hóa mật khẩu trong ứng dụng thực tế!
    address TEXT,
    notifications BOOLEAN DEFAULT TRUE,
    coupons JSON, -- Có thể giữ lại cho các chương trình khuyến mãi thuê xe
    is_verified BOOLEAN DEFAULT FALSE, -- Thêm cột để đánh dấu đã xác minh email/SĐT
    otp_code VARCHAR(10),            -- Lưu mã OTP tạm thời
    otp_expiry DATETIME               -- Thời gian hết hạn của OTP
);

-- Bảng vehicles: Giữ nguyên cấu trúc
CREATE TABLE vehicles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    license_plate VARCHAR(50),
    type VARCHAR(50),
    capacity INT,
    transmission VARCHAR(50),
    fuel_type VARCHAR(50),
    price_per_day DECIMAL(10, 2) NOT NULL,
    image_url VARCHAR(255)
);

-- Bảng bookings: ĐÃ SỬA vehicle_id thành INT
CREATE TABLE bookings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    vehicle_id INT, -- ĐÃ SỬA: Kiểu dữ liệu giờ là INT để khớp với vehicles.id
    start_date DATETIME NOT NULL,
    end_date DATETIME NOT NULL,
    actual_pickup_date DATETIME,
    actual_return_date DATETIME,
    total_price DECIMAL(10, 2) NOT NULL,
    discount_amount DECIMAL(10, 2) DEFAULT 0.00,
    discount_code_applied VARCHAR(50),
    status VARCHAR(50) NOT NULL,
    customer_info JSON,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) -- THAM CHIẾU ĐÃ ĐÚNG KIỂU DỮ LIỆU
);

-- Bảng discounts: Quản lý mã giảm giá (Giữ nguyên)
CREATE TABLE discounts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL, -- Mã giảm giá (ví dụ: THUEXE20, GIAM100K)
    type VARCHAR(20) NOT NULL, -- Loại giảm giá ('percentage' hoặc 'fixed')
    value DECIMAL(10, 2) NOT NULL, -- Giá trị giảm giá (ví dụ: 20 cho 20%, hoặc 100000 cho 100k)
    min_order_value DECIMAL(10, 2) DEFAULT 0.00, -- Giá trị đơn hàng tối thiểu để áp dụng
    max_discount_amount DECIMAL(10, 2) DEFAULT NULL, -- Số tiền giảm tối đa (cho loại percentage)
    usage_limit INT DEFAULT NULL, -- Tổng số lần sử dụng tối đa
    uses_count INT DEFAULT 0, -- Số lần đã được sử dụng
    expires_at DATETIME, -- Thời gian hết hạn của mã giảm giá
    is_active BOOLEAN DEFAULT TRUE, -- Trạng thái kích hoạt
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);


-- Bảng addresses: Địa chỉ đã lưu của người dùng (Giữ nguyên)
CREATE TABLE addresses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    name VARCHAR(255) NOT NULL,     -- Tên địa chỉ (e.g., Nhà riêng, Văn phòng)
    details TEXT NOT NULL,        -- Chi tiết địa chỉ (số nhà, đường, phường, quận)
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Bảng reviews: Đánh giá (Liên kết với xe và/hoặc booking)
CREATE TABLE reviews (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    vehicle_id INT, -- Đánh giá cho xe cụ thể
    booking_id INT, -- Đánh giá cho một lượt thuê cụ thể (tùy chọn, dùng FOREIGN KEY)
    rating INT NOT NULL, -- Xếp hạng sao (1-5)
    comment TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (vehicle_id) REFERENCES vehicles(id),
    FOREIGN KEY (booking_id) REFERENCES bookings(id)
);

-- Thêm dữ liệu mẫu cho bảng discounts (nếu bạn muốn)
INSERT INTO discounts (code, type, value, expires_at, is_active, min_order_value, max_discount_amount, usage_limit) VALUES
('THUEXE20', 'percentage', 20.00, '2025-12-31 23:59:59', TRUE, 500000.00, 200000.00, 100),
('GIAM100K', 'fixed', 100000.00, '2025-11-30 23:59:59', TRUE, 1000000.00, NULL, 50),
('DULICHVN', 'percentage', 15.00, '2025-10-15 23:59:59', TRUE, 700000.00, 150000.00, 75);


-- Thêm dữ liệu mẫu cho bảng vehicles
-- Các ID sẽ tự động được gán từ 1, 2, 3...
INSERT INTO vehicles (name, license_plate, type, capacity, transmission, fuel_type, price_per_day, image_url) VALUES
('Honda Air Blade', '59-A1 123.45', 'Xe máy', 2, 'Tự động', 'Xăng', 150000.00, 'images/11.png'),
('Toyota Vios', '51-B1 678.90', 'Ô tô 4 chỗ', 4, 'Tự động', 'Xăng', 700000.00, 'images/2.png'),
('Kia Sedona', '51-C1 123.45', 'Ô tô 7 chỗ', 7, 'Tự động', 'Dầu Diesel', 1000000.00, 'images/3.png'),
('Yamaha Exciter', '60-D1 543.21', 'Xe máy', 2, 'Số sàn', 'Xăng', 180000.00, 'images/4.png'),
('Hyundai Accent', '30-E1 987.65', 'Ô tô 4 chỗ', 4, 'Số sàn', 'Xăng', 650000.00, 'images/5.png'),
('Mitsubishi Xpander', '30-F1 111.22', 'Ô tô 7 chỗ', 7, 'Tự động', 'Xăng', 950000.00, 'images/6.png'),
('Ford Transit 24 chỗ', '77-G1 000.01', 'Xe khách 18 chỗ', 24, 'Số sàn', 'Dầu Diesel', 1800000.00, 'images/7.jpg'),
('Thaco Meadow 30 chỗ', '92-H1 000.02', 'Xe khách 30 chỗ', 30, 'Số sàn', 'Dầu Diesel', 2600000.00, 'images/8.jpg'),
('Honda Winner X', '59-K1 333.44', 'Xe máy', 2, 'Số sàn', 'Xăng', 160000.00, 'images/9.png'),
('Mazda 3', '51-L1 555.66', 'Ô tô 4 chỗ', 4, 'Tự động', 'Xăng', 750000.00, 'images/10.jpg'),
('Toyota Innova', '51-M1 777.88', 'Ô tô 7 chỗ', 7, 'Số sàn', 'Xăng', 880000.00, 'images/111.jpg'),
('Hyundai County 24 chỗ', '77-N1 999.00', 'Xe khách 24 chỗ', 24, 'Số sàn', 'Dầu Diesel', 1950000.00, 'images/12.jpg'),
('Samco Felix 30 chỗ', '92-P1 111.22', 'Xe khách 30 chỗ', 30, 'Số sàn', 'Dầu Diesel', 2800000.00, 'images/13.jpg'),
('Suzuki Raider', '59-Q1 222.33', 'Xe máy', 2, 'Số sàn', 'Xăng', 170000.00, 'images/14.png'),
('Honda City', '51-R1 444.55', 'Ô tô 4 chỗ', 4, 'Tự động', 'Xăng', 720000.00, 'images/15.png'),
('Hyundai Santa Fe', '51-S1 666.77', 'Ô tô 7 chỗ', 7, 'Tự động', 'Dầu Diesel', 1150000.00, 'images/16.jpg'),
('Thaco Towner 24 chỗ', '77-T1 888.99', 'Xe khách 24 chỗ', 24, 'Số sàn', 'Dầu Diesel', 1750000.00, 'images/17.png'),
('Hyundai Global Noble 29 chỗ', '92-V1 000.11', 'Xe khách 30 chỗ', 30, 'Số sàn', 'Dầu Diesel', 2900000.00, 'images/18.jpg'),
('Vespa Sprint', '59-W1 222.33', 'Xe máy', 2, 'Tự động', 'Xăng', 200000.00, 'images/19.png'),
('Kia K3', '51-X1 444.55', 'Ô tô 4 chỗ', 4, 'Tự động', 'Xăng', 780000.00, 'images/20.png'),
('Ford Everest', '51-Y1 666.77', 'Ô tô 7 chỗ', 7, 'Tự động', 'Dầu Diesel', 1200000.00, 'images/21.jpg'),
('Honda Air Blade', '59-Z1 888.99', 'Xe máy', 2, 'Tự động', 'Xăng', 155000.00, 'images/22.jpg'),
('VinFast Fadil', '30-A2 000.11', 'Ô tô 4 chỗ', 4, 'Tự động', 'Xăng', 620000.00, 'images/23.jpg'),
('Mazda CX-8', '51-B2 222.33', 'Ô tô 7 chỗ', 7, 'Tự động', 'Xăng', 1100000.00, 'images/24.jpg'),
('Hyundai County 24 chỗ', '77-C2 444.55', 'Xe khách 24 chỗ', 24, 'Số sàn', 'Dầu Diesel', 1900000.00, 'images/25.png'),
('Thaco Towner 5 chỗ', '92-D2 666.77', 'Xe khách 5 chỗ', 5, 'Số sàn', 'Dầu Diesel', 2750000.00, 'images/26.png'),
('Piaggio Liberty', '59-E2 888.99', 'Xe máy', 2, 'Tự động', 'Xăng', 190000.00, 'images/27.jpg'),
('Toyota Corolla Altis', '51-F2 000.00', 'Ô tô 4 chỗ', 4, 'Tự động', 'Xăng', 790000.00, 'images/28.png'),
('Honda CR-V', '51-G2 222.44', 'Ô tô 7 chỗ', 5, 'Tự động', 'Xăng', 1050000.00, 'images/29.jpg'),
('Ford Transit 24 chỗ', '77-H2 333.55', 'Xe khách 24 chỗ', 24, 'Số sàn', 'Dầu Diesel', 1850000.00, 'images/30.png'),
('Hyundai Global Noble 30 chỗ', '92-K2 444.66', 'Xe khách 30 chỗ', 30, 'Số sàn', 'Dầu Diesel', 3000000.00, 'images/31.jpg'),
('Honda Vision', '59-L2 555.77', 'Xe máy', 2, 'Tự động', 'Xăng', 130000.00, 'images/32.jpg'),
('VinFast Lux A2.0', '29-M2 666.88', 'Ô tô 4 chỗ', 4, 'Tự động', 'Xăng', 800000.00, 'images/33.png'),
('Toyota Fortuner', '51-N2 777.99', 'Ô tô 7 chỗ', 7, 'Tự động', 'Dầu Diesel', 1300000.00, 'images/34.png'),
('Hyundai County 24 chỗ', '77-P2 888.00', 'Xe khách 24 chỗ', 24, 'Số sàn', 'Dầu Diesel', 2000000.00, 'images/35.png'),
('Thaco Meadow 30 chỗ', '92-Q2 999.11', 'Xe khách 30 chỗ', 30, 'Số sàn', 'Dầu Diesel', 3100000.00, 'images/36.png'),
('Honda SH Mode', '59-R2 111.22', 'Xe máy', 2, 'Tự động', 'Xăng', 170000.00, 'images/37.png'),
('Hyundai Elantra', '51-S2 333.44', 'Ô tô 4 chỗ', 4, 'Tự động', 'Xăng', 730000.00, 'images/38.png'),
('Kia Sorento', '51-T2 555.66', 'Ô tô 7 chỗ', 7, 'Tự động', 'Dầu Diesel', 1250000.00, 'images/39.jpg'),
('Thaco Towner 24 chỗ', '77-V2 777.88', 'Xe khách 24 chỗ', 24, 'Số sàn', 'Dầu Diesel', 1700000.00, 'images/40.png'),
('Hyundai Global Noble 30 chỗ', '92-X2 999.00', 'Xe khách 30 chỗ', 30, 'Số sàn', 'Dầu Diesel', 3200000.00, 'images/41.jpg'),
('Yamaha Janus', '59-Y2 111.33', 'Xe máy', 2, 'Tự động', 'Xăng', 140000.00, 'images/42.png'),
('Toyota Camry', '51-Z2 222.44', 'Ô tô 4 chỗ', 4, 'Tự động', 'Xăng', 850000.00, 'images/43.png'),
('VinFast Lux SA2.0', '29-A3 333.55', 'Ô tô 7 chỗ', 7, 'Tự động', 'Xăng', 1400000.00, 'images/44.png'),
('Ford Transit 24 chỗ', '77-B3 444.66', 'Xe khách 24 chỗ', 24, 'Số sàn', 'Dầu Diesel', 1820000.00, 'images/45.jpg'),
('Thaco Frontier TF200', '92-C3 555.77', 'Xe tải 2 chỗ', 2, 'Số sàn', 'Dầu Diesel', 2850000.00, 'images/46.jpg'),
('Honda Wave Alpha', '59-D3 666.88', 'Xe máy', 2, 'Số sàn', 'Xăng', 120000.00, 'images/47.png'),
('Honda Civic', '51-E3 777.99', 'Ô tô 4 chỗ', 4, 'Tự động', 'Xăng', 760000.00, 'images/48.png'),
('Hyundai Tucson', '51-F3 888.00', 'Ô tô 7 chỗ', 5, 'Tự động', 'Xăng', 1000000.00, 'images/49.png'),
('Hyundai County 24 chỗ', '77-G3 999.11', 'Xe khách 24 chỗ', 24, 'Số sàn', 'Dầu Diesel', 1980000.00, 'images/50.jpg'),
('Samco Felix 30 chỗ', '92-H3 000.22', 'Xe khách 30 chỗ', 30, 'Số sàn', 'Dầu Diesel', 2950000.00, 'images/51.jpg'),
('Honda Future', '59-K3 111.33', 'Xe máy', 2, 'Số sàn', 'Xăng', 145000.00, 'images/52.jpg'),
('Kia Cerato', '51-L3 222.44', 'Ô tô 4 chỗ', 4, 'Tự động', 'Xăng', 700000.00, 'images/53.png'),
('Toyota Rush', '51-M3 333.55', 'Ô tô 7 chỗ', 7, 'Tự động', 'Xăng', 900000.00, 'images/54.png'),
('Ford Transit 24 chỗ', '77-N3 444.66', 'Xe khách 24 chỗ', 24, 'Số sàn', 'Dầu Diesel', 1870000.00, 'images/55.png'),
('Hyundai Global Noble 30 chỗ', '92-P3 555.77', 'Xe khách 30 chỗ', 30, 'Số sàn', 'Dầu Diesel', 3050000.00, 'images/56.jpg'),
('Honda PCX', '59-Q3 666.88', 'Xe máy', 2, 'Tự động', 'Xăng', 220000.00, 'images/57.png'),
('Toyota Yaris Cross', '51-R3 777.99', 'Ô tô 4 chỗ', 4, 'Tự động', 'Xăng', 770000.00, 'images/58.jpg'),
('Ford Ecosport', '51-S3 888.00', 'Ô tô 7 chỗ', 7, 'Tự động', 'Xăng', 850000.00, 'images/59.jpg'),
('Hyundai County 24 chỗ', '77-T3 999.11', 'Xe khách 24 chỗ', 24, 'Số sàn', 'Dầu Diesel', 1920000.00, 'images/60.jpg'),
('Honda Scoopy', '59-X3 111.33', 'Xe máy', 2, 'Tự động', 'Xăng', 165000.00, 'images/61.png'),
('Suzuki Swift', '51-Y3 222.44', 'Ô tô 4 chỗ', 4, 'Tự động', 'Xăng', 680000.00, 'images/62.jpg'),
('Chevrolet Captiva', '51-Z3 333.55', 'Ô tô 7 chỗ', 7, 'Tự động', 'Xăng', 920000.00, 'images/63.jpg');