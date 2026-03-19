import mongoose from 'mongoose';
import { SERVER_CONFIG } from './serverConfig';

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(SERVER_CONFIG.MONGO_URI || '');
        console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch (error: any) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
};

export default connectDB;
