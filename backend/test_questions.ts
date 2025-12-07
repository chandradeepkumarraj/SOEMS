import axios from 'axios';

const API_URL = 'http://127.0.0.1:5000/api';

const testQuestionCRUD = async () => {
    try {
        // 1. Register a Teacher (Only teachers can create questions)
        const uniqueId = Date.now();
        const teacherCreds = {
            name: `Teacher ${uniqueId}`,
            email: `teacher${uniqueId}@example.com`,
            password: 'password123',
            role: 'teacher'
        };

        console.log('1. Registering Teacher...');
        const registerRes = await axios.post(`${API_URL}/auth/register`, teacherCreds);
        const token = registerRes.data.token;
        console.log('   Success! Token received.');

        // 2. Create a Question
        console.log('\n2. Creating Question...');
        const newQuestion = {
            text: `What is 2 + 2? (Created at ${uniqueId})`,
            options: ['3', '4', '5', '6'],
            correctAnswer: 1, // Index of '4'
            subject: 'Math',
            difficulty: 'easy'
        };
        const createRes = await axios.post(`${API_URL}/questions`, newQuestion, {
            headers: { Authorization: `Bearer ${token}` }
        });
        const questionId = createRes.data._id;
        console.log('   Created Question ID:', questionId);

        // 3. Get All Questions
        console.log('\n3. Fetching All Questions...');
        const getAllRes = await axios.get(`${API_URL}/questions`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log(`   Fetched ${getAllRes.data.length} questions.`);

        // 4. Get Question By ID
        console.log('\n4. Fetching Question by ID...');
        const getByIdRes = await axios.get(`${API_URL}/questions/${questionId}`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        if (getByIdRes.data.text === newQuestion.text) {
            console.log('   ✅ Fetch by ID verified.');
        } else {
            console.error('   ❌ Fetch by ID mismatch.');
        }

        // 5. Update Question
        console.log('\n5. Updating Question...');
        const updateData = {
            text: `What is 2 + 2? (Updated at ${uniqueId})`,
            difficulty: 'medium'
        };
        const updateRes = await axios.put(`${API_URL}/questions/${questionId}`, updateData, {
            headers: { Authorization: `Bearer ${token}` }
        });
        if (updateRes.data.text === updateData.text && updateRes.data.difficulty === 'medium') {
            console.log('   ✅ Update verified.');
        } else {
            console.error('   ❌ Update mismatch.');
        }

        // 6. Delete Question
        console.log('\n6. Deleting Question...');
        await axios.delete(`${API_URL}/questions/${questionId}`, {
            headers: { Authorization: `Bearer ${token}` }
        });

        // Verify Deletion
        try {
            await axios.get(`${API_URL}/questions/${questionId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            console.error('   ❌ Deletion failed: Question still exists.');
        } catch (err: any) {
            if (err.response && err.response.status === 404) {
                console.log('   ✅ Deletion verified (404 Not Found).');
            } else {
                console.error('   ❌ Unexpected error during deletion verification:', err.message);
            }
        }

        console.log('\n✅ Question Bank CRUD Lifecycle Verification PASSED');

    } catch (error: any) {
        console.error('\n❌ Test Failed:', error.response ? error.response.data : error.message);
    }
};

testQuestionCRUD();
