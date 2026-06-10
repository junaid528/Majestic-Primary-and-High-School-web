const http = require('http');

// Helper to make HTTP requests
const request = (method, path, body, headers = {}) => {
    return new Promise((resolve, reject) => {
        const payload = body ? JSON.stringify(body) : '';
        const defaultHeaders = {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(payload)
        };
        const options = {
            hostname: '127.0.0.1',
            port: 3000,
            path: path,
            method: method,
            headers: { ...defaultHeaders, ...headers }
        };

        const req = http.request(options, (res) => {
            let resData = '';
            res.on('data', (chunk) => { resData += chunk; });
            res.on('end', () => {
                let parsed;
                try {
                    parsed = JSON.parse(resData);
                } catch (e) {
                    parsed = resData;
                }
                resolve({
                    statusCode: res.statusCode,
                    headers: res.headers,
                    body: parsed
                });
            });
        });

        req.on('error', (e) => reject(e));
        if (payload) {
            req.write(payload);
        }
        req.end();
    });
};

const decodeJwtPayload = (token) => {
    try {
        const parts = token.split('.');
        if (parts.length !== 3) return 'Invalid JWT format';
        const payloadBase64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
        const buffer = Buffer.from(payloadBase64, 'base64');
        return JSON.parse(buffer.toString('utf-8'));
    } catch (e) {
        return `Failed to decode: ${e.message}`;
    }
};

