const axios = require('axios');

const API_URL = 'http://localhost:5002/api';
const ADMIN_EMAIL = 'admin@soems.edu';
const ADMIN_PASS = 'admin123';
const STUDENT_EMAIL = 'student@soems.edu';
const STUDENT_PASS = 'student123';

async function test() {
    try {
        console.log('--- Phase 1: Authentication ---');
        
        // 1. Login as Admin
        console.log('Logging in as Admin...');
        const adminLogin = await axios.post(`${API_URL}/auth/login`, {
            email: ADMIN_EMAIL,
            password: ADMIN_PASS
        });
        const adminToken = adminLogin.data.token;
        console.log('Admin logged in successfully.');

        // 2. Login as Student (Initially)
        console.log('Logging in as Student (expect success)...');
        const studentLogin = await axios.post(`${API_URL}/auth/login`, {
            email: STUDENT_EMAIL,
            password: STUDENT_PASS
        });
        const studentToken = studentLogin.data.token;
        console.log('Student logged in successfully.');

        console.log('\n--- Phase 2: Toggle Maintenance Mode ON ---');
        
        // 3. Enable Maintenance Mode
        console.log('Enabling Maintenance Mode...');
        await axios.put(`${API_URL}/admin/config/defaults`, 
            { maintenanceMode: true },
            { headers: { Authorization: `Bearer ${adminToken}` } }
        );
        console.log('Maintenance Mode enabled.');

        // 4. Check Status Endpoint
        console.log('Checking status endpoint...');
        const statusResponse = await axios.get(`${API_URL}/auth/maintenance-status`);
        console.log('Status Response:', statusResponse.data);
        if (statusResponse.data.maintenanceMode !== true) {
            throw new Error('Maintenance mode NOT correctly reported by status endpoint');
        }

        console.log('\n--- Phase 3: Verify Enforcement (Blocked) ---');

        // 5. Try Student Login (expect block)
        console.log('Attempting Student Login (expect 503)...');
        try {
            await axios.post(`${API_URL}/auth/login`, {
                email: STUDENT_EMAIL,
                password: STUDENT_PASS
            });
            console.error('FAIL: Student login was NOT blocked!');
        } catch (error) {
            if (error.response && error.response.status === 503) {
                console.log('SUCCESS: Student login blocked with 503.');
                console.log('Error Message:', error.response.data.message);
            } else {
                console.error('FAIL: Student login returned unexpected error:', error.message);
            }
        }

        // 6. Try Student Protected Route (expect block)
        console.log('Attempting Student Protected Route Access (expect 503)...');
        try {
            await axios.get(`${API_URL}/exams`, {
                headers: { Authorization: `Bearer ${studentToken}` }
            });
            console.error('FAIL: Student access to /api/exams was NOT blocked!');
        } catch (error) {
            if (error.response && error.response.status === 503) {
                console.log('SUCCESS: Student route access blocked with 503.');
            } else {
                console.error('FAIL: Student route access returned unexpected error:', error.message);
            }
        }

        // 7. Verify Admin Login Still Works
        console.log('Verifying Admin can still login...');
        await axios.post(`${API_URL}/auth/login`, {
            email: ADMIN_EMAIL,
            password: ADMIN_PASS
        });
        console.log('SUCCESS: Admin can still login.');

        console.log('\n--- Phase 4: Toggle Maintenance Mode OFF ---');

        // 8. Disable Maintenance Mode
        console.log('Disabling Maintenance Mode...');
        await axios.put(`${API_URL}/admin/config/defaults`, 
            { maintenanceMode: false },
            { headers: { Authorization: `Bearer ${adminToken}` } }
        );
        console.log('Maintenance Mode disabled.');

        // 9. Verify Student can login again
        console.log('Verifying Student can login again...');
        await axios.post(`${API_URL}/auth/login`, {
            email: STUDENT_EMAIL,
            password: STUDENT_PASS
        });
        console.log('SUCCESS: Student login restored.');

        console.log('\n--- ALL TESTS PASSED ---');

    } catch (error) {
        console.error('TEST FAILED:', error.response ? error.response.data : error.message);
    }
}

test();
