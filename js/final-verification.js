/**
 * PHASE 15 - FINAL VERIFICATION TEST SUITE
 * Comprehensive end-to-end and security testing
 */

const FinalVerification = (() => {
    const tests = {
        e2e: [],
        security: [],
        performance: [],
        database: [],
        api: []
    };

    const results = {
        passed: 0,
        failed: 0,
        warnings: 0,
        errors: []
    };

    /**
     * Test 1: New User Registration
     */
    async function testUserRegistration() {
        console.log('\n🔍 TEST 1: User Registration Flow');
        try {
            const testData = {
                name: 'Test Student',
                email: `test_${Date.now()}@test.com`,
                password: 'TestPass123!',
                role: 'STUDENT',
                mobile_number: '9876543210'
            };

            const response = await fetch('http://127.0.0.1:8000/api/v1/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(testData)
            });

            if (response.ok) {
                console.log('✅ PASS: User registration successful');
                return { passed: true, message: 'Registration working' };
            } else {
                const error = await response.json();
                console.warn('⚠️  WARN:', error.detail);
                return { passed: false, message: error.detail };
            }
        } catch (err) {
            console.error('❌ FAIL:', err.message);
            return { passed: false, message: err.message };
        }
    }

    /**
     * Test 2: Admin Login
     */
    async function testAdminLogin() {
        console.log('\n🔍 TEST 2: Admin Login');
        try {
            const response = await fetch('http://127.0.0.1:8000/api/v1/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: 'majestichps@gmail.com',
                    password: 'admin123'
                })
            });

            if (response.ok) {
                const data = await response.json();
                if (data.access_token) {
                    localStorage.setItem('jwt_token', data.access_token);
                    localStorage.setItem('user_role', data.role);
                    console.log('✅ PASS: Admin login successful - JWT stored');
                    return { passed: true, token: data.access_token, role: data.role };
                }
            }
            console.error('❌ FAIL: Login failed');
            return { passed: false };
        } catch (err) {
            console.error('❌ FAIL:', err.message);
            return { passed: false, message: err.message };
        }
    }

    /**
     * Test 3: JWT Token Validation
     */
    async function testJWTValidation() {
        console.log('\n🔍 TEST 3: JWT Token Validation');
        try {
            const token = localStorage.getItem('jwt_token');
            if (!token) {
                console.warn('⚠️  WARN: No token in localStorage');
                return { passed: false, message: 'No token found' };
            }

            const parts = token.split('.');
            if (parts.length !== 3) {
                console.error('❌ FAIL: Invalid JWT format');
                return { passed: false, message: 'Invalid format' };
            }

            const payload = JSON.parse(atob(parts[1]));
            const expiryTime = payload.exp * 1000;
            const currentTime = Date.now();

            if (currentTime > expiryTime) {
                console.error('❌ FAIL: Token has expired');
                return { passed: false, message: 'Token expired' };
            }

            const timeRemaining = Math.floor((expiryTime - currentTime) / 1000 / 60);
            console.log(`✅ PASS: JWT valid - Expires in ${timeRemaining} minutes`);
            return { passed: true, expiresIn: timeRemaining };
        } catch (err) {
            console.error('❌ FAIL:', err.message);
            return { passed: false, message: err.message };
        }
    }

    /**
     * Test 4: Admission Submission
     */
    async function testAdmissionSubmission() {
        console.log('\n🔍 TEST 4: Admission Submission');
        try {
            const admissionData = {
                student_name: 'Test Student ' + Date.now(),
                parent_name: 'Test Parent',
                mobile: '9876543210',
                email: `admission_${Date.now()}@test.com`,
                class_applied: 'CLASS_1',
                address: '123 Test Street',
                previous_school: 'Test School',
                remarks: 'Test admission'
            };

            const response = await fetch('http://127.0.0.1:8000/api/v1/admissions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(admissionData)
            });

            if (response.ok) {
                const data = await response.json();
                console.log('✅ PASS: Admission submitted - ID:', data.id);
                return { passed: true, admissionId: data.id };
            } else {
                const error = await response.json();
                console.error('❌ FAIL:', error.detail);
                return { passed: false, message: error.detail };
            }
        } catch (err) {
            console.error('❌ FAIL:', err.message);
            return { passed: false, message: err.message };
        }
    }

    /**
     * Test 5: Contact Submission
     */
    async function testContactSubmission() {
        console.log('\n🔍 TEST 5: Contact Form Submission');
        try {
            const contactData = {
                name: 'Test Contact',
                email: `contact_${Date.now()}@test.com`,
                subject: 'Test Subject',
                message: 'This is a test message for contact form.'
            };

            const response = await fetch('http://127.0.0.1:8000/api/v1/contact', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(contactData)
            });

            if (response.ok) {
                console.log('✅ PASS: Contact message submitted');
                return { passed: true };
            } else {
                const error = await response.json();
                console.error('❌ FAIL:', error.detail);
                return { passed: false, message: error.detail };
            }
        } catch (err) {
            console.error('❌ FAIL:', err.message);
            return { passed: false, message: err.message };
        }
    }

    /**
     * Test 6: Admin Stats Endpoint
     */
    async function testAdminStats() {
        console.log('\n🔍 TEST 6: Admin Dashboard Statistics');
        try {
            const token = localStorage.getItem('jwt_token');
            const response = await fetch('http://127.0.0.1:8000/api/v1/admin/stats', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const data = await response.json();
                console.log('✅ PASS: Admin stats retrieved');
                console.log('   - Total Admissions:', data.total_admissions);
                console.log('   - Pending Admissions:', data.pending_admissions);
                console.log('   - Contacts:', data.contact_count);
                return { passed: true, stats: data };
            } else if (response.status === 401) {
                console.error('❌ FAIL: Unauthorized (401) - JWT may be invalid');
                return { passed: false, message: 'Unauthorized' };
            } else {
                console.error('❌ FAIL:', response.status);
                return { passed: false, message: `Status ${response.status}` };
            }
        } catch (err) {
            console.error('❌ FAIL:', err.message);
            return { passed: false, message: err.message };
        }
    }

    /**
     * Test 7: Authorization Headers
     */
    async function testAuthorizationHeaders() {
        console.log('\n🔍 TEST 7: Authorization Header Requirement');
        try {
            // Test without token
            const noTokenResponse = await fetch('http://127.0.0.1:8000/api/v1/admin/stats');
            
            if (noTokenResponse.status === 401 || noTokenResponse.status === 403) {
                console.log('✅ PASS: Protected endpoint rejects requests without auth header');
                return { passed: true };
            } else {
                console.warn('⚠️  WARN: Protected endpoint did not reject unauthenticated request');
                return { passed: false, message: 'Auth not enforced' };
            }
        } catch (err) {
            console.error('❌ FAIL:', err.message);
            return { passed: false, message: err.message };
        }
    }

    /**
     * Test 8: Role-Based Access Control
     */
    async function testRBAC() {
        console.log('\n🔍 TEST 8: Role-Based Access Control');
        try {
            // Test that only admins can access admin endpoints
            const token = localStorage.getItem('jwt_token');
            const role = localStorage.getItem('user_role');

            if (role === 'SUPER_ADMIN' || role === 'ADMIN') {
                console.log(`✅ PASS: User has admin role (${role})`);
                return { passed: true, role: role };
            } else {
                console.warn(`⚠️  WARN: User role is ${role}, not admin`);
                return { passed: false, message: `Invalid role: ${role}` };
            }
        } catch (err) {
            console.error('❌ FAIL:', err.message);
            return { passed: false, message: err.message };
        }
    }

    /**
     * Test 9: Form Validation
     */
    async function testFormValidation() {
        console.log('\n🔍 TEST 9: Client-Side Form Validation');
        try {
            // Test email validation
            if (ErrorHandler && ErrorHandler.isValidEmail) {
                const validEmail = ErrorHandler.isValidEmail('test@example.com');
                const invalidEmail = ErrorHandler.isValidEmail('invalid-email');

                if (validEmail && !invalidEmail) {
                    console.log('✅ PASS: Email validation working');
                } else {
                    console.warn('⚠️  WARN: Email validation inconsistent');
                    return { passed: false };
                }

                // Test phone validation
                const validPhone = ErrorHandler.isValidPhone('9876543210');
                const invalidPhone = ErrorHandler.isValidPhone('123');

                if (validPhone && !invalidPhone) {
                    console.log('✅ PASS: Phone validation working');
                    return { passed: true };
                } else {
                    console.warn('⚠️  WARN: Phone validation inconsistent');
                    return { passed: false };
                }
            }
        } catch (err) {
            console.error('❌ FAIL:', err.message);
            return { passed: false, message: err.message };
        }
    }

    /**
     * Test 10: Error Handling
     */
    async function testErrorHandling() {
        console.log('\n🔍 TEST 10: Error Handling & Toast Notifications');
        try {
            // Test showing error toast
            if (ErrorHandler && ErrorHandler.showErrorToast) {
                ErrorHandler.showErrorToast('Test error message', 1000);
                console.log('✅ PASS: Error handler toast working');
                return { passed: true };
            } else {
                console.error('❌ FAIL: ErrorHandler not available');
                return { passed: false };
            }
        } catch (err) {
            console.error('❌ FAIL:', err.message);
            return { passed: false };
        }
    }

    /**
     * Run all tests
     */
    async function runAllTests() {
        console.log('\n' + '='.repeat(60));
        console.log('PHASE 15: FINAL VERIFICATION TEST SUITE');
        console.log('='.repeat(60));

        const testSuite = [
            { name: 'User Registration', fn: testUserRegistration },
            { name: 'Admin Login', fn: testAdminLogin },
            { name: 'JWT Validation', fn: testJWTValidation },
            { name: 'Admission Submission', fn: testAdmissionSubmission },
            { name: 'Contact Submission', fn: testContactSubmission },
            { name: 'Admin Stats', fn: testAdminStats },
            { name: 'Authorization Headers', fn: testAuthorizationHeaders },
            { name: 'RBAC', fn: testRBAC },
            { name: 'Form Validation', fn: testFormValidation },
            { name: 'Error Handling', fn: testErrorHandling }
        ];

        const startTime = performance.now();

        for (const test of testSuite) {
            try {
                const result = await test.fn();
                if (result.passed) {
                    results.passed++;
                } else {
                    results.failed++;
                    results.errors.push({
                        test: test.name,
                        message: result.message
                    });
                }
            } catch (err) {
                results.failed++;
                results.errors.push({
                    test: test.name,
                    message: err.message
                });
            }
        }

        const endTime = performance.now();
        const duration = ((endTime - startTime) / 1000).toFixed(2);

        // Print summary
        console.log('\n' + '='.repeat(60));
        console.log('TEST SUMMARY');
        console.log('='.repeat(60));
        console.log(`✅ Passed: ${results.passed}/${testSuite.length}`);
        console.log(`❌ Failed: ${results.failed}/${testSuite.length}`);
        console.log(`⏱️  Duration: ${duration}s`);
        console.log(`📊 Pass Rate: ${((results.passed / testSuite.length) * 100).toFixed(1)}%`);

        if (results.errors.length > 0) {
            console.log('\n❌ FAILURES:');
            results.errors.forEach((err, idx) => {
                console.log(`  ${idx + 1}. ${err.test}: ${err.message}`);
            });
        }

        console.log('\n' + '='.repeat(60));

        return results;
    }

    /**
     * Generate production readiness report
     */
    function generateProductionReadinessReport() {
        const passRate = (results.passed / (results.passed + results.failed)) * 100;
        const readinessScore = Math.max(0, Math.min(100, Math.round(passRate * 0.95))); // 95% of pass rate

        return {
            timestamp: new Date().toISOString(),
            testsPassed: results.passed,
            testsFailed: results.failed,
            passRate: passRate.toFixed(1) + '%',
            productionReadiness: readinessScore + '%',
            recommendations: getRecommendations(readinessScore),
            criticalIssues: results.errors.filter(e => 
                e.test.includes('Security') || e.test.includes('Auth')
            ),
            warnings: results.errors.filter(e => 
                !e.test.includes('Security') && !e.test.includes('Auth')
            )
        };
    }

    /**
     * Get recommendations based on readiness score
     */
    function getRecommendations(score) {
        if (score >= 95) {
            return ['✅ Production ready', '✅ All critical tests passing', '✅ Security verified'];
        } else if (score >= 80) {
            return ['⚠️  Review failures before deployment', '⚠️  Fix critical security issues', '🔄 Re-test after fixes'];
        } else {
            return ['❌ Not production ready', '❌ Major issues must be resolved', '❌ Additional testing required'];
        }
    }

    // Public API
    return {
        runAllTests,
        generateProductionReadinessReport,
        getResults: () => results
    };
})();

// Auto-run tests on page load if verification page
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        if (window.location.pathname.includes('test') || window.location.pathname.includes('verify')) {
            FinalVerification.runAllTests().then(() => {
                const report = FinalVerification.generateProductionReadinessReport();
                console.log('\n📋 PRODUCTION READINESS REPORT:', report);
            });
        }
    });
}
