// javascript/pages/contact.js

// Import utility functions from common/utils.js
import { showToast, showError, hideError, showLoading, hideLoading, validateForm } from '../common/utils.js';

/**
 * Initializes the contact page functionalities,
 * including form validation and submission handling.
 */
document.addEventListener('DOMContentLoaded', () => {
    console.log('Contact page initialized.');

    const contactForm = document.getElementById('contact-form');

    if (contactForm) {
        contactForm.addEventListener('submit', async (e) => {
            e.preventDefault(); // Prevent default form submission

            // Define validation rules for the form fields
            const rules = {
                'name': { required: true, errorMessage: 'Vui lòng nhập họ và tên của bạn.' },
                'email': { required: true, regex: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, errorMessage: 'Email không hợp lệ.' },
                'phone': { regex: /^\+?\d{10,15}$/, errorMessage: 'Số điện thoại không hợp lệ (10-15 số).' }, // Optional, but validate if entered
                'subject': { required: true, errorMessage: 'Vui lòng nhập chủ đề tin nhắn.' },
                'message': { required: true, errorMessage: 'Vui lòng nhập nội dung tin nhắn.' }
            };

            // Clear previous errors before validation
            Object.keys(rules).forEach(fieldId => hideError(fieldId));

            // Validate the form using the common utility function
            const isValid = validateForm(rules);

            if (isValid) {
                // If the form is valid, prepare data for submission
                const formData = {
                    name: document.getElementById('name').value.trim(),
                    email: document.getElementById('email').value.trim(),
                    phone: document.getElementById('phone').value.trim(),
                    subject: document.getElementById('subject').value.trim(),
                    message: document.getElementById('message').value.trim()
                };

                showLoading(); // Show loading overlay

                try {
                    // *** IMPORTANT: Replace this with your actual backend API endpoint ***
                    // This is a simulated fetch request. In a real application, you'd send this
                    // to a backend endpoint (e.g., /api/contact) that handles sending emails
                    // or saving messages to a database.
                    // Example:
                    // const response = await fetch('http://localhost:5000/api/contact', {
                    //     method: 'POST',
                    //     headers: { 'Content-Type': 'application/json' },
                    //     body: JSON.stringify(formData)
                    // });
                    // if (!response.ok) {
                    //     const errorData = await response.json();
                    //     throw new Error(errorData.error || 'Failed to send message');
                    // }

                    // Simulate a network delay for the example
                    await new Promise(resolve => setTimeout(resolve, 1500));

                    showToast('Tin nhắn của bạn đã được gửi thành công!', 'success');
                    contactForm.reset(); // Clear the form fields after successful submission

                } catch (error) {
                    console.error('Error sending contact message:', error);
                    showToast(`Có lỗi xảy ra khi gửi tin nhắn: ${error.message || 'Vui lòng thử lại.'}`, 'error');
                } finally {
                    hideLoading(); // Hide loading overlay
                }
            } else {
                // If validation fails, show a general error toast
                showToast('Vui lòng kiểm tra lại thông tin bạn đã nhập.', 'error');
            }
        });
    } else {
        console.error('Contact form element not found in HTML.');
    }
});