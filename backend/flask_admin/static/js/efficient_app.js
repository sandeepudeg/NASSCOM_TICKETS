// Efficient Flask Admin JavaScript
// Modern, single-page application functionality

class EfficientFlaskAdmin {
    constructor() {
        this.config = {
            autoRefreshInterval: 60000, // 1 minute
            requestTimeout: 10000,
            maxRetries: 2,
            animationDuration: 300
        };
        
        this.state = {
            currentTab: 'overview',
            fabOpen: false,
            autoRefreshEnabled: false,
            refreshInterval: null,
            cache: new Map()
        };
        
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.setupKeyboardShortcuts();
        this.loadInitialData();
        this.setupAutoRefresh();
        this.setupSearch();
    }
    
    // Event Listeners
    setupEventListeners() {
        // Tab switching
        document.querySelectorAll('#mainTabs .nav-link').forEach(tab => {
            tab.addEventListener('click', (e) => {
                this.switchTab(e.target.getAttribute('data-bs-target').replace('#', ''));
            });
        });
        
        // FAB menu
        const fabMain = document.querySelector('.fab-main');
        if (fabMain) {
            fabMain.addEventListener('click', () => this.toggleFAB());
        }
        
        // Quick action buttons
        document.addEventListener('click', (e) => {
            if (e.target.closest('[onclick*="showQuick"]')) {
                e.preventDefault();
                const action = e.target.closest('[onclick*="showQuick"]').getAttribute('onclick');
                if (action.includes('showQuickTicket')) this.showQuickTicket();
                else if (action.includes('showQuickFolder')) this.showQuickFolder();
                else if (action.includes('showQuickClassify')) this.showQuickClassify();
            }
        });
        
        // Global search
        const globalSearch = document.getElementById('globalSearch');
        if (globalSearch) {
            globalSearch.addEventListener('input', this.debounce((e) => {
                this.performGlobalSearch(e.target.value);
            }, 300));
        }

        // Custom Modal Hidden Listener
        document.addEventListener('ds-modal-hidden', (e) => {
            if (e.detail.modalId === 'quickTicketModal') {
                this._closeAndResetTicketModal();
            }
        });
        
        // Settings panel
        document.addEventListener('click', (e) => {
            if (e.target.closest('[onclick*="toggleSettings"]')) {
                e.preventDefault();
                this.toggleSettings();
            }
        });
    }
    
