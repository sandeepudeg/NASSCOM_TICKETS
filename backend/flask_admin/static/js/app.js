// Flask Admin Client-Side JavaScript

// Global application state
const FlaskAdmin = {
    config: {
        autoRefreshInterval: 30000, // 30 seconds
        requestTimeout: 120000, // 120 seconds
        maxRetries: 3,
        animationDuration: 300,
        toastDuration: 5000
    },
    state: {
        isLoading: false,
        autoRefreshEnabled: false,
        currentPage: window.location.pathname,
        cache: new Map(),
        requestQueue: []
    },
    version: '1.0.0'
};

// Utility Functions
const Utils = {
    // Show loading state with enhanced animation
    showLoading: function(element, text = 'Loading...') {
        if (element) {
            element.disabled = true;
            element.classList.add('btn-loading');
            const originalText = element.getAttribute('data-original-text') || element.innerHTML;
            element.setAttribute('data-original-text', originalText);
            element.innerHTML = `<i class="fas fa-spinner fa-spin"></i> ${text}`;
        }
    },

    // Hide loading state
    hideLoading: function(element, originalText = null) {
        if (element) {
            element.disabled = false;
            element.classList.remove('btn-loading');
            const text = originalText || element.getAttribute('data-original-text');
            if (text) {
                element.innerHTML = text;
            }
        }
    },

    // Show toast notification with enhanced styling
    showToast: function(message, type = 'info', duration = null) {
        const toastContainer = document.getElementById('toast-container') || this.createToastContainer();
        const toast = this.createToast(message, type);
        toastContainer.appendChild(toast);
        
        // Auto-remove after specified duration
        const toastDuration = duration || FlaskAdmin.config.toastDuration;
        setTimeout(() => {
            if (toast.parentNode) {
                toast.classList.add('fade-out');
                setTimeout(() => toast.remove(), 300);
            }
        }, toastDuration);
        
        return toast;
    },

    // Create toast container if it doesn't exist
    createToastContainer: function() {
        const container = document.createElement('div');
        container.id = 'toast-container';
        container.className = 'position-fixed top-0 end-0 p-3';
        container.style.zIndex = '1055';
        document.body.appendChild(container);
        return container;
    },

    // Create individual toast with enhanced features
    createToast: function(message, type) {
        const toast = document.createElement('div');
        toast.className = `toast align-items-center text-white bg-${type} border-0 slide-in-left`;
        toast.setAttribute('role', 'alert');
        
        const iconMap = {
            success: 'check-circle',
            danger: 'exclamation-triangle',
            warning: 'exclamation-circle',
            info: 'info-circle'
        };
        
        const icon = iconMap[type] || 'info-circle';
        
        toast.innerHTML = `
            <div class="d-flex">
                <div class="toast-body">
                    <i class="fas fa-${icon} me-2"></i>${message}
                </div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
            </div>
        `;
        
        // Initialize Bootstrap toast
        const bsToast = new bootstrap.Toast(toast, {
            autohide: false // We handle this manually
        });
        bsToast.show();
        
        return toast;
    },

    // Format date/time with locale support
    formatDateTime: function(dateString, options = {}) {
        const date = new Date(dateString);
        const defaultOptions = {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        };
        return date.toLocaleString(undefined, { ...defaultOptions, ...options });
    },

    // Format relative time (e.g., "2 minutes ago")
    formatRelativeTime: function(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHours / 24);
        
        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
        if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
        if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
        
        return this.formatDateTime(dateString);
    },

    // Debounce function with immediate option
    debounce: function(func, wait, immediate = false) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                timeout = null;
                if (!immediate) func(...args);
            };
            const callNow = immediate && !timeout;
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
            if (callNow) func(...args);
        };
    },

    // Throttle function
    throttle: function(func, limit) {
        let inThrottle;
        return function(...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    },

    // Animate element with CSS classes
    animate: function(element, animationClass, duration = null) {
        return new Promise((resolve) => {
            const animationDuration = duration || FlaskAdmin.config.animationDuration;
            element.classList.add(animationClass);
            
            setTimeout(() => {
                element.classList.remove(animationClass);
                resolve();
            }, animationDuration);
        });
    },

    // Copy text to clipboard
    copyToClipboard: function(text) {
        if (navigator.clipboard) {
            return navigator.clipboard.writeText(text).then(() => {
                this.showToast('Copied to clipboard', 'success', 2000);
            }).catch(() => {
                this.fallbackCopyToClipboard(text);
            });
        } else {
            this.fallbackCopyToClipboard(text);
        }
    },

    // Fallback copy method for older browsers
    fallbackCopyToClipboard: function(text) {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        
        try {
            document.execCommand('copy');
            this.showToast('Copied to clipboard', 'success', 2000);
        } catch (err) {
            this.showToast('Failed to copy to clipboard', 'danger', 3000);
        }
        
        document.body.removeChild(textArea);
    },

    // Generate unique ID
    generateId: function(prefix = 'id') {
        return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    },

    // Validate email format
    isValidEmail: function(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    },

    // Sanitize HTML to prevent XSS
    sanitizeHtml: function(str) {
        const temp = document.createElement('div');
        temp.textContent = str;
        return temp.innerHTML;
    },

    // Format file size
    formatFileSize: function(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
};

// Form Validation and Enhancement
const FormHandler = {
    // Initialize form validation
    init: function() {
        this.setupValidation();
        this.setupCharacterCounters();
        this.setupFormSubmission();
    },

    // Setup Bootstrap validation
    setupValidation: function() {
        const forms = document.querySelectorAll('.needs-validation');
        forms.forEach(form => {
            form.addEventListener('submit', function(event) {
                if (!form.checkValidity()) {
                    event.preventDefault();
                    event.stopPropagation();
                }
                form.classList.add('was-validated');
            });
        });
    },

    // Setup character counters for textareas
    setupCharacterCounters: function() {
        const textareas = document.querySelectorAll('textarea[maxlength]');
        textareas.forEach(textarea => {
            const maxLength = parseInt(textarea.getAttribute('maxlength'));
            const counter = this.createCharacterCounter(textarea, maxLength);
            textarea.parentNode.appendChild(counter);
            
            textarea.addEventListener('input', () => {
                this.updateCharacterCounter(textarea, counter, maxLength);
            });
        });
    },

    // Create character counter element
    createCharacterCounter: function(textarea, maxLength) {
        const counter = document.createElement('div');
        counter.className = 'form-text character-counter';
        counter.textContent = `0 / ${maxLength} characters`;
        return counter;
    },

    // Update character counter
    updateCharacterCounter: function(textarea, counter, maxLength) {
        const currentLength = textarea.value.length;
        const remaining = maxLength - currentLength;
        
        counter.textContent = `${currentLength} / ${maxLength} characters`;
        
        if (remaining < 50) {
            counter.className = 'form-text character-counter text-warning';
        } else if (remaining < 0) {
            counter.className = 'form-text character-counter text-danger';
        } else {
            counter.className = 'form-text character-counter text-muted';
        }
    },

    // Setup form submission handling
    setupFormSubmission: function() {
        const forms = document.querySelectorAll('form');
        forms.forEach(form => {
            form.addEventListener('submit', function(event) {
                const submitBtn = form.querySelector('button[type="submit"]');
                
                // Enhanced form validation
                if (!form.checkValidity()) {
                    event.preventDefault();
                    event.stopPropagation();
                    form.classList.add('was-validated');
                    
                    // Show validation errors
                    const firstInvalidField = form.querySelector(':invalid');
                    if (firstInvalidField) {
                        firstInvalidField.focus();
                        Utils.showToast('Please fix the form errors before submitting', 'warning');
                    }
                    return;
                }
                
                // Show loading state for valid forms
                if (submitBtn) {
                    Utils.showLoading(submitBtn, 'Processing...');
                    
                    // Disable form to prevent double submission
                    const formElements = form.querySelectorAll('input, select, textarea, button');
                    formElements.forEach(element => {
                        element.disabled = true;
                    });
                    
                    // Re-enable form after timeout (fallback)
                    setTimeout(() => {
                        formElements.forEach(element => {
                            element.disabled = false;
                        });
                        Utils.hideLoading(submitBtn);
                    }, 30000); // 30 second timeout
                }
            });
            
            // Setup AJAX form submission for forms with data-ajax attribute
            if (form.hasAttribute('data-ajax')) {
                form.addEventListener('submit', function(event) {
                    event.preventDefault();
                    FormHandler.submitFormAjax(form);
                });
            }
        });
    },

    // Submit form via AJAX
    submitFormAjax: function(form) {
        const submitBtn = form.querySelector('button[type="submit"]');
        const originalText = submitBtn?.textContent;
        
        Utils.showLoading(submitBtn, 'Submitting...');
        
        AjaxHelper.submitForm(form)
            .then(response => {
                if (response.success) {
                    Utils.showToast(response.message || 'Form submitted successfully', 'success');
                    
                    // Reset form if specified
                    if (form.hasAttribute('data-reset-on-success')) {
                        form.reset();
                        form.classList.remove('was-validated');
                    }
                    
                    // Redirect if specified
                    if (response.redirect) {
                        setTimeout(() => {
                            window.location.href = response.redirect;
                        }, 1500);
                    }
                } else {
                    Utils.showToast(response.message || 'Form submission failed', 'danger');
                }
            })
            .catch(error => {
                Utils.showToast('Form submission failed. Please try again.', 'danger');
            })
            .finally(() => {
                Utils.hideLoading(submitBtn, originalText);
            });
    }
};

// AJAX Helper with enhanced features
const AjaxHelper = {
    // Request cache for performance
    cache: new Map(),
    
    // Active requests to prevent duplicates
    activeRequests: new Map(),

    // Make AJAX request with caching and retry logic
    request: function(url, options = {}) {
        const defaultOptions = {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest'
            },
            timeout: FlaskAdmin.config.requestTimeout,
            cache: false,
            retries: 0
        };

        const config = { ...defaultOptions, ...options };
        const cacheKey = `${config.method}:${url}:${JSON.stringify(config.body || {})}`;
        
        // Add CSRF token for non-GET requests
        if (config.method !== 'GET') {
            const csrfToken = document.querySelector('input[name="csrf_token"]')?.value ||
                             document.querySelector('meta[name="csrf-token"]')?.content;
            if (csrfToken) {
                config.headers['X-CSRFToken'] = csrfToken;
            }
        }
        
        // Check cache for GET requests
        if (config.method === 'GET' && config.cache && this.cache.has(cacheKey)) {
            const cached = this.cache.get(cacheKey);
            if (Date.now() - cached.timestamp < 300000) { // 5 minutes cache
                return Promise.resolve(cached.data);
            }
        }
        
        // Check for active duplicate requests
        if (this.activeRequests.has(cacheKey)) {
            return this.activeRequests.get(cacheKey);
        }

        const requestPromise = this._makeRequest(url, config, cacheKey)
            .finally(() => {
                this.activeRequests.delete(cacheKey);
            });
            
        this.activeRequests.set(cacheKey, requestPromise);
        return requestPromise;
    },

    // Internal request method with retry logic
    _makeRequest: function(url, config, cacheKey) {
        return new Promise((resolve, reject) => {
            const attemptRequest = (attempt = 0) => {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), config.timeout);

                fetch(url, {
                    ...config,
                    signal: controller.signal
                })
                .then(response => {
                    clearTimeout(timeoutId);
                    
                    if (!response.ok) {
                        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                    }
                    
                    const contentType = response.headers.get('content-type');
                    if (contentType && contentType.includes('application/json')) {
                        return response.json();
                    } else {
                        return response.text();
                    }
                })
                .then(data => {
                    // Cache successful GET requests
                    if (config.method === 'GET' && config.cache) {
                        this.cache.set(cacheKey, {
                            data: data,
                            timestamp: Date.now()
                        });
                    }
                    
                    resolve(data);
                })
                .catch(error => {
                    clearTimeout(timeoutId);
                    
                    // Retry logic for network errors
                    if (attempt < config.retries && this._shouldRetry(error)) {
                        console.warn(`Request failed, retrying (${attempt + 1}/${config.retries}):`, error.message);
                        setTimeout(() => attemptRequest(attempt + 1), Math.pow(2, attempt) * 1000);
                    } else {
                        console.error('AJAX request failed:', error);
                        if (!config.silent) {
                            Utils.showToast(`Request failed: ${error.message}`, 'danger');
                        }
                        reject(error);
                    }
                });
            };
            
            attemptRequest();
        });
    },

    // Determine if request should be retried
    _shouldRetry: function(error) {
        return error.name === 'AbortError' || 
               error.message.includes('NetworkError') ||
               error.message.includes('Failed to fetch');
    },

    // GET request with caching
    get: function(url, options = {}) {
        return this.request(url, { 
            ...options, 
            method: 'GET',
            cache: options.cache !== false,
            retries: options.retries || 2
        });
    },

    // POST request
    post: function(url, data, options = {}) {
        return this.request(url, {
            ...options,
            method: 'POST',
            body: JSON.stringify(data),
            retries: options.retries || 1
        });
    },

    // PUT request
    put: function(url, data, options = {}) {
        return this.request(url, {
            ...options,
            method: 'PUT',
            body: JSON.stringify(data),
            retries: options.retries || 1
        });
    },

    // DELETE request
    delete: function(url, options = {}) {
        return this.request(url, {
            ...options,
            method: 'DELETE',
            retries: options.retries || 1
        });
    },

    // Submit form via AJAX
    submitForm: function(form, options = {}) {
        const formData = new FormData(form);
        const data = {};
        
        // Convert FormData to JSON
        for (let [key, value] of formData.entries()) {
            data[key] = value;
        }
        
        const url = form.action || window.location.pathname;
        const method = form.method?.toUpperCase() || 'POST';
        
        return this.request(url, {
            method: method,
            body: JSON.stringify(data),
            ...options
        });
    },

    // Load content into element
    loadContent: function(url, targetElement, options = {}) {
        const loadingHtml = options.loadingHtml || '<div class="text-center p-3"><div class="spinner-border" role="status"></div></div>';
        
        if (targetElement) {
            targetElement.innerHTML = loadingHtml;
        }
        
        return this.get(url, { ...options, cache: true })
            .then(data => {
                if (targetElement) {
                    if (typeof data === 'string') {
                        targetElement.innerHTML = data;
                    } else {
                        // Assume JSON response with html property
                        targetElement.innerHTML = data.html || JSON.stringify(data);
                    }
                    
                    // Trigger custom event for loaded content
                    targetElement.dispatchEvent(new CustomEvent('contentLoaded', { detail: data }));
                }
                return data;
            })
            .catch(error => {
                if (targetElement) {
                    targetElement.innerHTML = `<div class="alert alert-danger">Failed to load content: ${error.message}</div>`;
                }
                throw error;
            });
    },

    // Clear cache
    clearCache: function() {
        this.cache.clear();
        console.log('AJAX cache cleared');
    },

    // Get cache statistics
    getCacheStats: function() {
        return {
            size: this.cache.size,
            keys: Array.from(this.cache.keys())
        };
    }
};

