document.addEventListener('DOMContentLoaded', () => {
    const authSection = document.getElementById('auth-section');
    const accountSection = document.getElementById('account-section');
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const forgotPasswordForm = document.getElementById('forgot-password-form');
    const resetPasswordForm = document.getElementById('reset-password-form');
    const profileForm = document.getElementById('profile-form');
    const changePasswordForm = document.getElementById('change-password-form');
    const addressForm = document.getElementById('address-form');
    const couponForm = document.getElementById('coupon-form');
    const loginBtn = document.getElementById('login-btn');
    const registerBtn = document.getElementById('register-btn');
    const forgotPasswordLink = document.getElementById('forgot-password-link');
    const backToLogin = document.getElementById('back-to-login');
    const backToLoginFromReset = document.getElementById('back-to-login-from-reset');
    const deleteAccountBtn = document.getElementById('delete-account-btn');
    const toast = document.getElementById('toast');
    const toastMessage = document.getElementById('toast-message');
    const loading = document.getElementById('loading');
    const otpModal = document.getElementById('otp-modal');
    const otpInput = document.getElementById('otp-input');
    const otpTimer = document.getElementById('otp-timer');
    const otpError = document.getElementById('otp-error');
    const confirmOtp = document.getElementById('confirm-otp');
    const cancelOtp = document.getElementById('cancel-otp');
    const loginError = document.getElementById('login-error');
    const registerError = document.getElementById('register-error');
    const forgotError = document.getElementById('forgot-error');
    const resetError = document.getElementById('reset-error');
    const googleBtn = document.querySelector('.social-btn[data-provider="google"]');
    const facebookBtn = document.querySelector('.social-btn[data-provider="facebook"]');
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    const logoutBtn = document.getElementById('logout-btn');
    const addReviewForm = document.getElementById('add-review-form');
    const reviewListElement = document.getElementById('review-list');
    const vehicleSelectElement = document.getElementById('review-vehicle-select'); // Thêm biến mới cho dropdown xe


    let otpTimeout = null;
    let currentEmail = null;
    let facebookInitialized = false;
    let isLoadingOrders = false;

    // Helper functions (showToast, showError, hideError, showLoading, hideLoading)
    // These functions are similar to those in utils.js but are defined here for self-containment
    // as seen in the original `account.js` and `payment.js` files.
    const showToast = (message, type = 'success', duration = 3000) => {
        if (!toast || !toastMessage) {
            console.error('Không tìm thấy toast hoặc toastMessage');
            return;
        }
        toastMessage.innerHTML = message;
        toast.className = `toast ${type}`;
        toast.style.display = 'block';
        if (toast.timeoutId) {
            clearTimeout(toast.timeoutId);
        }
        toast.timeoutId = setTimeout(() => {
            toast.style.display = 'none';
            toast.timeoutId = null;
        }, duration);
    };


    const showError = (element, message, duration = 5000) => {
        if (!element) {
            console.error('Không tìm thấy phần tử error');
            return;
        }
        element.textContent = message;
        element.style.display = 'block';
        if (element.timeoutId) {
            clearTimeout(element.timeoutId);
        }
        element.timeoutId = setTimeout(() => {
            element.style.display = 'none';
            element.timeoutId = null;
        }, duration);
    };


    const hideError = (element) => {
        if (element) {
            element.style.display = 'none';
             if (element.timeoutId) {
                 clearTimeout(element.timeoutId);
                 element.timeoutId = null;
             }
        }
    };


    const showLoading = () => {
        if (!loading) {
            console.error('Không tìm thấy loading element');
            return;
        }
        loading.style.display = 'flex';
    };

    const hideLoading = () => {
        if (!loading) {
            console.error('Không tìm thấy loading element');
            return;
        }
        loading.style.display = 'none';
    };

    const isValidEmail = (email) => {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    };

    const isValidPhone = (phone) => {
        // Allow phone numbers with spaces and hyphens, but validate only digits
        const cleanedPhone = phone.replace(/[\s-]/g, '');
        return /^\+?\d{10,15}$/.test(cleanedPhone);
    };

    const isValidPassword = (password) => {
        return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/.test(password);
    };

    const startOtpTimer = () => {
        if (!otpTimer || !otpModal || !otpInput) {
            console.error('Không tìm thấy otpTimer, otpModal hoặc otpInput');
            return;
        }
        let timeLeft = 60;
        otpTimer.textContent = timeLeft;
        if (otpTimeout) {
            clearInterval(otpTimeout);
        }
        otpTimeout = setInterval(() => {
            timeLeft--;
            otpTimer.textContent = timeLeft;
            if (timeLeft <= 0) {
                clearInterval(otpTimeout);
                otpTimeout = null;
                if (otpModal) otpModal.style.display = 'none';
                if (otpInput) otpInput.value = '';
                showError(otpError, 'Mã OTP đã hết hạn.');
            }
        }, 1000);
    };

    const checkLoginStatus = () => {
        console.log('Kiểm tra trạng thái đăng nhập...');
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        if (!authSection || !accountSection) {
            console.error('Auth/Account sections not found');
            return;
        }
        if (user.id) {
            console.log('Tìm thấy người dùng, hiển thị phần tài khoản');
            authSection.style.display = 'none';
            accountSection.style.display = 'block';

            const defaultTab = document.querySelector('.account-tabs .tab-btn[data-tab="profile"]');
            if (defaultTab) {
                // Manually trigger click to load default tab content
                defaultTab.click();
            } else {
                console.warn('Default profile tab button not found.');
                // Fallback: just ensure account section is visible
                accountSection.style.display = 'block';
            }
            initializeFaqAccordion();
        } else {
            console.log('Không tìm thấy người dùng, hiển thị phần xác thực');
            authSection.style.display = 'block';
            accountSection.style.display = 'none';
            if (loginForm) loginForm.style.display = 'block';
            if (registerForm) registerForm.style.display = 'none';
            if (forgotPasswordForm) forgotPasswordForm.style.display = 'none';
            if (resetPasswordForm) resetPasswordForm.style.display = 'none';
            if (loginBtn) loginBtn.classList.add('active');
            if (registerBtn) registerBtn.classList.remove('active');

            // Clear previous errors on all auth forms when switching to auth section
            hideError(loginError);
            hideError(registerError);
            hideError(forgotError);
            hideError(resetError);
        }
    };

    const loadProfile = async () => { // Đã bỏ tham số userId
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        const userId = user.id; // Lấy userId từ localStorage
        console.log('Tải hồ sơ cho người dùng ID:', userId);

        if (!userId) {
            console.error('loadProfile: Không có User ID để tải hồ sơ. Người dùng chưa đăng nhập hoặc token không hợp lệ.');
            showToast('Lỗi: Vui lòng đăng nhập để xem hồ sơ.', 'error');
            return;
        }
        try {
            const response = await fetch(`http://localhost:5000/api/users/${userId}`);
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: 'Lỗi không xác định' }));
                throw new Error(`Lỗi tải hồ sơ: ${errorData.error || response.statusText}`);
            }
            const userDetails = await response.json(); // Đổi tên biến để tránh trùng user từ localStorage
            console.log('loadProfile: Dữ liệu người dùng đã nhận:', userDetails);

            const profileName = document.getElementById('profile-name');
            const profileEmail = document.getElementById('profile-email');
            const profilePhone = document.getElementById('profile-phone');
            const profileAddress = document.getElementById('profile-address');
            const profileNotifications = document.getElementById('profile-notifications');

            if (profileName) profileName.value = userDetails.name || '';
            if (profileEmail) profileEmail.value = userDetails.email || '';
            if (profilePhone) profilePhone.value = userDetails.phone || '';
            if (profileAddress) profileAddress.value = userDetails.address || '';
            if (profileNotifications) profileNotifications.checked = userDetails.notifications || false;

        } catch (error) {
            console.error('Lỗi tải hồ sơ:', error);
            showToast(`Không thể tải hồ sơ: ${error.message}`, 'error');
        }
    };

    if (profileForm) {
        profileForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            showLoading();
            console.log('Form hồ sơ được gửi...');
            const name = document.getElementById('profile-name')?.value.trim();
            const phone = document.getElementById('profile-phone')?.value.trim();
            const address = document.getElementById('profile-address')?.value.trim();
            const notifications = document.getElementById('profile-notifications')?.checked;

            if (!name || !phone) {
                showToast('Vui lòng điền đầy đủ họ tên và số điện thoại.', 'error');
                hideLoading();
                return;
            }

            if (!isValidPhone(phone)) {
                showToast('Số điện thoại không hợp lệ (10-15 số).', 'error');
                hideLoading();
                return;
            }

            try {
                const user = JSON.parse(localStorage.getItem('user') || '{}');
                if (!user.id) {
                    showToast('Lỗi: Không tìm thấy thông tin người dùng.', 'error');
                    hideLoading();
                    return;
                }
                const response = await fetch(`http://localhost:5000/api/users/${user.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name, phone, address, notifications })
                });
                const result = await response.json().catch(() => ({}));

                if (response.ok) {
                    // Update localStorage with new info from the form
                    const updatedUser = { ...user, name, phone, address, notifications };
                    localStorage.setItem('user', JSON.stringify(updatedUser));
                    showToast('Cập nhật hồ sơ thành công!');
                } else {
                    console.error('Lỗi cập nhật hồ sơ từ server:', result.error, response.status);
                    showToast(`Cập nhật hồ sơ thất bại: ${result.error || 'Lỗi không rõ'}`, 'error');
                }
            } catch (error) {
                console.error('Lỗi mạng hoặc lỗi không xác định khi cập nhật hồ sơ:', error);
                showToast('Có lỗi xảy ra. Vui lòng thử lại.', 'error');
            }
            hideLoading();
        });
    }

    if (changePasswordForm) {
        changePasswordForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            showLoading();
            const currentPassword = document.getElementById('current-password')?.value.trim();
            const newPassword = document.getElementById('new-password')?.value.trim();
            const confirmNewPassword = document.getElementById('confirm-new-password')?.value.trim();

            const changePassErrorElement = document.getElementById('change-password-error');
            if (changePassErrorElement) hideError(changePassErrorElement);

            if (!currentPassword || !newPassword || !confirmNewPassword) {
                const msg = 'Vui lòng điền đầy đủ thông tin mật khẩu.';
                showToast(msg, 'error');
                if (changePassErrorElement) showError(changePassErrorElement, msg);
                hideLoading();
                return;
            }

            if (newPassword === currentPassword) {
                const msg = 'Mật khẩu mới không được giống mật khẩu hiện tại.';
                showToast(msg, 'error');
                if (changePassErrorElement) showError(changePassErrorElement, msg);
                hideLoading();
                return;
            }

            if (!isValidPassword(newPassword)) {
                const msg = 'Mật khẩu mới phải có ít nhất 8 ký tự, bao gồm chữ hoa, chữ thường, số và ký tự đặc biệt.';
                showToast(msg, 'error');
                if (changePassErrorElement) showError(changePassErrorElement, msg);
                hideLoading();
                return;
            }

            if (newPassword !== confirmNewPassword) {
                const msg = 'Mật khẩu xác nhận không khớp.';
                showToast(msg, 'error');
                if (changePassErrorElement) showError(changePassErrorElement, msg);
                hideLoading();
                return;
            }

            try {
                const user = JSON.parse(localStorage.getItem('user') || '{}');
                if (!user.email) {
                    const msg = 'Lỗi: Không tìm thấy thông tin email người dùng.';
                    showToast(msg, 'error');
                    if (changePassErrorElement) showError(changePassErrorElement, msg);
                    hideLoading();
                    return;
                }
                const response = await fetch(`http://localhost:5000/api/users/change-password`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email: user.email, currentPassword, newPassword })
                });

                const result = await response.json().catch(() => ({}));

                if (response.ok) {
                    showToast('Đổi mật khẩu thành công!');
                    changePasswordForm.reset();
                    if (changePassErrorElement) hideError(changePassErrorElement);
                } else {
                    console.error('Lỗi đổi mật khẩu từ server:', response.status, result.error);
                    const msg = `Đổi mật khẩu thất bại: ${result.error || 'Mật khẩu hiện tại không đúng'}.`;
                    showToast(msg, 'error');
                    if (changePassErrorElement) showError(changePassErrorElement, msg);
                }
            } catch (error) {
                console.error('Lỗi mạng hoặc không xác định khi đổi mật khẩu:', error);
                const msg = 'Có lỗi xảy ra khi đổi mật khẩu. Vui lòng thử lại.';
                showToast(msg, 'error');
                if (changePassErrorElement) showError(changePassErrorElement, msg);
            }
            hideLoading();
        });
    }

    const loadOrders = async () => {
        console.log('--- Loading orders ---');
        if (isLoadingOrders) {
            console.log('Đang tải đơn hàng, bỏ qua yêu cầu mới.');
            return;
        }
        isLoadingOrders = true;
        const orderList = document.getElementById('order-list');

        if (!orderList) {
            console.error('Không tìm thấy phần tử #order-list trong DOM.');
            showToast('Lỗi hiển thị lịch sử đặt xe (phần tử DOM bị thiếu).', 'error');
            isLoadingOrders = false;
            return;
        }

        orderList.innerHTML = '<p style="text-align: center; color: var(--dark-gray);"><i class="fas fa-spinner fa-spin"></i> Đang tải lịch sử đặt xe...</p>';
        console.log('Bắt đầu tải đơn hàng...');

        try {
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            if (!user.id) {
                console.warn('Không tìm thấy user.id trong localStorage. Không thể tải đơn hàng.');
                orderList.innerHTML = '<p class="no-orders">Vui lòng đăng nhập để xem lịch sử đặt xe.</p>';
                return;
            }

            const response = await fetch(`http://localhost:5000/api/orders?userId=${user.id}`);
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: 'Lỗi không xác định' }));
                console.error(`Lỗi API khi lấy đơn hàng: ${response.status} - ${response.statusText}`, errorData);
                orderList.innerHTML = `<p class="error-message">Không thể tải lịch sử đặt xe: ${errorData.error || 'Lỗi không xác định'}</p>`;
                showToast('Không thể tải lịch sử đặt xe.', 'error');
                return;
            }

            const orders = await response.json();

            orderList.innerHTML = '';

            if (!Array.isArray(orders) || orders.length === 0) {
                orderList.innerHTML = '<p class="no-orders">Bạn chưa có lượt đặt xe nào.</p>';
                console.log('Không có đơn hàng nào được tìm thấy cho user này.');
                return;
            }

            console.log(`Tìm thấy ${orders.length} lượt đặt xe.`);

            orders.forEach(order => {
                if (!order.id || !order.date || order.total === undefined || !order.status || !order.items) {
                    console.warn('Bỏ qua hiển thị dữ liệu đơn hàng không hợp lệ (thiếu thuộc tính):', order);
                    return;
                }
                if (!Array.isArray(order.items)) {
                    console.warn('Dữ liệu items trong đơn hàng không phải là mảng:', order);
                    return;
                }

                let displayDate = 'N/A';
                try {
                    if (order.date) {
                        const dateObj = new Date(order.date);
                        if (!isNaN(dateObj.getTime())) {
                            displayDate = dateObj.toLocaleDateString('vi-VN', {
                                year: 'numeric',
                                month: '2-digit',
                                day: '2-digit',
                                hour: '2-digit',
                                minute: '2-digit'
                            });
                        } else {
                            console.warn('Ngày đặt xe không hợp lệ:', order.date);
                            displayDate = 'Ngày không hợp lệ';
                        }
                    }
                } catch (dateError) {
                    console.error('Lỗi định dạng ngày:', order.date, dateError);
                    displayDate = 'Lỗi định dạng ngày';
                }

                const orderItem = document.createElement('div');
                orderItem.className = 'order-item';
                orderItem.innerHTML = `
                    <div class="order-header">
                        <h4>Đặt xe #${order.id}</h4>
                        <span class="order-status ${order.status.toLowerCase().replace(/\s/g, '-')}">${order.status}</span>
                    </div>
                    <p class="order-date"><i class="fas fa-calendar-alt"></i> ${displayDate}</p>
                    <p class="order-total"><i class="fas fa-money-bill"></i> ${order.total.toLocaleString('vi-VN')} VNĐ</p>
                    <div class="order-actions">
                        <button class="order-btn view-details" data-order-id="${order.id}"><i class="fas fa-eye"></i> Xem chi tiết</button>
                    ${['Pending', 'Confirmed', 'PickedUp'].includes(order.status) ? `<button class="order-btn cancel-order" data-order-id="${order.id}"><i class="fas fa-times"></i> Hủy đặt</button>` : ''}
                </div>
                    <div class="order-details" id="order-details-${order.id}" style="display: none;"></div>
                `;
                orderList.appendChild(orderItem);
            });

           orderList.addEventListener('click', async (event) => {
                const targetButton = event.target.closest('.cancel-order');
                if (!targetButton) return;

                const orderId = parseInt(targetButton.dataset.orderId); // Convert to integer
                if (isNaN(orderId)) { // Check if conversion was successful
                    console.error('Invalid orderId found in dataset of cancel button.');
                    showToast('Lỗi: Không thể xác định đặt xe cần hủy.', 'error');
                    return;
                }


                const details = document.getElementById(`order-details-${orderId}`);
                const order = orders.find(o => o.id === parseInt(orderId));

                console.log(`Chuyển đổi hiển thị chi tiết đặt xe cho orderId: ${orderId}`);

                if (!details) {
                    console.error(`Không tìm thấy phần tử chi tiết đặt xe (ID: order-details-${orderId}).`);
                    showToast('Lỗi hiển thị chi tiết đặt xe (phần tử DOM bị thiếu).', 'error');
                    return;
                }
                if (!order) {
                    console.error(`Không tìm thấy đặt xe với orderId: ${orderId} trong dữ liệu đã tải.`);
                    showToast('Dữ liệu chi tiết đặt xe không khả dụng.', 'error');
                    details.innerHTML = '<p class="error-message">Lỗi: Không tìm thấy thông tin đặt xe đã tải.</p>';
                    details.style.display = 'block';
                    return;
                }
                if (!order.items || !Array.isArray(order.items)) {
                    console.error(`Dữ liệu items không hợp lệ cho orderId: ${orderId}`, order);
                    showToast('Dữ liệu xe trong đặt xe không hợp lệ.', 'error');
                    details.innerHTML = '<p class="error-message">Lỗi: Không thể tải chi tiết xe.</p>';
                    details.style.display = 'block';
                    return;
                }

                // Parse customer_info if it's a string
                const customerInfo = typeof order.customer_info === 'string' ? JSON.parse(order.customer_info) : order.customer_info;


                if (details.style.display === 'none') {
                    details.style.display = 'block';
                    details.innerHTML = `
                            <h4>Thông tin xe đã đặt</h4>
                            <div class="order-items-detail-list">
                                ${order.items.map(item => {
                                    // Assuming item.name, item.price, item.quantity exist for each item in the order
                                    if (!item.name || item.price === undefined || item.quantity === undefined) {
                                        console.warn('view-details: Dữ liệu item không đầy đủ:', item);
                                        return '<div class="order-item-detail"><span>Xe không hợp lệ</span><span>N/A</span></div>';
                                    }
                                    return `
                                        <div class="order-item-detail">
                                            <span>${item.name} x ${item.quantity} ngày</span>
                                            <span>${(item.price * item.quantity).toLocaleString('vi-VN')} VNĐ</span>
                                        </div>
                                    `;
                                }).join('')}
                            </div>
                            ${customerInfo ? `
                            <h4>Thông tin người thuê</h4>
                            <p>Họ và tên: ${customerInfo.name || 'N/A'}</p>
                            <p>Số điện thoại: ${customerInfo.phone || 'N/A'}</p>
                            <p>Email: ${customerInfo.email || 'N/A'}</p>
                            <p>Địa chỉ liên hệ: ${customerInfo.address || 'N/A'}</p>
                            <p>Địa điểm nhận xe: ${customerInfo.pickupLocation || 'N/A'}</p>
                            <p>Địa điểm trả xe: ${customerInfo.returnLocation || 'N/A'}</p>
                            ${customerInfo.note ? `<p>Ghi chú: ${customerInfo.note}</p>` : ''}
                            ` : ''}
                            <h4>Tổng kết</h4>
                            <div class="order-totals-detail-list">
                                <div class="total-item-detail">
                                    <span>Tổng tiền thuê cơ bản:</span>
                                    <span>${(order.subtotal || 0).toLocaleString('vi-VN')} VNĐ</span>
                                </div>
                                ${order.shipping_fee !== undefined ? `<div class="total-item-detail">
                                    <span>Phí giao nhận xe:</span>
                                    <span>${(order.shipping_fee || 0).toLocaleString('vi-VN')} VNĐ</span>
                                </div>` : ''}
                                ${order.gift_fee !== undefined ? `<div class="total-item-detail">
                                    <span>Gói quà tặng:</span>
                                    <span>${(order.gift_fee || 0).toLocaleString('vi-VN')} VNĐ</span>
                                </div>` : ''}
                                ${order.discount > 0 ? `<div class="total-item-detail">
                                    <span>Giảm giá:</span>
                                    <span>-${(order.discount || 0).toLocaleString('vi-VN')} VNĐ</span>
                                </div>` : ''}
                                <div class="total-item-detail total-bold">
                                    <span>Tổng thanh toán:</span>
                                    <span>${(order.total || 0).toLocaleString('vi-VN')} VNĐ</span>
                                </div>
                                <div class="total-item-detail">
                                    <span>Phương thức thanh toán:</span>
                                    <span>${order.paymentMethod || 'N/A'}</span>
                                </div>
                            </div>
                        `;
                } else {
                    details.style.display = 'none';
                }
            });

            orderList.addEventListener('click', async (event) => {
                const targetButton = event.target.closest('.cancel-order');
                if (!targetButton) return;

                const orderId = parseInt(targetButton.dataset.orderId); // Chuyển đổi sang số nguyên
                if (isNaN(orderId)) { // Kiểm tra xem việc chuyển đổi có thành công không
                    console.error('Invalid orderId found in dataset of cancel button.');
                    showToast('Lỗi: Không thể xác định đặt xe cần hủy.', 'error');
                    return;
                }

                const orderToCancel = orders.find(o => o.id === orderId);
                if (!orderToCancel) {
                    console.error(`Đặt xe #${orderId} không được tìm thấy trong danh sách hiện tại.`);
                    showToast('Lỗi: Không tìm thấy thông tin đặt xe.', 'error');
                    return;
                }
                if (orderToCancel.status !== 'Pending' && orderToCancel.status !== 'Confirmed') {
                    showToast(`Không thể hủy đặt xe #${orderId}. Trạng thái hiện tại là "${orderToCancel.status}".`, 'warning');
                    return;
                }

                if (confirm(`Bạn có chắc chắn muốn hủy lượt đặt xe #${orderId} này không?`)) {
                    showLoading();
                    try {
                        const response = await fetch(`http://localhost:5000/api/orders/${orderId}`, {
                            method: 'PUT',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ status: 'Cancelled' }) // Cập nhật trạng thái thành 'Cancelled'
                        });

                        hideLoading();

                        const result = await response.json().catch(() => ({}));

                        if (response.ok) {
                            showToast(`Lượt đặt xe #${orderId} đã được hủy thành công!`, 'success');
                            loadOrders(); // Tải lại danh sách đơn hàng
                            loadMembershipLevels(); // Re-calculate membership levels if cancellation affects total spent
                        } else {
                            console.error(`Lỗi khi hủy đặt xe ${orderId}: ${response.status} - ${response.statusText}`, result);
                            showToast(`Không thể hủy đặt xe #${orderId}. Lỗi: ${result.error || 'Không rõ'}`, 'error');
                        }
                    } catch (error) {
                        hideLoading();
                        console.error(`Lỗi mạng hoặc lỗi không xác định khi hủy đặt xe ${orderId}:`, error);
                        showToast('Đã xảy ra lỗi khi kết nối đến server. Vui lòng thử lại.', 'error');
                    }
                }
            });


        } catch (error) {
            console.error('Lỗi chung khi tải hoặc xử lý đặt xe:', error);
            if(orderList && orderList.innerHTML.includes('Đang tải lịch sử đặt xe')) {
                 orderList.innerHTML = '<p class="error-message">Đã xảy ra lỗi khi tải lịch sử đặt xe.</p>';
             } else if (orderList) {
                  showToast('Có lỗi xảy ra khi hiển thị một số lượt đặt xe.', 'warning');
             } else {
                  showToast('Lỗi nghiêm trọng: Không thể hiển thị lượt đặt xe.', 'error');
             }

        } finally {
            isLoadingOrders = false;
            console.log('--- Finished loading orders ---');
        }
    };


    const loadAddresses = async () => {
        console.log('Tải địa chỉ...');
        try {
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            if (!user.id) {
                 console.warn('Không tìm thấy user.id. Không thể tải địa chỉ.');
                 const addressList = document.getElementById('address-list');
                 if(addressList) addressList.innerHTML = '<p class="no-addresses">Vui lòng đăng nhập để xem địa chỉ.</p>';
                 return;
            }
             // Hiển thị thông báo đang tải địa chỉ
             const addressList = document.getElementById('address-list');
             if(addressList) addressList.innerHTML = '<p style="text-align: center; color: var(--dark-gray);"><i class="fas fa-spinner fa-spin"></i> Đang tải địa chỉ...</p>';


            const response = await fetch(`http://localhost:5000/api/addresses/${user.id}`);

             if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
                 console.error(`Lỗi API khi lấy địa chỉ: ${response.status} - ${response.statusText}`, errorData);
                 const addressList = document.getElementById('address-list');
                 if(addressList) addressList.innerHTML = `<p class="error-message">Không thể tải địa chỉ: ${errorData.error || 'Lỗi không xác định'}.</p>`;
                 showToast('Không thể tải địa chỉ.', 'error');
                 return;
             }


            const addresses = await response.json();
             const addressListElement = document.getElementById('address-list');

            if (!addressListElement) {
                 console.error('Không tìm thấy address-list trong DOM');
                 showToast('Lỗi hiển thị địa chỉ (phần tử DOM bị thiếu).', 'error');
                 return;
            }
            addressListElement.innerHTML = '';

            if (!Array.isArray(addresses) || addresses.length === 0) {
                addressListElement.innerHTML = '<p class="no-addresses">Bạn chưa có địa chỉ nào.</p>';
                return;
            }

            console.log(`Tìm thấy ${addresses.length} địa chỉ.`);


            addresses.forEach(address => {
                if (!address.id || !address.name || !address.details) {
                    console.warn('Bỏ qua hiển thị dữ liệu địa chỉ không đầy đủ:', address);
                    return;
                }
                const addressItem = document.createElement('div');
                addressItem.className = 'address-item';
                addressItem.innerHTML = `
                    <div class="address-content">
                        <h4>${address.name}</h4>
                        <p>${address.details}</p>
                    </div>
                    <div class="address-actions">
                        <button class="delete-address" data-address-id="${address.id}"><i class="fas fa-trash"></i> Xóa</button>
                    </div>
                `;
                addressListElement.appendChild(addressItem);
            });

             addressListElement.addEventListener('click', async (event) => {
                 const targetButton = event.target.closest('.delete-address');
                 if (!targetButton) return;

                const id = targetButton.dataset.addressId;
                 if (!id) {
                     console.error('Không tìm thấy addressId trong dataset nút xóa.');
                     showToast('Lỗi xóa địa chỉ.', 'error');
                     return;
                 }

                if (confirm('Bạn có chắc chắn muốn xóa địa chỉ này?')) {
                    showLoading();
                    try {
                        const response = await fetch(`http://localhost:5000/api/addresses/${id}`, {
                            method: 'DELETE'
                        });

                         const result = await response.json().catch(() => ({}));
                        if (response.ok) {
                            showToast('Xóa địa chỉ thành công!');
                            loadAddresses();
                        } else {
                             console.error(`Lỗi xóa địa chỉ ${id}: ${response.status} - ${response.statusText}`, result);
                             showToast(`Xóa địa chỉ thất bại: ${result.error || 'Không rõ'}`, 'error');
                        }
                    } catch (error) {
                        console.error(`Lỗi mạng hoặc không xác định khi xóa địa chỉ ${id}:`, error);
                        showToast('Có lỗi xảy ra. Vui lòng thử lại.', 'error');
                    }
                    hideLoading();
                }
             });

        } catch (error) {
            console.error('Lỗi khi tải địa chỉ:', error);
             const addressList = document.getElementById('address-list');
             if(addressList) addressList.innerHTML = '<p class="error-message">Không thể tải địa chỉ.</p>';
            showToast('Không thể tải địa chỉ. Vui lòng thử lại.', 'error');
        }
    };


    if (addressForm) {
        addressForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            showLoading();
            console.log('Form địa chỉ được gửi...');
            const name = document.getElementById('address-name')?.value.trim();
            const details = document.getElementById('address-details')?.value.trim();

            if (!name || !details) {
                showToast('Vui lòng điền đầy đủ thông tin địa chỉ.', 'error');
                hideLoading();
                return;
            }

            try {
                const user = JSON.parse(localStorage.getItem('user') || '{}');
                if (!user.id) {
                     showToast('Lỗi: Vui lòng đăng nhập để thêm địa chỉ.', 'error');
                     hideLoading();
                     return;
                }
                const response = await fetch(`http://localhost:5000/api/addresses/${user.id}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name, details })
                });

                 const result = await response.json().catch(() => ({}));

                if (response.ok) {
                    showToast('Thêm địa chỉ thành công!');
                    addressForm.reset();
                    loadAddresses();
                } else {
                    console.error('Lỗi thêm địa chỉ từ server:', response.status, result.error);
                    showToast(`Thêm địa chỉ thất bại: ${result.error || 'Không rõ'}`, 'error');
                }
            } catch (error) {
                console.error('Lỗi mạng hoặc không xác định khi thêm địa chỉ:', error);
                showToast('Có lỗi xảy ra. Vui lòng thử lại.', 'error');
            }
            hideLoading();
        });
    }

    // Hàm mới để điền dữ liệu cho dropdown chọn xe
    const populateVehicleDropdown = async () => {
        if (!vehicleSelectElement) {
            console.error('Không tìm thấy #review-vehicle-select trong DOM.');
            return;
        }
        vehicleSelectElement.innerHTML = '<option value="">-- Đang tải danh sách xe --</option>'; // Trạng thái tải

        try {
            const response = await fetch('http://localhost:5000/api/vehicles'); // Lấy tất cả xe
            if (!response.ok) {
                throw new Error('Không thể tải danh sách xe.');
            }
            const vehicles = await response.json();

            vehicleSelectElement.innerHTML = '<option value="">-- Chọn xe --</option>'; // Reset dropdown

            if (Array.isArray(vehicles) && vehicles.length > 0) {
                vehicles.forEach(vehicle => {
                    const option = document.createElement('option');
                    option.value = vehicle.id; // Giá trị là ID của xe
                    option.textContent = `${vehicle.name} (${vehicle.license_plate || 'Không biển số'})`; // Hiển thị tên và biển số
                    vehicleSelectElement.appendChild(option);
                });
            } else {
                vehicleSelectElement.innerHTML = '<option value="">-- Không có xe nào để đánh giá --</option>';
            }
        } catch (error) {
            console.error('Lỗi khi tải danh sách xe để điền dropdown:', error);
            vehicleSelectElement.innerHTML = '<option value="">-- Lỗi tải xe --</option>';
            showToast('Không thể tải danh sách xe để đánh giá.', 'error');
        }
    };


    const loadReviews = async () => {
        console.log('Tải đánh giá...');
        try {
            const user = JSON.parse(localStorage.getItem('user') || '{}');
             if (!user.id) {
                 console.warn('Không tìm thấy user.id. Không thể tải đánh giá.');
                 if(reviewListElement) reviewListElement.innerHTML = '<p class="no-reviews">Vui lòng đăng nhập để xem đánh giá.</p>';
                 return;
            }

             if(reviewListElement) reviewListElement.innerHTML = '<p style="text-align: center; color: var(--dark-gray);"><i class="fas fa-spinner fa-spin"></i> Đang tải đánh giá...</p>';


            const response = await fetch(`http://localhost:5000/api/reviews/${user.id}`);

             if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
                console.error(`Lỗi API khi lấy đánh giá: ${response.status} - ${response.statusText}`, errorData);
                 if(reviewListElement) reviewListElement.innerHTML = `<p class="error-message">Không thể tải đánh giá: ${errorData.error || 'Lỗi không xác định'}.</p>`;
                showToast('Không thể tải đánh giá.', 'error');
                return;
            }

            const reviews = await response.json();

            if (!reviewListElement) {
                 console.error('Không tìm thấy review-list trong DOM');
                 showToast('Lỗi hiển thị đánh giá (phần tử DOM bị thiếu).', 'error');
                 return;
            }
            reviewListElement.innerHTML = '';

            if (!Array.isArray(reviews) || reviews.length === 0) {
                reviewListElement.innerHTML = '<p class="no-reviews">Bạn chưa có đánh giá nào.</p>';
                return;
            }
             console.log(`Tìm thấy ${reviews.length} đánh giá.`);

            // Sử dụng Promise.all để lấy thông tin xe cho từng đánh giá
            const reviewsWithVehicleNames = await Promise.all(reviews.map(async (review) => {
                // Cập nhật kiểm tra: review.product không còn được dùng, thay bằng review.vehicle_id
                if (!review.id || review.rating === undefined || review.comment === undefined || review.vehicle_id === undefined) {
                    console.warn('Bỏ qua hiển thị dữ liệu đánh giá không đầy đủ:', review);
                    return null; // Bỏ qua đánh giá không hợp lệ
                }

                let vehicleName = 'Xe không xác định';
                if (review.vehicle_id) {
                    try {
                        // Gọi API để lấy thông tin xe dựa trên vehicle_id
                        const vehicleResponse = await fetch(`http://localhost:5000/api/vehicles/${review.vehicle_id}`);
                        if (vehicleResponse.ok) {
                            const vehicleData = await vehicleResponse.json();
                            vehicleName = vehicleData.name || `ID: ${review.vehicle_id}`; // Lấy tên xe, nếu không có thì hiển thị ID
                        } else {
                            console.warn(`Không thể lấy thông tin xe cho ID: ${review.vehicle_id}. Status: ${vehicleResponse.status}`);
                        }
                    } catch (vehErr) {
                        console.error(`Lỗi khi fetch thông tin xe ID ${review.vehicle_id}:`, vehErr);
                    }
                }

                return { ...review, vehicleName }; // Thêm tên xe vào đối tượng review
            }));

            // Lọc bỏ các đánh giá bị bỏ qua (null)
            const validReviews = reviewsWithVehicleNames.filter(review => review !== null);

            validReviews.forEach(review => {
                 const validatedRating = (typeof review.rating === 'number' && review.rating >= 1 && review.rating <= 5) ? review.rating : 0;

                const reviewItem = document.createElement('div');
                reviewItem.className = 'review-item';
                reviewItem.innerHTML = `
                    <h4>${review.vehicleName}</h4> <div class="star-rating">${'★'.repeat(validatedRating)}${'☆'.repeat(5 - validatedRating)}</div>
                    <p>${review.comment || 'Chưa có nhận xét'}</p>
                    <button class="delete-review" data-review-id="${review.id}"><i class="fas fa-trash"></i> Xóa</button>
                `;
                reviewListElement.appendChild(reviewItem);
            });

            reviewListElement.addEventListener('click', async (event) => {
                 const targetButton = event.target.closest('.delete-review');
                 if (!targetButton) return;

                const id = targetButton.dataset.reviewId;
                 if (!id) {
                     console.error('Không tìm thấy reviewId trong dataset nút xóa.');
                     showToast('Lỗi xóa đánh giá.', 'error');
                     return;
                 }

                if (confirm('Bạn có chắc chắn muốn xóa đánh giá này?')) {
                    showLoading();
                    try {
                        const response = await fetch(`http://localhost:5000/api/reviews/${id}`, {
                            method: 'DELETE'
                        });
                         const result = await response.json().catch(() => ({}));

                        if (response.ok) {
                            showToast('Xóa đánh giá thành công!');
                            loadReviews();
                        } else {
                             console.error(`Lỗi xóa đánh giá ${id}: ${response.status} - ${response.statusText}`, result);
                             showToast(`Xóa đánh giá thất bại: ${result.error || 'Không rõ'}`, 'error');
                        }
                    } catch (error) {
                        console.error(`Lỗi mạng hoặc không xác định khi xóa đánh giá ${id}:`, error);
                        showToast('Có lỗi xảy ra. Vui lòng thử lại.', 'error');
                    }
                    hideLoading();
                }
             });

        } catch (error) {
            console.error('Lỗi khi tải đánh giá:', error);
             if(reviewListElement) reviewListElement.innerHTML = '<p class="error-message">Không thể tải đánh giá.</p>';
            showToast('Không thể tải đánh giá. Vui lòng thử lại.', 'error');
        }
    };

    // Add review
    if (addReviewForm) {
         addReviewForm.addEventListener('submit', async (e) => {
             e.preventDefault();
             showLoading();
             console.log('Form thêm đánh giá được gửi...');

             // Lấy giá trị từ dropdown mới
             const vehicleIdInput = document.getElementById('review-vehicle-select');
             const commentInput = document.getElementById('review-comment');
             const ratingInput = document.querySelector('input[name="rating"]:checked');

             const vehicleId = parseInt(vehicleIdInput?.value.trim()); // Chuyển đổi sang số nguyên
             const rating = ratingInput?.value;
             const comment = commentInput?.value.trim();

           // Cập nhật kiểm tra hợp lệ
           if (isNaN(vehicleId) || vehicleId <= 0 || !rating || !comment) { // Kiểm tra vehicleId là số dương hợp lệ
              const msg = 'Vui lòng điền đầy đủ thông tin đánh giá (ID xe hợp lệ, xếp hạng, nhận xét).';
              showToast(msg, 'error');
              hideLoading();
              return;
            }

             try {
                 const user = JSON.parse(localStorage.getItem('user') || '{}');
                 if (!user.id) {
                     showToast('Lỗi: Vui lòng đăng nhập để gửi đánh giá.', 'error');
                     hideLoading();
                     return;
                 }

                 const response = await fetch(`http://localhost:5000/api/reviews/${user.id}`, {
                     method: 'POST',
                     headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ vehicleId, rating: parseInt(rating), comment }) // Gửi vehicleId thay vì product
                 });

                 const result = await response.json().catch(() => ({}));

                 if (response.ok) {
                     showToast('Gửi đánh giá thành công!');
                     addReviewForm.reset();
                     document.querySelectorAll('input[name="rating"]:checked').forEach(radio => radio.checked = false);

                     loadReviews(); // Tải lại danh sách đánh giá sau khi gửi thành công
                 } else {
                     console.error('Lỗi gửi đánh giá từ server:', response.status, result.error);
                      const msg = `Gửi đánh giá thất bại: ${result.error || 'Lỗi không xác định'}.`;
                     showToast(msg, 'error');

                 }
             } catch (error) {
                 console.error('Lỗi mạng hoặc không xác định khi gửi đánh giá:', error);
                  const msg = 'Có lỗi xảy ra khi gửi đánh giá. Vui lòng thử lại.';
                 showToast(msg, 'error');
             }
             hideLoading();
         });
     }


     const loadCoupons = async () => {
         console.log('Tải mã giảm giá của người dùng...');
         const couponList = document.getElementById('coupon-list');
         if (!couponList) {
             console.error('Không tìm thấy #coupon-list element.');
             return;
         }

         const user = JSON.parse(localStorage.getItem('user') || '{}');
          if (!user.id) {
             couponList.innerHTML = '<p>Vui lòng đăng nhập để xem mã giảm giá.</p>';
             return;
         }
         couponList.innerHTML = '<p style="text-align: center; color: var(--dark-gray);"><i class="fas fa-spinner fa-spin"></i> Đang tải mã giảm giá...</p>';


         const validCouponsMeta = [
             { code: 'THUEXE20', description: 'Giảm 20% cho đơn hàng trên 5 ngày' },
             { code: 'GIAM10', description: 'Giảm 100.000 VNĐ cho đơn hàng đầu tiên' },
             { code: 'FREESHIP', description: 'Miễn phí giao nhận xe' }

         ];

         try {

              const response = await fetch(`http://localhost:5000/api/users/${user.id}`);

               if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
                 console.error(`Lỗi API khi fetch user để lấy coupon: ${response.status}`, errorData);
                 couponList.innerHTML = `<p class="error-message">Không thể tải mã giảm giá: ${errorData.error || 'Lỗi không xác định'}.</p>`;
                 showToast('Không thể tải mã giảm giá.', 'error');
                 return;
             }


              const userData = await response.json();
              const userCoupons = Array.isArray(userData.coupons) ? userData.coupons : [];
              localStorage.setItem('user', JSON.stringify(userData)); // Update localStorage with fresh user data, including coupons


              if (userCoupons.length === 0) {
                  couponList.innerHTML = '<p>Chưa có mã giảm giá nào được áp dụng.</p>';
                  return;
              }

              // Hiển thị danh sách mã giảm giá
              couponList.innerHTML = userCoupons.map(code => {
                  const couponDetails = validCouponsMeta.find(c => c.code === code);
                  const description = couponDetails ? couponDetails.description : 'Mã giảm giá chung';
                  return `<div class="coupon-item">Mã: <strong>${code}</strong><br>Chi tiết: ${description}</div>`;
              }).join('');


         } catch (error) {
             console.error('Lỗi khi tải mã giảm giá của người dùng:', error);
             couponList.innerHTML = '<p class="error-message">Không thể tải mã giảm giá.</p>';
             showToast('Không thể tải mã giảm giá. Vui lòng thử lại.', 'error');
         }
     };

    if (couponForm) {
        couponForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            showLoading();
            console.log('Form mã giảm giá được gửi...');
            const couponCodeInput = document.getElementById('coupon-code');
            const couponCode = couponCodeInput?.value.trim().toUpperCase();

            if (!couponCode || !couponCodeInput) {
                console.error('Không tìm thấy coupon-code input.');
                showToast('Vui lòng nhập mã giảm giá.', 'error');
                hideLoading();
                return;
            }

            const validCoupons = [
                { code: 'THUEXE20', discount: '20%', type: 'percentage', value: 20 },
                { code: 'GIAM10', discount: '100.000 VNĐ', type: 'fixed', value: 100000 },
                { code: 'FREESHIP', discount: 'Miễn phí vận chuyển', type: 'shipping', value: 0 }
            ];

            const coupon = validCoupons.find(c => c.code === couponCode);

            if (coupon) {
                try {
                    const user = JSON.parse(localStorage.getItem('user') || '{}');
                    if (!user.id) {
                        showToast('Lỗi: Vui lòng đăng nhập để sử dụng mã giảm giá.', 'error');
                        hideLoading();
                        return;
                    }

                    const userResponse = await fetch(`http://localhost:5000/api/users/${user.id}`);
                     if (!userResponse.ok) {
                          const errorData = await userResponse.json().catch(() => ({ error: 'Unknown error' }));
                          console.error(`Lỗi API khi fetch user để kiểm tra coupon: ${userResponse.status}`, errorData);
                          // Không throw error, chỉ hiển thị toast và thoát
                          showToast(`Không thể kiểm tra mã giảm giá hiện tại: ${errorData.error || 'Lỗi không rõ'}`, 'error');
                          hideLoading();
                          return;
                     }
                    const userData = await userResponse.json();
                    const coupons = Array.isArray(userData.coupons) ? userData.coupons : [];


                    if (!coupons.includes(couponCode)) {
                        const updatedCoupons = [...coupons, couponCode];
                        const response = await fetch(`http://localhost:5000/api/users/${user.id}`, {
                            method: 'PUT',
                            headers: { 'Content-Type': 'application/json' },
                             body: JSON.stringify({ coupons: updatedCoupons })
                        });

                         const result = await response.json().catch(() => ({}));

                        if (response.ok) {
                             const updatedUserResponse = await fetch(`http://localhost:5000/api/users/${user.id}`);
                             if(updatedUserResponse.ok) {
                                 const updatedUserData = await updatedUserResponse.json();
                                 localStorage.setItem('user', JSON.stringify(updatedUserData));
                             } else {
                                 console.warn('Không thể fetch user data sau khi cập nhật coupon để cập nhật localStorage.');
                                 localStorage.setItem('user', JSON.stringify({ ...userData, coupons: updatedCoupons }));
                             }

                            showToast(`Áp dụng mã ${couponCode} thành công! Giảm ${coupon.discount}.`);
                            couponCodeInput.value = '';
                            loadCoupons();
                        } else {
                             console.error('Lỗi cập nhật coupon cho user:', response.status, result.error);
                             showToast(`Thêm mã giảm giá thất bại: ${result.error || 'Không rõ'}. Vui lòng kiểm tra logic cập nhật coupon ở server.`, 'error');
                        }
                    } else {
                        showToast('Mã giảm giá này đã được sử dụng.', 'warning');
                    }
                } catch (error) {
                    console.error('Lỗi khi áp dụng mã giảm giá:', error);
                    showToast('Có lỗi xảy ra khi áp dụng mã giảm giá. Vui lòng thử lại.', 'error');
                }
            } else {
                showToast('Mã giảm giá không hợp lệ.', 'error');
            }

            hideLoading();
        });
    }


    const loadMembershipLevels = async () => {
        console.log('Tải cấp độ thành viên...');
        try {
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            if (!user.id) {
                 console.warn('Không tìm thấy user.id. Không thể tải cấp độ thành viên.');
                 return;
            }
            const response = await fetch(`http://localhost:5000/api/orders?userId=${user.id}`);
             if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
                 console.error(`Lỗi API khi lấy đơn hàng cho cấp độ thành viên: ${response.status} - ${response.statusText}`, errorData);
                 showToast('Không thể tải thông tin cấp độ thành viên.', 'error');
                 return;
             }
            const orders = await response.json();

            const totalSpent = orders.reduce((sum, order) => {
                // Only count 'Completed' or 'Hoàn thành' orders towards total spent
                if (order.status === 'Completed' || order.status === 'Hoàn thành' && order.total !== undefined && typeof order.total === 'number') {
                    return sum + order.total;
                }
                return sum;
            }, 0);


            const levelName = document.getElementById('level-name');
            const totalSpentElement = document.getElementById('total-spent');
            const progress = document.getElementById('progress');
            const nextLevel = document.getElementById('next-level');
            const progressBarContainer = document.querySelector('.progress-bar');


            if (!levelName || !totalSpentElement || !progress || !nextLevel || !progressBarContainer) {
                console.error('Không tìm thấy các phần tử cấp độ thành viên trong DOM.');
                return;
            }

            let level, nextLevelThreshold, progressAmount, currentThreshold, nextLevelMessage, progressPercent;

            const silverThreshold = 0;
            const goldThreshold = 10000000; // 10 million VND
            const platinumThreshold = 30000000; // 30 million VND

            if (totalSpent < goldThreshold) {
                level = 'Bạc (Silver)';
                currentThreshold = silverThreshold;
                nextLevelThreshold = goldThreshold;
                progressAmount = totalSpent - currentThreshold;
                nextLevelMessage = `Cần chi tiêu thêm ${(goldThreshold - totalSpent).toLocaleString('vi-VN')} VNĐ để đạt cấp Vàng`;
                 progressPercent = (progressAmount / (goldThreshold - silverThreshold)) * 100;

            } else if (totalSpent < platinumThreshold) {
                level = 'Vàng (Gold)';
                currentThreshold = goldThreshold;
                nextLevelThreshold = platinumThreshold;
                 progressAmount = totalSpent - currentThreshold;
                nextLevelMessage = `Cần chi tiêu thêm ${(platinumThreshold - totalSpent).toLocaleString('vi-VN')} VNĐ để đạt cấp Bạch Kim`;
                progressPercent = (progressAmount / (platinumThreshold - goldThreshold)) * 100;

            } else {
                level = 'Bạch Kim (Platinum)';
                currentThreshold = platinumThreshold;
                nextLevelThreshold = platinumThreshold;
                progressAmount = totalSpent - currentThreshold;
                progressPercent = 100;
                nextLevelMessage = 'Bạn đã đạt cấp độ cao nhất!';
            }

            levelName.textContent = level;
            totalSpentElement.textContent = totalSpent.toLocaleString('vi-VN');
            progress.style.width = `${Math.max(0, Math.min(100, progressPercent))}%`;
            nextLevel.textContent = nextLevelMessage;

            console.log(`Cấp độ thành viên: ${level}, Tổng chi tiêu (Hoàn thành): ${totalSpent.toLocaleString()} VNĐ`);

        } catch (error) {
            console.error('Lỗi khi tải cấp độ thành viên:', error);
            showToast('Không thể tải thông tin cấp độ thành viên. Vui lòng thử lại.', 'error');
        } finally {
            console.log('--- Finished loading membership levels ---');
        }
    };


    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            showLoading();
            console.log('Form đăng nhập được gửi...');
            const email = document.getElementById('login-email')?.value.trim();
            const password = document.getElementById('login-password')?.value.trim();

            hideError(loginError);

            if (!email || !password) {
                showError(loginError, 'Vui lòng điền đầy đủ email và mật khẩu.');
                hideLoading();
                return;
            }

            try {
                const response = await fetch('http://localhost:5000/api/users/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password })
                });

                const result = await response.json().catch(() => ({}));

                if (response.ok) {
                    if (result && result.id && result.email) {
                         localStorage.setItem('user', JSON.stringify(result));
                         showToast('Đăng nhập thành công!');
                         checkLoginStatus();
                    } else {
                        console.error('Phản hồi đăng nhập thành công nhưng thiếu dữ liệu user:', result);
                         showError(loginError, 'Đăng nhập thành công nhưng có lỗi dữ liệu. Vui lòng thử lại.');
                    }

                } else {
                    console.error('Lỗi đăng nhập từ server:', response.status, result.error);
                    showError(loginError, `Đăng nhập thất bại: ${result.error || 'Email hoặc mật khẩu không đúng'}.`);
                }
            } catch (error) {
                console.error('Lỗi mạng hoặc không xác định khi đăng nhập:', error);
                showError(loginError, 'Có lỗi xảy ra. Vui lòng thử lại.');
            }
            hideLoading();
        });
    }

    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            showLoading();
            console.log('Form đăng ký được gửi...');
            const name = document.getElementById('register-name')?.value.trim();
            const email = document.getElementById('register-email')?.value.trim();
            const phone = document.getElementById('register-phone')?.value.trim();
            const password = document.getElementById('register-password')?.value.trim();

            hideError(registerError);


            if (!name || !email || !phone || !password) {
                showError(registerError, 'Vui lòng điền đầy đủ thông tin.');
                hideLoading();
                return;
            }

            if (!isValidEmail(email)) {
                showError(registerError, 'Email không hợp lệ.');
                hideLoading();
                return;
            }

             const cleanedPhone = phone.replace(/[\s-]/g, '');
            if (!isValidPhone(cleanedPhone)) {
                showError(registerError, 'Số điện thoại không hợp lệ (10-15 số).');
                hideLoading();
                return;
            }


            if (!isValidPassword(password)) {
                showError(registerError, 'Mật khẩu phải có ít nhất 8 ký tự, bao gồm chữ hoa, chữ thường, số và ký tự đặc biệt.');
                hideLoading();
                return;
            }

            try {
                const response = await fetch('http://localhost:5000/api/users/register', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name, email, phone: cleanedPhone, password, address: '', notifications: true })
                });

                 const result = await response.json().catch(() => ({}));

                if (response.ok) {
                    if (result && result.id && result.email) {
                         localStorage.setItem('user', JSON.stringify(result));
                         showToast('Đăng ký thành công! Bạn đã được đăng nhập.');
                         checkLoginStatus();
                    } else {
                         console.error('Phản hồi đăng ký thành công nhưng thiếu dữ liệu user:', result);
                          showError(registerError, 'Đăng ký thành công nhưng có lỗi dữ liệu. Vui lòng thử lại.');
                    }

                } else {
                     console.error('Lỗi đăng ký từ server:', response.status, result.error);
                     if (response.status === 409 || (result.error && result.error.includes('Email đã được đăng ký'))) {
                         showError(registerError, 'Email này đã được sử dụng. Vui lòng đăng nhập hoặc sử dụng email khác.');
                     } else {
                        showError(registerError, `Đăng ký thất bại: ${result.error || 'Lỗi khác'}.`);
                     }

                }
            } catch (error) {
                console.error('Lỗi mạng hoặc không xác định khi đăng ký:', error);
                showError(registerError, 'Có lỗi xảy ra. Vui lòng thử lại.');
            }
            hideLoading();
        });
    }

    if (forgotPasswordForm && forgotPasswordLink) {
        forgotPasswordLink.addEventListener('click', (e) => {
            e.preventDefault();
            if (loginForm) loginForm.style.display = 'none';
            if (registerForm) registerForm.style.display = 'none';
            if (forgotPasswordForm) forgotPasswordForm.style.display = 'block';
            if (resetPasswordForm) resetPasswordForm.style.display = 'none';
            hideError(loginError);
            hideError(forgotError);
            hideError(registerError);
             hideError(resetError);

             if(forgotPasswordForm) forgotPasswordForm.reset();
             currentEmail = null;
        });

        forgotPasswordForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            showLoading();
            const email = document.getElementById('forgot-email')?.value.trim();
            hideError(forgotError);

            if (!isValidEmail(email)) {
                showError(forgotError, 'Email không hợp lệ.');
                hideLoading();
                return;
            }

            try {
                const response = await fetch('http://localhost:5000/api/users/forgot-password', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email })
                });

                 const result = await response.json().catch(() => ({}));

                if (response.ok) {
                    currentEmail = email;
                    if (otpModal) otpModal.style.display = 'flex';
                    startOtpTimer();
                    showToast('Mã OTP đã được gửi đến email của bạn. Vui lòng kiểm tra email.');
                     if (forgotPasswordForm) forgotPasswordForm.reset();
                } else {
                     console.error('Lỗi yêu cầu OTP từ server:', response.status, result.error);
                    showError(forgotError, `Yêu cầu OTP thất bại: ${result.error || 'Email không tồn tại hoặc lỗi khác'}.`);
                }
            } catch (error) {
                console.error('Lỗi mạng hoặc không xác định khi gửi OTP:', error);
                showError(forgotError, 'Có lỗi xảy ra khi gửi OTP. Vui lòng thử lại.');
            }
            hideLoading();
        });
    }

    if (confirmOtp) {
        confirmOtp.addEventListener('click', async () => {
            const otp = otpInput?.value.trim();
             hideError(otpError);


            if (!otp || otp.length !== 6 || isNaN(parseInt(otp))) {
                showError(otpError, 'Mã OTP phải là 6 chữ số.');
                return;
            }

            if (!currentEmail) {
                 showError(otpError, 'Lỗi: Không tìm thấy email để xác nhận OTP.');
                 console.error('currentEmail is null when attempting to verify OTP.');
                 return;
            }


            showLoading();
            try {
                const response = await fetch('http://localhost:5000/api/users/verify-otp', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email: currentEmail, otp })
                });

                 const result = await response.json().catch(() => ({}));

                if (response.ok) {
                    clearInterval(otpTimeout);
                    otpTimeout = null;
                    if (otpModal) otpModal.style.display = 'none';
                    if (forgotPasswordForm) forgotPasswordForm.style.display = 'none';
                    if (resetPasswordForm) resetPasswordForm.style.display = 'block';
                     if(resetPasswordForm) resetPasswordForm.reset();
                     if (otpInput) otpInput.value = '';
                    showToast('Xác nhận OTP thành công! Vui lòng đặt lại mật khẩu.');
                } else {
                    console.error('Lỗi xác nhận OTP từ server:', response.status, result.error);
                    showError(otpError, `Xác nhận OTP thất bại: ${result.error || 'Mã OTP không đúng hoặc đã hết hạn'}.`);
                }
            } catch (error) {
                console.error('Lỗi mạng hoặc không xác định khi xác nhận OTP:', error);
                showError(otpError, 'Có lỗi xảy ra khi xác nhận OTP. Vui lòng thử lại.');
            }
            hideLoading();
        });
    }

    if (cancelOtp) {
        cancelOtp.addEventListener('click', () => {
            clearInterval(otpTimeout);
             otpTimeout = null;
            if (otpModal) otpModal.style.display = 'none';
            if (otpInput) otpInput.value = '';
             hideError(otpError);
             if(forgotPasswordForm) forgotPasswordForm.style.display = 'block';
             if(resetPasswordForm) resetPasswordForm.style.display = 'none';
             if(loginForm) loginForm.style.display = 'none';
        });
    }


    if (resetPasswordForm) {
        resetPasswordForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            showLoading();
            const password = document.getElementById('reset-password')?.value.trim();
            const confirmPassword = document.getElementById('reset-confirm-password')?.value.trim();
            hideError(resetError);

            if (!isValidPassword(password)) {
                showError(resetError, 'Mật khẩu mới phải có ít nhất 8 ký tự, bao gồm chữ hoa, chữ thường, số và ký tự đặc biệt.');
                hideLoading();
                return;
            }

            if (password !== confirmPassword) {
                showError(resetError, 'Mật khẩu xác nhận không khớp.');
                hideLoading();
                return;
            }

             if (!currentEmail) {
                  showError(resetError, 'Lỗi: Không tìm thấy email để đặt lại mật khẩu.');
                  hideLoading();
                  console.error('currentEmail is null when attempting to reset password.');
                  return;
             }

            try {
                const response = await fetch('http://localhost:5000/api/users/reset-password', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email: currentEmail, newPassword: password })
                });

                 const result = await response.json().catch(() => ({}));

                if (response.ok) {
                    showToast('Đặt lại mật khẩu thành công! Vui lòng đăng nhập lại.');
                     currentEmail = null;
                    if (resetPasswordForm) resetPasswordForm.style.display = 'none';
                    if (loginForm) loginForm.style.display = 'block';

                     if(loginForm) loginForm.reset();

                     hideError(loginError);
                } else {
                    console.error('Lỗi đặt lại mật khẩu từ server:', response.status, result.error);
                    showError(resetError, `Đặt lại mật khẩu thất bại: ${result.error || 'Lỗi không xác định'}.`);
                }
            } catch (error) {
                console.error('Lỗi mạng hoặc không xác định khi đặt lại mật khẩu:', error);
                showError(resetError, 'Có lỗi xảy ra khi đặt lại mật khẩu. Vui lòng thử lại.');
            }
            hideLoading();
        });
    }

    if (backToLogin) {
        backToLogin.addEventListener('click', () => {
            if (forgotPasswordForm) forgotPasswordForm.style.display = 'none';
            if (loginForm) loginForm.style.display = 'block';
            if (forgotPasswordForm) forgotPasswordForm.reset();
            if (resetPasswordForm) resetPasswordForm.reset();
            hideError(forgotError);
             hideError(resetError);
             hideError(loginError);
             currentEmail = null;

        });
    }

    if (backToLoginFromReset) {
        backToLoginFromReset.addEventListener('click', () => {
            if (resetPasswordForm) resetPasswordForm.style.display = 'none';
            if (loginForm) loginForm.style.display = 'block';
             if (resetPasswordForm) resetPasswordForm.reset();
             hideError(resetError);
             hideError(loginError);
             currentEmail = null;

        });
    }

    if (deleteAccountBtn) {
        deleteAccountBtn.addEventListener('click', async () => {
            if (confirm('Bạn có chắc chắn muốn xóa tài khoản này vĩnh viễn không? Hành động này không thể hoàn tác.')) {
                showLoading();
                try {
                    const user = JSON.parse(localStorage.getItem('user') || '{}');
                    if (!user.id) {
                         showToast('Lỗi: Không tìm thấy thông tin người dùng để xóa tài khoản.', 'error');
                         hideLoading();
                         return;
                    }
                    const response = await fetch(`http://localhost:5000/api/users/${user.id}`, {
                        method: 'DELETE'
                    });

                     const result = await response.json().catch(() => ({}));

                    if (response.ok) {
                        localStorage.removeItem('user');
                        showToast('Xóa tài khoản thành công!');
                        checkLoginStatus();
                    } else {
                        console.error('Lỗi xóa tài khoản từ server:', response.status, result.error);
                        showToast(`Xóa tài khoản thất bại: ${result.error || 'Lỗi không xác định'}.`, 'error');
                    }
                } catch (error) {
                    console.error('Lỗi mạng hoặc không xác định khi xóa tài khoản:', error);
                    showToast('Có lỗi xảy ra. Vui lòng thử lại.', 'error');
                }
                hideLoading();
            }
        });
    }

    if (googleBtn) {
        googleBtn.addEventListener('click', () => {
            if (!window.google?.accounts?.id) {
                console.error('Google API không được tải hoặc chưa khởi tạo.');
                showToast('Không thể đăng nhập bằng Google. Vui lòng thử lại sau.', 'error');
                return;
            }
            // YOUR_GOOGLE_CLIENT_ID needs to be replaced with a real Google Client ID
            window.google.accounts.id.initialize({
                client_id: 'YOUR_GOOGLE_CLIENT_ID',
                callback: handleGoogleLogin
            });
            window.google.accounts.id.prompt();
        });
    }

    const handleGoogleLogin = async (response) => {
        showLoading();
        console.log('Phản hồi từ Google:', response);
        if (!response.credential) {
             console.error('Không nhận được credential từ Google.');
             showToast('Đăng nhập bằng Google thất bại. Không nhận được thông tin đăng nhập.', 'error');
             hideLoading();
             return;
        }

        try {
            const res = await fetch('http://localhost:5000/api/users/google-login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token: response.credential })
            });

            const user = await res.json().catch(() => ({}));

            if (res.ok) {
                if (user && user.id && user.email) {
                     localStorage.setItem('user', JSON.stringify(user));
                     showToast('Đăng nhập bằng Google thành công!');
                     checkLoginStatus();
                } else {
                     console.error('Phản hồi đăng nhập Google thành công nhưng thiếu dữ liệu user:', user);
                      showToast('Đăng nhập bằng Google thành công nhưng có lỗi dữ liệu. Vui lòng thử lại.', 'error');
                }

            } else {
                 console.error('Lỗi đăng nhập Google từ server:', res.status, user.error);
                 showToast(`Đăng nhập bằng Google thất bại: ${user.error || 'Lỗi không xác định'}.`, 'error');
            }
        } catch (error) {
            console.error('Lỗi mạng hoặc không xác định khi đăng nhập bằng Google:', error);
            showToast('Có lỗi xảy ra khi đăng nhập bằng Google. Vui lòng thử lại.', 'error');
        }
        hideLoading();
    };

    if (facebookBtn) {
        facebookBtn.addEventListener('click', () => {
            if (!window.FB) {
                console.error('Facebook SDK không được tải.');
                showToast('Không thể đăng nhập bằng Facebook. Vui lòng thử lại sau.', 'error');
                return;
            }
            if (!facebookInitialized) {
                FB.init({
                    appId: 'YOUR_FACEBOOK_APP_ID',
                    version: 'v22.0',
                    xfbml: false
                });
                facebookInitialized = true;
            }

            FB.login(response => {
                console.log('Phản hồi từ Facebook Login:', response);
                if (response.authResponse) {
                    handleFacebookLogin(response.authResponse.accessToken);
                } else {
                     console.warn('Đăng nhập Facebook bị hủy hoặc thất bại.');
                    showToast('Đăng nhập bằng Facebook bị hủy hoặc thất bại.', 'warning');
                }
            }, { scope: 'public_profile,email' });
        });
    }

    const handleFacebookLogin = async (accessToken) => {
        showLoading();
        console.log('Access Token Facebook:', accessToken);
        try {

            const response = await fetch('http://localhost:5000/api/users/facebook-login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ accessToken: accessToken })
            });

            const user = await response.json().catch(() => ({}));

            if (response.ok) {
                 if (user && user.id && user.email) {
                     localStorage.setItem('user', JSON.stringify(user));
                     showToast('Đăng nhập bằng Facebook thành công!');
                     checkLoginStatus();
                 } else {
                      console.error('Phản hồi đăng nhập Facebook thành công nhưng thiếu dữ liệu user:', user);
                       showToast('Đăng nhập bằng Facebook thành công nhưng có lỗi dữ liệu. Vui lòng thử lại.', 'error');
                 }

            } else {
                 console.error('Lỗi đăng nhập Facebook từ server:', response.status, user.error);
                 showToast(`Đăng nhập bằng Facebook thất bại: ${user.error || 'Lỗi không xác định'}.`, 'error');
            }
        } catch (error) {
            console.error('Lỗi mạng hoặc không xác định khi đăng nhập bằng Facebook:', error);
            showToast('Có lỗi xảy ra khi đăng nhập bằng Facebook. Vui lòng thử lại.', 'error');
        }
        hideLoading();
    };


    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const tabId = button.dataset.tab;

            if (!tabId || tabId.trim() === '') {
                console.error('Nút tab thiếu thuộc tính data-tab hoặc giá trị không hợp lệ:', {
                    button: button.outerHTML,
                    id: button.id,
                    text: button.textContent.trim()
                });
                showToast('Lỗi điều hướng tab. Vui lòng kiểm tra cấu hình HTML.', 'error');
                return;
            }

            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabContents.forEach(content => content.style.display = 'none');

            button.classList.add('active');

            const tabContent = document.getElementById(tabId);
            if (tabContent) {
                tabContent.style.display = 'block';

                switch (tabId) {
                    case 'profile':
                        loadProfile(); // Đã sửa để không truyền userId
                         loadCoupons();
                        break;
                    case 'orders':
                        loadOrders();
                        break;
                    case 'addresses':
                        loadAddresses();
                        break;
                    case 'reviews':
                        loadReviews();
                        populateVehicleDropdown(); // Gọi hàm này khi chuyển sang tab reviews
                        break;
                    case 'membership-benefits':
                        // No specific loading logic for static content
                        break;
                     case 'membership-levels':
                         loadMembershipLevels();
                         break;
                    case 'faq':
                        // Initialize accordion for FAQ
                        initializeFaqAccordion();
                        break;
                    case 'logout':
                        // Handled separately below
                         break;
                }

            } else {
                console.error(`Không tìm thấy tab content với ID: ${tabId}`, {
                    button: button.outerHTML
                });
                showToast(`Không tìm thấy nội dung cho tab "${tabId}".`, 'error');
            }

            if (tabId === 'logout') {

                if (confirm('Bạn có chắc chắn muốn đăng xuất không?')) {
                     localStorage.removeItem('user');
                     showToast('Đăng xuất thành công!');
                     checkLoginStatus();
                } else {
                     const profileTabBtn = document.querySelector('.account-tabs .tab-btn[data-tab="profile"]');
                      if(profileTabBtn) profileTabBtn.click();
                      else {
                          // Fallback if profile tab not found
                      }
                }
            }
        });
    });

    const initializeFaqAccordion = () => {
        const faqQuestions = document.querySelectorAll('.faq-question');
        faqQuestions.forEach(question => {
            const oldListener = question._faqListener;
            if (oldListener) {
                question.removeEventListener('click', oldListener);
            }

            const newListener = () => {
                const answer = question.nextElementSibling;
                const icon = question.querySelector('i');
                if (!answer || !icon) {
                    console.error('Không tìm thấy FAQ answer hoặc icon cho câu hỏi:', question);
                    return;
                }

                 const faqList = question.closest('.faq-list');
                 if (faqList) {
                      faqList.querySelectorAll('.faq-answer').forEach(ans => {
                          if(ans !== answer && ans.style.display === 'block') {
                              ans.style.display = 'none';
                              const correspondingIcon = ans.previousElementSibling?.querySelector('i');
                              if(correspondingIcon) correspondingIcon.classList.replace('fa-chevron-up', 'fa-chevron-down');
                          }
                      });
                 }


                if (answer.style.display === 'block') {
                    answer.style.display = 'none';
                    icon.classList.replace('fa-chevron-up', 'fa-chevron-down');
                } else {
                    answer.style.display = 'block';
                    icon.classList.replace('fa-chevron-down', 'fa-chevron-up');
                }
            };

            question.addEventListener('click', newListener);
            question._faqListener = newListener;


        });
    };

    if (loginBtn && registerBtn) {
        loginBtn.addEventListener('click', () => {
            if (loginForm) loginForm.style.display = 'block';
            if (registerForm) registerForm.style.display = 'none';
            if (forgotPasswordForm) forgotPasswordForm.style.display = 'none';
            if (resetPasswordForm) resetPasswordForm.style.display = 'none';
            loginBtn.classList.add('active');
            registerBtn.classList.remove('active');
            hideError(loginError);
            hideError(registerError);
             hideError(forgotError);
             hideError(resetError);
             if (loginForm) loginForm.reset();
             if (registerForm) registerForm.reset();
             if (forgotPasswordForm) forgotPasswordForm.reset();
             if (resetPasswordForm) resetPasswordForm.reset();

        });

        registerBtn.addEventListener('click', () => {
            if (loginForm) loginForm.style.display = 'none';
            if (registerForm) registerForm.style.display = 'block';
            if (forgotPasswordForm) forgotPasswordForm.style.display = 'none';
            if (resetPasswordForm) resetPasswordForm.style.display = 'none';
            registerBtn.classList.add('active');
            loginBtn.classList.remove('active');
            hideError(loginError);
            hideError(registerError);
            hideError(forgotError);
            hideError(resetError);
             if (loginForm) loginForm.reset();
             if (registerForm) registerForm.reset();
             if (forgotPasswordForm) forgotPasswordForm.reset();
             if (resetPasswordForm) resetPasswordForm.reset();

        });
    }

    const initializeAccountPage = () => {
         console.log('account.js initialized.');
        checkLoginStatus();
    };
    initializeAccountPage();


});