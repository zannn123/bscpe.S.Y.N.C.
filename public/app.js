// CPE Sync - Frontend Application
class CPESync {
    constructor() {
        this.currentUser = null;
        this.socket = null;
        this.isDarkMode = localStorage.getItem('darkMode') === 'true';
        this.currentEventId = null;
        
        this.init();
    }

    init() {
        this.initSocket();
        this.setupEventListeners();
        this.setupDarkMode();
        this.checkAuthStatus();
        this.loadEvents();
    }

    // Socket.IO initialization
    initSocket() {
        this.socket = io();
        
        this.socket.on('connect', () => {
            console.log('Connected to server');
            if (this.currentUser) {
                this.socket.emit('authenticate', {
                    userId: this.currentUser.id,
                    role: this.currentUser.role
                });
            }
        });

        // Real-time event listeners
        this.socket.on('newEvent', (event) => {
            this.showNotification('New event created!', 'success');
            this.addEventToDOM(event);
        });

        this.socket.on('eventUpdated', (event) => {
            this.showNotification('Event updated!', 'info');
            this.updateEventInDOM(event);
        });

        this.socket.on('eventDeleted', (data) => {
            this.showNotification('Event deleted!', 'warning');
            this.removeEventFromDOM(data.eventId);
        });

        this.socket.on('newAttendanceSubmission', (submission) => {
            if (this.currentUser && this.currentUser.role === 'admin') {
                this.showNotification(`New attendance submission for ${submission.eventTitle}`, 'info');
                this.updateAdminStats();
            }
        });

        this.socket.on('attendanceStatusUpdated', (data) => {
            if (this.currentUser && this.currentUser.role === 'student') {
                const statusColor = data.status === 'verified' ? 'success' : 
                                  data.status === 'rejected' ? 'error' : 'info';
                this.showNotification(`Attendance ${data.status} for event`, statusColor);
                this.loadAttendanceHistory();
            }
        });
    }

