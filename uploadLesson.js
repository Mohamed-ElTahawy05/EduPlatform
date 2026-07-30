const fs = require('fs');
const path = require('path');
const readline = require('readline');

const BASE_URL = 'https://eduplatform-production-ecab.up.railway.app/api/v1';

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
});

const ask = (question) =>
    new Promise((resolve) => rl.question(question, (answer) => resolve(answer.trim())));

const run = async () => {
    try {
        console.log('=== Login ===');
        const phone = await ask('Phone number (admin/teacher): ');
        const password = await ask('Password: ');

        const loginRes = await fetch(`${BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ phone, password }),
        });
        const loginData = await loginRes.json();

        if (loginData.status !== 'success') {
            console.error('Login failed:', loginData.message);
            process.exit(1);
        }

        const token = loginData.token;
        console.log('Login successful\n');

        console.log('=== Video Info ===');
        const filePath = await ask('Full path to the video file (e.g. C:\\videos\\lesson1.mp4): ');

        if (!fs.existsSync(filePath)) {
            console.error('File not found at that path. Check the path and try again.');
            process.exit(1);
        }

        const fileName = path.basename(filePath);
        const fileBuffer = fs.readFileSync(filePath);
        const fileSizeMB = (fileBuffer.length / (1024 * 1024)).toFixed(2);

        console.log(`Video size: ${fileSizeMB} MB\n`);

        console.log('=== Lesson Info ===');
        const title = await ask('Lesson title: ');
        const description = await ask('Lesson description: ');
        const course = await ask('Course ID: ');
        const statusInput = await ask('Lesson status (published/draft) [default: published]: ');
        const isFreeInput = await ask('Is this lesson free? (y/n) [default: n]: ');

        const status = statusInput || 'published';
        const isFree = isFreeInput.toLowerCase() === 'y';

        console.log('\nRequesting upload URL from backend...');
        const urlRes = await fetch(`${BASE_URL}/lessons/get-upload-url`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ fileName, fileType: 'video/mp4' }),
        });
        const urlData = await urlRes.json();

        if (urlData.status !== 'success') {
            console.error('Failed to get upload URL:', urlData.message);
            process.exit(1);
        }

        const { uploadUrl, fileUrl } = urlData.data;
        console.log('Got upload URL successfully\n');

        console.log('Uploading video to B2 (this may take a while depending on your connection)...');
        const uploadStart = Date.now();

        const uploadRes = await fetch(uploadUrl, {
            method: 'PUT',
            headers: { 'Content-Type': 'video/mp4' },
            body: fileBuffer,
        });

        const uploadSeconds = ((Date.now() - uploadStart) / 1000).toFixed(1);

        if (!uploadRes.ok) {
            console.error(`Video upload failed. Status: ${uploadRes.status}`);
            process.exit(1);
        }
        console.log(`Video uploaded successfully in ${uploadSeconds} seconds\n`);

        console.log('Creating lesson...');
        const lessonRes = await fetch(`${BASE_URL}/lessons`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
                title,
                description,
                course,
                status,
                isFree,
                videoUrl: fileUrl,
            }),
        });
        const lessonData = await lessonRes.json();

        if (lessonData.status !== 'success') {
            console.error('Failed to create lesson:', lessonData.message);
            process.exit(1);
        }

        console.log('Done! Lesson created with the new video.');
        console.log('Lesson ID:', lessonData.data.data._id);
        console.log('Video URL:', fileUrl);
    } catch (err) {
        console.error('Unexpected error:', err.message);
    } finally {
        rl.close();
    }
};

run();