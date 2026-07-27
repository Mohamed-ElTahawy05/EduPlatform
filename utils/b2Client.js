const { S3Client } = require('@aws-sdk/client-s3');

const b2Client = new S3Client({
    endpoint: process.env.B2_ENDPOINT,
    region: 'us-west-005', // لازم يتطابق مع الـ region بتاع الـ endpoint عندك
    credentials: {
        accessKeyId: process.env.B2_KEY_ID,
        secretAccessKey: process.env.B2_APPLICATION_KEY,
    },
});

module.exports = b2Client;