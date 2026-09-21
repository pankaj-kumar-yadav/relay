# Relay Production Deployment

This is the complete deployment order for Relay:

| Part         | Provider in this guide    |
| ------------ | ------------------------- |
| Frontend     | Vercel                    |
| API          | Render Docker Web Service |
| Database     | Neon PostgreSQL           |
| File uploads | Amazon S3                 |
| Email        | Any SMTP provider         |

You can substitute equivalent providers, but do not deploy the frontend until the API URL is available. Relay uses browser cookies and direct browser-to-API requests, so both services must use HTTPS.

## Before you start

You need:

- A GitHub repository containing this project
- A Vercel account
- A Render account
- A Neon account
- An AWS account with permission to create an S3 bucket and IAM user
- Node.js 22 or newer
- pnpm 10 or newer

Never commit `.env`, `.env.local`, database passwords, S3 keys, SMTP passwords, or `TOKEN_SECRET`.

## Step 1: Push the project to GitHub

From the repository root:

```bash
git status
git add .
git commit -m "chore: prepare deployment"
git push origin main
```

If the project is already on GitHub, only push the latest changes:

```bash
git push origin main
```

## Step 2: Verify locally

Run these commands from the repository root:

```bash
pnpm install
pnpm lint
pnpm build
```

Fix build or type errors before continuing. The deployment services build from the repository and will fail for the same errors.

Generate a production token secret:

```bash
openssl rand -base64 48
```

Copy the output somewhere private. It will become `TOKEN_SECRET`.

Do not run the development seed against the production database. The seed accounts use the password `password`.

## Step 3: Create the production database

1. Open [Neon](https://neon.tech/) and create an account.
2. Create a new project named `relay-production`.
3. Select PostgreSQL.
4. Copy the connection string from the project dashboard.
5. Confirm that it contains SSL, usually `?sslmode=require`.

The connection string should look similar to:

```text
postgresql://user:password@host/database?sslmode=require
```

Keep this value private. It will become `DATABASE_URL` on Render.

Prisma migrations are applied automatically by `apps/api/Dockerfile` when the API starts:

```text
pnpm exec prisma migrate deploy
```

## Step 4: Create the Amazon S3 bucket

1. Open the [Amazon S3 console](https://s3.console.aws.amazon.com/).
2. Select the AWS region where the application should store files.
3. Create a bucket named `relay-production-<unique-suffix>`.
4. Keep **Block all public access** enabled. Relay uses signed URLs, so the bucket does not need to be public.
5. Keep **Object Ownership** set to `ACLs disabled` / `Bucket owner enforced`.
6. Open the bucket's **Permissions** tab and add a CORS configuration.

Replace `https://your-project.vercel.app` with the exact Vercel production origin:

```json
[
  {
    "AllowedOrigins": ["https://your-project.vercel.app"],
    "AllowedMethods": ["GET", "PUT", "HEAD"],
    "AllowedHeaders": ["*"],
    "ExposeHeaders": ["ETag", "Content-Length"],
    "MaxAgeSeconds": 3000
  }
]
```

Create an IAM policy for this bucket. Replace the bucket name before creating it:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": ["s3:DeleteObject", "s3:GetObject", "s3:PutObject"],
      "Resource": "arn:aws:s3:::relay-production-<unique-suffix>/*"
    }
  ]
}
```

Create an IAM user or equivalent workload credential with this policy only. Create an access key for it and copy the access key ID and secret access key. Do not use the AWS root account keys.

For a bucket in `eu-west-1`, the Render values will look like this:

```text
S3_ENDPOINT=https://s3.eu-west-1.amazonaws.com
S3_PUBLIC_ENDPOINT=https://s3.eu-west-1.amazonaws.com
S3_REGION=eu-west-1
S3_BUCKET=relay-production-<unique-suffix>
S3_ACCESS_KEY=your-aws-access-key-id
S3_SECRET_KEY=your-aws-secret-access-key
S3_FORCE_PATH_STYLE=false
```

Use your actual AWS region in both endpoint values. For `us-east-1`, use `https://s3.us-east-1.amazonaws.com`.

Do not use `localhost` for any production storage URL. Do not make the bucket public; Relay signs both upload and download URLs.

## Step 5: Create the API on Render

