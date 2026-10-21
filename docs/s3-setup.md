# S3 setup (product images)

1. **Create a bucket** (AWS Console -> S3 -> Create bucket). Pick a region, e.g. `ap-south-1`.
   Under "Block Public Access", untick "Block all public access" (product images must be viewable by shoppers).
2. **Bucket policy** (Permissions -> Bucket policy). Replace `YOUR_BUCKET`:
```json
{
  "Version": "2012-10-17",
  "Statement": [{
    "Sid": "PublicReadProductImages",
    "Effect": "Allow",
    "Principal": "*",
    "Action": "s3:GetObject",
    "Resource": "arn:aws:s3:::YOUR_BUCKET/products/*"
  }]
}
```
3. **CORS** (Permissions -> CORS). The browser uploads directly to S3, so S3 must allow it. Add your deployed frontend URL later:
```json
[{
  "AllowedHeaders": ["*"],
  "AllowedMethods": ["PUT", "GET"],
  "AllowedOrigins": ["http://localhost:5173"],
  "ExposeHeaders": []
}]
```
4. **IAM user** (IAM -> Users -> Create user -> attach an inline policy). Replace `YOUR_BUCKET`:
```json
{
  "Version": "2012-10-17",
  "Statement": [{ "Effect": "Allow", "Action": ["s3:PutObject"], "Resource": "arn:aws:s3:::YOUR_BUCKET/products/*" }]
}
```
   Create an access key for this user and copy it into `backend/.env`:
   `AWS_REGION`, `S3_BUCKET`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`.
5. Never commit `.env` or the keys to GitHub.
