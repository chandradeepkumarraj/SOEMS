const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => res.send('Minimal Server Running'));
app.post('/api/auth/register', (req, res) => {
    console.log('Register hit:', req.body);
    res.json({ message: 'Register worked', token: 'fake-token' });
});

app.listen(5000, '127.0.0.1', () => {
    console.log('Minimal server running on http://127.0.0.1:5000');
});
