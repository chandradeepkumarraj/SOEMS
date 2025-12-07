import axios from 'axios';

const API_URL = 'http://127.0.0.1:5000/api';

const testUserProfile = async () => {
    try {
        // 1. Register a new user
        const uniqueId = Date.now();
        const userCredentials = {
            name: `Test User ${uniqueId}`,
            email: `testuser${uniqueId}@example.com`,
            password: 'password123',
            role: 'student'
        };

        console.log('1. Registering User...');
        const registerRes = await axios.post(`${API_URL}/auth/register`, userCredentials);
        const token = registerRes.data.token;
        console.log('   Success! Token received.');

        // 2. Get User Profile
        console.log('\n2. Fetching User Profile...');
        const getProfileRes = await axios.get(`${API_URL}/users/profile`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log('   Profile:', getProfileRes.data);

        // 3. Update User Profile
        console.log('\n3. Updating User Profile...');
        const updateData = {
            name: `Updated Name ${uniqueId}`,
            email: `updated${uniqueId}@example.com`
        };
        const updateProfileRes = await axios.put(`${API_URL}/users/profile`, updateData, {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log('   Updated Profile:', updateProfileRes.data);

        // 4. Verify Update
        if (updateProfileRes.data.name === updateData.name && updateProfileRes.data.email === updateData.email) {
            console.log('\n✅ User Profile API Verification PASSED');
        } else {
            console.error('\n❌ Verification FAILED: Data mismatch');
        }

    } catch (error: any) {
        console.error('\n❌ Test Failed:', error.response ? error.response.data : error.message);
    }
};

testUserProfile();