1. Open [Render](https://render.com/).
2. Select **New** and then **Web Service**.
3. Connect the GitHub repository.
4. Select the Relay repository.
5. Select **Docker** as the runtime.
6. Set the Dockerfile path to `apps/api/Dockerfile`.
7. Set the Docker build context to the repository root.
8. Choose a paid instance for production if the free instance sleeping behavior is not acceptable.
9. Create the service.

Add these environment variables in Render. Replace every placeholder with a real value:

```text
NODE_ENV=production
PORT=4000
TRUST_PROXY=1

DATABASE_URL=your-neon-connection-string

TOKEN_SECRET=your-generated-random-secret
TOKEN_ISSUER=relay
TOKEN_AUDIENCE=relay-web

WEB_ORIGIN=https://temporary-placeholder.vercel.app

S3_ENDPOINT=https://s3.eu-west-1.amazonaws.com
S3_PUBLIC_ENDPOINT=https://s3.eu-west-1.amazonaws.com
S3_REGION=eu-west-1
S3_BUCKET=relay-production-<unique-suffix>
S3_ACCESS_KEY=your-aws-access-key-id
S3_SECRET_KEY=your-aws-secret-access-key
S3_FORCE_PATH_STYLE=false
```

`WEB_ORIGIN` is temporarily a placeholder because Vercel has not provided the final frontend URL yet. It will be replaced in Step 8.

Optional SMTP variables:

```text
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=your-smtp-user
SMTP_PASS=your-smtp-password
SMTP_FROM=Relay <noreply@example.com>
```

Deploy the Render service. The first deploy may take several minutes because it installs dependencies, generates Prisma, builds TypeScript, runs migrations, and starts the API.

Copy the Render service URL, for example:

```text
https://relay-api.onrender.com
```

Test it in a browser:

```text
https://relay-api.onrender.com/api/v1/health
```

The URL must return a successful health response before deploying Vercel.

## Step 6: Create the Vercel project

1. Open [Vercel](https://vercel.com/).
2. Select **Add New**, then **Project**.
3. Import the same GitHub repository.
4. Set the framework to **Next.js**.
5. Set **Root Directory** to `apps/web`.
6. Add this environment variable:

```text
NEXT_PUBLIC_API_URL=https://relay-api.onrender.com
```

7. Deploy the project.

If Vercel cannot resolve the workspace package `@relay/shared`, use the repository root as the project root and set:

```text
Build Command: pnpm --filter @relay/web build
```

The API URL is embedded during the Next.js build. Redeploy Vercel after changing `NEXT_PUBLIC_API_URL`.

Copy the Vercel production URL, for example:

```text
https://relay.vercel.app
```

## Step 7: Connect Vercel to the API

Return to the Render API service and change:

```text
WEB_ORIGIN=https://relay.vercel.app
```

Use the exact Vercel origin:

- Include `https://`
- Do not add `/` at the end
- Do not use a preview URL unless intentionally testing a preview

Save the environment variable and redeploy the API.

## Step 8: Test login and application data

Open the Vercel production URL and test in this order:

1. Register a new account.
2. Log in.
3. Refresh the browser page.
4. Create an organization.
5. Create a team and project.
6. Create an issue.
7. Add a comment.
8. Upload an avatar or attachment.
9. Log out.
10. Log in again.

Open browser developer tools and confirm that API requests succeed and cookies are set. Do not use the seed accounts in production.

## Step 9: Test email

Trigger an invitation or password reset. Confirm that:

- The email arrives.
- The link opens the Vercel frontend.
- The link uses HTTPS.
- The token can only be used as intended.

If SMTP is not configured, the API logs the invitation and reset links instead of sending email. This is not suitable for production.

## Step 10: Add custom domains

Only do this after the generated Vercel and Render URLs work.

Recommended final URLs:

```text
Frontend: https://app.example.com
API:      https://api.example.com
Health:   https://api.example.com/api/v1/health
```

1. Add `app.example.com` to Vercel and configure the DNS record Vercel provides.
2. Add `api.example.com` to Render and configure the DNS record Render provides.
3. Update the S3 bucket CORS `AllowedOrigins` value to `https://app.example.com`.
4. Change Vercel `NEXT_PUBLIC_API_URL` to `https://api.example.com`.
5. Change Render `WEB_ORIGIN` to `https://app.example.com`.
6. Redeploy both Vercel and Render.
7. Repeat the login and upload tests.

## Troubleshooting

### Vercel build cannot find `@relay/shared`

Use the repository root as the Vercel root directory and set:

```text
Build Command: pnpm --filter @relay/web build
```

Then redeploy.

### Login fails with a CORS error

Check that Render has:

```text
WEB_ORIGIN=https://your-exact-vercel-domain.vercel.app
```

The value must match the browser address exactly and must not have a trailing slash.

### Login succeeds but refresh logs you out

Check all of these:

- Frontend uses HTTPS.
- API uses HTTPS.
- `WEB_ORIGIN` is exact.
- `TRUST_PROXY=1` is set on Render.
- The browser is not blocking third-party cookies.

### API deploy fails during Prisma migration

Check that:

- `DATABASE_URL` is correct.
- The database is reachable from Render.
- The database connection requires the correct SSL setting.
- The Neon database user can run migrations.

### Uploads fail

Check that:

- The bucket name is exactly `relay`.
- The AWS credentials can read, write, head, and delete objects in the bucket.
- `S3_ENDPOINT` is the provider endpoint, not the public file URL.
- `S3_PUBLIC_ENDPOINT` is reachable in a browser.
- The S3 bucket CORS `AllowedOrigins` value exactly matches the Vercel origin.
- The S3 bucket region matches `S3_REGION`.

## Final checklist

- [ ] Code is pushed to GitHub
- [ ] `pnpm lint` passes locally
- [ ] `pnpm build` passes locally
- [ ] Production PostgreSQL database created
- [ ] Production migrations applied
- [ ] Amazon S3 bucket created
- [ ] S3 bucket CORS configured
- [ ] Least-privilege IAM policy created
- [ ] API deployed and health endpoint works
- [ ] Vercel frontend deployed
- [ ] `NEXT_PUBLIC_API_URL` points to the production API
- [ ] `WEB_ORIGIN` exactly matches the production frontend
- [ ] Strong `TOKEN_SECRET` configured
- [ ] SMTP configured
- [ ] Registration tested
- [ ] Login and refresh tested
- [ ] Organization and issue creation tested
- [ ] File upload tested
- [ ] Development seed accounts not used
