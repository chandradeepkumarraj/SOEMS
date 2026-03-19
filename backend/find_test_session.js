const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const IViolation = require('./dist/models/Violation').default;
const ExamSession = require('./dist/models/ExamSession').default;
const User = require('./dist/models/User').default;

async function run() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to DB');
        
        const session = await ExamSession.findOne({ status: 'in-progress' }).sort({ updatedAt: -1 });
        if (session) {
            const student = await User.findById(session.studentId);
            console.log('FOUND_SESSION:', {
                examId: session.examId.toString(),
                studentId: session.studentId.toString(),
                studentName: student ? student.name : 'Unknown'
            });
        } else {
            console.log('NO_ACTIVE_SESSION_FOUND');
        }
    } catch (err) {
        console.error('ERROR:', err);
    } finally {
        await mongoose.disconnect();
    }
}

run();
