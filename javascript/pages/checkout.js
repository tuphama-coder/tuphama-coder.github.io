// common/utils.js cần có showLoading và hideLoading
import { formatPrice, isLoggedIn, redirectToPage, showToast, showError, hideError, getUrlParameter, validateForm, showLoading, hideLoading } from '../common/utils.js';

// Export default function để có thể import trong HTML
export default async function initializeCheckoutPage() {
    console.log('Checkout page initialized.');

    // Element selectors
    const bookingForm = document.getElementById('payment-form');
    const bookingSummaryElement = document.getElementById('order-summary');
    const discountCodeInput = document.getElementById('discount-code');
    const applyDiscountBtn = document.getElementById('apply-discount');

    const customerNameInput = document.getElementById('customer-name');
    const customerPhoneInput = document.getElementById('customer-phone');
    const customerProvinceInput = document.getElementById('customer-province');
    const customerAddressInput = document.getElementById('customer-address');
    const customerEmailInput = document.getElementById('customer-email');
    const customerNoteInput = document.getElementById('customer-note');

    const pickupLocationInput = document.getElementById('pickup-location');
    const returnLocationInput = document.getElementById('return-location');

    const confirmModal = document.getElementById('confirm-modal');
    const confirmSummary = document.getElementById('confirm-summary');
    const cancelConfirm = document.getElementById('cancel-confirm');
    const confirmBookingBtn = document.getElementById('confirm-order');

    const otpModal = document.getElementById('otp-modal');
    const otpInput = document.getElementById('otp-input');
    const cancelOtp = document.getElementById('cancel-otp');
    const confirmOtp = document.getElementById('confirm-otp');
    const otpTimer = document.getElementById('otp-timer');

    const successModal = document.getElementById('success-modal');
    const shopContinueBtn = document.getElementById('shop-continue');
    const viewBookingsBtn = document.getElementById('view-orders');
    const paymentMethodDetailsElement = document.getElementById('payment-method-details');

    const startDateInput = document.getElementById('start-date');
    const endDateInput = document.getElementById('end-date');

    // State variables
    let selectedVehicle = null;
    let appliedDiscount = 0;
    let discountCode = null;
    let calculatedTotalPrice = 0;
    let otpInterval = null;

    // Danh sách mã giảm giá (frontend-only, backend sẽ kiểm tra lại)
    const discountCodesFrontend = {
        'THUEXE20': { type: 'percentage', value: 20 },
        'GIAM10': { type: 'fixed', value: 100000 },
        'FREESHIP': { type: 'shipping', value: 0 }
    };

    // --- Helper Functions (defined before they are called) ---

    // Hàm này gọi API để lấy chi tiết xe
    async function fetchVehicleDetails(vehicleId) {
        if (bookingSummaryElement) {
             bookingSummaryElement.innerHTML = '<p class="loading-message" style="text-align: center; color: var(--dark-gray);"><i class="fas fa-spinner fa-spin"></i> Đang tải thông tin xe...</p>';
        }
        showLoading();

        try {
            const response = await fetch(`http://localhost:5000/api/vehicles/${vehicleId}`);
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
                throw new Error(`Lỗi API ${response.status}: ${errorData.error || response.statusText}`);
            }
            selectedVehicle = await response.json();
            console.log('Fetched vehicle details:', selectedVehicle);

            // KHÔNG CẦN GỌI displayBookingSummary() Ở ĐÂY.
            // setupDateListeners() sẽ gọi handleDateChange() -> validateAndCalculateBookingDates() -> displayBookingSummary() với đầy đủ dữ liệu.

        } catch (error) {
            console.error(`Lỗi khi tải chi tiết xe với ID ${vehicleId}:`, error);
            showToast(`Không thể tải thông tin xe: ${error.message || 'Lỗi không xác định'}. Vui lòng thử lại.`, 'error');
            if(bookingSummaryElement) bookingSummaryElement.innerHTML = '<p class="empty-cart">Không tìm thấy thông tin xe. Vui lòng chọn xe từ danh sách.</p>';
            setTimeout(() => redirectToPage('vehicles.html'), 3000);
        } finally {
            hideLoading();
        }
    }

    // Hàm tính số ngày thuê (client-side)
    function calculateDurationInDaysClient(startDateString, endDateString) {
        if (!startDateString || !endDateString) return 0;
        try {
            const start = new Date(startDateString);
            const end = new Date(endDateString);
            if (isNaN(start.getTime()) || isNaN(end.getTime()) || end <= start) return 0;
            const durationInMs = end.getTime() - start.getTime();
            const durationInHours = durationInMs / (1000 * 60 * 60);
            return Math.ceil(durationInHours / 24);
        } catch (error) {
            console.error('Lỗi tính toán ngày phía client:', error);
            return 0;
        }
    }

    function validateAndCalculateBookingDates(startDateString, endDateString) {
        console.log('Đang xác thực và tính toán ngày...');
        if (!selectedVehicle) {
            console.error('Không có xe được chọn để tính giá.');
            showToast('Lỗi: Không tìm thấy thông tin xe để tính giá.', 'error');
            return;
        }

        try {
            const start = new Date(startDateString);
            const end = new Date(endDateString);
            const now = new Date();

            if (isNaN(start.getTime()) || isNaN(end.getTime())) {
                showToast('Định dạng ngày hoặc giờ không hợp lệ.', 'error');
                calculatedTotalPrice = 0;
                displayBookingSummary(); // Gọi để reset summary
                return;
            }

            // Kiểm tra ngày bắt đầu không được trong quá khứ so với hiện tại
            if (start < now) {
                showToast('Ngày giờ nhận xe không thể ở trong quá khứ.', 'error');
                startDateInput.value = ''; // Xóa giá trị sai
                calculatedTotalPrice = 0;
                displayBookingSummary(); // Gọi để reset summary
                return;
            }

            // Kiểm tra ngày kết thúc phải sau ngày bắt đầu
            if (end <= start) {
                showToast('Ngày giờ trả xe phải sau ngày giờ nhận xe.', 'error');
                endDateInput.value = ''; // Xóa giá trị sai
                calculatedTotalPrice = 0;
                displayBookingSummary(); // Gọi để reset summary
                return;
            }

            const durationInMs = end.getTime() - start.getTime();
            const durationInHours = durationInMs / (1000 * 60 * 60);
            // Làm tròn lên số ngày, ví dụ 24.1 giờ vẫn tính là 2 ngày
            const durationInDays = Math.ceil(durationInHours / 24);
            console.log(`Thời gian thuê (giờ): ${durationInHours}, Thời gian thuê (ngày, làm tròn lên): ${durationInDays}`);

            if (durationInDays <= 0) {
                showToast('Thời gian thuê không hợp lệ (phải ít nhất là 1 ngày).', 'error');
                calculatedTotalPrice = 0;
                displayBookingSummary();
                return;
            }

            let basePrice = durationInDays * selectedVehicle.price_per_day;
            console.log('Giá cơ bản:', basePrice);

            appliedDiscount = 0;
            discountCode = discountCodeInput ? discountCodeInput.value.trim().toUpperCase() : null;

            if (discountCode) {
                const discountInfo = discountCodesFrontend[discountCode];
                if (discountInfo) {
                    if (discountInfo.type === 'percentage') {
                        appliedDiscount = (basePrice * discountInfo.value) / 100;
                    } else if (discountInfo.type === 'fixed') {
                        appliedDiscount = Math.min(discountInfo.value, basePrice);
                    }
                } else {
                    discountCode = null; // Reset nếu mã không hợp lệ
                    if (discountCodeInput) discountCodeInput.value = '';
                    showToast('Mã giảm giá không hợp lệ hoặc không còn hiệu lực.', 'warning');
                }
            }

            calculatedTotalPrice = basePrice - appliedDiscount;
            calculatedTotalPrice = Math.max(0, calculatedTotalPrice); // Đảm bảo tổng tiền không âm

            displayBookingSummary({ startDate: startDateString, endDate: endDateString, duration: durationInDays, basePrice: basePrice, discount: appliedDiscount, total: calculatedTotalPrice });

        } catch (error) {
            console.error('Lỗi khi tính toán ngày thuê/giá:', error);
            showToast('Lỗi khi tính giá thuê. Vui lòng kiểm tra lại ngày.', 'error');
            calculatedTotalPrice = 0;
            displayBookingSummary();
        }
    }

    function handleDateChange() {
        console.log('Đầu vào ngày giờ thay đổi.');
        const start = startDateInput.value;
        const end = endDateInput.value;

        if (start && end) {
            validateAndCalculateBookingDates(start, end);
        } else {
            calculatedTotalPrice = 0;
            appliedDiscount = 0;
            discountCode = null;
            if (discountCodeInput) discountCodeInput.value = '';
            displayBookingSummary();
        }
    }

    function setupDateListeners() {
        if (!startDateInput || !endDateInput) {
            console.error('Không tìm thấy trường ngày bắt đầu hoặc ngày kết thúc trong HTML.');
            if (bookingSummaryElement) bookingSummaryElement.innerHTML = '<p class="error-message">Lỗi: Không tìm thấy trường chọn ngày thuê. Vui lòng kiểm tra lại trang.</p>';
            return;
        }

        const now = new Date();
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);

        // Format sang ISO-MM-DDTHH:mm cho input datetime-local
        const formatDateTimeLocal = (date) => {
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            const hours = String(date.getHours()).padStart(2, '0');
            const minutes = String(date.getMinutes()).padStart(2, '0');
            return `${year}-${month}-${day}T${hours}:${minutes}`;
        };

        // Đặt giá trị min cho phép chọn từ thời điểm hiện tại trở đi
        startDateInput.setAttribute('min', formatDateTimeLocal(now));
        endDateInput.setAttribute('min', formatDateTimeLocal(tomorrow));

        // Đặt giá trị mặc định ban đầu để tránh trường trống
        startDateInput.value = formatDateTimeLocal(now);
        endDateInput.value = formatDateTimeLocal(tomorrow);

        // Kích hoạt tính toán giá ngay lần đầu tải trang
        handleDateChange();

        startDateInput.addEventListener('change', handleDateChange);
        endDateInput.addEventListener('change', handleDateChange);
    }

    function displayBookingSummary(bookingInfo) {
        console.log('Hiển thị tóm tắt đặt xe:', bookingInfo);
        if (!bookingSummaryElement) {
            console.error('Không tìm thấy phần tử tóm tắt đặt xe.');
            return;
        }

        if (!selectedVehicle) {
            bookingSummaryElement.innerHTML = '<p class="empty-cart">Không có xe nào được chọn.</p>';
            const checkoutBtn = document.querySelector('.form-actions .btn[type="submit"]');
            if (checkoutBtn) checkoutBtn.disabled = true;
            return;
        }

        let summaryContent = `
            <div class="order-card">
                <h4>Xe Đã Chọn</h4>
                <div class="order-items">
                    <div class="order-item">
                        <div class="item-details">
                            <h4>${selectedVehicle.name} ${selectedVehicle.license_plate ? `(${selectedVehicle.license_plate})` : ''}</h4>
                            <p>Loại: ${selectedVehicle.type || 'N/A'}</p>
                            <p>Giá/ngày: ${formatPrice(selectedVehicle.price_per_day)} VNĐ</p>
                            ${selectedVehicle.image_url ? `<img src="${selectedVehicle.image_url}" alt="${selectedVehicle.name}" style="max-width: 100px; height: auto; border-radius: 5px; margin-top: 10px;">` : ''}
                        </div>
                        <div class="item-info"></div>
                    </div>
                </div>
                <div class="order-totals"></div>
            </div>
        `;

        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = summaryContent.trim();

        const itemInfoElement = tempDiv.querySelector('.item-info');
        const orderTotalsElement = tempDiv.querySelector('.order-totals');


        if (bookingInfo && bookingInfo.startDate && bookingInfo.endDate) {
            itemInfoElement.innerHTML = `
                <p>Từ: ${new Date(bookingInfo.startDate).toLocaleString('vi-VN')}</p>
                <p>Đến: ${new Date(bookingInfo.endDate).toLocaleString('vi-VN')}</p>
                <p>Tổng số ngày thuê: ${bookingInfo.duration} ngày</p>
            `;

            orderTotalsElement.innerHTML = `
                <div class="total-item">
                    <span>Tổng tiền thuê cơ bản:</span>
                    <span>${formatPrice(bookingInfo.basePrice)} VNĐ</span>
                </div>
                <div class="total-item">
                    <span>Giảm giá:</span>
                    <span>-${formatPrice(bookingInfo.discount)} VNĐ</span>
                </div>
                <div class="total-item final-total">
                    <span>Tổng thanh toán:</span>
                    <span>${formatPrice(bookingInfo.total)} VNĐ</span>
                </div>
            `;

            const checkoutBtn = document.querySelector('.form-actions .btn[type="submit"]');
            if (checkoutBtn) checkoutBtn.disabled = (bookingInfo.total <= 0 && document.querySelector('input[name="payment-method"]:checked')?.value !== 'cod');


        } else {
            itemInfoElement.innerHTML = '<p>Vui lòng chọn ngày giờ nhận và trả xe để tính giá.</p>';
            orderTotalsElement.innerHTML = `
                <div class="total-item">
                    <span>Tổng tiền thuê cơ bản:</span>
                    <span>0 VNĐ</span>
                </div>
                <div class="total-item">
                    <span>Giảm giá:</span>
                    <span>-0 VNĐ</span>
                </div>
                <div class="total-item final-total">
                    <span>Tổng thanh toán:</span>
                    <span>0 VNĐ</span>
                </div>
            `;
            const checkoutBtn = document.querySelector('.form-actions .btn[type="submit"]');
            if (checkoutBtn) checkoutBtn.disabled = true;
        }

        bookingSummaryElement.innerHTML = '';
        bookingSummaryElement.appendChild(tempDiv.firstChild);
    }

    const autofillCustomerInfo = () => {
        const savedInfo = JSON.parse(localStorage.getItem('customerInfo') || '{}');
        if (savedInfo.name && customerNameInput) customerNameInput.value = savedInfo.name;
        if (savedInfo.phone && customerPhoneInput) customerPhoneInput.value = savedInfo.phone;
        if (savedInfo.province && customerProvinceInput) customerProvinceInput.value = savedInfo.province;
        if (savedInfo.address && customerAddressInput) customerAddressInput.value = savedInfo.address;
        if (savedInfo.email && customerEmailInput) customerEmailInput.value = savedInfo.email;
        if (savedInfo.pickupLocation && pickupLocationInput) pickupLocationInput.value = savedInfo.pickupLocation;
        if (savedInfo.returnLocation && returnLocationInput) returnLocationInput.value = savedInfo.returnLocation;
    };

    function generateBookingId() {
        const timestamp = Date.now();
        const random = Math.floor(Math.random() * 10000);
        return `${timestamp}-${random}`;
    }

    function copyTransferContent() {
        const content = document.getElementById('transfer-content')?.textContent;
        if (content) {
            navigator.clipboard.writeText(content).then(() => {
                showToast('Đã sao chép nội dung chuyển khoản!');
            }).catch(err => {
                console.error('Lỗi khi sao chép văn bản: ', err);
                showToast('Lỗi khi sao chép.', 'error');
            });
        }
    }
    function copyMomoContent() {
        const content = document.getElementById('momo-content')?.textContent;
        if (content) {
            navigator.clipboard.writeText(content).then(() => {
                showToast('Đã sao chép nội dung chuyển khoản MoMo!');
            }).catch(err => {
                console.error('Lỗi khi sao chép văn bản: ', err);
                showToast('Lỗi khi sao chép.', 'error');
            });
        }
    }

    const displayPaymentMethodDetails = () => {
        const paymentMethodRadios = document.querySelectorAll('input[name="payment-method"]');
        if (paymentMethodRadios.length === 0 || !paymentMethodDetailsElement) {
            console.warn('Không tìm thấy radio phương thức thanh toán hoặc phần tử chi tiết.');
            return;
        }
        const paymentMethod = document.querySelector('input[name="payment-method"]:checked')?.value;
        paymentMethodDetailsElement.innerHTML = '';

        if (paymentMethod === 'bank-transfer') {
            paymentMethodDetailsElement.innerHTML = `
                <div class="payment-details bank-transfer">
                    <h4>Thông tin chuyển khoản</h4>
                    <p>Ngân hàng: Vietcombank</p>
                    <p>Chủ tài khoản: Thuê Xe An Toàn</p>
                    <p>Số tài khoản: 1234567890</p>
                    <p>Chi nhánh: Hà Nội</p>
                    <p>Nội dung chuyển khoản: <span id="transfer-content">BOOKING_${generateBookingId()}</span>
                        <button type="button" class="copy-btn"><i class="fas fa-copy"></i> Sao chép</button> </p>
                    <div class="security-notice">
                        <i class="fas fa-shield-alt"></i>
                        Vui lòng kiểm tra thông tin trước khi chuyển khoản.
                    </div>
                </div>
            `;
            paymentMethodDetailsElement.querySelector('.copy-btn')?.addEventListener('click', copyTransferContent);

        } else if (paymentMethod === 'momo') {
            paymentMethodDetailsElement.innerHTML = `
                <div class="payment-details momo">
                    <h4>Thanh toán qua MoMo</h4>
                    <img src="https://via.placeholder.com/160?text=MoMo+QR" alt="MoMo QR Code" class="qr-code">
                    <p>Số điện thoại: 0901234567</p>
                    <p>Nội dung chuyển khoản: <span id="momo-content">BOOKING_${generateBookingId()}</span>
                         <button type="button" class="copy-btn"><i class="fas fa-copy"></i> Sao chép</button> </p>
                    <div class="security-notice">
                        <i class="fas fa-shield-alt"></i>
                        Quét mã QR hoặc nhập thông tin để thanh toán.
                    </div>
                </div>
            `;
            paymentMethodDetailsElement.querySelector('.copy-btn')?.addEventListener('click', copyMomoContent);

        } else if (paymentMethod === 'credit-card') {
            // Theo như checkout.html đã xóa tùy chọn Credit Card, nhưng giữ lại logic phòng trường hợp cần
            paymentMethodDetailsElement.innerHTML = `
                <div class="payment-details credit-card">
                    <h4>Thanh toán bằng thẻ tín dụng</h4>
                    <p>Tính năng thanh toán thẻ tín dụng đang được cập nhật.</p>
                    <div class="security-notice">
                        <i class="fas fa-shield-alt"></i>
                        Thông tin thẻ được mã hóa để đảm bảo an toàn.
                    </div>
                </div>
            `;
        }
        // Sau khi thay đổi phương thức thanh toán, hãy cập nhật trạng thái của nút "Xác nhận đặt xe"
        handleDateChange(); // Kích hoạt lại tính toán và cập nhật summary/nút
    };

    const setupDiscountCodeValidation = () => {
        if (!applyDiscountBtn || !discountCodeInput) {
            console.warn('Không tìm thấy nút áp dụng mã giảm giá hoặc trường nhập liệu.');
            return;
        }

        applyDiscountBtn.addEventListener('click', () => {
            const code = discountCodeInput.value.trim().toUpperCase();
            if (discountCodesFrontend[code]) {
                showToast(`Mã ${code} có thể được áp dụng!`, 'success');
            } else {
                showToast('Mã giảm giá không hợp lệ.', 'error');
            }
            handleDateChange(); // Kích hoạt tính toán lại giá sau khi áp dụng mã
        });
    };

    const validateBookingForm = () => {
        console.log('Đang xác thực biểu mẫu đặt xe...');
        let isValid = true;
        const rules = {
            'customer-name': { required: true, errorMessage: 'Vui lòng nhập họ và tên.' },
            'customer-phone': { required: true, regex: /^\+?[\d\s-]{10,15}$/, errorMessage: 'Số điện thoại không hợp lệ (10-15 số).' },
            'customer-province': { required: true, errorMessage: 'Vui lòng nhập Tỉnh/Thành phố.' },
            'customer-address': { required: true, errorMessage: 'Vui lòng nhập Địa chỉ liên hệ.' },
            'pickup-location': { required: true, errorMessage: 'Vui lòng nhập Địa điểm nhận xe.' },
            'return-location': { required: true, errorMessage: 'Vui lòng nhập Địa điểm trả xe.' },
            'start-date': { required: true, errorMessage: 'Vui lòng chọn Ngày giờ nhận xe.' },
            'end-date': { required: true, errorMessage: 'Vui lòng chọn Ngày giờ trả xe.' }
        };

        // Xóa tất cả các lỗi trước khi xác thực
        Object.keys(rules).forEach(fieldId => hideError(fieldId));
        hideError('otp-input');

        isValid = validateForm(rules); // Sử dụng hàm validateForm từ utils.js

        const start = startDateInput ? new Date(startDateInput.value) : null;
        const end = endDateInput ? new Date(endDateInput.value) : null;

        if (!start || !end || isNaN(start.getTime()) || isNaN(end.getTime()) || end <= start) {
            showToast('Vui lòng chọn ngày bắt đầu và kết thúc thuê hợp lệ.', 'error');
            isValid = false;
        } else {
            const now = new Date();
            if (start < now) {
                showToast('Ngày giờ nhận xe không thể ở trong quá khứ.', 'error');
                isValid = false;
            }
        }

        const paymentMethod = document.querySelector('input[name="payment-method"]:checked')?.value;
        if (!paymentMethod) {
            showToast('Vui lòng chọn phương thức thanh toán.', 'error');
            isValid = false;
        }

        if (!selectedVehicle) {
            showToast('Không có thông tin xe để đặt.', 'error');
            isValid = false;
        }

        // Kiểm tra tổng tiền
        if (calculatedTotalPrice <= 0 && paymentMethod !== 'cod') { // Cho phép COD nếu tổng tiền = 0
             if (calculatedTotalPrice < 0) {
                  showToast('Tổng tiền thanh toán không hợp lệ.', 'error');
                  isValid = false;
             } else if (calculatedTotalPrice === 0) {
                  showToast('Tổng tiền là 0 VNĐ. Vui lòng chọn Thanh toán khi nhận xe hoặc kiểm tra lại mã giảm giá.', 'warning');
                  isValid = false;
             }
        }

        console.log('Kết quả xác thực biểu mẫu:', isValid);
        return isValid;
    };

    async function performFinalAvailabilityCheck() {
        console.log('Đang thực hiện kiểm tra tình trạng xe cuối cùng...');
        if (!selectedVehicle || !startDateInput?.value || !endDateInput?.value) {
            console.error('Không thể kiểm tra tình trạng: thiếu thông tin xe hoặc ngày.');
            showToast('Lỗi hệ thống: Thiếu thông tin kiểm tra sẵn có.', 'error');
            return false;
        }

        const start = startDateInput.value;
        const end = endDateInput.value;

        showLoading();
        try {
            // Đây là một endpoint giả định để kiểm tra tính sẵn có.
            // Trong thực tế, bạn sẽ cần một API backend để làm điều này.
            // Ví dụ: `GET /api/vehicles/available?vehicleId=X&startDate=Y&endDate=Z`
            // Hiện tại không có endpoint này trong server.js, nên ta sẽ bỏ qua bước này
            // hoặc giả định luôn có sẵn (tùy theo yêu cầu của bạn).
            // Nếu bạn muốn triển khai, cần tạo endpoint này ở backend.
            // Ví dụ:
            // const response = await fetch(`http://localhost:5000/api/vehicles/available?vehicleId=${selectedVehicle.id}&startDate=${encodeURIComponent(start)}&endDate=${encodeURIComponent(end)}`);
            // if (!response.ok) { /* handle error */ }
            // const result = await response.json();
            // return result.isAvailable; // Giả định API trả về { isAvailable: true/false }

            // Đối với mục đích hiện tại, chúng ta sẽ giả định xe luôn có sẵn.
            // Bạn có thể thêm logic kiểm tra API thực tế ở đây nếu cần.

            // Mô phỏng độ trễ kiểm tra
            await new Promise(resolve => setTimeout(resolve, 500));
            console.log('Kiểm tra tình trạng cuối cùng thành công (mô phỏng).');
            return true;

        } catch (error) {
            console.error('Lỗi trong quá trình kiểm tra tình trạng cuối cùng:', error);
            showToast(`Không thể kiểm tra lại sẵn có của xe: ${error.message || 'Lỗi không xác định'}. Vui lòng thử lại.`, 'error');
            return false;
        } finally {
            hideLoading();
        }
    }

    async function submitBooking(bookingData) {
        console.log('Đang gửi đặt xe lên backend...', bookingData);
        showLoading();

        // customerInfo đã được chuẩn bị trước đó trong processBooking
        // và được gán vào bookingData.customerInfo
        const customerInfoJson = bookingData.customerInfo;


        try {
            const response = await fetch('http://localhost:5000/api/bookings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: bookingData.userId,
                    vehicleId: bookingData.vehicleId,
                    startDate: bookingData.startDate,
                    endDate: bookingData.endDate,
                    customerInfo: customerInfoJson, // Đã bao gồm paymentMethod và các thông tin khách hàng khác
                    discountCode: bookingData.discountCode,
                    subtotal: bookingData.subtotal,
                    discount: bookingData.discount,
                    finalTotal: bookingData.finalTotal,
                    status: 'Pending', // Trạng thái ban đầu của đơn hàng
                })
            });

            const result = await response.json().catch(() => ({}));

            if (response.ok && result.bookingId) {
                console.log('Đặt xe thành công:', result);
                showToast('Đặt xe thành công!', 'success');
                saveCustomerInfo(); // Lưu thông tin khách hàng cho lần sau
                showSuccessModal(result.bookingId);
            } else {
                console.error('Gửi đặt xe thất bại:', response.status, result.error);
                showToast(`Đặt xe thất bại: ${result.error || 'Lỗi không xác định'}.`, 'error');
            }
        } catch (error) {
            console.error('Lỗi trong quá trình gửi đặt xe:', error);
            showToast('Có lỗi xảy ra khi đặt xe. Vui lòng thử lại.', 'error');
        } finally {
            hideLoading();
        }
    }

    function saveCustomerInfo() {
        const saveInfoCheckbox = document.getElementById('save-info');
        if (saveInfoCheckbox && saveInfoCheckbox.checked) {
            const customerInfoToSave = {
                name: customerNameInput?.value.trim(),
                phone: customerPhoneInput?.value.trim(),
                province: customerProvinceInput?.value.trim(),
                address: customerAddressInput?.value.trim(),
                email: customerEmailInput?.value.trim(),
                pickupLocation: pickupLocationInput?.value.trim(),
                returnLocation: returnLocationInput?.value.trim()
            };
            localStorage.setItem('customerInfo', JSON.stringify(customerInfoToSave));
        } else {
            // Có thể xóa thông tin nếu checkbox không được chọn
            // localStorage.removeItem('customerInfo');
        }
    }

    function showConfirmModal(bookingData) {
        console.log('Hiển thị modal xác nhận...');
        if (!confirmModal || !confirmSummary || !confirmBookingBtn) {
            console.error('Không tìm thấy các phần tử modal xác nhận.');
            return;
        }

        // Lấy thông tin khách hàng từ bookingData.customerInfo
        const customerInfoDisplay = bookingData.customerInfo || {};

        confirmSummary.innerHTML = `
            <div class="order-card">
                <h4>Thông tin người thuê</h4>
                <p>Họ và tên: ${customerInfoDisplay.name || 'N/A'}</p>
                <p>Số điện thoại: ${customerInfoDisplay.phone || 'N/A'}</p>
                <p>Email: ${customerInfoDisplay.email || 'N/A'}</p>
                <p>Địa chỉ liên hệ: ${customerInfoDisplay.address || 'N/A'}, ${customerInfoDisplay.province || 'N/A'}</p>
                <p>Địa điểm nhận xe: ${customerInfoDisplay.pickupLocation || 'N/A'}</p>
                <p>Địa điểm trả xe: ${customerInfoDisplay.returnLocation || 'N/A'}</p>
                ${customerInfoDisplay.note ? `<p>Ghi chú: ${customerInfoDisplay.note}</p>` : ''}

                <h4>Chi tiết xe và thời gian</h4>
                <p><strong>Xe:</strong> ${selectedVehicle?.name} ${selectedVehicle?.license_plate ? `(${selectedVehicle.license_plate})` : ''}</p>
                <p><strong>Thời gian thuê:</strong> Từ ${new Date(bookingData.startDate).toLocaleString('vi-VN')} đến ${new Date(bookingData.endDate).toLocaleString('vi-VN')}</p>
                <p><strong>Tổng số ngày thuê:</strong> ${calculateDurationInDaysClient(bookingData.startDate, bookingData.endDate)} ngày</p>


                <h4>Tổng kết</h4>
                <p>Tổng tiền thuê cơ bản: ${formatPrice(bookingData.subtotal)} VNĐ</p>
                ${bookingData.discount > 0 ? `<p>Giảm giá: -${formatPrice(bookingData.discount)} VNĐ</p>` : ''}
                <p><strong>Tổng thanh toán: ${formatPrice(bookingData.finalTotal)} VNĐ</strong></p>
                <p>Phương thức thanh toán: ${customerInfoDisplay.paymentMethod || 'N/A'}</p>
            </div>
        `;

        confirmModal.style.display = 'flex';

        // Xóa listener cũ để tránh trùng lặp
        const oldConfirmListener = confirmBookingBtn._confirmListener;
        if (oldConfirmListener) confirmBookingBtn.removeEventListener('click', oldConfirmListener);

        const newConfirmListener = () => {
            confirmModal.style.display = 'none';

            // Chỉ hiển thị OTP nếu phương thức thanh toán KHÔNG phải là COD
            if (['momo', 'bank-transfer'].includes(bookingData.customerInfo.paymentMethod)) { // Thêm cả bank-transfer nếu cần OTP
                showOTPModal(bookingData);
            } else {
                submitBooking(bookingData);
            }
        };
        confirmBookingBtn.addEventListener('click', newConfirmListener);
        confirmBookingBtn._confirmListener = newConfirmListener;
    }

    let otpCountdown = 60;
    function startOtpTimer() {
        otpCountdown = 60;
        if (otpTimer) otpTimer.textContent = otpCountdown;
        if (otpInterval) clearInterval(otpInterval); // Xóa timer cũ nếu có

        otpInterval = setInterval(() => {
            otpCountdown--;
            if (otpTimer) otpTimer.textContent = otpCountdown;

            if (otpCountdown <= 0) {
                clearInterval(otpInterval);
                if (otpTimer) otpTimer.textContent = 'hết hạn';
                showToast('Mã OTP đã hết hạn. Vui lòng thử lại.', 'warning');
                // Có thể tự động đóng modal OTP nếu muốn
                // if (otpModal) otpModal.style.display = 'none';
            }
        }, 1000);
    }

    function showOTPModal(bookingData) {
        console.log('Hiển thị modal OTP...');
        if (!otpModal) { console.error('Không tìm thấy phần tử modal OTP.'); return; }
        otpModal.style.display = 'flex';
        if (otpInput) otpInput.value = '';
        hideError('otp-input');

        startOtpTimer();
        otpModal._bookingData = bookingData; // Lưu dữ liệu đặt xe vào modal để dùng sau
    }

    async function handleOtpConfirmation() {
        console.log('Đang xử lý xác nhận OTP...');
        const otp = otpInput?.value.trim();
        hideError('otp-input');

        if (!otp || otp.length !== 6 || isNaN(parseInt(otp))) {
            showError('otp-input', 'Mã OTP phải là 6 chữ số.');
            return;
        }

        const bookingData = otpModal._bookingData;
        if (!bookingData || !bookingData.customerInfo || !bookingData.customerInfo.email) { // Cần email để xác minh OTP
            console.error('Không tìm thấy dữ liệu đặt xe hoặc email trên modal OTP.');
            showError('otp-input', 'Lỗi hệ thống: Không tìm thấy thông tin đặt xe hoặc email.');
            return;
        }

        showLoading();
        try {
            // Gửi yêu cầu xác minh OTP đến backend
            const response = await fetch('http://localhost:5000/api/users/verify-otp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: bookingData.customerInfo.email, otp: otp }) // Sử dụng email từ customerInfo
            });
            const result = await response.json().catch(() => ({}));

            if (response.ok) {
                clearInterval(otpInterval); otpInterval = null; // Dừng timer
                if (otpModal) otpModal.style.display = 'none';
                if (otpInput) otpInput.value = '';
                showToast('Xác nhận OTP thành công!');

                // Sau khi xác nhận OTP, tiến hành gửi đơn hàng
                submitBooking(bookingData);

            } else {
                console.error('Xác minh OTP thất bại:', response.status, result.error);
                showError('otp-input', `Xác nhận OTP thất bại: ${result.error || 'Mã OTP không đúng hoặc đã hết hạn'}.`);
            }
        } catch (error) {
            console.error('Lỗi trong quá trình xác nhận OTP:', error);
            showError('otp-input', 'Có lỗi xảy ra khi xác nhận OTP. Vui lòng thử lại.');
        } finally {
            hideLoading();
        }
    }

    function showSuccessModal(bookingId) {
        console.log('Hiển thị modal thành công cho Booking ID:', bookingId);
        if (!successModal) { console.error('Không tìm thấy phần tử modal thành công.'); return; }

        const successMessageElement = successModal.querySelector('p');
        if (successMessageElement) successMessageElement.textContent = `Cảm ơn bạn đã sử dụng dịch vụ của chúng tôi! Lượt đặt xe #${bookingId} của bạn đã được xác nhận.`;

        successModal.style.display = 'flex';
    }


    function setupModalListeners() {
        if (cancelConfirm) cancelConfirm.addEventListener('click', () => { if (confirmModal) confirmModal.style.display = 'none'; });

        if (cancelOtp) cancelOtp.addEventListener('click', () => {
            clearInterval(otpInterval); otpInterval = null; // Dừng timer OTP
            if (otpModal) otpModal.style.display = 'none';
            if (otpInput) otpInput.value = '';
            hideError('otp-input');
        });

        if (confirmOtp) confirmOtp.addEventListener('click', handleOtpConfirmation);

        if (shopContinueBtn) shopContinueBtn.addEventListener('click', () => redirectToPage('vehicles.html'));
        if (viewBookingsBtn) viewBookingsBtn.addEventListener('click', () => redirectToPage('account.html#orders'));
    }


    const processBooking = async (e) => {
        e.preventDefault();
        console.log('Đang xử lý đặt xe...');

        if (!validateBookingForm()) {
            console.log('Xác thực biểu mẫu thất bại.');
            return;
        }

        const isAvailable = await performFinalAvailabilityCheck();
        if (!isAvailable) {
            console.log('Kiểm tra tình trạng cuối cùng thất bại.');
            return;
        }

        const user = JSON.parse(localStorage.getItem('user') || '{}');
        if (!user.id) {
            showToast('Lỗi: Thông tin người dùng không hợp lệ. Vui lòng đăng nhập lại.', 'error');
            redirectToPage('account.html');
            return;
        }

        // Lấy phương thức thanh toán đã chọn
        const paymentMethod = document.querySelector('input[name="payment-method"]:checked')?.value;

        // TẠO đối tượng customerInfoJson chứa tất cả thông tin khách hàng và phương thức thanh toán
        const customerInfoJson = {
            name: customerNameInput?.value.trim(),
            phone: customerPhoneInput?.value.trim().replace(/[\s-]/g, ''),
            province: customerProvinceInput?.value.trim(),
            address: customerAddressInput?.value.trim(),
            email: customerEmailInput?.value.trim(),
            pickupLocation: pickupLocationInput?.value.trim(),
            returnLocation: returnLocationInput?.value.trim(),
            note: customerNoteInput?.value.trim(),
            paymentMethod: paymentMethod // <-- Đưa paymentMethod vào đây
        };

        // Tạo bookingData với customerInfo là một đối tượng JSON
        const bookingData = {
            userId: user.id,
            vehicleId: selectedVehicle.id,
            startDate: startDateInput?.value,
            endDate: endDateInput?.value,
            customerInfo: customerInfoJson, // Gán đối tượng customerInfo đã hoàn chỉnh
            discountCode: discountCodeInput?.value.trim() || null,
            subtotal: (calculateDurationInDaysClient(startDateInput?.value, endDateInput?.value) || 0) * (selectedVehicle.price_per_day || 0),
            discount: appliedDiscount,
            finalTotal: calculatedTotalPrice,
        };

        console.log('Dữ liệu đặt xe đã chuẩn bị (sau khi gộp customerInfo):', bookingData);
        showConfirmModal(bookingData);
    };


    // --- Khởi tạo trang (Order of execution) ---

    if (!isLoggedIn()) {
        showToast('Vui lòng đăng nhập để đặt xe.', 'error');
        redirectToPage('account.html');
        return;
    }

    const vehicleId = getUrlParameter('vehicleId');
    if (!vehicleId) {
        console.error('Vehicle ID not found in URL.');
        showToast('Không tìm thấy thông tin xe. Vui lòng chọn xe từ danh sách.', 'error');
        setTimeout(() => redirectToPage('vehicles.html'), 3000);
        return;
    }

    // Fetch thông tin xe từ API backend
    await fetchVehicleDetails(vehicleId);

    // Setup listeners and autofill after vehicle details are fetched
    setupDateListeners();
    autofillCustomerInfo();
    displayPaymentMethodDetails();
    setupDiscountCodeValidation();
    setupModalListeners();


    if (bookingForm) {
        bookingForm.addEventListener('submit', processBooking);
    } else {
        console.error('Booking form not found.');
    }

    // Thêm listener cho các nút radio phương thức thanh toán
    document.querySelectorAll('input[name="payment-method"]').forEach(method => {
        method.addEventListener('change', displayPaymentMethodDetails);
    });
}