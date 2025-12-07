import axios from 'axios';

const API_URL = 'http://127.0.0.1:5000/api';

const testExamCRUD = async () => {
    try {
        // 1. Register a Teacher
        const uniqueId = Date.now();
        const teacherCreds = {
            name: `Exam Teacher ${uniqueId}`,
            email: `examteacher${uniqueId}@example.com`,
            password: 'password123',
            role: 'teacher'
        };

        console.log('1. Registering Teacher...');
        const registerRes = await axios.post(`${API_URL}/auth/register`, teacherCreds);
        const token = registerRes.data.token;
        console.log('   Success! Token received.');

        // 2. Create a Question (Prerequisite)
        console.log('\n2. Creating a Question for the Exam...');
        const questionRes = await axios.post(`${API_URL}/questions`, {
            text: 'Sample Question for Exam?',
            options: ['A', 'B', 'C', 'D'],
            correctAnswer: 0,
            subject: 'General',
            difficulty: 'easy'
        }, { headers: { Authorization: `Bearer ${token}` } });
        const questionId = questionRes.data._id;
        console.log('   Question Created ID:', questionId);

        // 3. Create Exam
        console.log('\n3. Creating Exam...');
        const newExam = {
            title: `Midterm Exam ${uniqueId}`,
            description: 'This is a test exam.',
            questions: [questionId],
            duration: 60,
            startTime: new Date().toISOString(),
            endTime: new Date(Date.now() + 3600000).toISOString(), // +1 hour
            status: 'published'
        };
        const createRes = await axios.post(`${API_URL}/exams`, newExam, {
            headers: { Authorization: `Bearer ${token}` }
        });
        const examId = createRes.data._id;
        console.log('   Exam Created ID:', examId);

        // 4. Get All Exams
        console.log('\n4. Fetching All Exams...');
        const getAllRes = await axios.get(`${API_URL}/exams`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log(`   Fetched ${getAllRes.data.length} exams.`);

        // 5. Get Exam By ID
        console.log('\n5. Fetching Exam by ID...');
        const getByIdRes = await axios.get(`${API_URL}/exams/${examId}`, {
            headers: { Authorization: `Bearer ${token}` }
        });

        if (getByIdRes.data.title === newExam.title && getByIdRes.data.questions[0]._id === questionId) {
            console.log('   ✅ Exam verification PASSED (Title and Questions match).');
        } else {
            console.error('   ❌ Exam verification FAILED.');
        }

        // 6. Delete Exam
        console.log('\n6. Deleting Exam...');
        await axios.delete(`${API_URL}/exams/${examId}`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log('   Exam Deleted.');

        console.log('\n✅ Exam Management Lifecycle Verification PASSED');

    } catch (error: any) {
        console.error('\n❌ Test Failed:', error.response ? error.response.data : error.message);
    }
};

testExamCRUD();