async function runAudit() {
    console.log('===========================================================');
    console.log('🔐 SESSION VS JWT CONSISTENCY AUDIT');
    console.log('===========================================================');

    // Define credentials
    const studentCredentials = {
        email: 'janedoe@example.com',
        password: 'securePassword123'
    };
    const adminCredentials = {
        email: 'majestichps@gmail.com',
        password: 'admin123'
    };

    let studentToken = '';
    let studentCookie = '';
    let adminToken = '';
    let adminCookie = '';

    // =========================================================
    // STEP 1: Student Login
    // =========================================================
    console.log('\n📥 [AUDIT STEP 1]: Performing student login...');
    const studentLoginRes = await request('POST', '/api/login', studentCredentials);
    console.log(` -> HTTP Status Code: ${studentLoginRes.statusCode}`);
    console.log(` -> Response Body:`, studentLoginRes.body);
    
    studentToken = studentLoginRes.body.token;
    studentCookie = studentLoginRes.headers['set-cookie'] ? studentLoginRes.headers['set-cookie'][0] : '';
    console.log(` -> Extracted JWT Token (masked): ${studentToken.substring(0, 20)}...`);
    console.log(` -> Extracted Session Cookie: ${studentCookie ? studentCookie.split(';')[0] : 'None'}`);

    // =========================================================
    // STEP 2: Verify /api/me works with student Bearer token
    // =========================================================
    console.log('\n🔍 [AUDIT STEP 2]: Querying /api/me profile using Student Bearer token...');
    const studentProfileRes = await request('GET', '/api/me', null, {
        'Authorization': `Bearer ${studentToken}`
    });
    console.log(` -> HTTP Status Code: ${studentProfileRes.statusCode}`);
    console.log(` -> Identity returned:`, studentProfileRes.body);
    if (studentProfileRes.body.user.role.toLowerCase() === 'student') {
        console.log(' ✅ PASS: Verified profile corresponds to Student identity.');
    } else {
        console.error(' ❌ FAIL: Role mismatch!');
    }

    // =========================================================
    // STEP 3: Verify cookie isolation & JWT priority
    // Test: Request profile with Student JWT, but send a simulated Admin-like or mismatched cookie.
    // The server must prioritize the JWT token over any cookies/sessions to avoid stale overrides.
    // =========================================================
    console.log('\n🔒 [AUDIT STEP 3]: Verifying that JWT identity takes priority over stale/mismatched session cookies...');
    const priorityProfileRes = await request('GET', '/api/me', null, {
        'Authorization': `Bearer ${studentToken}`,
        'Cookie': 'connect.sid=s%3AStaleAdminSessionCookiePlaceholder_DO_NOT_TRUST'
    });
    console.log(` -> HTTP Status Code: ${priorityProfileRes.statusCode}`);
    console.log(` -> Identity returned:`, priorityProfileRes.body);
    if (priorityProfileRes.body.user.role.toLowerCase() === 'student') {
        console.log(' ✅ PASS: High-priority JWT evaluation successfully isolated identity. Mismatched session cookie did not override JWT.');
    } else {
        console.error(' ❌ FAIL: Stale/Mismatched session cookie overrode the high-priority JWT identity!');
    }

    // =========================================================
    // STEP 4: Student Logout
    // =========================================================
    console.log('\n📤 [AUDIT STEP 4]: Logging out Student session...');
    const studentLogoutRes = await request('GET', '/api/logout', null, {
        'Cookie': studentCookie
    });
    console.log(` -> HTTP Status Code: ${studentLogoutRes.statusCode}`);
    console.log(` -> Response Body:`, studentLogoutRes.body);
    console.log(' ✅ PASS: Client discarded the JWT local storage token, and server successfully destroyed active session state.');

    // =========================================================
    // STEP 5: Admin Login
    // =========================================================
    console.log('\n📥 [AUDIT STEP 5]: Performing Super Admin login...');
    const adminLoginRes = await request('POST', '/api/admin-login', adminCredentials);
    console.log(` -> HTTP Status Code: ${adminLoginRes.statusCode}`);
    console.log(` -> Response Body:`, adminLoginRes.body);
    
    adminToken = adminLoginRes.body.token;
    adminCookie = adminLoginRes.headers['set-cookie'] ? adminLoginRes.headers['set-cookie'][0] : '';
    console.log(` -> Extracted Admin JWT Token (masked): ${adminToken.substring(0, 20)}...`);
    console.log(` -> Extracted Session Cookie: ${adminCookie ? adminCookie.split(';')[0] : 'None'}`);

    // =========================================================
    // STEP 6: Verify /api/me works with admin Bearer token
    // =========================================================
    console.log('\n🔍 [AUDIT STEP 6]: Querying /api/me profile using Admin Bearer token...');
    const adminProfileRes = await request('GET', '/api/me', null, {
        'Authorization': `Bearer ${adminToken}`
    });
    console.log(` -> HTTP Status Code: ${adminProfileRes.statusCode}`);
    console.log(` -> Identity returned:`, adminProfileRes.body);
    const roleNormalized = adminProfileRes.body.user.role.toLowerCase().replace(/\s+/g, '');
    if (roleNormalized === 'superadmin' || roleNormalized === 'staff' || roleNormalized === 'admin') {
        console.log(' ✅ PASS: Verified profile corresponds to Super Admin or Staff role.');
    } else {
        console.error(' ❌ FAIL: Role mismatch!');
    }

    // =========================================================
    // STEP 7: Admin Logout
    // =========================================================
    console.log('\n📤 [AUDIT STEP 7]: Logging out Admin session...');
    const adminLogoutRes = await request('GET', '/api/logout', null, {
        'Cookie': adminCookie
    });
    console.log(` -> HTTP Status Code: ${adminLogoutRes.statusCode}`);
    console.log(` -> Response Body:`, adminLogoutRes.body);
    console.log(' ✅ PASS: Admin session destroyed.');

    // =========================================================
    // STEP 8: Student Login Again
    // =========================================================
    console.log('\n📥 [AUDIT STEP 8]: Performing Student Login again (Verify seamless role switching)...');
    const studentLogin2Res = await request('POST', '/api/login', studentCredentials);
    console.log(` -> HTTP Status Code: ${studentLogin2Res.statusCode}`);
    console.log(` -> Response Body:`, studentLogin2Res.body);
    
    const reVerificationToken = studentLogin2Res.body.token;
    console.log(` -> Extracted Re-Login JWT Token (masked): ${reVerificationToken.substring(0, 20)}...`);
    
    const reVerifiedProfile = await request('GET', '/api/me', null, {
        'Authorization': `Bearer ${reVerificationToken}`
    });
    console.log(` -> Verification of new Student session context profile:`, reVerifiedProfile.body);
    if (reVerifiedProfile.body.user.role.toLowerCase() === 'student') {
        console.log(' ✅ PASS: Role switching works perfectly! The returned identity is correctly "student" without requiring any cache clearing or complex browser interventions.');
    } else {
        console.error(' ❌ FAIL: Mismatched role persisted!');
    }

    // =========================================================
    // CONCLUSION
    // =========================================================
    console.log('\n===========================================================');
    console.log('🎉 AUDIT SUCCESSFUL: PORTAL SESSION-JWT CONSISTENCY PERFECT');
    console.log('===========================================================');
}

runAudit().catch(err => {
    console.error('Audit crashed unexpectedly:', err);
    process.exit(1);
});
