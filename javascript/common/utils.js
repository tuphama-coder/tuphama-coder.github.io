// common/utils.js

export function formatPrice(price) {
    if (typeof price !== 'number') return 'N/A';
    return price.toLocaleString('vi-VN'); // Sử dụng toLocaleString để định dạng tiền tệ Việt Nam
}

export function redirectToPage(pageUrl) {
    window.location.href = pageUrl;
}

// Function to show toast messages
let toastTimeout;
export function showToast(message, type = 'info', duration = 3000) {
    const toast = document.getElementById('toast');
    const toastMessage = document.getElementById('toast-message');

    if (!toast || !toastMessage) {
        console.warn('Toast elements not found.');
        return;
    }

    toastMessage.textContent = message;
    toast.className = 'toast show'; // Reset classes and add 'show'
    if (type === 'success') {
        toast.classList.add('success');
    } else if (type === 'error') {
        toast.classList.add('error');
    } else if (type === 'warning') {
        toast.classList.add('warning');
    } else {
        toast.classList.add('info'); // Default type
    }


    clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => {
        toast.classList.remove('show', 'success', 'error', 'warning', 'info'); // Remove all specific types
    }, duration);
}

// Function to show error messages next to input fields
export function showError(fieldId, message) {
    // Có thể truyền ID của input, hoặc trực tiếp errorElement nếu có
    // Dạng `input.id`-error là chuẩn nếu bạn muốn ẩn/hiện tự động
    let errorElement = document.getElementById(`${fieldId}-error`);
    if (!errorElement) {
        errorElement = document.createElement('div');
        errorElement.id = `${fieldId}-error`;
        errorElement.className = 'error-message';
        const field = document.getElementById(fieldId);
        if (field) {
            field.classList.add('error'); // Add error class to input
            // Chèn lỗi ngay sau input
            field.parentNode.insertBefore(errorElement, field.nextSibling);
        } else {
            console.warn(`Field with ID ${fieldId} not found for error message.`);
            return;
        }
    }
    errorElement.textContent = message;
    errorElement.style.display = 'block';
}

// Function to hide error messages
export function hideError(fieldId) {
    const errorElement = document.getElementById(`${fieldId}-error`);
    if (errorElement) {
        errorElement.style.display = 'none';
        const field = document.getElementById(fieldId);
        if (field) {
            field.classList.remove('error');
        }
    }
}

// Function to get URL parameter
export function getUrlParameter(name) {
    name = name.replace(/[\[]/, '\\[').replace(/[\]]/, '\\]');
    var regex = new RegExp('[\\?&]' + name + '=([^&#]*)');
    var results = regex.exec(location.search);
    return results === null ? '' : decodeURIComponent(results[1].replace(/\+/g, ' '));
}

// Simple form validation utility
export function validateForm(rules) {
    let isValid = true;
    for (const fieldId in rules) {
        const input = document.getElementById(fieldId);
        const rule = rules[fieldId];

        if (!input) {
            console.warn(`Validation: Input with ID ${fieldId} not found.`);
            continue;
        }

        hideError(fieldId); // Clear previous error

        if (rule.required && !input.value.trim()) {
            showError(fieldId, rule.errorMessage || 'Trường này không được để trống.');
            isValid = false;
            continue;
        }

        if (rule.regex && !rule.regex.test(input.value.trim())) {
            showError(fieldId, rule.errorMessage || 'Giá trị không hợp lệ.');
            isValid = false;
            continue;
        }
        // Add more validation types (e.g., email, minLength, maxLength) as needed
    }
    return isValid;
}

// Check if user is logged in (Placeholder - cần chỉnh sửa theo logic xác thực thật của bạn)
export function isLoggedIn() {
    // Trong môi trường thực tế, bạn sẽ kiểm tra token JWT trong localStorage/sessionStorage
    // và/hoặc xác thực với backend.
    const user = localStorage.getItem('user'); // Giả định 'user' object được lưu sau khi đăng nhập
    return !!user; // Trả về true nếu có user trong localStorage
}


// --- Loading Overlay Functions ---
let loadingOverlay = null; // Biến này sẽ giữ tham chiếu đến phần tử overlay

export function showLoading() {
    if (!loadingOverlay) {
        loadingOverlay = document.createElement('div');
        loadingOverlay.id = 'loading-overlay';
        loadingOverlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.6); /* Nền tối mờ */
            display: flex;
            justify-content: center;
            align-items: center;
            color: white; /* Màu chữ/spinner */
            font-size: 1.5em;
            z-index: 9999; /* Đảm bảo nằm trên cùng */
            flex-direction: column;
            gap: 15px;
            pointer-events: all; /* Ngăn chặn tương tác với nội dung bên dưới */
            /* Animation cho sự xuất hiện */
            opacity: 0;
            transition: opacity 0.3s ease-in-out;
        `;
        loadingOverlay.innerHTML = `
            <i class="fas fa-spinner fa-spin" style="font-size: 3em;"></i>
            <span>Đang xử lý...</span>
        `;
        document.body.appendChild(loadingOverlay);
        // Kích hoạt transition
        setTimeout(() => { loadingOverlay.style.opacity = '1'; }, 10);
    }
    loadingOverlay.style.display = 'flex';
    loadingOverlay.style.opacity = '1'; // Đảm bảo opacity được đặt nếu đã tạo
}

export function hideLoading() {
    if (loadingOverlay) {
        // Kích hoạt transition khi ẩn
        loadingOverlay.style.opacity = '0';
        // Ẩn hoàn toàn sau khi transition kết thúc
        setTimeout(() => {
            if (loadingOverlay) loadingOverlay.style.display = 'none';
        }, 300); // Trùng với thời gian transition
    }
}