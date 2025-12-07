import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';

const API_URL = 'http://127.0.0.1:5000/api';
const LOG_FILE = path.join(__dirname, 'test_submission_result.txt');

const log = (message: string) => {
    console.log(message);
    fs.appendFileSync(LOG_FILE, message + '\n');
};

const testExamSubmission = async () => {
    // Clear previous log
    fs.writeFileSync(LOG_FILE, '');

    try {
        const uniqueId = Date.now();

        // 1. Register Teacher
        log('1. Registering Teacher...');
        const teacherCreds = {
            name: `Teacher ${uniqueId}`,
            email: `teacher${uniqueId}@example.com`,
            password: 'password123',
            role: 'teacher'
        };
        const teacherRes = await axios.post(`${API_URL}/auth/register`, teacherCreds);
        const teacherToken = teacherRes.data.token;

        // 2. Register Student
        log('2. Registering Student...');
        const studentCreds = {
            name: `Student ${uniqueId}`,
            email: `student${uniqueId}@example.com`,
            password: 'password123',
            role: 'student'
        };
        const studentRes = await axios.post(`${API_URL}/auth/register`, studentCreds);
        const studentToken = studentRes.data.token;

        // 3. Create Question (Teacher)
        log('3. Creating Question...');
        const questionRes = await axios.post(`${API_URL}/questions`, {
            text: 'What is 1 + 1?',
            options: ['1', '2', '3', '4'],
            correctAnswer: 1, // '2' is at index 1
            subject: 'Math',
            difficulty: 'easy'
        }, { headers: { Authorization: `Bearer ${teacherToken}` } });
        const questionId = questionRes.data._id;

        // 4. Create Exam (Teacher)
        log('4. Creating Exam...');
        const examRes = await axios.post(`${API_URL}/exams`, {
            title: `Math Quiz ${uniqueId}`,
            questions: [questionId],
            duration: 30,
            startTime: new Date().toISOString(),
            endTime: new Date(Date.now() + 3600000).toISOString(),
            status: 'published'
        }, { headers: { Authorization: `Bearer ${teacherToken}` } });
        const examId = examRes.data._id;

        // 5. Submit Exam (Student)
        log('5. Submitting Exam (Student)...');
        const answers = [
            { questionId: questionId, selectedOption: 1 } // Correct answer
        ];
        const submitRes = await axios.post(`${API_URL}/exams/${examId}/submit`, {
            answers
        }, { headers: { Authorization: `Bearer ${studentToken}` } });

        log(`   Result: ${JSON.stringify(submitRes.data)}`);

        // 6. Verify Score
        if (submitRes.data.score === 1 && submitRes.data.totalPoints === 1) {
            log('   ✅ Submission Verified: Score is correct (1/1).');
        } else {
            log('   ❌ Submission Failed: Incorrect score.');
        }

    } catch (error: any) {
        log(`\n❌ Test Failed: ${error.response ? JSON.stringify(error.response.data) : error.message}`);
    }
};

testExamSubmission();