    // Keyboard Shortcuts
    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey || e.metaKey) {
                switch(e.key) {
                    case 't':
                        e.preventDefault();
                        this.showQuickTicket();
                        break;
                    case 'f':
                        e.preventDefault();
                        this.showQuickFolder();
                        break;
                    case 'r':
                        e.preventDefault();
                        this.refreshData();
                        break;
                    case 'k':
                        e.preventDefault();
                        document.getElementById('globalSearch')?.focus();
                        break;
                }
            }
            
            // ESC to close modals/FAB
            if (e.key === 'Escape') {
                this.closeFAB();
                this.closeModals();
            }
        });
    }
    
    // Tab Management
    switchTab(tabName) {
        this.state.currentTab = tabName;
        
        // Load tab-specific data
        switch(tabName) {
            case 'tickets':
                this.loadTickets();
                break;
            case 'folders':
                this.loadFolders();
                break;
            case 'classify':
                this.setupClassifyTab();
                break;
        }
    }
    
    // Data Loading
    loadInitialData() {
        this.updateSystemStatus();
        this.loadActivityFeed();
    }
    
    async loadTickets() {
        try {
            const tickets = await this.apiRequest('/api/tickets');
            this.renderTicketsTable(tickets);
        } catch (error) {
            this.showToast('Failed to load tickets', 'danger');
        }
    }
    
    async loadFolders() {
        try {
            const folders = await this.apiRequest('/api/folders');
            this.renderFoldersGrid(folders);
        } catch (error) {
            this.showToast('Failed to load folders', 'danger');
        }
    }
    
    async updateSystemStatus() {
        try {
            const health = await this.apiRequest('/health');
            this.updateHealthIndicator(health);
        } catch (error) {
            this.updateHealthIndicator(null);
        }
    }
    
    loadActivityFeed() {
        const feed = document.getElementById('activityFeed');
        if (feed) {
            // Simulate activity data
            const activities = [
                { icon: 'plus', text: 'System initialized', time: 'Just now', type: 'success' },
                { icon: 'sync', text: 'Auto-refresh enabled', time: '1 minute ago', type: 'info' }
            ];
            
            feed.innerHTML = activities.map(activity => `
                <div class="activity-item">
                    <div class="activity-icon">
                        <i class="fas fa-${activity.icon} text-${activity.type}"></i>
                    </div>
                    <div class="activity-content">
                        <div class="activity-text">${activity.text}</div>
                        <div class="activity-time">${activity.time}</div>
                    </div>
                </div>
            `).join('');
        }
    }
    
    // Rendering Methods
    renderTicketsTable(tickets) {
        const tbody = document.getElementById('ticketsTableBody');
        if (!tbody) return;
        
        if (tickets.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="7" class="text-center py-4">
                        <i class="fas fa-ticket-alt fa-2x text-muted mb-2"></i>
                        <p class="text-muted">No tickets found</p>
                        <button class="btn btn-success btn-sm" onclick="app.showQuickTicket()">
                            <i class="fas fa-plus"></i> Create First Ticket
                        </button>
                    </td>
                </tr>
            `;
            return;
        }
        
        tbody.innerHTML = tickets.map(ticket => `
            <tr>
                <td><input type="checkbox" value="${ticket.id}"></td>
                <td>
                    <strong>${this.escapeHtml(ticket.title)}</strong>
                    <br><small class="text-muted">${this.truncate(ticket.description, 50)}</small>
                </td>
                <td>${ticket.folder_name || '-'}</td>
                <td><span class="badge bg-primary">${ticket.category || 'Unclassified'}</span></td>
                <td><span class="badge bg-warning">${ticket.status || 'Open'}</span></td>
                <td><small>${this.formatRelativeTime(ticket.created_at)}</small></td>
                <td>
                    <button class="btn btn-sm btn-outline-primary" title="Edit">
                        <i class="fas fa-edit"></i>
                    </button>
                </td>
            </tr>
        `).join('');
    }
    
    renderFoldersGrid(folders) {
        const grid = document.getElementById('foldersGrid');
        if (!grid) return;
        
        const folderCards = folders.map(folder => `
            <div class="folder-card" data-folder-id="${folder.id}">
                <div class="folder-header">
                    <div class="folder-icon">
                        <i class="fas fa-folder"></i>
                    </div>
                    <div class="folder-actions">
                        <button class="btn btn-sm btn-outline-primary" 
                                onclick="app.addTicketToFolder('${folder.id}')" 
                                title="Add Ticket">
                            <i class="fas fa-plus"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-secondary" 
                                onclick="app.editFolder('${folder.id}')" 
                                title="Edit">
                            <i class="fas fa-edit"></i>
                        </button>
                    </div>
                </div>
                <div class="folder-content">
                    <div class="folder-name">${this.escapeHtml(folder.name)}</div>
                    <div class="folder-description">
                        ${folder.description ? this.truncate(folder.description, 50) : 'No description'}
                    </div>
                    <div class="folder-stats">
                        <span class="badge bg-secondary">${folder.ticket_count || 0} tickets</span>
                    </div>
                </div>
            </div>
        `).join('');
        
        // Add "Add New Folder" card
        const addCard = `
            <div class="folder-card add-folder" onclick="app.showQuickFolder()">
                <div class="folder-content text-center">
                    <div class="folder-icon">
                        <i class="fas fa-plus"></i>
                    </div>
                    <div class="folder-name">Add Folder</div>
                </div>
            </div>
        `;
        
        grid.innerHTML = folderCards + addCard;
    }
    
    // Quick Actions
    showQuickTicket() {
        const modal = new bootstrap.Modal(document.getElementById('quickTicketModal'));
        this.loadFoldersForSelect('quickFolder');
        modal.show();
    }
    
    showQuickFolder() {
        const modal = new bootstrap.Modal(document.getElementById('quickFolderModal'));
        modal.show();
    }
    
    showQuickClassify() {
        const modal = new bootstrap.Modal(document.getElementById('quickClassifyModal'));
        modal.show();
    }
    
    async loadFoldersForSelect(selectId) {
        try {
            const folders = await this.apiRequest('/api/folders');
            const select = document.getElementById(selectId);
            if (select) {
                select.innerHTML = '<option value="">Select folder...</option>' +
                    folders.map(folder => 
                        `<option value="${folder.id}">${this.escapeHtml(folder.name)}</option>`
                    ).join('');
            }
        } catch (error) {
            console.error('Failed to load folders for select:', error);
        }
    }
    
    // Form Submissions
    async submitQuickTicket() {
        const title = document.getElementById('quickTitle').value;
        const description = document.getElementById('quickDescription').value;
        const folderId = document.getElementById('quickFolder').value;
        
        if (!title || !description) {
            this.showToast('Please fill in all required fields', 'warning');
            return;
        }
        
        // Show loading state in modal footer
        const createBtn = document.getElementById('createTicketBtn');
        if (createBtn) {
            createBtn.disabled = true;
            createBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creating & Analyzing...';
        }

        try {
            const response = await this.apiRequest('/api/quick-ticket', {
                method: 'POST',
                body: JSON.stringify({
                    title: title,
                    description: description,
                    folder_id: folderId
                })
            });
            
            if (response.success) {
                const ticket = response.ticket;
                const isEscalated = ticket && ticket.routing_status === 'escalated';
                const suggestion = ticket && ticket.resolution_suggestion;
                const similarTickets = ticket && ticket.similar_tickets;

                // If we have a resolution or escalation to show — keep modal open and display result
                if (suggestion || isEscalated) {
                    const formArea = document.getElementById('quickTicketForm');
                    const resultArea = document.getElementById('ticketCreationResult');
                    if (formArea) formArea.style.display = 'none';
                    if (resultArea) {
                        resultArea.style.display = 'block';
                        resultArea.innerHTML = this._buildTicketResultHtml(ticket, suggestion, similarTickets, isEscalated);
                    }
                    if (createBtn) createBtn.style.display = 'none';
                    const closeBtn = document.getElementById('closeTicketModalBtn');
                    if (closeBtn) closeBtn.textContent = 'Done';
                } else {
                    // No suggestion available — dismiss and notify
                    this.showToast('Ticket created successfully!', 'success');
                    this._closeAndResetTicketModal();
                }

                this.refreshCurrentTab();
            } else {
                this.showToast(response.message || 'Failed to create ticket', 'danger');
                if (createBtn) {
                    createBtn.disabled = false;
                    createBtn.innerHTML = '<i class="fas fa-plus"></i> Create Ticket';
                }
            }
        } catch (error) {
            this.showToast('Failed to create ticket', 'danger');
            if (createBtn) {
                createBtn.disabled = false;
                createBtn.innerHTML = '<i class="fas fa-plus"></i> Create Ticket';
            }
        }
    }

    _buildTicketResultHtml(ticket, suggestion, similarTickets, isEscalated) {
        const confidence = ticket ? Math.round((ticket.confidence_score || 0) * 100) : 0;
        const category = ticket ? (ticket.category || 'Unknown') : 'Unknown';
        const routingBadge = isEscalated
            ? `<span class="badge" style="background:rgba(245,158,11,0.15);color:#f59e0b;border:1px solid rgba(245,158,11,0.4)">⚠ Escalated for Human Review</span>`
            : `<span class="badge" style="background:rgba(16,185,129,0.15);color:#10b981;border:1px solid rgba(16,185,129,0.4)">✓ AI Classified</span>`;

        let html = `
            <div style="margin-bottom:1.25rem;">
                <div style="display:flex;align-items:center;gap:0.75rem;flex-wrap:wrap;margin-bottom:0.75rem;">
                    <span class="badge bg-primary">${this.escapeHtml(category)}</span>
                    ${routingBadge}
                    <span style="font-size:0.8rem;color:var(--color-theme-text-muted)">Confidence: <strong>${confidence}%</strong></span>
                </div>
                <p style="margin:0;font-size:0.85rem;color:var(--color-theme-text-secondary)">
                    <strong>${this.escapeHtml(ticket.title || '')}</strong>
                </p>
            </div>`;

        if (isEscalated) {
            html += `
                <div style="background:rgba(245,158,11,0.08);border:1px solid rgba(245,158,11,0.3);border-left:4px solid #f59e0b;border-radius:8px;padding:1rem;margin-bottom:1rem;">
                    <strong style="color:#f59e0b;"><i class="fas fa-exclamation-triangle"></i> Escalated — Human Review Required</strong>
                    <p style="margin:0.5rem 0 0;font-size:0.85rem;color:var(--color-theme-text-secondary)">
                        The AI confidence score (<strong>${confidence}%</strong>) is below the escalation threshold.
                        This ticket has been flagged for review by a human agent in the <strong>${this.escapeHtml(category)}</strong> queue.
                    </p>
                </div>`;
        }

        if (suggestion && suggestion.steps && suggestion.steps.length > 0) {
            const stepsHtml = suggestion.steps.map((step, i) =>
                `<li style="margin-bottom:0.5rem;font-size:0.875rem;color:var(--color-theme-text);">${this.escapeHtml(step)}</li>`
            ).join('');

            const sourceCount = (suggestion.source_ticket_ids || []).length;

            html += `
                <div style="background:rgba(79,70,229,0.06);border:1px solid rgba(79,70,229,0.25);border-left:4px solid #4f46e5;border-radius:8px;padding:1rem;">
                    <strong style="color:#a5b4fc;font-size:0.9rem;"><i class="fas fa-lightbulb"></i> AI Resolution Suggestion</strong>
                    <p style="margin:0.4rem 0 0.75rem;font-size:0.8rem;color:var(--color-theme-text-muted)">
                        Based on ${sourceCount} similar resolved ticket${sourceCount !== 1 ? 's' : ''}:
                    </p>
                    <ol style="padding-left:1.25rem;margin:0;">${stepsHtml}</ol>
                </div>`;
        }

        if (similarTickets && similarTickets.length > 0 && !suggestion) {
            html += `
                <div style="background:var(--color-theme-background-secondary);border:1px solid var(--color-theme-border);border-radius:8px;padding:0.75rem;font-size:0.8rem;">
                    <strong style="color:var(--color-theme-text-secondary)"><i class="fas fa-search"></i> Related Tickets Found</strong>
                    <p style="color:var(--color-theme-text-muted);margin:0.4rem 0 0;">
                        ${similarTickets.length} similar ticket(s) found, but not enough context for a full resolution suggestion.
                    </p>
                </div>`;
        }

        if (!suggestion && !isEscalated) {
            html += `
                <div style="font-size:0.85rem;color:var(--color-theme-text-muted);text-align:center;padding:0.5rem;">
                    <i class="fas fa-info-circle"></i> No similar resolved tickets found for a suggestion yet.
                </div>`;
        }

        return html;
    }

    _closeAndResetTicketModal() {
        const modal = document.getElementById('quickTicketModal');
        if (modal) {
            const bsModal = bootstrap.Modal.getInstance(modal);
            if (bsModal) bsModal.hide();
        }
        this.clearForm('quickTicketForm');
        // Reset the result state
        const formArea = document.getElementById('quickTicketForm');
        const resultArea = document.getElementById('ticketCreationResult');
        if (formArea) formArea.style.display = '';
        if (resultArea) { resultArea.style.display = 'none'; resultArea.innerHTML = ''; }
        const createBtn = document.getElementById('createTicketBtn');
        if (createBtn) {
            createBtn.style.display = '';
            createBtn.disabled = false;
            createBtn.innerHTML = '<i class="fas fa-plus"></i> Create Ticket';
        }
        const closeBtn = document.getElementById('closeTicketModalBtn');
        if (closeBtn) closeBtn.textContent = 'Cancel';
    }

    
    async submitQuickFolder() {
        const name = document.getElementById('folderName').value;
        const description = document.getElementById('folderDescription').value;
        
        if (!name) {
            this.showToast('Please enter a folder name', 'warning');
            return;
        }
        
        try {
            const response = await this.apiRequest('/api/quick-folder', {
                method: 'POST',
                body: JSON.stringify({
                    name: name,
                    description: description
                })
            });
            
            if (response.success) {
                this.showToast('Folder created successfully!', 'success');
                bootstrap.Modal.getInstance(document.getElementById('quickFolderModal')).hide();
                this.clearForm('quickFolderForm');
                this.refreshCurrentTab();
            } else {
                this.showToast(response.message || 'Failed to create folder', 'danger');
            }
        } catch (error) {
            this.showToast('Failed to create folder', 'danger');
        }
    }
    
    async submitQuickClassify() {
        const text = document.getElementById('classifyText').value;
        const results = document.getElementById('classifyResults');
        
        if (!text) {
            this.showToast('Please enter text to classify', 'warning');
            return;
        }
        
        try {
            results.style.display = 'block';
            results.innerHTML = '<div class="text-center"><i class="fas fa-spinner fa-spin"></i> Classifying...</div>';
            
            const response = await this.apiRequest('/api/quick-classify', {
                method: 'POST',
                body: JSON.stringify({ text: text })
            });
            
            if (response.success) {
                const classification = response.classification;
                results.innerHTML = `
                    <div class="classification-result">
                        <h6>Classification Result:</h6>
                        <div class="mb-2">
                            <strong>Category:</strong> 
                            <span class="badge bg-primary">${classification.category || 'Unknown'}</span>
                        </div>
                        <div class="mb-2">
                            <strong>Confidence:</strong>
                            <div class="progress">
                                <div class="progress-bar" style="width: ${(classification.confidence * 100) || 0}%">
                                    ${Math.round((classification.confidence * 100) || 0)}%
                                </div>
                            </div>
                        </div>
                        ${response.cached ? '<small class="text-muted">Cached result</small>' : ''}
                    </div>
                `;
            } else {
                results.innerHTML = `<div class="alert alert-danger">${response.message || 'Classification failed'}</div>`;
            }
        } catch (error) {
            results.innerHTML = '<div class="alert alert-danger">Classification failed</div>';
        }
    }
    
    // FAB Management
    toggleFAB() {
        const menu = document.getElementById('fabMenu');
        this.state.fabOpen = !this.state.fabOpen;
        
        if (menu) {
            menu.style.display = this.state.fabOpen ? 'block' : 'none';
            menu.style.animation = this.state.fabOpen ? 'fadeInUp 0.3s ease-out' : '';
        }
    }
    
    closeFAB() {
        const menu = document.getElementById('fabMenu');
        this.state.fabOpen = false;
        if (menu) {
            menu.style.display = 'none';
        }
    }
    
    // Settings Management
    toggleSettings() {
        const offcanvas = new bootstrap.Offcanvas(document.getElementById('settingsPanel'));
        offcanvas.show();
    }
    
    // Health Management
    updateHealthIndicator(health) {
        const statusElement = document.getElementById('systemStatus');
        const healthIcon = document.getElementById('healthIcon');
        
        if (statusElement) {
            if (health && health.status === 'healthy') {
                statusElement.innerHTML = '<i class="fas fa-circle text-success"></i> <small class="text-light">Online</small>';
            } else {
                statusElement.innerHTML = '<i class="fas fa-circle text-warning"></i> <small class="text-light">Issues</small>';
            }
        }
        
        if (healthIcon) {
            healthIcon.className = health && health.status === 'healthy' 
                ? 'fas fa-heartbeat text-success' 
                : 'fas fa-heartbeat text-warning';
        }
    }
    
    toggleHealthPanel() {
        const panel = document.getElementById('healthPanel');
        if (panel) {
            const isVisible = panel.style.display !== 'none';
            panel.style.display = isVisible ? 'none' : 'block';
            
            if (!isVisible) {
                this.updateSystemStatus();
            }
        }
    }
    
    // Search Functionality
    setupSearch() {
        const ticketSearch = document.getElementById('ticketSearch');
        const folderSearch = document.getElementById('folderSearch');
        
        if (ticketSearch) {
            ticketSearch.addEventListener('input', this.debounce((e) => {
                this.filterTickets(e.target.value);
            }, 300));
        }
        
        if (folderSearch) {
            folderSearch.addEventListener('input', this.debounce((e) => {
                this.filterFolders(e.target.value);
            }, 300));
        }
    }
    
    performGlobalSearch(query) {
        if (!query.trim()) return;
        
        // Implement global search logic
        console.log('Global search:', query);
        // This would search across tickets, folders, etc.
    }
    
    filterTickets(query) {
        const rows = document.querySelectorAll('#ticketsTableBody tr');
        rows.forEach(row => {
            const text = row.textContent.toLowerCase();
            const matches = text.includes(query.toLowerCase());
            row.style.display = matches ? '' : 'none';
        });
    }
    
    filterFolders(query) {
        const cards = document.querySelectorAll('.folder-card:not(.add-folder)');
        cards.forEach(card => {
            const text = card.textContent.toLowerCase();
            const matches = text.includes(query.toLowerCase());
            card.style.display = matches ? '' : 'none';
        });
    }
    
    // Auto-refresh
    setupAutoRefresh() {
        const interval = localStorage.getItem('refreshInterval') || 60;
        if (interval > 0) {
            this.state.autoRefreshEnabled = true;
            this.state.refreshInterval = setInterval(() => {
                this.refreshData();
            }, interval * 1000);
        }
    }
    
    refreshData() {
        this.updateSystemStatus();
        this.refreshCurrentTab();
        this.loadActivityFeed();
        this.showToast('Data refreshed', 'info', 2000);
    }
    
    refreshCurrentTab() {
        switch(this.state.currentTab) {
            case 'tickets':
                this.loadTickets();
                break;
            case 'folders':
                this.loadFolders();
                break;
        }
    }
    
    // Utility Methods
    async apiRequest(url, options = {}) {
        const defaultOptions = {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest'
            }
        };
        
        // Add CSRF token for non-GET requests
        if (options.method && options.method !== 'GET') {
            const csrfToken = document.querySelector('input[name="csrf_token"]')?.value ||
                             document.querySelector('meta[name="csrf-token"]')?.content;
            if (csrfToken) {
                defaultOptions.headers['X-CSRFToken'] = csrfToken;
            }
        }
        
        const config = { ...defaultOptions, ...options };
        
        try {
            const response = await fetch(url, config);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            return await response.json();
        } catch (error) {
            console.error('API request failed:', error);
            throw error;
        }
    }
    
    showToast(message, type = 'info', duration = 5000) {
        const container = document.getElementById('flashContainer');
        if (!container) return;
        
        const toast = document.createElement('div');
        toast.className = `alert alert-${type} alert-dismissible fade show`;
        toast.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
        
        container.appendChild(toast);
        
        setTimeout(() => {
            if (toast.parentNode) {
                toast.remove();
            }
        }, duration);
    }
    
    clearForm(formId) {
        const form = document.getElementById(formId);
        if (form) {
            form.reset();
        }
    }
    
    closeModals() {
        document.querySelectorAll('.modal.show').forEach(modal => {
            const bsModal = bootstrap.Modal.getInstance(modal);
            if (bsModal) {
                bsModal.hide();
            }
        });
    }
    
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    truncate(text, length) {
        if (!text) return '';
        return text.length > length ? text.substring(0, length) + '...' : text;
    }
    
    formatRelativeTime(dateString) {
        if (!dateString) return 'Unknown';
        
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHours / 24);
        
        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        
        return date.toLocaleDateString();
    }
    
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
}

// Global functions for onclick handlers
window.showQuickTicket = () => app.showQuickTicket();
window.showQuickFolder = () => app.showQuickFolder();
window.showQuickClassify = () => app.showQuickClassify();
window.submitQuickTicket = () => app.submitQuickTicket();
window.submitQuickFolder = () => app.submitQuickFolder();
window.submitQuickClassify = () => app.submitQuickClassify();
window.toggleFAB = () => app.toggleFAB();
window.toggleSettings = () => app.toggleSettings();
window.toggleHealthPanel = () => app.toggleHealthPanel();
window.refreshData = () => app.refreshData();

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.app = new EfficientFlaskAdmin();
});