import { formatPrice, redirectToPage, showToast, isLoggedIn } from '../common/utils.js'; 

let allVehicles = []; 
export default function initVehiclesPage() {
    console.log('Trang danh sách xe đã được khởi tạo.');

    const vehicleGrid = document.getElementById('vehicle-grid');
    if (vehicleGrid) {
        vehicleGrid.innerHTML = '<p style="text-align: center; color: var(--dark-gray);"><i class="fas fa-spinner fa-spin"></i> Đang tải danh sách xe...</p>';
    }

  
    loadAndRenderVehicles();
    setupSearchAndFilter();
}

async function loadAndRenderVehicles() {
    console.log('Đang tải xe từ API...');
    const vehicleGrid = document.getElementById('vehicle-grid');
    if (!vehicleGrid) {
        console.error('Không tìm thấy phần tử #vehicle-grid');
        return;
    }

    try {
        const response = await fetch('http://localhost:5000/api/vehicles'); //
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
            throw new Error(`Lỗi API ${response.status}: ${errorData.error || response.statusText}`);
        }
        allVehicles = await response.json();
        console.log(`Đã tải ${allVehicles.length} xe từ API.`);

        if (allVehicles.length === 0) {
            console.warn("API không có dữ liệu, sử dụng dữ liệu mẫu cứng (hardcodedVehicles) từ HTML.");
            if (window.hardcodedVehicles && Array.isArray(window.hardcodedVehicles)) {
                allVehicles = [...window.hardcodedVehicles];
            } else {
                console.error("Không tìm thấy dữ liệu xe cứng trong window.hardcodedVehicles.");
                allVehicles = []; 
            }
        }
    } catch (error) {
        console.error('Lỗi khi tải danh sách xe từ API:', error);
        showToast(`Không thể tải danh sách xe từ API: ${error.message}. Sử dụng dữ liệu mẫu từ HTML.`, 'error');
        if (window.hardcodedVehicles && Array.isArray(window.hardcodedVehicles)) {
            allVehicles = [...window.hardcodedVehicles];
        } else {
            console.error("Không tìm thấy dữ liệu xe cứng trong window.hardcodedVehicles.");
            allVehicles = []; 
        }
    } finally {
        renderVehicles(allVehicles); 
    }
}

function renderVehicles(vehiclesToRender) {
    const vehicleGrid = document.getElementById('vehicle-grid');
    if (!vehicleGrid) {
        console.error('Không tìm thấy phần tử #vehicle-grid');
        return;
    }

    vehicleGrid.innerHTML = '';

    if (!Array.isArray(vehiclesToRender) || vehiclesToRender.length === 0) {
        vehicleGrid.innerHTML = '<p style="text-align: center; color: var(--dark-gray);">Không tìm thấy xe nào phù hợp.</p>';
        return;
    }

    vehiclesToRender.forEach(vehicle => {
        if (!vehicle.id || !vehicle.name || vehicle.price_per_day === undefined || !vehicle.image_url) {
            console.warn('Bỏ qua dữ liệu xe không hợp lệ khi render:', vehicle);
            return;
        }

        const vehicleCard = document.createElement('div');
        vehicleCard.className = 'product'; 
        vehicleCard.setAttribute('data-id', vehicle.id);
        vehicleCard.setAttribute('data-type', vehicle.type || 'N/A');

        vehicleCard.innerHTML = `
            <img src="${vehicle.image_url}" alt="${vehicle.name}" />
            <h3>${vehicle.name} ${vehicle.license_plate ? `(${vehicle.license_plate})` : ''}</h3>
            <p>Loại: ${vehicle.type || 'N/A'}</p>
            <p>Số chỗ: ${vehicle.capacity || 'N/A'}</p>
            <p>Hộp số: ${vehicle.transmission || 'N/A'}</p>
            <p>Nhiên liệu: ${vehicle.fuel_type || 'N/A'}</p>
            <span class="price">${formatPrice(vehicle.price_per_day)} VNĐ/ngày</span>
            <button class="btn view-details-btn" data-id="${vehicle.id}">Xem Chi Tiết & Đặt Xe</button>
        `;
        vehicleGrid.appendChild(vehicleCard);
    });

    setupVehicleEventListeners();
}

function setupSearchAndFilter() {
    const searchInput = document.getElementById('search-input');
    const typeFilter = document.getElementById('vehicle-type-filter');

    if (typeFilter) {
        typeFilter.innerHTML = '<option value="">Tất cả loại xe</option>';
        const vehicleTypes = [...new Set(window.hardcodedVehicles.map(v => v.type))].sort();
        vehicleTypes.forEach(type => {
            if (type) {
                const option = document.createElement('option');
                option.value = type;
                option.textContent = type;
                typeFilter.appendChild(option);
            }
        });

        searchInput.addEventListener('input', filterAndRenderVehicles);
        typeFilter.addEventListener('change', filterAndRenderVehicles);
    } else {
        console.warn('Không tìm thấy phần tử input tìm kiếm hoặc lọc loại xe.');
    }
}

function filterAndRenderVehicles() {
    const searchInput = document.getElementById('search-input');
    const typeFilter = document.getElementById('vehicle-type-filter');

    const searchTerm = searchInput ? searchInput.value.trim().toLowerCase() : '';
    const selectedType = typeFilter ? typeFilter.value : '';

    let filteredVehicles = [...allVehicles]; 

    if (searchTerm) {
        filteredVehicles = filteredVehicles.filter(vehicle =>
            (vehicle.name && vehicle.name.toLowerCase().includes(searchTerm)) ||
            (vehicle.license_plate && vehicle.license_plate.toLowerCase().includes(searchTerm))
        );
    }

    if (selectedType) {
        filteredVehicles = filteredVehicles.filter(vehicle =>
            vehicle.type && vehicle.type.toLowerCase() === selectedType.toLowerCase()
        );
    }

    renderVehicles(filteredVehicles);
}

function setupVehicleEventListeners() {
    console.log('Thiết lập Event Listeners cho các card xe...');
    const vehicleGrid = document.getElementById('vehicle-grid');
    if (vehicleGrid) {
        const oldListener = vehicleGrid._vehicleClickListener;
        if (oldListener) {
            vehicleGrid.removeEventListener('click', oldListener);
        }

        const newListener = (event) => {
            const targetButton = event.target.closest('.view-details-btn');
            if (!targetButton) return;

            const vehicleId = targetButton.dataset.id;
            if (vehicleId) {
                console.log('Đã nhấp nút chi tiết xe, ID xe:', vehicleId);
                if (!isLoggedIn()) { //
                    showToast('Vui lòng đăng nhập để đặt xe.', 'error'); //
                    setTimeout(() => redirectToPage('account.html'), 1500); //
                    return; 
                }

                redirectToPage(`checkout.html?vehicleId=${vehicleId}`); //
            } else {
                console.error('Không tìm thấy ID xe cho nút chi tiết.');
                showToast('Lỗi: Không thể xác định xe.', 'error'); //
            }
        };

        vehicleGrid.addEventListener('click', newListener);
        vehicleGrid._vehicleClickListener = newListener;
    } else {
        console.warn('Không tìm thấy phần tử lưới xe để thiết lập listener.');
    }
}