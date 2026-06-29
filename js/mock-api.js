// mock-api.js - Frontend LocalStorage Mock Backend
// This file overrides fetch to simulate the Express/SQLite backend entirely in your browser

(function() {
    const originalFetch = window.fetch;
    
    // Initialize dummy DB
    if (!localStorage.getItem('users_db')) {
        const defaultUsers = [{
            id: 1,
            name: 'Admin',
            class: '',
            parentName: '',
            phone: '',
            email: 'majestichps@gmail.com',
            password: btoa('admin123'), // Encrypted lightly for mock demo
            role: 'admin'
        }];
        localStorage.setItem('users_db', JSON.stringify(defaultUsers));
    }

    if (!localStorage.getItem('session_user')) {
        localStorage.setItem('session_user', 'null');
    }

    function getUsers() {
        return JSON.parse(localStorage.getItem('users_db'));
    }

    function saveUsers(users) {
        localStorage.setItem('users_db', JSON.stringify(users));
    }

    function mockResponse(data, status = 200) {
        return Promise.resolve({
            ok: status >= 200 && status < 300,
            status: status,
            json: () => Promise.resolve(data)
        });
    }

    window.fetch = async function(url, options) {
        const method = options?.method || 'GET';
        
        // --- Delay simulation
        await new Promise(resolve => setTimeout(resolve, 300));
        
        if (url === '/api/signup' && method === 'POST') {
            const body = JSON.parse(options.body);
            const users = getUsers();
            
            if (users.find(u => u.email === body.email)) {
                return mockResponse({ error: 'Email already exists' }, 400);
            }

            const newUser = {
                id: Date.now(),
                name: body.name,
                class: body.class,
                parentName: body.parentName,
                phone: body.phone,
                email: body.email,
                password: btoa(body.password), // Mock encryption
                role: 'student'
            };
            
            users.push(newUser);
            saveUsers(users);
            
            console.log(`[Mock SMS/Email] Registration successful for ${body.email}.`);
            return mockResponse({ message: 'Registration successful', id: newUser.id }, 201);
        }
        
        if (url === '/api/login' && method === 'POST') {
            const body = JSON.parse(options.body);
            const users = getUsers();
            const user = users.find(u => u.email === body.email && u.role === 'student');
            
            if (user && user.password === btoa(body.password)) {
                localStorage.setItem('session_user', JSON.stringify({ id: user.id, name: user.name, role: user.role }));
                return mockResponse({ message: 'Login successful' }, 200);
            } else {
                return mockResponse({ error: 'Invalid email or password' }, 401);
            }
        }

        if (url === '/api/admin/login' && method === 'POST') {
            const body = JSON.parse(options.body);
            const users = getUsers();
            const user = users.find(u => u.email === body.email && u.role === 'admin');
            
            if (user && user.password === btoa(body.password)) {
                localStorage.setItem('session_user', JSON.stringify({ id: user.id, name: user.name, role: user.role }));
                return mockResponse({ message: 'Admin login successful' }, 200);
            } else {
                return mockResponse({ error: 'Invalid admin email or password' }, 401);
            }
        }
        
        if (url === '/api/me' && method === 'GET') {
            const session = JSON.parse(localStorage.getItem('session_user'));
            if (session) {
                return mockResponse({ user: session }, 200);
            } else {
                return mockResponse({ error: 'Not authenticated' }, 401);
            }
        }
        
        if (url === '/api/logout' && method === 'POST') {
            localStorage.setItem('session_user', 'null');
            return mockResponse({ message: 'Logged out successfully' }, 200);
        }

        if (url === '/api/users' && method === 'GET') {
            const session = JSON.parse(localStorage.getItem('session_user'));
            if (session && session.role === 'admin') {
                return mockResponse(getUsers(), 200);
            }
            return mockResponse({ error: 'Forbidden' }, 403);
        }
        
        if (url.startsWith('/api/users/') && method === 'PUT') {
            const session = JSON.parse(localStorage.getItem('session_user'));
            if (!session || session.role !== 'admin') return mockResponse({ error: 'Forbidden' }, 403);

            const id = parseInt(url.split('/').pop());
            const body = JSON.parse(options.body);
            const users = getUsers();
            const index = users.findIndex(u => u.id === id);
            
            if (index !== -1) {
                users[index] = { ...users[index], ...body };
                saveUsers(users);
                return mockResponse({ message: 'User updated' }, 200);
            }
            return mockResponse({ error: 'User not found' }, 404);
        }

        if (url.startsWith('/api/users/') && method === 'DELETE') {
            const session = JSON.parse(localStorage.getItem('session_user'));
            if (!session || session.role !== 'admin') return mockResponse({ error: 'Forbidden' }, 403);

            const id = parseInt(url.split('/').pop());
            let users = getUsers();
            users = users.filter(u => u.id !== id);
            saveUsers(users);
            return mockResponse({ message: 'User deleted' }, 200);
        }

        // If it's none of the mock APIs, perform the original fetch
        return originalFetch(url, options);
    };
})();
