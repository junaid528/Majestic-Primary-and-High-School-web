/**
 * Global Error Handler Module
 * Handles all API errors, form validation, and user notifications
 */

const ErrorHandler = (() => {
    const RETRY_MAX = 3;
    const RETRY_DELAY_MS = 1000;
    
    /**
     * Show error toast notification
     */
    function showErrorToast(message, duration = 5000) {
        const toast = createToast(message, 'error', duration);
        document.body.appendChild(toast);
        return toast;
    }

    /**
     * Show success toast notification
     */
    function showSuccessToast(message, duration = 3000) {
        const toast = createToast(message, 'success', duration);
        document.body.appendChild(toast);
        return toast;
    }

    /**
     * Show warning toast notification
     */
    function showWarningToast(message, duration = 4000) {
        const toast = createToast(message, 'warning', duration);
        document.body.appendChild(toast);
        return toast;
    }

    /**
     * Create toast element
     */
    function createToast(message, type = 'error', duration = 5000) {
        const toast = document.createElement('div');
        toast.className = `toast-notification toast-${type}`;
        toast.innerHTML = `
            <div class="toast-content">
                <span class="toast-message">${escapeHtml(message)}</span>
                <button class="toast-close">&times;</button>
            </div>
        `;
        
        toast.querySelector('.toast-close').addEventListener('click', () => {
            toast.remove();
        });
        
        if (duration > 0) {
            setTimeout(() => {
                toast.classList.add('fade-out');
                setTimeout(() => toast.remove(), 300);
            }, duration);
        }
        
        return toast;
    }

    /**
     * Map HTTP status codes to user-friendly messages
     */
    function mapErrorMessage(status, detail) {
        const errorMap = {
            400: 'Invalid request. Please check your input.',
            401: 'Unauthorized. Please login again.',
            403: 'Access denied. You do not have permission.',
            404: 'Resource not found.',
            409: 'Record already exists.',
            413: 'File is too large. Please reduce the file size.',
            422: 'Validation error. Please check your input.',
            500: 'Server error. Please try again later.',
            502: 'Bad gateway. Please try again later.',
            503: 'Service unavailable. Please try again later.',
            504: 'Gateway timeout. Please try again later.',
        };

        if (detail) {
            return detail;
        }
        
        return errorMap[status] || 'An error occurred. Please try again.';
    }

    /**
     * Handle API errors with retry logic
     */
    async function handleApiError(error, retryFn = null, retryCount = 0) {
        let message = 'An unexpected error occurred.';
        let status = 500;
        let isRetryable = false;

        if (error.response) {
            status = error.response.status;
            const data = error.response.data;
            
            message = mapErrorMessage(
                status,
                typeof data === 'string' ? data : data?.detail || data?.message
            );

            // Check if error is retryable
            if ([408, 429, 502, 503, 504].includes(status)) {
                isRetryable = true;
            }

            // Handle 401 Unauthorized
            if (status === 401) {
                handleUnauthorized();
                return { success: false, message, status };
            }

            // Handle 403 Forbidden
            if (status === 403) {
                message = 'Access denied. You do not have permission for this action.';
            }

        } else if (error.request) {
            message = 'Network error. Please check your connection.';
            isRetryable = true;
        } else if (error.message) {
            message = error.message;
        }

        // Attempt retry if applicable
        if (isRetryable && retryFn && retryCount < RETRY_MAX) {
            console.warn(`[RETRY] Attempt ${retryCount + 1}/${RETRY_MAX} after ${RETRY_DELAY_MS}ms`);
            showWarningToast(`${message}. Retrying...`);
            
            await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS));
            return handleApiError(error, retryFn, retryCount + 1);
        }

        return { success: false, message, status, isRetryable };
    }

    /**
     * Handle unauthorized access (401)
     */
    function handleUnauthorized() {
        localStorage.removeItem('jwt_token');
        localStorage.removeItem('user_role');
        localStorage.removeItem('user_name');
        showErrorToast('Session expired. Please login again.', 4000);
        
        setTimeout(() => {
            window.location.href = 'login.html';
        }, 1000);
    }

    /**
     * Validate form field
     */
    function validateField(fieldElement, rules) {
        const value = fieldElement.value.trim();
        const errorElement = fieldElement.nextElementSibling;
        
        // Check required
        if (rules.required && !value) {
            showFieldError(fieldElement, 'This field is required');
            return false;
        }

        if (!value) return true; // Skip other validations if empty and not required

        // Check email
        if (rules.email && !isValidEmail(value)) {
            showFieldError(fieldElement, 'Please enter a valid email address');
            return false;
        }

        // Check phone
        if (rules.phone && !isValidPhone(value)) {
            showFieldError(fieldElement, 'Please enter a valid 10-digit phone number');
            return false;
        }

        // Check min length
        if (rules.minLength && value.length < rules.minLength) {
            showFieldError(fieldElement, `Minimum ${rules.minLength} characters required`);
            return false;
        }

        // Check max length
        if (rules.maxLength && value.length > rules.maxLength) {
            showFieldError(fieldElement, `Maximum ${rules.maxLength} characters allowed`);
            return false;
        }

        // Check pattern
        if (rules.pattern && !rules.pattern.test(value)) {
            showFieldError(fieldElement, rules.patternMessage || 'Invalid format');
            return false;
        }

        // Clear error
        clearFieldError(fieldElement);
        return true;
    }

    /**
     * Show field error
     */
    function showFieldError(fieldElement, message) {
        fieldElement.classList.add('field-error');
        fieldElement.classList.remove('field-success');
        
        let errorElement = fieldElement.parentElement.querySelector('.field-error-message');
        if (!errorElement) {
            errorElement = document.createElement('small');
            errorElement.className = 'field-error-message';
            fieldElement.parentElement.appendChild(errorElement);
        }
        errorElement.textContent = message;
        errorElement.style.display = 'block';
    }

    /**
     * Clear field error
     */
    function clearFieldError(fieldElement) {
        fieldElement.classList.remove('field-error');
        fieldElement.classList.add('field-success');
        
        const errorElement = fieldElement.parentElement.querySelector('.field-error-message');
        if (errorElement) {
            errorElement.style.display = 'none';
        }
    }

    /**
     * Validate email format
     */
    function isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    /**
     * Validate phone format (10 digits)
     */
    function isValidPhone(phone) {
        const phoneRegex = /^[0-9]{10}$/;
        return phoneRegex.test(phone.replace(/\D/g, ''));
    }

    /**
     * Format file size
     */
    function formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
    }

    /**
     * Validate file upload
     */
    function validateFile(fileInput, rules = {}) {
        const files = fileInput.files;
        
        if (!files || files.length === 0) {
            if (fileInput.required) {
                showFieldError(fileInput, 'Please select a file');
                return false;
            }
            clearFieldError(fileInput);
            return true;
        }

        const file = files[0];

        // Check file size
        const maxSize = rules.maxSize || 10 * 1024 * 1024; // 10MB default
        if (file.size > maxSize) {
            showFieldError(fileInput, `File size must be less than ${formatFileSize(maxSize)}`);
            return false;
        }

        // Check file type
        if (rules.allowedTypes && !rules.allowedTypes.includes(file.type)) {
            showFieldError(fileInput, `File type not allowed. Allowed types: ${rules.allowedTypes.join(', ')}`);
            return false;
        }

        // Check file extension
        if (rules.allowedExtensions) {
            const fileName = file.name.toLowerCase();
            const fileExt = fileName.substring(fileName.lastIndexOf('.'));
            if (!rules.allowedExtensions.includes(fileExt)) {
                showFieldError(fileInput, `File extension not allowed. Allowed: ${rules.allowedExtensions.join(', ')}`);
                return false;
            }
        }

        clearFieldError(fileInput);
        return true;
    }

    /**
     * Display file preview
     */
    function showFilePreview(fileInput, previewContainer) {
        const files = fileInput.files;
        
        previewContainer.innerHTML = '';
        
        if (!files || files.length === 0) return;

        Array.from(files).forEach((file, index) => {
            const previewItem = document.createElement('div');
            previewItem.className = 'file-preview-item';

            if (file.type.startsWith('image/')) {
                // Image preview
                const reader = new FileReader();
                reader.onload = (e) => {
                    previewItem.innerHTML = `
                        <img src="${e.target.result}" alt="Preview" class="file-preview-image">
                        <div class="file-preview-info">
                            <p>${file.name}</p>
                            <small>${formatFileSize(file.size)}</small>
                        </div>
                    `;
                };
                reader.readAsDataURL(file);
            } else {
                // Generic file preview
                previewItem.innerHTML = `
                    <div class="file-preview-icon">
                        <i class="fas fa-file"></i>
                    </div>
                    <div class="file-preview-info">
                        <p>${file.name}</p>
                        <small>${formatFileSize(file.size)}</small>
                    </div>
                `;
            }

            // Add remove button
            const removeBtn = document.createElement('button');
            removeBtn.type = 'button';
            removeBtn.className = 'file-remove-btn';
            removeBtn.innerHTML = '<i class="fas fa-trash"></i>';
            removeBtn.addEventListener('click', () => {
                fileInput.value = '';
                previewItem.remove();
            });

            previewItem.appendChild(removeBtn);
            previewContainer.appendChild(previewItem);
        });
    }

    /**
     * Escape HTML to prevent XSS
     */
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * Set form loading state
     */
    function setFormLoading(formElement, isLoading = true) {
        const submitBtn = formElement.querySelector('button[type="submit"]');
        if (submitBtn) {
            if (isLoading) {
                submitBtn.disabled = true;
                submitBtn.innerHTML = '<span class="spinner"></span> Submitting...';
            } else {
                submitBtn.disabled = false;
                submitBtn.innerHTML = submitBtn.dataset.originalText || 'Submit';
            }
        }
    }

    /**
     * Store original button text
     */
    function storeOriginalButtonText(formElement) {
        const submitBtn = formElement.querySelector('button[type="submit"]');
        if (submitBtn) {
            submitBtn.dataset.originalText = submitBtn.innerText;
        }
    }

    /**
     * Reset form to initial state
     */
    function resetForm(formElement) {
        formElement.reset();
        formElement.querySelectorAll('.field-error-message').forEach(el => el.remove());
        formElement.querySelectorAll('.field-error').forEach(el => el.classList.remove('field-error'));
        formElement.querySelectorAll('.field-success').forEach(el => el.classList.remove('field-success'));
        formElement.querySelectorAll('.file-preview-container').forEach(el => el.innerHTML = '');
        setFormLoading(formElement, false);
    }

    // Public API
    return {
        showErrorToast,
        showSuccessToast,
        showWarningToast,
        handleApiError,
        handleUnauthorized,
        validateField,
        showFieldError,
        clearFieldError,
        validateFile,
        showFilePreview,
        formatFileSize,
        setFormLoading,
        storeOriginalButtonText,
        resetForm,
        isValidEmail,
        isValidPhone
    };
})();

