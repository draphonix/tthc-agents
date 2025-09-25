# Vercel Deployment Guide

This guide provides instructions for deploying your application to Vercel with proper environment variable configuration.

## Issues Fixed

The following deployment issues have been resolved:

1. **Missing Environment Variables in Turbo Configuration**: Added all required environment variables to `turbo.json`
2. **Google Cloud Credentials Authentication**: Updated `vertex-rag.ts` to support both file-based and environment variable-based authentication
3. **Build Configuration**: Ensured all necessary variables are available during the build process

## Vercel Environment Variables Setup

### Required Environment Variables

Add the following environment variables to your Vercel project:

#### Google Cloud / Vertex AI Configuration
- `GOOGLE_CLOUD_PROJECT` - Your Google Cloud project ID
- `VERTEX_REGION` - Your Vertex AI region (e.g., `us-central1`)
- `RAG_CORPUS_NAME` - Your RAG corpus name
- `VERTEX_MODEL` - Vertex AI model to use (e.g., `gemini-1.5-pro`)

#### Google Cloud Authentication (Choose ONE method)

**Method 1: JSON Environment Variable (Recommended for Vercel)**
- `GOOGLE_APPLICATION_CREDENTIALS_JSON` - The full JSON content of your service account key

**Method 2: File Path (For local development)**
- `GOOGLE_APPLICATION_CREDENTIALS` - Path to the service account key file

#### Application Configuration
- `GOOGLE_GENERATIVE_AI_API_KEY` - Your Google Generative AI API key
- `DATABASE_URL` - Your PostgreSQL database connection string
- `CORS_ORIGIN` - CORS origin URL (e.g., `http://localhost:3000`)
- `BETTER_AUTH_SECRET` - Your Better Auth secret
- `BETTER_AUTH_URL` - Your Better Auth URL

### How to Set Up Environment Variables in Vercel

1. **Go to your Vercel project dashboard**
2. **Navigate to Settings → Environment Variables**
3. **Add each variable with its appropriate value**

#### Setting Up GOOGLE_APPLICATION_CREDENTIALS_JSON

1. **Get your service account JSON file** from Google Cloud Console
2. **Copy the entire JSON content**
3. **Create a new environment variable** named `GOOGLE_APPLICATION_CREDENTIALS_JSON`
4. **Paste the JSON content** as the value

Example format:
```json
{
  "type": "service_account",
  "project_id": "your-project-id",
  "private_key_id": "your-key-id",
  "private_key": "-----BEGIN PRIVATE KEY-----\n...",
  "client_email": "your-service-account-email",
  "client_id": "your-client-id",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token"
}
```

## Deployment Process

### Automatic Deployment (GitHub Integration)

1. **Connect your GitHub repository to Vercel**
2. **Configure environment variables** as described above
3. **Trigger a deployment** by pushing to your main branch
4. **Monitor the build logs** to ensure successful deployment

### Manual Deployment using Vercel CLI

If you prefer to deploy manually:

```bash
# Install Vercel CLI if not already installed
npm i -g vercel

# Deploy to Vercel
vercel --prod
```

## Local Development

For local development, continue using the `.env.local` files with the file-based authentication:

```env
GOOGLE_APPLICATION_CREDENTIALS=./credentials/tthc-rag-service-key.json
```

The application automatically detects the environment and uses the appropriate authentication method:
- **Vercel/Production**: Uses `GOOGLE_APPLICATION_CREDENTIALS_JSON`
- **Local Development**: Uses `GOOGLE_APPLICATION_CREDENTIALS` file path

## Troubleshooting

### Common Issues

1. **Build fails with missing environment variables**
   - Ensure all required variables are set in Vercel
   - Check that the `turbo.json` includes all necessary variables in the `env` array

2. **Google Cloud authentication fails**
   - Verify the service account JSON is valid and properly formatted
   - Ensure the service account has the necessary permissions
   - Check that the project ID matches your Google Cloud project

3. **Vertex AI RAG not working**
   - Verify the RAG corpus name is correct
   - Ensure the region matches your Vertex AI setup
   - Check that the service account has Vertex AI access

### Build Verification

After deployment, verify the build succeeded by:
1. Checking the Vercel deployment logs
2. Testing the application endpoints
3. Verifying Vertex AI RAG functionality

## File Changes Made

### turbo.json
- Added all required environment variables to the build task configuration

### apps/server/src/lib/vertex-rag.ts
- Updated to support both file-based and environment variable-based authentication
- Added proper error handling for JSON parsing
- Maintains backward compatibility with local development

### apps/server/.env.example
- Updated to show both authentication methods
- Added comments explaining Vercel deployment setup

## Support

If you encounter any issues during deployment:
1. Check the Vercel build logs for specific error messages
2. Verify all environment variables are correctly set
3. Ensure your Google Cloud service account has the necessary permissions
4. Test the application locally with the same configuration