// Health Monitoring
const HealthMonitor = {
    interval: null,
    isMonitoring: false,
    lastHealthData: null,

    // Start monitoring
    start: function() {
        if (FlaskAdmin.state.currentPage === '/system-health') {
            this.isMonitoring = true;
            this.checkHealth();
            this.interval = setInterval(() => {
                if (this.isMonitoring) {
                    this.checkHealth();
                }
            }, FlaskAdmin.config.autoRefreshInterval);
            
            console.log('Health monitoring started');
        }
    },

    // Stop monitoring
    stop: function() {
        this.isMonitoring = false;
        if (this.interval) {
            clearInterval(this.interval);
            this.interval = null;
            console.log('Health monitoring stopped');
        }
    },

    // Toggle monitoring
    toggle: function() {
        if (this.isMonitoring) {
            this.stop();
            return false;
        } else {
            this.start();
            return true;
        }
    },

    // Check system health
    checkHealth: function() {
        // Show subtle loading indicator
        this.updateLoadingState(true);
        
        AjaxHelper.get('/health', { silent: true, timeout: 5000 })
            .then(data => {
                this.updateHealthDisplay(data);
                this.lastHealthData = data;
                this.checkForAlerts(data);
            })
            .catch(error => {
                console.error('Health check failed:', error);
                this.updateHealthDisplay(null);
            })
            .finally(() => {
                this.updateLoadingState(false);
            });
    },

    // Update loading state
    updateLoadingState: function(isLoading) {
        const refreshBtn = document.getElementById('refreshBtn');
        const lastCheckElement = document.getElementById('last-health-check');
        
        if (refreshBtn) {
            if (isLoading) {
                refreshBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Checking...';
                refreshBtn.disabled = true;
            } else {
                refreshBtn.innerHTML = '<i class="fas fa-sync-alt"></i> Refresh';
                refreshBtn.disabled = false;
            }
        }
        
        if (lastCheckElement && !isLoading) {
            lastCheckElement.textContent = Utils.formatDateTime(new Date());
        }
    },

    // Update health display
    updateHealthDisplay: function(healthData) {
        // Update overall status
        this.updateOverallStatus(healthData);
        
        // Update component statuses
        const statusElements = document.querySelectorAll('[data-health-component]');
        statusElements.forEach(element => {
            const component = element.getAttribute('data-health-component');
            const status = this.getComponentStatus(healthData, component);
            this.updateStatusElement(element, status);
        });

        // Update detailed metrics
        this.updateDetailedMetrics(healthData);
        
        // Update last check time
        const timestampElement = document.getElementById('last-health-check');
        if (timestampElement) {
            timestampElement.textContent = Utils.formatDateTime(new Date());
        }
    },

    // Update overall status
    updateOverallStatus: function(healthData) {
        const statusIcon = document.querySelector('.system-status-icon');
        const statusText = document.querySelector('.system-status-text');
        
        if (statusIcon && statusText) {
            if (healthData && healthData.status === 'healthy') {
                statusIcon.className = 'fas fa-check-circle text-success system-status-icon';
                statusText.textContent = 'System Operational';
            } else {
                statusIcon.className = 'fas fa-exclamation-triangle text-warning system-status-icon';
                statusText.textContent = 'System Issues Detected';
            }
        }
    },

    // Update detailed metrics
    updateDetailedMetrics: function(healthData) {
        const metricsContainer = document.querySelector('.health-metrics-container');
        if (!metricsContainer || !healthData) return;
        
        // Update API connectivity
        const apiMetric = metricsContainer.querySelector('[data-metric="api"]');
        if (apiMetric) {
            const status = healthData.api || 'unknown';
            const badgeClass = status === 'reachable' ? 'bg-success' : 'bg-danger';
            apiMetric.innerHTML = `<span class="badge ${badgeClass}">${status.charAt(0).toUpperCase() + status.slice(1)}</span>`;
        }
        
        // Update component metrics
        if (healthData.components) {
            Object.entries(healthData.components).forEach(([component, status]) => {
                const componentMetric = metricsContainer.querySelector(`[data-metric="${component}"]`);
                if (componentMetric) {
                    const badgeClass = status === 'healthy' ? 'bg-success' : 'bg-warning';
                    componentMetric.innerHTML = `<span class="badge ${badgeClass}">${status.charAt(0).toUpperCase() + status.slice(1)}</span>`;
                }
            });
        }
    },

    // Get component status from health data
    getComponentStatus: function(healthData, component) {
        if (!healthData) return 'unknown';
        
        if (component === 'flask-admin') return 'healthy';
        if (component === 'api' && healthData.api) return healthData.api;
        if (healthData.components && healthData.components[component]) {
            return healthData.components[component];
        }
        return 'unknown';
    },

    // Update status element
    updateStatusElement: function(element, status) {
        const statusClasses = {
            'healthy': 'text-success',
            'reachable': 'text-success',
            'unhealthy': 'text-danger',
            'unreachable': 'text-danger',
            'unknown': 'text-warning'
        };

        // Remove old status classes
        Object.values(statusClasses).forEach(cls => {
            element.classList.remove(cls);
        });

        // Add new status class
        if (statusClasses[status]) {
            element.classList.add(statusClasses[status]);
        }

        // Update text content
        element.textContent = status.charAt(0).toUpperCase() + status.slice(1);
    },

    // Check for health alerts
    checkForAlerts: function(healthData) {
        if (!healthData) return;
        
        // Check for API issues
        if (healthData.api === 'unreachable') {
            if (!this.lastHealthData || this.lastHealthData.api !== 'unreachable') {
                Utils.showToast('⚠️ API is unreachable - some features may not work', 'warning', 10000);
            }
        }
        
        // Check for component issues
        if (healthData.components) {
            Object.entries(healthData.components).forEach(([component, status]) => {
                if (status === 'unhealthy') {
                    const wasHealthy = this.lastHealthData?.components?.[component] === 'healthy';
                    if (wasHealthy || !this.lastHealthData) {
                        Utils.showToast(`⚠️ ${component} is unhealthy`, 'warning', 8000);
                    }
                }
            });
        }
    },

    // Manual refresh
    refresh: function() {
        this.checkHealth();
    }
};

