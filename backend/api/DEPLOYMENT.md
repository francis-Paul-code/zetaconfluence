# AWS Elastic Beanstalk Deployment Guide (Console Upload)

## Overview

This setup deploys your API using Docker on Elastic Beanstalk by uploading a Docker image. Environment variables are loaded directly from the `.env` file baked into the Docker image.

## Prerequisites

1. Docker installed locally
2. AWS Account with Elastic Beanstalk access
3. Your `.env` file configured with production values

## Step 1: Prepare Your Environment File

Make sure your `api/.env` file has all production values set:

```bash
# Update .env with production values
# - Change HOST_URL to your domain
# - Set NODE_ENV=production
# - Add all your API keys
# - Configure DATABASE_URL with production database
```

**Important**: The `.env` file will be baked into your Docker image, so ensure it has production values before building.

## Step 2: Build Docker Image

```bash
cd api
docker build -t zetaconfluence-api:latest .
```

This will:
- Build your application
- Copy the `.env` file into the image
- Create a production-ready container

## Step 3: Push to Docker Registry

### Option A: Amazon ECR (Recommended)

1. **Create ECR Repository** (via AWS Console):
   - Go to Amazon ECR
   - Click "Create repository"
   - Name: `zetaconfluence-api`
   - Click "Create"

2. **Get Push Commands** (shown in ECR console):
   ```bash
   # Authenticate Docker to ECR
   aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <account-id>.dkr.ecr.us-east-1.amazonaws.com
   
   # Tag your image
   docker tag zetaconfluence-api:latest <account-id>.dkr.ecr.us-east-1.amazonaws.com/zetaconfluence-api:latest
   
   # Push to ECR
   docker push <account-id>.dkr.ecr.us-east-1.amazonaws.com/zetaconfluence-api:latest
   ```

3. **Update `Dockerrun.aws.json`**:
   ```json
   {
     "AWSEBDockerrunVersion": "1",
     "Image": {
       "Name": "<account-id>.dkr.ecr.us-east-1.amazonaws.com/zetaconfluence-api:latest",
       "Update": "true"
     },
     "Ports": [
       {
         "ContainerPort": 8910,
         "HostPort": 8910
       }
     ],
     "Logging": "/var/log/app"
   }
   ```

### Option B: Docker Hub

1. **Login to Docker Hub**:
   ```bash
   docker login
   ```

2. **Tag and Push**:
   ```bash
   docker tag zetaconfluence-api:latest your-dockerhub-username/zetaconfluence-api:latest
   docker push your-dockerhub-username/zetaconfluence-api:latest
   ```

3. **Update `Dockerrun.aws.json`**:
   ```json
   {
     "AWSEBDockerrunVersion": "1",
     "Image": {
       "Name": "your-dockerhub-username/zetaconfluence-api:latest",
       "Update": "true"
     },
     "Ports": [
       {
         "ContainerPort": 8910,
         "HostPort": 8910
       }
     ],
     "Logging": "/var/log/app"
   }
   ```

## Step 4: Create Elastic Beanstalk Application

1. **Go to AWS Elastic Beanstalk Console**
2. **Click "Create Application"**
3. **Configure**:
   - Application name: `zetaconfluence-api`
   - Platform: Docker
   - Platform branch: Docker running on 64bit Amazon Linux 2023
   - Platform version: (recommended)

4. **Application Code**:
   - Select "Upload your code"
   - Version label: `v1.0.0` (or your version)
   - Upload `Dockerrun.aws.json` file

5. **Configure More Options** (Optional):
   - Instance type: t3.small or larger
   - Capacity: Single instance or Load balanced
   - Security: Add your key pair for SSH access

6. **Click "Create Application"**

## Step 5: Deploy Updates

When you need to update:

1. **Update your code or .env file**
2. **Rebuild Docker image**:
   ```bash
   docker build -t zetaconfluence-api:latest .
   ```

3. **Push to registry**:
   ```bash
   # For ECR
   docker tag zetaconfluence-api:latest <account-id>.dkr.ecr.us-east-1.amazonaws.com/zetaconfluence-api:latest
   docker push <account-id>.dkr.ecr.us-east-1.amazonaws.com/zetaconfluence-api:latest
   ```

4. **Deploy via Console**:
   - Go to your EB environment
   - Click "Upload and deploy"
   - Upload `Dockerrun.aws.json` (if changed) or just click deploy to pull latest image
   - Click "Deploy"

## Monitoring & Troubleshooting

### View Logs
1. Go to your environment in EB Console
2. Click "Logs" in left sidebar
3. Click "Request Logs" → "Full Logs"

### Check Application Health
- Dashboard shows health status
- Green = Healthy
- Yellow = Warning
- Red = Severe issues

### Common Issues

**Container not starting:**
- Check logs for errors
- Verify port 8910 is exposed and matches Dockerrun.aws.json
- Ensure .env file has correct values

**Database connection issues:**
- If using RDS, ensure security groups allow connection
- Verify DATABASE_URL is correct in .env
- Check VPC configuration

**API keys not working:**
- Verify .env file was copied into Docker image
- Rebuild image if .env was updated after build

## Security Notes

⚠️ **Important**: Since your `.env` file is baked into the Docker image:

1. **Keep your Docker images private** (use private ECR or Docker Hub repos)
2. **Don't share or publish images** containing production secrets
3. **Rotate keys regularly** and rebuild images
4. **Consider AWS Secrets Manager** for enhanced security in production

## Alternative: Using AWS Secrets Manager (More Secure)

For production, consider:
1. Store secrets in AWS Secrets Manager
2. Grant EB instance role access to secrets
3. Modify your app to fetch secrets at runtime
4. Remove sensitive values from .env file

This approach keeps secrets out of your Docker image entirely.
