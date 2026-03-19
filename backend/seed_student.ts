import mongoose from 'mongoose';
import User from './src/models/User';
import dotenv from 'dotenv';

dotenv.config();

const seedStudent = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI!);
        
        const studentEmail = 'student@soems.edu';
        const studentPassword = 'student123';

        const userExists = await User.findOne({ email: studentEmail });

        if (!userExists) {
            await User.create({
                name: 'Test Student',
                email: studentEmail,
                password: studentPassword,
                role: 'student'
            });
            console.log(`Student user created: ${studentEmail} / ${studentPassword}`);
        } else {
            console.log('Student user already exists');
        }
        
        await mongoose.connection.close();
    } catch (error) {
        console.error(`Error seeding student: ${error}`);
        process.exit(1);
    }
};

seedStudent();
