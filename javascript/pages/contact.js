
import { showToast, showError, hideError, showLoading, hideLoading, validateForm } from '../common/utils.js';

document.addEventListener('DOMContentLoaded', () => {
    console.log('Contact page initialized.');

    const contactForm = document.getElementById('contact-form');

    if (contactForm) {
        contactForm.addEventListener('submit', async (e) => {
            e.preventDefault(); 

            const rules = {
                'name': { required: true, errorMessage: 'Vui lòng nhập họ và tên của bạn.' },
                'email': { required: true, regex: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, errorMessage: 'Email không hợp lệ.' },
                'phone': { regex: /^\+?\d{10,15}$/, errorMessage: 'Số điện thoại không hợp lệ (10-15 số).' },
                'subject': { required: true, errorMessage: 'Vui lòng nhập chủ đề tin nhắn.' },
                'message': { required: true, errorMessage: 'Vui lòng nhập nội dung tin nhắn.' }
            };

           
            Object.keys(rules).forEach(fieldId => hideError(fieldId));

           
            const isValid = validateForm(rules);

            if (isValid) {
                const formData = {
                    name: document.getElementById('name').value.trim(),
                    email: document.getElementById('email').value.trim(),
                    phone: document.getElementById('phone').value.trim(),
                    subject: document.getElementById('subject').value.trim(),
                    message: document.getElementById('message').value.trim()
                };

                showLoading(); 

                try {
            
                    await new Promise(resolve => setTimeout(resolve, 1500));

                    showToast('Tin nhắn của bạn đã được gửi thành công!', 'success');
                    contactForm.reset(); 

                } catch (error) {
                    console.error('Error sending contact message:', error);
                    showToast(`Có lỗi xảy ra khi gửi tin nhắn: ${error.message || 'Vui lòng thử lại.'}`, 'error');
                } finally {
                    hideLoading(); 
                }
            } else {
             
                showToast('Vui lòng kiểm tra lại thông tin bạn đã nhập.', 'error');
            }
        });
    } else {
        console.error('Contact form element not found in HTML.');
    }
});