// Auto-refresh functionality
const AutoRefresh = {
    interval: null,
    isEnabled: false,

    // Toggle auto-refresh
    toggle: function() {
        if (this.isEnabled) {
            this.stop();
        } else {
            this.start();
        }
        return this.isEnabled;
    },

    // Start auto-refresh
    start: function() {
        this.isEnabled = true;
        
        // Start page-specific refresh
        this.startPageRefresh();
        
        // Update UI
        this.updateUI();
        
        Utils.showToast('Auto-refresh enabled', 'info', 3000);
        console.log('Auto-refresh started');
    },

    // Stop auto-refresh
    stop: function() {
        this.isEnabled = false;
        
        if (this.interval) {
            clearInterval(this.interval);
            this.interval = null;
        }
        
        // Stop page-specific refresh
        this.stopPageRefresh();
        
        // Update UI
        this.updateUI();
        
        Utils.showToast('Auto-refresh disabled', 'info', 3000);
        console.log('Auto-refresh stopped');
    },

    // Start page-specific refresh
    startPageRefresh: function() {
        const currentPage = FlaskAdmin.state.currentPage;
        
        this.interval = setInterval(() => {
            if (!this.isEnabled) return;
            
            switch (currentPage) {
                case '/':
                    if (PageHandlers.refreshDashboardMetrics) {
                        PageHandlers.refreshDashboardMetrics();
                    }
                    break;
                case '/system-health':
                    if (HealthMonitor.checkHealth) {
                        HealthMonitor.checkHealth();
                    }
                    break;
                case '/folders':
                    // Refresh folders list
                    this.refreshCurrentPage();
                    break;
                default:
                    // For other pages, just reload
                    this.refreshCurrentPage();
            }
        }, FlaskAdmin.config.autoRefreshInterval);
    },

    // Stop page-specific refresh
    stopPageRefresh: function() {
        // Stop dashboard refresh
        if (PageHandlers.stopDashboardRefresh) {
            PageHandlers.stopDashboardRefresh();
        }
        
        // Stop health monitoring
        if (HealthMonitor.isMonitoring) {
            HealthMonitor.stop();
        }
    },

    // Refresh current page content
    refreshCurrentPage: function() {
        // Show subtle refresh indicator
        this.showRefreshIndicator();
        
        // Reload page after a short delay
        setTimeout(() => {
            location.reload();
        }, 1000);
    },

    // Show refresh indicator
    showRefreshIndicator: function() {
        let indicator = document.getElementById('auto-refresh-indicator');
        if (!indicator) {
            indicator = document.createElement('div');
            indicator.id = 'auto-refresh-indicator';
            indicator.className = 'position-fixed top-0 end-0 m-3';
            indicator.style.zIndex = '1060';
            document.body.appendChild(indicator);
        }
        
        indicator.innerHTML = `
            <div class="alert alert-info alert-dismissible fade show" role="alert">
                <i class="fas fa-sync-alt fa-spin me-2"></i>
                Auto-refreshing...
                <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
            </div>
        `;
        
        // Auto-hide after 3 seconds
        setTimeout(() => {
            const alert = indicator.querySelector('.alert');
            if (alert) {
                const bsAlert = new bootstrap.Alert(alert);
                bsAlert.close();
            }
        }, 3000);
    },

    // Update UI elements
    updateUI: function() {
        const btn = document.getElementById('auto-refresh-btn');
        const toggle = document.getElementById('auto-refresh-toggle');
        
        if (btn) {
            if (this.isEnabled) {
                btn.innerHTML = '<i class="fas fa-pause"></i> Stop Auto-Refresh';
                btn.classList.remove('btn-outline-secondary');
                btn.classList.add('btn-warning');
            } else {
                btn.innerHTML = '<i class="fas fa-play"></i> Start Auto-Refresh';
                btn.classList.remove('btn-warning');
                btn.classList.add('btn-outline-secondary');
            }
        }
        
        if (toggle) {
            toggle.checked = this.isEnabled;
        }
        
        // Update health monitoring button
        const healthBtn = document.getElementById('autoRefreshBtn');
        if (healthBtn) {
            if (this.isEnabled) {
                healthBtn.innerHTML = '<i class="fas fa-clock"></i> Auto Refresh: On';
                healthBtn.classList.remove('btn-outline-info');
                healthBtn.classList.add('btn-success');
            } else {
                healthBtn.innerHTML = '<i class="fas fa-clock"></i> Auto Refresh: Off';
                healthBtn.classList.remove('btn-success');
                healthBtn.classList.add('btn-outline-info');
            }
        }
    },

    // Get current state
    getState: function() {
        return {
            isEnabled: this.isEnabled,
            interval: this.interval ? FlaskAdmin.config.autoRefreshInterval : null,
            currentPage: FlaskAdmin.state.currentPage
        };
    }
};