// Add CSS for toast notifications and error styling
if (!document.getElementById('error-handler-styles')) {
    const styleTag = document.createElement('style');
    styleTag.id = 'error-handler-styles';
    styleTag.textContent = `
        .toast-notification {
            position: fixed;
            bottom: 20px;
            right: 20px;
            padding: 16px 24px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            z-index: 10000;
            display: flex;
            align-items: center;
            gap: 12px;
            max-width: 400px;
            animation: slideIn 0.3s ease-out;
        }

        .toast-notification.toast-error {
            background-color: #ef4444;
            color: white;
        }

        .toast-notification.toast-success {
            background-color: #10b981;
            color: white;
        }

        .toast-notification.toast-warning {
            background-color: #f59e0b;
            color: white;
        }

        .toast-close {
            background: none;
            border: none;
            color: inherit;
            font-size: 20px;
            cursor: pointer;
            margin-left: auto;
        }

        .toast-notification.fade-out {
            animation: slideOut 0.3s ease-out forwards;
        }

        @keyframes slideIn {
            from {
                transform: translateX(400px);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }

        @keyframes slideOut {
            from {
                transform: translateX(0);
                opacity: 1;
            }
            to {
                transform: translateX(400px);
                opacity: 0;
            }
        }

        .field-error-message {
            display: none;
            color: #ef4444;
            font-size: 0.8rem;
            font-weight: 600;
            margin-top: 4px;
        }

        .field-error {
            border-color: #ef4444 !important;
            background-color: #fef2f2 !important;
        }

        .field-success {
            border-color: #10b981 !important;
        }

        .file-preview-container {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
            gap: 12px;
            margin-top: 12px;
        }

        .file-preview-item {
            position: relative;
            border: 1px solid #e5e7eb;
            border-radius: 8px;
            padding: 8px;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 8px;
        }

        .file-preview-image {
            max-width: 100%;
            max-height: 100px;
            border-radius: 4px;
        }

        .file-preview-icon {
            font-size: 24px;
            color: #6b7280;
        }

        .file-preview-info {
            text-align: center;
            width: 100%;
        }

        .file-preview-info p {
            margin: 0;
            font-size: 0.75rem;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }

        .file-preview-info small {
            color: #9ca3af;
            font-size: 0.7rem;
        }

        .file-remove-btn {
            position: absolute;
            top: 4px;
            right: 4px;
            background: #ef4444;
            color: white;
            border: none;
            border-radius: 50%;
            width: 24px;
            height: 24px;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 12px;
        }

        .file-remove-btn:hover {
            background: #dc2626;
        }

        .spinner {
            display: inline-block;
            width: 12px;
            height: 12px;
            border: 2px solid rgba(255, 255, 255, 0.3);
            border-top-color: white;
            border-radius: 50%;
            animation: spin 0.8s linear infinite;
            margin-right: 6px;
        }

        @keyframes spin {
            to { transform: rotate(360deg); }
        }
    `;
    document.head.appendChild(styleTag);
}
