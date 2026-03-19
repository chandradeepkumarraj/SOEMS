const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

const ExamSchema = new mongoose.Schema({
    title: String,
    status: String,
    isAdaptive: Boolean,
    generationStatus: String,
    questions: [mongoose.Schema.Types.ObjectId]
});

const Exam = mongoose.model('Exam', ExamSchema);

async function checkFailedExams() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        const failedExams = await Exam.find({ isAdaptive: true, generationStatus: 'failed' });
        console.log(`Found ${failedExams.length} adaptive exams with FAILED status:`);
        failedExams.forEach(e => {
            console.log(`- ID: ${e._id}, Title: ${e.title}, Questions: ${e.questions.length}`);
        });

        const generatingExams = await Exam.find({ isAdaptive: true, generationStatus: 'generating' });
        console.log(`\nFound ${generatingExams.length} adaptive exams with GENERATING status:`);
        generatingExams.forEach(e => {
            console.log(`- ID: ${e._id}, Title: ${e.title}, Questions: ${e.questions.length}`);
        });

        const pendingExams = await Exam.find({ isAdaptive: true, generationStatus: 'pending' });
        console.log(`\nFound ${pendingExams.length} adaptive exams with PENDING status:`);
        pendingExams.forEach(e => {
            console.log(`- ID: ${e._id}, Title: ${e.title}, Questions: ${e.questions.length}`);
        });

        await mongoose.disconnect();
    } catch (err) {
        console.error('Error:', err);
    }
}

checkFailedExams();
