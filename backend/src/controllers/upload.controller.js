const { randomUUID } = require('crypto');
const { z } = require('zod');
const { PutObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const s3 = require('../config/s3');
const asyncHandler = require('../utils/asyncHandler');

const EXT = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' };

const schemas = {
  presign: z.object({
    filename: z.string().max(200).optional(),
    contentType: z.enum(['image/jpeg', 'image/png', 'image/webp']),
  }),
};

// The browser uploads straight to S3 with the returned URL, so image bytes never pass through our server.
const presign = asyncHandler(async (req, res) => {
  const { contentType } = req.body;
  const key = `products/${req.user.id}/${randomUUID()}.${EXT[contentType]}`;
  const uploadUrl = await getSignedUrl(
    s3,
    new PutObjectCommand({ Bucket: process.env.S3_BUCKET, Key: key, ContentType: contentType }),
    { expiresIn: 300 }
  );
  const fileUrl = `https://${process.env.S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
  res.json({ uploadUrl, fileUrl, key });
});

module.exports = { schemas, presign };
