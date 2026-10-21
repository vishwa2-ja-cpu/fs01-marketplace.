const { S3Client } = require('@aws-sdk/client-s3');

// Credentials come from AWS_ACCESS_KEY_ID / AWS_SECRET_ACCESS_KEY in .env automatically.
module.exports = new S3Client({ region: process.env.AWS_REGION });
