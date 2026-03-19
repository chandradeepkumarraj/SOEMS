
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

async function checkAdmin() {
    try {
        console.log('Connecting to:', process.env.MONGO_URI);
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://0.0.0.0:27017/soems');
        const User = mongoose.model('User', new mongoose.Schema({}, { strict: false }));
        const adminEmail = process.env.ADMIN_EMAIL || 'admin@soems.edu';
        const user = await User.findOne({ email: adminEmail });
        if (user) {
            console.log('Admin found:');
            console.log('ID:', user._id);
            console.log('Email:', user.email);
            console.log('Role:', user.role);
            // console.log('Full Object:', JSON.stringify(user, null, 2));
        } else {
            console.log('Admin not found with email:', adminEmail);
        }
    } catch (e) {
        console.error('Error:', e);
    } finally {
        await mongoose.disconnect();
    }
}

checkAdmin();
