import axios from 'axios';

const API_URL = 'http://127.0.0.1:5000/api/auth';

const testAuth = async () => {
    try {
        console.log('1. Testing Registration...');
        const registerRes = await axios.post(`${API_URL}/register`, {
            name: 'Test User',
            email: `test${Date.now()}@example.com`,
            password: 'password123',
            role: 'student'
        });
        console.log('✅ Registration Successful:', registerRes.data);

        const { email, password } = { email: registerRes.data.email, password: 'password123' };

        console.log('\n2. Testing Login...');
        const loginRes = await axios.post(`${API_URL}/login`, {
            email,
            password
        });
        console.log('✅ Login Successful:', loginRes.data);

        if (loginRes.data.token) {
            console.log('\n✅ Token received.');
        } else {
            console.error('\n❌ No token received.');
        }

    } catch (error: any) {
        console.error('❌ Error:', error.response ? error.response.data : error.message);
    }
};

testAuth();
