import api from './client.js';

export const MAX_IMAGE_MB = 5;

// 1) ask our API for a presigned URL, 2) PUT the file straight to S3, 3) return the public URL.
export async function uploadImage(file) {
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) throw new Error('Only JPG, PNG or WebP images');
  if (file.size > MAX_IMAGE_MB * 1024 * 1024) throw new Error(`Image must be under ${MAX_IMAGE_MB} MB`);
  const { data } = await api.post('/uploads/presign', { filename: file.name, contentType: file.type });
  const res = await fetch(data.uploadUrl, { method: 'PUT', headers: { 'Content-Type': file.type }, body: file });
  if (!res.ok) throw new Error('Upload to S3 failed (check bucket CORS and credentials)');
  return data.fileUrl;
}
