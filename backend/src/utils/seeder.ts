import User from '../models/User';
import dotenv from 'dotenv';

dotenv.config();

const seedAdmin = async () => {
    try {
        const adminEmail = process.env.ADMIN_EMAIL || 'admin@soems.edu';
        const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';

        const userExists = await User.findOne({ email: adminEmail });

        if (userExists) {
            console.log('Admin user already exists');
        } else {
            await User.create({
                name: 'System Admin',
                email: adminEmail,
                password: adminPassword,
                role: 'admin'
            });
            console.log(`Admin user created: ${adminEmail} / ${adminPassword}`);
        }
    } catch (error) {
        console.error(`Error seeding admin: ${error}`);
    }
};

export default seedAdmin;
