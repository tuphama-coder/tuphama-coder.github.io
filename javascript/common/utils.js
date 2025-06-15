
export function formatPrice(price) {
    if (typeof price !== 'number') return 'N/A';
    return price.toLocaleString('vi-VN');
}

export function redirectToPage(pageUrl) {
    window.location.href = pageUrl;
}

let toastTimeout;
export function showToast(message, type = 'info', duration = 3000) {
    const toast = document.getElementById('toast');
    const toastMessage = document.getElementById('toast-message');

    if (!toast || !toastMessage) {
        console.warn('Toast elements not found.');
        return;
    }

    toastMessage.textContent = message;
    toast.className = 'toast show'; 
    if (type === 'success') {
        toast.classList.add('success');
    } else if (type === 'error') {
        toast.classList.add('error');
    } else if (type === 'warning') {
        toast.classList.add('warning');
    } else {
        toast.classList.add('info'); 
    }


    clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => {
        toast.classList.remove('show', 'success', 'error', 'warning', 'info'); 
    }, duration);
}

export function showError(fieldId, message) {
    let errorElement = document.getElementById(`${fieldId}-error`);
    if (!errorElement) {
        errorElement = document.createElement('div');
        errorElement.id = `${fieldId}-error`;
        errorElement.className = 'error-message';
        const field = document.getElementById(fieldId);
        if (field) {
            field.classList.add('error');
            field.parentNode.insertBefore(errorElement, field.nextSibling);
        } else {
            console.warn(`Field with ID ${fieldId} not found for error message.`);
            return;
        }
    }
    errorElement.textContent = message;
    errorElement.style.display = 'block';
}


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


export function getUrlParameter(name) {
    name = name.replace(/[\[]/, '\\[').replace(/[\]]/, '\\]');
    var regex = new RegExp('[\\?&]' + name + '=([^&#]*)');
    var results = regex.exec(location.search);
    return results === null ? '' : decodeURIComponent(results[1].replace(/\+/g, ' '));
}


export function validateForm(rules) {
    let isValid = true;
    for (const fieldId in rules) {
        const input = document.getElementById(fieldId);
        const rule = rules[fieldId];

        if (!input) {
            console.warn(`Validation: Input with ID ${fieldId} not found.`);
            continue;
        }

        hideError(fieldId); 

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
    }
    return isValid;
}


export function isLoggedIn() {
    const user = localStorage.getItem('user'); 
    return !!user; 
}


let loadingOverlay = null; 

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
        setTimeout(() => { loadingOverlay.style.opacity = '1'; }, 10);
    }
    loadingOverlay.style.display = 'flex';
    loadingOverlay.style.opacity = '1'; 
}

export function hideLoading() {
    if (loadingOverlay) {
        loadingOverlay.style.opacity = '0';
        setTimeout(() => {
            if (loadingOverlay) loadingOverlay.style.display = 'none';
        }, 300); 
    }
}