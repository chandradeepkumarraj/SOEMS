const axios = require('axios');

async function test() {
    try {
        const res = await axios.get('http://localhost:5002/api/auth/maintenance-status');
        console.log('Maintenance Status:', res.data);
    } catch (err) {
        console.error('Error fetching status:', err.message);
        if (err.response) {
            console.error('Data:', err.response.data);
        }
    }
}

test();