    // Event listeners setup
    setupEventListeners() {
        // Navigation
        document.getElementById('nav-home').addEventListener('click', () => this.showPage('home'));
        document.getElementById('nav-login').addEventListener('click', () => this.showPage('login'));
        document.getElementById('nav-register').addEventListener('click', () => this.showPage('register'));
        document.getElementById('nav-logout').addEventListener('click', () => this.logout());

        // Mobile navigation
        document.getElementById('mobile-menu-btn').addEventListener('click', () => {
            const menu = document.getElementById('mobile-menu');
            menu.classList.toggle('hidden');
        });

        document.querySelectorAll('.mobile-nav-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const target = e.target.getAttribute('data-target');
                this.showPage(target);
                document.getElementById('mobile-menu').classList.add('hidden');
            });
        });

        // Login tabs
        document.getElementById('student-login-tab').addEventListener('click', () => this.switchLoginTab('student'));
        document.getElementById('admin-login-tab').addEventListener('click', () => this.switchLoginTab('admin'));

        // Login/Register navigation
        document.getElementById('go-to-register').addEventListener('click', () => this.showPage('register'));
        document.getElementById('go-to-login').addEventListener('click', () => this.showPage('login'));

        // Forms
        document.getElementById('student-login-form').addEventListener('submit', (e) => this.handleStudentLogin(e));
        document.getElementById('admin-login-form').addEventListener('submit', (e) => this.handleAdminLogin(e));
        document.getElementById('register-form').addEventListener('submit', (e) => this.handleRegister(e));

        // Admin functionality
        document.getElementById('btn-create-event').addEventListener('click', () => this.showCreateEventSection());
        document.getElementById('btn-manage-users').addEventListener('click', () => this.showManageUsersSection());
        document.getElementById('btn-attendance-overview').addEventListener('click', () => this.showAttendanceOverviewSection());

        document.getElementById('create-event-form').addEventListener('submit', (e) => this.handleCreateEvent(e));
        document.getElementById('generate-code').addEventListener('click', () => this.generateAttendanceCode());
        document.getElementById('cancel-create-event').addEventListener('click', () => this.hideAllAdminSections());

        // Attendance modal
        document.getElementById('close-attendance-modal').addEventListener('click', () => this.closeAttendanceModal());
        document.getElementById('attendance-form').addEventListener('submit', (e) => this.handleAttendanceSubmission(e));

        // Image modal
        document.getElementById('close-image-modal').addEventListener('click', () => this.closeImageModal());

        // Dark mode toggle
        document.getElementById('darkModeToggle').addEventListener('click', () => this.toggleDarkMode());
    }

    // Dark mode setup
    setupDarkMode() {
        if (this.isDarkMode) {
            document.body.classList.add('dark');
            document.getElementById('darkModeToggle').innerHTML = '<i class="fas fa-sun text-yellow-500"></i>';
        }
    }

    toggleDarkMode() {
        this.isDarkMode = !this.isDarkMode;
        localStorage.setItem('darkMode', this.isDarkMode);
        document.body.classList.toggle('dark');
        
        const icon = document.getElementById('darkModeToggle');
        icon.innerHTML = this.isDarkMode ? 
            '<i class="fas fa-sun text-yellow-500"></i>' : 
            '<i class="fas fa-moon text-gray-600"></i>';
    }

    // Authentication
    checkAuthStatus() {
        const savedUser = localStorage.getItem('cpeSync_user');
        if (savedUser) {
            this.currentUser = JSON.parse(savedUser);
            this.updateNavigation();
            this.updateUserDisplay();
            
            if (this.currentUser.role === 'admin') {
                this.showPage('admin');
                this.loadAdminData();
            } else {
                this.showPage('home');
                this.loadAttendanceHistory();
            }
        }
    }

    updateNavigation() {
        const loginBtn = document.getElementById('nav-login');
        const registerBtn = document.getElementById('nav-register');
        const logoutBtn = document.getElementById('nav-logout');

        if (this.currentUser) {
            loginBtn.classList.add('hidden');
            registerBtn.classList.add('hidden');
            logoutBtn.classList.remove('hidden');
        } else {
            loginBtn.classList.remove('hidden');
            registerBtn.classList.remove('hidden');
            logoutBtn.classList.add('hidden');
        }
    }

    updateUserDisplay() {
        if (this.currentUser && this.currentUser.role === 'student') {
            const userCard = document.getElementById('user-info-card');
            const userName = document.getElementById('user-name');
            const userId = document.getElementById('user-id');
            
            userCard.classList.remove('hidden');
            userName.textContent = this.currentUser.fullName;
            userId.textContent = `ID: ${this.currentUser.idNumber}`;
            
            document.getElementById('attendance-history-section').classList.remove('hidden');
        }
    }

    // Login/Register handlers
    switchLoginTab(type) {
        const studentTab = document.getElementById('student-login-tab');
        const adminTab = document.getElementById('admin-login-tab');
        const studentForm = document.getElementById('student-login-form');
        const adminForm = document.getElementById('admin-login-form');

        if (type === 'student') {
            studentTab.classList.add('bg-white', 'text-blue-600', 'shadow-sm');
            studentTab.classList.remove('text-gray-500');
            adminTab.classList.remove('bg-white', 'text-blue-600', 'shadow-sm');
            adminTab.classList.add('text-gray-500');
            
            studentForm.classList.remove('hidden');
            adminForm.classList.add('hidden');
        } else {
            adminTab.classList.add('bg-white', 'text-red-600', 'shadow-sm');
            adminTab.classList.remove('text-gray-500');
            studentTab.classList.remove('bg-white', 'text-blue-600', 'shadow-sm');
            studentTab.classList.add('text-gray-500');
            
            adminForm.classList.remove('hidden');
            studentForm.classList.add('hidden');
        }
    }

    async handleStudentLogin(e) {
        e.preventDefault();
        
        const idNumber = document.getElementById('student-id').value;
        const password = document.getElementById('student-password').value;

        try {
            const response = await fetch('/api/login/student', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ idNumber, password })
            });

            const data = await response.json();

            if (response.ok) {
                this.currentUser = data.user;
                localStorage.setItem('cpeSync_user', JSON.stringify(this.currentUser));
                
                this.socket.emit('authenticate', {
                    userId: this.currentUser.id,
                    role: this.currentUser.role
                });

                this.showNotification('Login successful!', 'success');
                this.updateNavigation();
                this.updateUserDisplay();
                this.loadAttendanceHistory();
                this.showPage('home');
            } else {
                this.showNotification(data.error, 'error');
            }
        } catch (error) {
            this.showNotification('Login failed. Please try again.', 'error');
        }
    }

    async handleAdminLogin(e) {
        e.preventDefault();
        
        const adminCode = document.getElementById('admin-code').value;

        try {
            const response = await fetch('/api/login/admin', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ adminCode })
            });

            const data = await response.json();

            if (response.ok) {
                this.currentUser = data.user;
                localStorage.setItem('cpeSync_user', JSON.stringify(this.currentUser));
                
                this.socket.emit('authenticate', {
                    userId: this.currentUser.id,
                    role: this.currentUser.role
                });

                this.showNotification('Admin login successful!', 'success');
                this.updateNavigation();
                this.loadAdminData();
                this.showPage('admin');
            } else {
                this.showNotification(data.error, 'error');
            }
        } catch (error) {
            this.showNotification('Admin login failed. Please try again.', 'error');
        }
    }

    async handleRegister(e) {
        e.preventDefault();
        
        const fullName = document.getElementById('register-name').value;
        const idNumber = document.getElementById('register-id').value;
        const password = document.getElementById('register-password').value;

        try {
            const response = await fetch('/api/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ fullName, idNumber, password })
            });

            const data = await response.json();

            if (response.ok) {
                this.showNotification('Registration successful! Please login.', 'success');
                this.showPage('login');
                
                // Clear form
                document.getElementById('register-form').reset();
            } else {
                this.showNotification(data.error, 'error');
            }
        } catch (error) {
            this.showNotification('Registration failed. Please try again.', 'error');
        }
    }

    logout() {
        this.currentUser = null;
        localStorage.removeItem('cpeSync_user');
        this.updateNavigation();
        
        document.getElementById('user-info-card').classList.add('hidden');
        document.getElementById('attendance-history-section').classList.add('hidden');
        
        this.showNotification('Logged out successfully!', 'info');
        this.showPage('home');
    }

    // Page management
    showPage(page) {
        const pages = ['home', 'login', 'register', 'admin'];
        pages.forEach(p => {
            document.getElementById(`page-${p}`).classList.add('hidden');
        });
        
        document.getElementById(`page-${page}`).classList.remove('hidden');
        
        if (page === 'admin' && this.currentUser && this.currentUser.role === 'admin') {
            this.hideAllAdminSections();
        }
    }

    // Events management
    async loadEvents() {
        try {
            const response = await fetch('/api/events');
            const events = await response.json();
            
            this.renderEvents(events);
        } catch (error) {
            console.error('Failed to load events:', error);
        }
    }

    renderEvents(events) {
        const container = document.getElementById('events-container');
        
        if (events.length === 0) {
            container.innerHTML = `
                <div class="col-span-full text-center py-12">
                    <i class="fas fa-calendar-times text-6xl text-gray-300 mb-4"></i>
                    <h3 class="text-xl font-semibold text-gray-600 mb-2">No Events Available</h3>
                    <p class="text-gray-500">Check back later for upcoming events!</p>
                </div>
            `;
            return;
        }

        container.innerHTML = events.map(event => this.createEventCard(event)).join('');
    }

    createEventCard(event) {
        const eventDate = new Date(event.dateTime);
        const now = new Date();
        const isUpcoming = eventDate > now;
        const isPast = eventDate < new Date(now.getTime() - 12 * 60 * 60 * 1000); // 12 hours ago
        
        const statusBadge = isPast ? 
            '<span class="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm font-medium">Past Event</span>' :
            isUpcoming ? 
            '<span class="px-3 py-1 bg-blue-100 text-blue-600 rounded-full text-sm font-medium">Upcoming</span>' :
            '<span class="px-3 py-1 bg-green-100 text-green-600 rounded-full text-sm font-medium animate-pulse">Active</span>';

        const attendButton = this.currentUser && this.currentUser.role === 'student' && !isPast ? 
            `<button onclick="app.openAttendanceModal('${event.id}', '${event.title}')" 
                     class="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white py-2 px-4 rounded-lg font-medium hover:from-green-600 hover:to-emerald-700 transition-all">
                <i class="fas fa-check-circle mr-2"></i>Submit Attendance
             </button>` : '';

        return `
            <div class="glass-effect rounded-2xl p-6 border border-white/20 hover:border-blue-200 transition-all duration-300 slide-in" data-event-id="${event.id}">
                <div class="flex justify-between items-start mb-4">
                    <h4 class="text-lg font-bold text-gray-900 line-clamp-2">${event.title}</h4>
                    ${statusBadge}
                </div>
                
                <p class="text-gray-600 mb-4 line-clamp-3">${event.description}</p>
                
                <div class="flex items-center text-sm text-gray-500 mb-4">
                    <i class="fas fa-calendar mr-2"></i>
                    <span>${eventDate.toLocaleDateString()}</span>
                    <i class="fas fa-clock ml-4 mr-2"></i>
                    <span>${eventDate.toLocaleTimeString()}</span>
                </div>
                
                ${attendButton}
            </div>
        `;
    }

    addEventToDOM(event) {
        const container = document.getElementById('events-container');
        
        // Check if container has "no events" message
        if (container.innerHTML.includes('No Events Available')) {
            container.innerHTML = '';
        }
        
        const eventCard = this.createEventCard(event);
        container.insertAdjacentHTML('afterbegin', eventCard);
    }

    updateEventInDOM(event) {
        const eventElement = document.querySelector(`[data-event-id="${event.id}"]`);
        if (eventElement) {
            eventElement.outerHTML = this.createEventCard(event);
        }
    }

    removeEventFromDOM(eventId) {
        const eventElement = document.querySelector(`[data-event-id="${eventId}"]`);
        if (eventElement) {
            eventElement.remove();
        }
        
        // Check if no events remain
        const container = document.getElementById('events-container');
        if (!container.children.length) {
            this.renderEvents([]);
        }
    }

    // Attendance management
    openAttendanceModal(eventId, eventTitle) {
        if (!this.currentUser || this.currentUser.role !== 'student') {
            this.showNotification('Please login as a student to submit attendance.', 'error');
            return;
        }

        this.currentEventId = eventId;
        document.getElementById('attendance-modal-title').textContent = `Submit Attendance - ${eventTitle}`;
        document.getElementById('attendance-modal').classList.remove('hidden');
    }

    closeAttendanceModal() {
        this.currentEventId = null;
        document.getElementById('attendance-modal').classList.add('hidden');
        document.getElementById('attendance-form').reset();
    }

    async handleAttendanceSubmission(e) {
        e.preventDefault();

        const attendanceCode = document.getElementById('attendance-code').value;
        const proofPhoto = document.getElementById('proof-photo').files[0];
        const caption = document.getElementById('photo-caption').value;

        if (!proofPhoto) {
            this.showNotification('Please upload a proof photo.', 'error');
            return;
        }

        const formData = new FormData();
        formData.append('eventId', this.currentEventId);
        formData.append('userId', this.currentUser.id);
        formData.append('attendanceCode', attendanceCode);
        formData.append('proofPhoto', proofPhoto);
        formData.append('caption', caption);

        try {
            const response = await fetch('/api/attendance', {
                method: 'POST',
                body: formData
            });

            const data = await response.json();

            if (response.ok) {
                this.showNotification('Attendance submitted successfully!', 'success');
                this.closeAttendanceModal();
                this.loadAttendanceHistory();
            } else {
                this.showNotification(data.error, 'error');
            }
        } catch (error) {
            this.showNotification('Failed to submit attendance. Please try again.', 'error');
        }
    }

    async loadAttendanceHistory() {
        if (!this.currentUser || this.currentUser.role !== 'student') return;

        try {
            const response = await fetch(`/api/attendance/user/${this.currentUser.id}`);
            const records = await response.json();
            
            this.renderAttendanceHistory(records);
        } catch (error) {
            console.error('Failed to load attendance history:', error);
        }
    }

    renderAttendanceHistory(records) {
        const container = document.getElementById('attendance-history');
        
        if (records.length === 0) {
            container.innerHTML = `
                <div class="text-center py-8">
                    <i class="fas fa-history text-4xl text-gray-300 mb-4"></i>
                    <p class="text-gray-500">No attendance records yet.</p>
                </div>
            `;
            return;
        }

        container.innerHTML = records.map(record => {
            const statusColors = {
                pending: 'bg-yellow-100 text-yellow-700',
                verified: 'bg-green-100 text-green-700',
                rejected: 'bg-red-100 text-red-700'
            };

            const statusIcons = {
                pending: 'fas fa-clock',
                verified: 'fas fa-check-circle',
                rejected: 'fas fa-times-circle'
            };

            return `
                <div class="glass-effect rounded-lg p-4 border border-white/20">
                    <div class="flex justify-between items-start">
                        <div class="flex-1">
                            <h4 class="font-semibold text-gray-900">${record.eventTitle}</h4>
                            <p class="text-sm text-gray-600 mt-1">
                                Submitted: ${new Date(record.submittedAt).toLocaleString()}
                            </p>
                            ${record.caption ? `<p class="text-sm text-gray-700 mt-2 italic">"${record.caption}"</p>` : ''}
                        </div>
                        <span class="px-3 py-1 rounded-full text-sm font-medium ${statusColors[record.status]}">
                            <i class="${statusIcons[record.status]} mr-1"></i>
                            ${record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                        </span>
                    </div>
                </div>
            `;
        }).join('');
    }

    // Admin functions
    async loadAdminData() {
        await Promise.all([
            this.updateAdminStats(),
            this.loadAdminEvents(),
            this.loadUsers()
        ]);
    }

    async updateAdminStats() {
        try {
            const [eventsRes, usersRes] = await Promise.all([
                fetch('/api/admin/events'),
                fetch('/api/admin/users')
            ]);

            const events = await eventsRes.json();
            const users = await usersRes.json();

            // Calculate pending and verified attendance
            let pendingCount = 0;
            let verifiedCount = 0;

            for (const event of events) {
                const attendanceRes = await fetch(`/api/admin/attendance/${event.id}`);
                const attendance = await attendanceRes.json();
                
                pendingCount += attendance.filter(a => a.status === 'pending').length;
                verifiedCount += attendance.filter(a => a.status === 'verified').length;
            }

            document.getElementById('stat-events').textContent = events.length;
            document.getElementById('stat-students').textContent = users.length;
            document.getElementById('stat-pending').textContent = pendingCount;
            document.getElementById('stat-verified').textContent = verifiedCount;
        } catch (error) {
            console.error('Failed to update admin stats:', error);
        }
    }

    showCreateEventSection() {
        this.hideAllAdminSections();
        document.getElementById('create-event-section').classList.remove('hidden');
    }

    showManageUsersSection() {
        this.hideAllAdminSections();
        document.getElementById('manage-users-section').classList.remove('hidden');
        this.loadUsers();
    }

    showAttendanceOverviewSection() {
        this.hideAllAdminSections();
        document.getElementById('attendance-overview-section').classList.remove('hidden');
        this.loadAttendanceOverview();
    }

    hideAllAdminSections() {
        const sections = ['create-event-section', 'manage-users-section', 'attendance-overview-section'];
        sections.forEach(section => {
            document.getElementById(section).classList.add('hidden');
        });
    }

    generateAttendanceCode() {
        const code = Math.random().toString(36).substr(2, 8).toUpperCase();
        document.getElementById('event-code').value = code;
    }

    async handleCreateEvent(e) {
        e.preventDefault();

        const title = document.getElementById('event-title').value;
        const description = document.getElementById('event-description').value;
        const dateTime = document.getElementById('event-datetime').value;
        const attendanceCode = document.getElementById('event-code').value;

        try {
            const response = await fetch('/api/admin/events', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title, description, dateTime, attendanceCode })
            });

            const data = await response.json();

            if (response.ok) {
                this.showNotification('Event created successfully!', 'success');
                document.getElementById('create-event-form').reset();
                this.hideAllAdminSections();
                this.updateAdminStats();
            } else {
                this.showNotification(data.error, 'error');
            }
        } catch (error) {
            this.showNotification('Failed to create event. Please try again.', 'error');
        }
    }

    async loadAdminEvents() {
        try {
            const response = await fetch('/api/admin/events');
            const events = await response.json();
            // Admin events are handled by the attendance overview
        } catch (error) {
            console.error('Failed to load admin events:', error);
        }
    }

    async loadUsers() {
        try {
            const response = await fetch('/api/admin/users');
            const users = await response.json();
            
            this.renderUsersTable(users);
        } catch (error) {
            console.error('Failed to load users:', error);
        }
    }

    renderUsersTable(users) {
        const container = document.getElementById('users-table');
        
        if (users.length === 0) {
            container.innerHTML = `
                <div class="text-center py-8">
                    <i class="fas fa-users text-4xl text-gray-300 mb-4"></i>
                    <p class="text-gray-500">No registered students yet.</p>
                </div>
            `;
            return;
        }

        container.innerHTML = `
            <table class="w-full">
                <thead>
                    <tr class="border-b border-gray-200">
                        <th class="text-left py-3 px-4 font-semibold text-gray-700">Full Name</th>
                        <th class="text-left py-3 px-4 font-semibold text-gray-700">ID Number</th>
                        <th class="text-left py-3 px-4 font-semibold text-gray-700">Registered</th>
                        <th class="text-center py-3 px-4 font-semibold text-gray-700">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${users.map(user => `
                        <tr class="border-b border-gray-100 hover:bg-gray-50">
                            <td class="py-3 px-4">${user.fullName}</td>
                            <td class="py-3 px-4 font-mono">${user.idNumber}</td>
                            <td class="py-3 px-4 text-sm text-gray-600">
                                ${new Date(user.registeredAt).toLocaleDateString()}
                            </td>
                            <td class="py-3 px-4 text-center">
                                <button onclick="app.deleteUser('${user.id}', '${user.fullName}')" 
                                        class="text-red-600 hover:text-red-700 font-medium">
                                    <i class="fas fa-trash"></i> Delete
                                </button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    }

    async deleteUser(userId, userName) {
        if (!confirm(`Are you sure you want to delete ${userName}'s account? This action cannot be undone.`)) {
            return;
        }

        try {
            const response = await fetch(`/api/admin/users/${userId}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                this.showNotification('User deleted successfully!', 'success');
                this.loadUsers();
                this.updateAdminStats();
            } else {
                const data = await response.json();
                this.showNotification(data.error, 'error');
            }
        } catch (error) {
            this.showNotification('Failed to delete user. Please try again.', 'error');
        }
    }

    async loadAttendanceOverview() {
        try {
            const response = await fetch('/api/admin/events');
            const events = await response.json();
            
            this.renderAttendanceOverview(events);
        } catch (error) {
            console.error('Failed to load attendance overview:', error);
        }
    }

    async renderAttendanceOverview(events) {
        const container = document.getElementById('events-attendance');
        
        if (events.length === 0) {
            container.innerHTML = `
                <div class="text-center py-8">
                    <i class="fas fa-chart-bar text-4xl text-gray-300 mb-4"></i>
                    <p class="text-gray-500">No events to show attendance for.</p>
                </div>
            `;
            return;
        }

        let html = '';
        
        for (const event of events) {
            const attendanceRes = await fetch(`/api/admin/attendance/${event.id}`);
            const attendance = await attendanceRes.json();
            
            html += `
                <div class="glass-effect rounded-2xl p-6 border border-white/20">
                    <div class="flex justify-between items-start mb-4">
                        <div>
                            <h4 class="text-xl font-bold text-gray-900">${event.title}</h4>
                            <p class="text-gray-600 mt-1">${event.description}</p>
                            <p class="text-sm text-gray-500 mt-2">
                                <i class="fas fa-calendar mr-2"></i>
                                ${new Date(event.dateTime).toLocaleString()}
                            </p>
                            <p class="text-sm text-gray-700 mt-1 font-mono">
                                Code: <span class="bg-gray-100 px-2 py-1 rounded">${event.attendanceCode}</span>
                            </p>
                        </div>
                        <div class="flex space-x-2">
                            <button onclick="app.exportAttendance('${event.id}')" 
                                    class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                                <i class="fas fa-download mr-2"></i>Export CSV
                            </button>
                        </div>
                    </div>
                    
                    ${attendance.length === 0 ? 
                        '<p class="text-gray-500 italic">No attendance submissions yet.</p>' :
                        this.renderAttendanceTable(attendance, event.id)
                    }
                </div>
            `;
        }
        
        container.innerHTML = html;
    }

    renderAttendanceTable(attendance, eventId) {
        return `
            <div class="overflow-x-auto">
                <table class="w-full">
                    <thead>
                        <tr class="border-b border-gray-200">
                            <th class="text-left py-2 px-3 font-semibold text-gray-700">Student</th>
                            <th class="text-left py-2 px-3 font-semibold text-gray-700">ID Number</th>
                            <th class="text-left py-2 px-3 font-semibold text-gray-700">Submitted</th>
                            <th class="text-left py-2 px-3 font-semibold text-gray-700">Photo</th>
                            <th class="text-left py-2 px-3 font-semibold text-gray-700">Status</th>
                            <th class="text-center py-2 px-3 font-semibold text-gray-700">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${attendance.map(record => `
                            <tr class="border-b border-gray-100">
                                <td class="py-2 px-3">${record.userFullName}</td>
                                <td class="py-2 px-3 font-mono text-sm">${record.userIdNumber}</td>
                                <td class="py-2 px-3 text-sm text-gray-600">
                                    ${new Date(record.submittedAt).toLocaleString()}
                                </td>
                                <td class="py-2 px-3">
                                    ${record.proofPhoto ? 
                                        `<img src="/uploads/${record.proofPhoto}" 
                                              alt="Proof photo" 
                                              class="w-12 h-12 object-cover rounded-lg cursor-pointer"
                                              onclick="app.openImageModal('/uploads/${record.proofPhoto}')">` :
                                        '<span class="text-gray-400">No photo</span>'
                                    }
                                </td>
                                <td class="py-2 px-3">
                                    <span class="px-2 py-1 rounded-full text-xs font-medium ${
                                        record.status === 'verified' ? 'bg-green-100 text-green-700' :
                                        record.status === 'rejected' ? 'bg-red-100 text-red-700' :
                                        'bg-yellow-100 text-yellow-700'
                                    }">
                                        ${record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                                    </span>
                                </td>
                                <td class="py-2 px-3 text-center">
                                    ${record.status === 'pending' ? 
                                        `<div class="flex space-x-1">
                                            <button onclick="app.updateAttendanceStatus('${record.id}', 'verified')" 
                                                    class="px-2 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700">
                                                Verify
                                            </button>
                                            <button onclick="app.updateAttendanceStatus('${record.id}', 'rejected')" 
                                                    class="px-2 py-1 bg-red-600 text-white rounded text-xs hover:bg-red-700">
                                                Reject
                                            </button>
                                        </div>` :
                                        `<button onclick="app.updateAttendanceStatus('${record.id}', 'pending')" 
                                                 class="px-2 py-1 bg-gray-600 text-white rounded text-xs hover:bg-gray-700">
                                            Reset
                                         </button>`
                                    }
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    }

    async updateAttendanceStatus(recordId, status) {
        try {
            const response = await fetch(`/api/admin/attendance/${recordId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status })
            });

            if (response.ok) {
                this.showNotification(`Attendance ${status}!`, 'success');
                this.loadAttendanceOverview();
                this.updateAdminStats();
            } else {
                const data = await response.json();
                this.showNotification(data.error, 'error');
            }
        } catch (error) {
            this.showNotification('Failed to update attendance status.', 'error');
        }
    }

    async exportAttendance(eventId) {
        try {
            const response = await fetch(`/api/admin/export/${eventId}`);
            
            if (response.ok) {
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `attendance_${eventId}_${Date.now()}.csv`;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
                
                this.showNotification('Attendance exported successfully!', 'success');
            } else {
                this.showNotification('Failed to export attendance.', 'error');
            }
        } catch (error) {
            this.showNotification('Export failed. Please try again.', 'error');
        }
    }

    openImageModal(imageSrc) {
        document.getElementById('modal-image').src = imageSrc;
        document.getElementById('image-modal').classList.remove('hidden');
    }

    closeImageModal() {
        document.getElementById('image-modal').classList.add('hidden');
    }

    // Utility functions
    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification bg-white border-l-4 p-4 rounded-lg shadow-lg max-w-sm ${
            type === 'success' ? 'border-green-500' :
            type === 'error' ? 'border-red-500' :
            type === 'warning' ? 'border-yellow-500' :
            'border-blue-500'
        }`;

        const icon = type === 'success' ? 'check-circle' :
                    type === 'error' ? 'exclamation-circle' :
                    type === 'warning' ? 'exclamation-triangle' :
                    'info-circle';

        const color = type === 'success' ? 'text-green-600' :
                     type === 'error' ? 'text-red-600' :
                     type === 'warning' ? 'text-yellow-600' :
                     'text-blue-600';

        notification.innerHTML = `
            <div class="flex items-center">
                <i class="fas fa-${icon} ${color} mr-3"></i>
                <p class="text-gray-800 font-medium">${message}</p>
                <button onclick="this.parentElement.parentElement.remove()" class="ml-auto text-gray-400 hover:text-gray-600">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;

        document.getElementById('notifications').appendChild(notification);

        // Auto remove after 5 seconds
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 5000);
    }
}

// Initialize the application
const app = new CPESync();

// Make app globally accessible for onclick handlers
window.app = app;