// Page-specific functionality
const PageHandlers = {
    // Dashboard page
    dashboard: function() {
        console.log('Dashboard page loaded');
        
        // Add click handlers for metric cards
        document.querySelectorAll('.metric-card').forEach(card => {
            card.addEventListener('click', function() {
                Utils.animate(this, 'bounce-in');
            });
        });
        
        // Setup dashboard refresh functionality
        this.setupDashboardRefresh();
        
        // Setup real-time updates if enabled
        if (FlaskAdmin.state.autoRefreshEnabled) {
            this.startDashboardRefresh();
        }
        
        // Add dashboard-specific keyboard shortcuts
        this.setupDashboardShortcuts();
    },

    // Setup dashboard refresh functionality
    setupDashboardRefresh: function() {
        const refreshBtn = document.getElementById('dashboard-refresh-btn');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => {
                this.refreshDashboardMetrics();
            });
        }
        
        // Auto-refresh toggle
        const autoRefreshToggle = document.getElementById('dashboard-auto-refresh');
        if (autoRefreshToggle) {
            autoRefreshToggle.addEventListener('change', (e) => {
                if (e.target.checked) {
                    this.startDashboardRefresh();
                } else {
                    this.stopDashboardRefresh();
                }
            });
        }
    },

    // Setup dashboard keyboard shortcuts
    setupDashboardShortcuts: function() {
        document.addEventListener('keydown', (e) => {
            // Only on dashboard page
            if (FlaskAdmin.state.currentPage !== '/') return;
            
            // R key to refresh
            if (e.key === 'r' && !e.ctrlKey && !e.metaKey) {
                const activeElement = document.activeElement;
                if (activeElement.tagName !== 'INPUT' && activeElement.tagName !== 'TEXTAREA') {
                    e.preventDefault();
                    this.refreshDashboardMetrics();
                }
            }
        });
    },

    // Start dashboard auto-refresh
    startDashboardRefresh: function() {
        this.stopDashboardRefresh(); // Clear any existing interval
        
        this.dashboardInterval = setInterval(() => {
            this.refreshDashboardMetrics();
        }, FlaskAdmin.config.autoRefreshInterval);
        
        console.log('Dashboard auto-refresh started');
    },

    // Stop dashboard auto-refresh
    stopDashboardRefresh: function() {
        if (this.dashboardInterval) {
            clearInterval(this.dashboardInterval);
            this.dashboardInterval = null;
            console.log('Dashboard auto-refresh stopped');
        }
    },

    // Refresh dashboard metrics via AJAX
    refreshDashboardMetrics: function() {
        const refreshBtn = document.getElementById('dashboard-refresh-btn');
        if (refreshBtn) {
            Utils.showLoading(refreshBtn, 'Refreshing...');
        }
        
        // Fetch dashboard data
        Promise.all([
            AjaxHelper.get('/api/v1/folders', { cache: false, silent: true }),
            AjaxHelper.get('/api/v1/escalations', { cache: false, silent: true })
        ])
        .then(([foldersData, escalationsData]) => {
            const metrics = {
                total_folders: Array.isArray(foldersData) ? foldersData.length : 0,
                pending_escalations: Array.isArray(escalationsData) ? escalationsData.length : 0,
                folders: foldersData || []
            };
            
            this.updateMetricCards(metrics);
            this.updateFoldersList(metrics.folders);
            
            Utils.showToast('Dashboard updated', 'success', 2000);
        })
        .catch(error => {
            console.warn('Failed to refresh dashboard metrics:', error);
            Utils.showToast('Failed to refresh dashboard data', 'warning');
        })
        .finally(() => {
            if (refreshBtn) {
                Utils.hideLoading(refreshBtn);
            }
        });
    },

    // Update metric cards with new data
    updateMetricCards: function(data) {
        const totalFoldersElement = document.querySelector('[data-metric="total-folders"]');
        const pendingEscalationsElement = document.querySelector('[data-metric="pending-escalations"]');
        
        if (totalFoldersElement && data.total_folders !== undefined) {
            this.animateCounter(totalFoldersElement, data.total_folders);
        }
        
        if (pendingEscalationsElement && data.pending_escalations !== undefined) {
            this.animateCounter(pendingEscalationsElement, data.pending_escalations);
        }
    },

    // Update folders list
    updateFoldersList: function(folders) {
        const foldersContainer = document.querySelector('.folders-list-container');
        if (!foldersContainer || !Array.isArray(folders)) return;
        
        if (folders.length === 0) {
            foldersContainer.innerHTML = `
                <div class="text-center py-4">
                    <i class="fas fa-folder-open fa-3x text-muted mb-3"></i>
                    <p class="text-muted">No folders created yet</p>
                    <a href="/folders" class="btn btn-primary">Create First Folder</a>
                </div>
            `;
            return;
        }
        
        const foldersHtml = folders.slice(0, 5).map(folder => `
            <div class="list-group-item list-group-item-action">
                <div class="d-flex w-100 justify-content-between">
                    <h6 class="mb-1">${Utils.sanitizeHtml(folder.name)}</h6>
                    <small class="text-muted">${folder.ticket_count || 0} tickets</small>
                </div>
                <p class="mb-1 text-truncate">${Utils.sanitizeHtml(folder.description || 'No description')}</p>
                <small class="text-muted">Created ${Utils.formatRelativeTime(folder.created_at)}</small>
            </div>
        `).join('');
        
        foldersContainer.innerHTML = `
            <div class="list-group">
                ${foldersHtml}
                ${folders.length > 5 ? `
                    <div class="list-group-item text-center">
                        <a href="/folders" class="btn btn-outline-primary btn-sm">View All ${folders.length} Folders</a>
                    </div>
                ` : ''}
            </div>
        `;
    },

    // Animate counter with number counting effect
    animateCounter: function(element, targetValue) {
        const currentValue = parseInt(element.textContent) || 0;
        const increment = (targetValue - currentValue) / 20;
        let current = currentValue;
        
        if (increment === 0) return; // No change needed
        
        const timer = setInterval(() => {
            current += increment;
            if ((increment > 0 && current >= targetValue) || (increment < 0 && current <= targetValue)) {
                current = targetValue;
                clearInterval(timer);
            }
            element.textContent = Math.round(current);
        }, 50);
        
        // Add visual feedback for changes
        if (targetValue !== currentValue) {
            Utils.animate(element.closest('.metric-card'), 'bounce-in');
        }
    },

    // Folders page
    folders: function() {
        console.log('Folders page loaded');
        
        // Add search functionality
        this.setupFolderSearch();
        
        // Add sorting functionality
        this.setupFolderSorting();
        
        // Add bulk actions
        this.setupBulkActions();
    },

    // Setup folder search
    setupFolderSearch: function() {
        const searchInput = document.getElementById('folder-search');
        if (searchInput) {
            const debouncedSearch = Utils.debounce((query) => {
                this.filterFolders(query);
            }, 300);
            
            searchInput.addEventListener('input', (e) => {
                debouncedSearch(e.target.value);
            });
        }
    },

    // Filter folders based on search query
    filterFolders: function(query) {
        const folderRows = document.querySelectorAll('.folder-row');
        const lowerQuery = query.toLowerCase();
        
        folderRows.forEach(row => {
            const name = row.querySelector('.folder-name')?.textContent.toLowerCase() || '';
            const description = row.querySelector('.folder-description')?.textContent.toLowerCase() || '';
            
            if (name.includes(lowerQuery) || description.includes(lowerQuery)) {
                row.style.display = '';
                Utils.animate(row, 'fade-in');
            } else {
                row.style.display = 'none';
            }
        });
    },

    // Setup folder sorting
    setupFolderSorting: function() {
        const sortButtons = document.querySelectorAll('[data-sort]');
        sortButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                const sortBy = e.target.getAttribute('data-sort');
                this.sortFolders(sortBy);
            });
        });
    },

    // Sort folders by specified criteria
    sortFolders: function(sortBy) {
        const tbody = document.querySelector('.folders-table tbody');
        if (!tbody) return;
        
        const rows = Array.from(tbody.querySelectorAll('.folder-row'));
        
        rows.sort((a, b) => {
            let aValue, bValue;
            
            switch (sortBy) {
                case 'name':
                    aValue = a.querySelector('.folder-name')?.textContent || '';
                    bValue = b.querySelector('.folder-name')?.textContent || '';
                    return aValue.localeCompare(bValue);
                case 'tickets':
                    aValue = parseInt(a.querySelector('.ticket-count')?.textContent) || 0;
                    bValue = parseInt(b.querySelector('.ticket-count')?.textContent) || 0;
                    return bValue - aValue; // Descending order
                case 'created':
                    aValue = new Date(a.getAttribute('data-created') || 0);
                    bValue = new Date(b.getAttribute('data-created') || 0);
                    return bValue - aValue; // Newest first
                default:
                    return 0;
            }
        });
        
        // Re-append sorted rows
        rows.forEach(row => tbody.appendChild(row));
    },

    // Setup bulk actions for folders
    setupBulkActions: function() {
        const selectAllCheckbox = document.getElementById('select-all-folders');
        const folderCheckboxes = document.querySelectorAll('.folder-checkbox');
        const bulkActionButton = document.getElementById('bulk-action-btn');
        
        if (selectAllCheckbox) {
            selectAllCheckbox.addEventListener('change', (e) => {
                folderCheckboxes.forEach(checkbox => {
                    checkbox.checked = e.target.checked;
                });
                this.updateBulkActionButton();
            });
        }
        
        folderCheckboxes.forEach(checkbox => {
            checkbox.addEventListener('change', () => {
                this.updateBulkActionButton();
            });
        });
    },

    // Update bulk action button state
    updateBulkActionButton: function() {
        const selectedCheckboxes = document.querySelectorAll('.folder-checkbox:checked');
        const bulkActionButton = document.getElementById('bulk-action-btn');
        
        if (bulkActionButton) {
            if (selectedCheckboxes.length > 0) {
                bulkActionButton.disabled = false;
                bulkActionButton.textContent = `Actions (${selectedCheckboxes.length})`;
            } else {
                bulkActionButton.disabled = true;
                bulkActionButton.textContent = 'Bulk Actions';
            }
        }
    },

    // Create ticket page
    createTicket: function() {
        console.log('Create ticket page loaded');
        
        // Setup real-time form validation
        this.setupTicketFormValidation();
        
        // Setup classification preview
        this.setupClassificationPreview();
    },

    // Setup ticket form validation
    setupTicketFormValidation: function() {
        const titleInput = document.getElementById('title');
        const descriptionInput = document.getElementById('description');
        
        if (titleInput) {
            titleInput.addEventListener('input', Utils.debounce(() => {
                this.validateTicketTitle(titleInput.value);
            }, 500));
            
            // Add real-time character counter
            this.setupCharacterCounter(titleInput, 200);
        }
        
        if (descriptionInput) {
            descriptionInput.addEventListener('input', Utils.debounce(() => {
                this.validateTicketDescription(descriptionInput.value);
            }, 500));
            
            // Add real-time character counter
            this.setupCharacterCounter(descriptionInput, 2000);
        }
        
        // Setup form submission with enhanced validation
        const form = document.querySelector('form.needs-validation');
        if (form) {
            form.addEventListener('submit', (e) => {
                if (!this.validateForm(form)) {
                    e.preventDefault();
                    e.stopPropagation();
                    Utils.showToast('Please fix the form errors before submitting', 'warning');
                }
                form.classList.add('was-validated');
            });
        }
    },

    // Setup character counter for input fields
    setupCharacterCounter: function(input, maxLength) {
        let counter = input.parentNode.querySelector('.character-counter');
        if (!counter) {
            counter = document.createElement('div');
            counter.className = 'character-counter form-text text-end';
            input.parentNode.appendChild(counter);
        }
        
        const updateCounter = () => {
            const currentLength = input.value.length;
            const remaining = maxLength - currentLength;
            
            counter.textContent = `${currentLength} / ${maxLength} characters`;
            
            if (remaining < 50) {
                counter.className = 'character-counter form-text text-end text-warning';
            } else if (remaining < 0) {
                counter.className = 'character-counter form-text text-end text-danger';
            } else {
                counter.className = 'character-counter form-text text-end text-muted';
            }
        };
        
        input.addEventListener('input', updateCounter);
        updateCounter(); // Initial update
    },

    // Validate entire form
    validateForm: function(form) {
        let isValid = true;
        
        // Check HTML5 validation
        if (!form.checkValidity()) {
            isValid = false;
        }
        
        // Custom validation rules
        const title = form.querySelector('#title')?.value;
        const description = form.querySelector('#description')?.value;
        
        if (title && (title.length < 5 || title.length > 200)) {
            isValid = false;
        }
        
        if (description && (description.length < 10 || description.length > 2000)) {
            isValid = false;
        }
        
        return isValid;
    },

    // Validate ticket title
    validateTicketTitle: function(title) {
        const titleInput = document.getElementById('title');
        const titleFeedback = this.getOrCreateFeedback(titleInput, 'title-feedback');
        
        if (title.length < 5) {
            this.setFieldInvalid(titleInput, titleFeedback, 'Title must be at least 5 characters long');
        } else if (title.length > 200) {
            this.setFieldInvalid(titleInput, titleFeedback, 'Title must be less than 200 characters');
        } else {
            this.setFieldValid(titleInput, titleFeedback, 'Title looks good!');
        }
    },

    // Validate ticket description
    validateTicketDescription: function(description) {
        const descriptionInput = document.getElementById('description');
        const descriptionFeedback = this.getOrCreateFeedback(descriptionInput, 'description-feedback');
        
        if (description.length < 10) {
            this.setFieldInvalid(descriptionInput, descriptionFeedback, 'Description must be at least 10 characters long');
        } else if (description.length > 2000) {
            this.setFieldInvalid(descriptionInput, descriptionFeedback, 'Description must be less than 2000 characters');
        } else {
            this.setFieldValid(descriptionInput, descriptionFeedback, 'Description looks good!');
        }
    },

    // Get or create feedback element
    getOrCreateFeedback: function(input, feedbackId) {
        let feedback = document.getElementById(feedbackId);
        if (!feedback) {
            feedback = document.createElement('div');
            feedback.id = feedbackId;
            feedback.className = 'invalid-feedback';
            input.parentNode.appendChild(feedback);
        }
        return feedback;
    },

    // Set field as invalid
    setFieldInvalid: function(input, feedback, message) {
        input.classList.remove('is-valid');
        input.classList.add('is-invalid');
        feedback.textContent = message;
        feedback.className = 'invalid-feedback d-block';
    },

    // Set field as valid
    setFieldValid: function(input, feedback, message) {
        input.classList.remove('is-invalid');
        input.classList.add('is-valid');
        feedback.textContent = message;
        feedback.className = 'valid-feedback d-block';
    },

    // Setup classification preview
    setupClassificationPreview: function() {
        const previewButton = document.getElementById('preview-classification');
        if (previewButton) {
            previewButton.addEventListener('click', () => {
                this.previewClassification();
            });
        }
        
        // Setup real-time classification as user types
        const titleInput = document.getElementById('title');
        const descriptionInput = document.getElementById('description');
        
        if (titleInput && descriptionInput) {
            const debouncedClassify = Utils.debounce(() => {
                this.autoClassifyPreview();
            }, 2000); // Wait 2 seconds after user stops typing
            
            titleInput.addEventListener('input', debouncedClassify);
            descriptionInput.addEventListener('input', debouncedClassify);
        }
    },

    // Auto-classify as user types (preview only)
    autoClassifyPreview: function() {
        const title = document.getElementById('title')?.value;
        const description = document.getElementById('description')?.value;
        
        // Only auto-classify if both fields have sufficient content
        if (!title || title.length < 10 || !description || description.length < 20) {
            return;
        }
        
        // Show subtle loading indicator
        const previewContainer = this.getOrCreatePreviewContainer();
        previewContainer.innerHTML = `
            <div class="alert alert-light border">
                <div class="d-flex align-items-center">
                    <div class="spinner-border spinner-border-sm me-2" role="status"></div>
                    <small class="text-muted">Analyzing content...</small>
                </div>
            </div>
        `;
        
        AjaxHelper.post('/api/v1/classification/predict', { title, description }, { timeout: 5000 })
            .then(data => {
                if (data) {
                    this.displayAutoClassificationPreview(data);
                }
            })
            .catch(error => {
                // Silently fail for auto-classification
                previewContainer.innerHTML = '';
            });
    },

    // Get or create preview container
    getOrCreatePreviewContainer: function() {
        let container = document.getElementById('auto-classification-preview');
        if (!container) {
            container = document.createElement('div');
            container.id = 'auto-classification-preview';
            container.className = 'mt-3';
            
            // Insert after description field
            const descriptionField = document.getElementById('description')?.parentNode;
            if (descriptionField) {
                descriptionField.insertAdjacentElement('afterend', container);
            }
        }
        return container;
    },

    // Display auto-classification preview
    displayAutoClassificationPreview: function(data) {
        const container = this.getOrCreatePreviewContainer();
        
        container.innerHTML = `
            <div class="alert alert-info border-info">
                <div class="d-flex align-items-center justify-content-between">
                    <div>
                        <h6 class="mb-1"><i class="fas fa-robot"></i> AI Classification Preview</h6>
                        <small class="text-muted">This is a preview - classification will be finalized when you submit</small>
                    </div>
                    <button type="button" class="btn-close" onclick="this.parentElement.parentElement.parentElement.style.display='none'"></button>
                </div>
                <div class="row mt-2">
                    <div class="col-md-6">
                        <strong>Category:</strong>
                        <span class="badge bg-primary ms-1">${data.category || 'Unknown'}</span>
                    </div>
                    <div class="col-md-6">
                        <strong>Confidence:</strong>
                        <div class="progress mt-1" style="height: 20px;">
                            <div class="progress-bar" role="progressbar" 
                                 style="width: ${Math.round((data.confidence || 0) * 100)}%">
                                ${Math.round((data.confidence || 0) * 100)}%
                            </div>
                        </div>
                    </div>
                </div>
                ${data.similar_tickets && data.similar_tickets.length > 0 ? `
                    <div class="mt-2">
                        <small><strong>Similar tickets found:</strong> ${data.similar_tickets.length} matches</small>
                    </div>
                ` : ''}
            </div>
        `;
        
        Utils.animate(container, 'slide-up');
    },

    // Preview classification without creating ticket
    previewClassification: function() {
        const title = document.getElementById('title')?.value;
        const description = document.getElementById('description')?.value;
        
        if (!title || !description) {
            Utils.showToast('Please fill in title and description first', 'warning');
            return;
        }
        
        const previewButton = document.getElementById('preview-classification');
        Utils.showLoading(previewButton, 'Classifying...');
        
        AjaxHelper.post('/api/v1/classification/predict', { title, description })
            .then(data => {
                if (data) {
                    this.displayClassificationPreview(data);
                }
            })
            .catch(error => {
                Utils.showToast('Classification preview failed', 'danger');
            })
            .finally(() => {
                Utils.hideLoading(previewButton);
            });
    },

    // Display classification preview
    displayClassificationPreview: function(data) {
        const previewContainer = document.getElementById('classification-preview');
        if (!previewContainer) return;
        
        previewContainer.innerHTML = `
            <div class="alert alert-success">
                <h6><i class="fas fa-robot"></i> Classification Results</h6>
                <div class="row">
                    <div class="col-md-6">
                        <p><strong>Category:</strong> <span class="badge bg-primary">${data.category || 'Unknown'}</span></p>
                    </div>
                    <div class="col-md-6">
                        <p><strong>Confidence:</strong></p>
                        <div class="progress">
                            <div class="progress-bar" role="progressbar" 
                                 style="width: ${Math.round((data.confidence || 0) * 100)}%">
                                ${Math.round((data.confidence || 0) * 100)}%
                            </div>
                        </div>
                    </div>
                </div>
                ${data.similar_tickets && data.similar_tickets.length > 0 ? `
                    <div class="mt-3">
                        <strong>Similar Tickets:</strong>
                        <div class="mt-2">
                            ${data.similar_tickets.slice(0, 3).map(ticket => `
                                <div class="border rounded p-2 mb-2">
                                    <div class="d-flex justify-content-between">
                                        <small class="fw-bold">${ticket.title}</small>
                                        <small class="text-muted">${Math.round(ticket.similarity_score * 100)}% match</small>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                ` : ''}
            </div>
        `;
        
        Utils.animate(previewContainer, 'slide-up');
    },

    // Classification test page
    classifyTest: function() {
        console.log('Classification test page loaded');
        
        // Setup test examples
        this.setupTestExamples();
    },

    // Setup classification test examples
    setupTestExamples: function() {
        const exampleButtons = document.querySelectorAll('.example-btn');
        exampleButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                const title = e.target.getAttribute('data-title');
                const description = e.target.getAttribute('data-description');
                
                document.getElementById('test-title').value = title;
                document.getElementById('test-description').value = description;
                
                Utils.showToast('Example loaded', 'info', 2000);
            });
        });
    },

    // System health page
    systemHealth: function() {
        HealthMonitor.start();
        console.log('System health page loaded');
        
        // Setup health alerts
        this.setupHealthAlerts();
    },

    // Setup health monitoring alerts
    setupHealthAlerts: function() {
        // Monitor for critical health issues
        const originalUpdateDisplay = HealthMonitor.updateHealthDisplay;
        HealthMonitor.updateHealthDisplay = function(healthData) {
            originalUpdateDisplay.call(this, healthData);
            PageHandlers.checkHealthAlerts(healthData);
        };
    },

    // Check for health alerts
    checkHealthAlerts: function(healthData) {
        if (healthData.api === 'unreachable') {
            Utils.showToast('⚠️ API is unreachable - some features may not work', 'warning', 10000);
        }
        
        if (healthData.components) {
            Object.entries(healthData.components).forEach(([component, status]) => {
                if (status === 'unhealthy') {
                    Utils.showToast(`⚠️ ${component} is unhealthy`, 'warning', 8000);
                }
            });
        }
    }
};

// Initialize application
document.addEventListener('DOMContentLoaded', function() {
    console.log(`Flask Admin v${FlaskAdmin.version} initializing...`);
    
    // Initialize form handling
    FormHandler.init();
    
    // Initialize tooltips and popovers
    initializeBootstrapComponents();
    
    // Initialize page-specific handlers
    const page = FlaskAdmin.state.currentPage;
    if (page === '/') {
        PageHandlers.dashboard();
    } else if (page === '/folders') {
        PageHandlers.folders();
    } else if (page === '/create-ticket') {
        PageHandlers.createTicket();
    } else if (page === '/classify-test') {
        PageHandlers.classifyTest();
    } else if (page === '/system-health') {
        PageHandlers.systemHealth();
    }
    
    // Initialize global features
    initializeGlobalFeatures();
    
    // Initialize performance monitoring
    initializePerformanceMonitoring();
    
    // Add smooth scrolling to anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
    
    // Initialize keyboard shortcuts
    initializeKeyboardShortcuts();
    
    // Initialize accessibility features
    initializeAccessibilityFeatures();
    
    console.log('Flask Admin application initialized successfully');
});

// Initialize Bootstrap components
function initializeBootstrapComponents() {
    // Initialize tooltips
    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });
    
    // Initialize popovers
    const popoverTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="popover"]'));
    popoverTriggerList.map(function (popoverTriggerEl) {
        return new bootstrap.Popover(popoverTriggerEl);
    });
}

// Initialize global features
function initializeGlobalFeatures() {
    // Add copy-to-clipboard functionality
    document.querySelectorAll('[data-copy]').forEach(element => {
        element.addEventListener('click', function() {
            const textToCopy = this.getAttribute('data-copy') || this.textContent;
            Utils.copyToClipboard(textToCopy);
        });
    });
    
    // Add auto-refresh toggle functionality
    const autoRefreshBtn = document.getElementById('auto-refresh-btn');
    if (autoRefreshBtn) {
        autoRefreshBtn.addEventListener('click', () => {
            AutoRefresh.toggle();
        });
    }
    
    // Add health monitoring auto-refresh toggle
    const healthAutoRefreshBtn = document.getElementById('autoRefreshBtn');
    if (healthAutoRefreshBtn) {
        healthAutoRefreshBtn.addEventListener('click', () => {
            const isEnabled = AutoRefresh.toggle();
            if (isEnabled && FlaskAdmin.state.currentPage === '/system-health') {
                HealthMonitor.start();
            }
        });
    }
    
    // Add manual refresh buttons
    const refreshBtn = document.getElementById('refreshBtn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', () => {
            if (FlaskAdmin.state.currentPage === '/system-health') {
                HealthMonitor.refresh();
            } else {
                location.reload();
            }
        });
    }
    
    // Add theme toggle (future enhancement)
    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) {
        themeToggle.addEventListener('click', toggleTheme);
    }
    
    // Initialize loading states for all buttons
    document.querySelectorAll('button[data-loading-text]').forEach(button => {
        button.addEventListener('click', function() {
            const loadingText = this.getAttribute('data-loading-text');
            if (loadingText) {
                Utils.showLoading(this, loadingText);
            }
        });
    });
}
    
// Initialize performance monitoring
function initializePerformanceMonitoring() {
    if ('performance' in window) {
        window.addEventListener('load', () => {
            setTimeout(() => {
                const perfData = performance.getEntriesByType('navigation')[0];
                const loadTime = Math.round(perfData.loadEventEnd - perfData.fetchStart);
                console.log(`Page load time: ${loadTime}ms`);
                
                // Show performance warning if page loads slowly
                if (loadTime > 5000) {
                    Utils.showToast('Page loaded slowly. Consider refreshing if you experience issues.', 'warning', 5000);
                }
            }, 0);
        });
    }
    
    // Monitor AJAX performance
    const originalRequest = AjaxHelper.request;
    AjaxHelper.request = function(url, options = {}) {
        const startTime = performance.now();
        
        return originalRequest.call(this, url, options).then(result => {
            const endTime = performance.now();
            const duration = Math.round(endTime - startTime);
            
            if (duration > 3000) {
                console.warn(`Slow AJAX request: ${url} took ${duration}ms`);
            }
            
            return result;
        });
    };
}

// Initialize accessibility features
function initializeAccessibilityFeatures() {
    // Add skip links
    const skipLink = document.createElement('a');
    skipLink.href = '#main-content';
    skipLink.textContent = 'Skip to main content';
    skipLink.className = 'visually-hidden-focusable btn btn-primary position-absolute top-0 start-0 m-2';
    skipLink.style.zIndex = '9999';
    document.body.insertBefore(skipLink, document.body.firstChild);
    
    // Add main content landmark
    const mainContent = document.querySelector('main');
    if (mainContent && !mainContent.id) {
        mainContent.id = 'main-content';
    }
    
    // Enhance form accessibility
    document.querySelectorAll('input, select, textarea').forEach(field => {
        const label = document.querySelector(`label[for="${field.id}"]`);
        if (!label && field.id) {
            // Add aria-label if no label exists
            const placeholder = field.getAttribute('placeholder');
            if (placeholder) {
                field.setAttribute('aria-label', placeholder);
            }
        }
        
        // Add required indicator to screen readers
        if (field.hasAttribute('required')) {
            const existingLabel = field.getAttribute('aria-label') || '';
            field.setAttribute('aria-label', `${existingLabel} (required)`.trim());
        }
    });
    
    // Announce dynamic content changes
    const announcer = document.createElement('div');
    announcer.setAttribute('aria-live', 'polite');
    announcer.setAttribute('aria-atomic', 'true');
    announcer.className = 'visually-hidden';
    announcer.id = 'accessibility-announcer';
    document.body.appendChild(announcer);
    
    // Enhance toast notifications for screen readers
    const originalShowToast = Utils.showToast;
    Utils.showToast = function(message, type = 'info', duration = null) {
        // Announce to screen readers
        announcer.textContent = `${type}: ${message}`;
        
        return originalShowToast.call(this, message, type, duration);
    };
}

// Initialize keyboard shortcuts
function initializeKeyboardShortcuts() {
    document.addEventListener('keydown', function(e) {
        // Ctrl/Cmd + K for search
        if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
            e.preventDefault();
            const searchInput = document.querySelector('input[type="search"], #folder-search');
            if (searchInput) {
                searchInput.focus();
            }
        }
        
        // Ctrl/Cmd + Enter to submit forms
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
            const activeForm = document.activeElement.closest('form');
            if (activeForm) {
                const submitBtn = activeForm.querySelector('button[type="submit"]');
                if (submitBtn && !submitBtn.disabled) {
                    submitBtn.click();
                }
            }
        }
        
        // Escape to close modals and clear search
        if (e.key === 'Escape') {
            const searchInput = document.querySelector('input[type="search"]:focus');
            if (searchInput) {
                searchInput.value = '';
                searchInput.blur();
            }
        }
    });
}

// Theme toggle function (future enhancement)
function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    
    Utils.showToast(`Switched to ${newTheme} theme`, 'info', 2000);
}

// Cleanup on page unload
window.addEventListener('beforeunload', function() {
    HealthMonitor.stop();
    AutoRefresh.stop();
    
    // Clear any pending timeouts
    FlaskAdmin.state.requestQueue.forEach(request => {
        if (request.abort) request.abort();
    });
});

// Global error handler with enhanced reporting
window.addEventListener('error', function(event) {
    console.error('Global error:', event.error);
    
    // Don't show toast for script loading errors
    if (event.filename && event.filename.includes('.js')) {
        console.warn('Script loading error, not showing user notification');
        return;
    }
    
    Utils.showToast('An unexpected error occurred. Please refresh the page.', 'danger');
    
    // Optional: Send error to monitoring service
    if (window.errorReporting) {
        window.errorReporting.report(event.error);
    }
});

// Handle unhandled promise rejections
window.addEventListener('unhandledrejection', function(event) {
    console.error('Unhandled promise rejection:', event.reason);
    
    // Prevent the default browser behavior
    event.preventDefault();
    
    Utils.showToast('A network error occurred. Please try again.', 'warning');
});

// Export for global access
window.FlaskAdmin = FlaskAdmin;
window.Utils = Utils;
window.AjaxHelper = AjaxHelper;
window.HealthMonitor = HealthMonitor;
window.AutoRefresh = AutoRefresh;