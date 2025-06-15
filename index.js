
// Import các hàm tiện ích chung cần thiết
import { formatPrice, redirectToPage } from '../common/utils.js';

// Khởi tạo trang chủ
export default function initIndexPage() {
    console.log('Trang chủ đã được khởi tạo');

}

// Tải và hiển thị xe nổi bật (Thay thế loadFeaturedProducts)
async function loadFeaturedVehicles() { // Renamed function
    console.log('Loading featured vehicles...');
    const featuredContainer = document.querySelector('.featured-products .product-grid'); // Chọn container dựa trên HTML mới
    if (!featuredContainer) {
        console.error('Không tìm thấy phần tử .featured-products .product-grid');
        return;
    }

    // Xóa nội dung tĩnh đang có trong HTML để chuẩn bị render động
    featuredContainer.innerHTML = '<p style="text-align: center; color: var(--dark-gray);"><i class="fas fa-spinner fa-spin"></i> Đang tải xe nổi bật...</p>';


    try {
        // Gọi API backend để lấy danh sách xe
        // Giả định API /api/vehicles trả về danh sách tất cả xe
        // Trong thực tế, bạn có thể cần một endpoint riêng cho xe nổi bật
        const response = await fetch('http://localhost:5000/api/vehicles');

        if (!response.ok) {
             const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
             throw new Error(`API error ${response.status}: ${errorData.error || response.statusText}`);
        }

        const vehicles = await response.json();
        console.log(`Workspaceed ${vehicles.length} vehicles. Displaying featured.`, vehicles);

        // Xóa thông báo loading
        featuredContainer.innerHTML = '';

        if (!Array.isArray(vehicles) || vehicles.length === 0) {
            featuredContainer.innerHTML = '<p style="text-align: center; color: var(--dark-gray);">Không có xe nào để hiển thị.</p>';
            return;
        }

        // Chọn một vài xe làm nổi bật (ví dụ: 3 xe đầu tiên hoặc chọn ngẫu nhiên)
        const featuredVehicles = vehicles.slice(0, 3); // Lấy 3 xe đầu tiên làm nổi bật

        // Hiển thị các xe nổi bật
        featuredVehicles.forEach(vehicle => {
            // Basic validation for vehicle data
            if (!vehicle.id || !vehicle.name || vehicle.price_per_day === undefined || !vehicle.image_url) {
                 console.warn('Skipping invalid vehicle data for featured display:', vehicle);
                 return;
            }

            const vehicleEl = document.createElement('div');
            vehicleEl.className = 'product'; // Sử dụng lại class 'product' cho style
            vehicleEl.setAttribute('data-id', vehicle.id);
            // Không cần data-name, data-price cho logic giỏ hàng cũ

            vehicleEl.innerHTML = `
                <img src="${vehicle.image_url || 'placeholder.jpg'}" alt="${vehicle.name}" style="width: 100%; height: 200px; object-fit: cover;" />
                <h3 style="font-size: 18px; margin: 10px 0;">${vehicle.name}</h3>
                <p style="font-size: 14px; color: var(--dark-gray); margin-bottom: 5px;">Loại: ${vehicle.type || 'N/A'}</p>
                <p style="font-size: 14px; color: var(--dark-gray); margin-bottom: 10px;">Sức chứa: ${vehicle.capacity || 'N/A'} chỗ</p>
                <span class="price">${formatPrice(vehicle.price_per_day)} VNĐ/ngày</span>
                <button class="btn view-details-btn" data-id="${vehicle.id}">Xem Chi Tiết & Đặt Xe</button> `;

            featuredContainer.appendChild(vehicleEl);
        });

        // Thêm event listeners cho nút "Xem Chi Tiết & Đặt Xe"
        setupFeaturedVehicleEventListeners();

    } catch (error) {
        console.error('Lỗi khi tải xe nổi bật:', error);
        featuredContainer.innerHTML = `<p class="error-message" style="text-align: center;">Không thể tải xe nổi bật: ${error.message || 'Lỗi không xác định'}.</p>`;
        // showToast('Không thể tải xe nổi bật. Vui lòng thử lại.', 'error'); // Có thể hiển thị toast nếu muốn
    }
}

// Thiết lập Event Listeners cho nút "Xem Chi Tiết & Đặt Xe" trên xe nổi bật
function setupFeaturedVehicleEventListeners() {
    console.log('Setting up featured vehicle event listeners...');
    const buttons = document.querySelectorAll('.featured-products .view-details-btn');

    buttons.forEach(button => {
        // Xóa bỏ event listener cũ nếu có
        const oldListener = button._featuredListener;
        if (oldListener) button.removeEventListener('click', oldListener);

        const newListener = (event) => {
            const vehicleId = event.target.dataset.id;
            if (vehicleId) {
                 console.log('Featured vehicle details button clicked, vehicle ID:', vehicleId);
                 // Chuyển hướng đến trang checkout, truyền vehicleId qua URL parameter
                 // Trang checkout sẽ xử lý việc chọn ngày và hiển thị chi tiết xe đã chọn
                 redirectToPage(`checkout.html?vehicleId=${vehicleId}`);
                 // Hoặc chuyển hướng đến trang chi tiết xe riêng nếu có
                 // redirectToPage(`vehicle-details.html?id=${vehicleId}`);
            } else {
                 console.error('Vehicle ID not found for featured vehicle button.');
                 // showToast('Lỗi: Không thể xác định xe.', 'error'); // Có thể hiển thị toast
            }
        };
        button.addEventListener('click', newListener);
        button._featuredListener = newListener; // Lưu listener để xóa sau
    });
}
