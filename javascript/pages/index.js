

import { formatPrice, redirectToPage } from '../common/utils.js';

export default function initIndexPage() {
    console.log('Trang chủ đã được khởi tạo');

}

// Tải và hiển thị xe nổi bật 
async function loadFeaturedVehicles() { 
    console.log('Loading featured vehicles...');
    const featuredContainer = document.querySelector('.featured-products .product-grid'); 
    if (!featuredContainer) { 
        console.error('Không tìm thấy phần tử .featured-products .product-grid');
        return;
    }
    featuredContainer.innerHTML = '<p style="text-align: center; color: var(--dark-gray);"><i class="fas fa-spinner fa-spin"></i> Đang tải xe nổi bật...</p>';


    try {
        const response = await fetch('http://localhost:5000/api/vehicles');

        if (!response.ok) {
             const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
             throw new Error(`API error ${response.status}: ${errorData.error || response.statusText}`);
        }

        const vehicles = await response.json();
        console.log(`Workspaceed ${vehicles.length} vehicles. Displaying featured.`, vehicles);

      
        featuredContainer.innerHTML = '';

        if (!Array.isArray(vehicles) || vehicles.length === 0) {
            featuredContainer.innerHTML = '<p style="text-align: center; color: var(--dark-gray);">Không có xe nào để hiển thị.</p>';
            return;
        }

     
        const featuredVehicles = vehicles.slice(0, 3);
        
        featuredVehicles.forEach(vehicle => {
            if (!vehicle.id || !vehicle.name || vehicle.price_per_day === undefined || !vehicle.image_url) {
                 console.warn('Skipping invalid vehicle data for featured display:', vehicle);
                 return;
            }

            const vehicleEl = document.createElement('div');
            vehicleEl.className = 'product'; 
            vehicleEl.setAttribute('data-id', vehicle.id);
          

            vehicleEl.innerHTML = `
                <img src="${vehicle.image_url || 'placeholder.jpg'}" alt="${vehicle.name}" style="width: 100%; height: 200px; object-fit: cover;" />
                <h3 style="font-size: 18px; margin: 10px 0;">${vehicle.name}</h3>
                <p style="font-size: 14px; color: var(--dark-gray); margin-bottom: 5px;">Loại: ${vehicle.type || 'N/A'}</p>
                <p style="font-size: 14px; color: var(--dark-gray); margin-bottom: 10px;">Sức chứa: ${vehicle.capacity || 'N/A'} chỗ</p>
                <span class="price">${formatPrice(vehicle.price_per_day)} VNĐ/ngày</span>
                <button class="btn view-details-btn" data-id="${vehicle.id}">Xem Chi Tiết & Đặt Xe</button> `;

            featuredContainer.appendChild(vehicleEl);
        });

        setupFeaturedVehicleEventListeners();

    } catch (error) {
        console.error('Lỗi khi tải xe nổi bật:', error);
        featuredContainer.innerHTML = `<p class="error-message" style="text-align: center;">Không thể tải xe nổi bật: ${error.message || 'Lỗi không xác định'}.</p>`;
        
    }
}


function setupFeaturedVehicleEventListeners() {
    console.log('Setting up featured vehicle event listeners...');
    const buttons = document.querySelectorAll('.featured-products .view-details-btn');

    buttons.forEach(button => {
        const oldListener = button._featuredListener;
        if (oldListener) button.removeEventListener('click', oldListener);

        const newListener = (event) => {
            const vehicleId = event.target.dataset.id;
            if (vehicleId) {
                 console.log('Featured vehicle details button clicked, vehicle ID:', vehicleId);
                 redirectToPage(`checkout.html?vehicleId=${vehicleId}`);
            } else {
                 console.error('Vehicle ID not found for featured vehicle button.');
            }
        };
        button.addEventListener('click', newListener);
        button._featuredListener = newListener; 
    });
}
