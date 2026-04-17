# Deployment Guide: Hugging Face Spaces

This guide provides step-by-step instructions for deploying the Tickets Folder Feature Flask Admin interface to Hugging Face (HF) Spaces using the Docker SDK.

## Overview

The Flask Admin interface provides a web-based dashboard for managing tickets, folders, and system monitoring. It can be deployed to HF Spaces as a standalone application that communicates with your FastAPI backend via HTTP APIs.

## Prerequisites

1. **Hugging Face Account**: Create an account at [huggingface.co](https://huggingface.co)
2. **FastAPI Backend**: Your FastAPI backend must be accessible from the internet:
   - Cloud deployment (AWS, GCP, Azure, DigitalOcean, etc.)
   - Tunneling service for development (ngrok, Cloudflare Tunnel)
   - VPS or dedicated server with public IP
3. **Git**: For pushing code to HF Spaces repository

## HF Spaces Configuration Files

The application is pre-configured for HF Spaces deployment with these files in the project root:

- **`app.py`**: Entry point for the Flask Admin interface
- **`Dockerfile`**: Multi-stage Docker build optimized for HF Spaces
- **`README.md`**: Contains required YAML frontmatter metadata for HF Spaces
- **`requirements.txt`**: Python dependencies for the Flask application
- **`.dockerignore`**: Excludes unnecessary files from Docker build context

## Step-by-Step Deployment

### 1. Create a New HF Space

1. Navigate to [huggingface.co/new-space](https://huggingface.co/new-space)
2. Fill in the space details:
   - **Space name**: Choose a descriptive name (e.g., `tickets-admin-dashboard`)
   - **License**: Select appropriate license (MIT recommended)
   - **SDK**: Select **Docker** (required for this application)
   - **Hardware**: Select **CPU basic** (sufficient for Flask admin interface)
   - **Visibility**: Choose **Public** or **Private** based on your needs

### 2. Configure Environment Variables

In your HF Space's **Settings** tab, add the following environment variables:

#### Required Variables

| Variable | Value | Description |
|----------|-------|-------------|
| `API_BASE_URL` | `https://your-api.example.com` | Full URL to your hosted FastAPI backend |
| `SECRET_KEY` | `your-secure-random-key` | Flask session secret (generate with `python -c "import secrets; print(secrets.token_hex(32))"`) |
| `FLASK_ENV` | `production` | Flask environment setting |

#### Optional Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `LOG_FORMAT` | `json` | Logging format for production |
| `LOG_LEVEL` | `INFO` | Logging level |
| `PORT` | `7860` | Application port (HF Spaces default) |
| `HOST` | `0.0.0.0` | Application host |

### 3. Prepare Your Code Repository

Ensure your project root contains the required files:

```bash
# Verify required files exist
ls -la app.py Dockerfile README.md requirements.txt

# Check README.md has HF Spaces metadata
head -10 README.md
```

The README.md should start with:
```yaml
---
title: Tickets Folder Feature
emoji: 🎫
colorFrom: blue
colorTo: green
sdk: docker
app_port: 7860
---
```

### 4. Deploy to HF Spaces

#### Option A: Git Push (Recommended)

```bash
# Add HF Spaces as a remote repository
git remote add hf https://huggingface.co/spaces/YOUR_USERNAME/YOUR_SPACE_NAME

# Push your code to HF Spaces
git push hf main
```

#### Option B: Upload Files via Web Interface

1. Go to your HF Space repository page
2. Click **"Upload files"**
3. Drag and drop or select all required files
4. Commit the changes

### 5. Monitor Deployment

1. **Build Logs**: Monitor the build process in your HF Space's **Logs** tab
2. **Build Time**: Initial build typically takes 3-5 minutes
3. **Status**: Wait for status to change from "Building" to "Running"

### 6. Verify Deployment

Once deployed, your application will be available at:
```
https://huggingface.co/spaces/YOUR_USERNAME/YOUR_SPACE_NAME
```

Test the deployment:

1. **Health Check**: Visit `/health` endpoint to verify the application is running
2. **Dashboard**: Access the main dashboard at `/`
3. **API Connection**: Verify the Flask admin can connect to your FastAPI backend

## Environment-Specific Configuration

### Port Configuration

The application automatically detects the deployment environment:

- **HF Spaces**: Uses port `7860` (HF Spaces standard)
- **Local Docker Compose**: Uses port `5000` internally, exposed on `5001`

This is controlled by the `PORT` environment variable with automatic detection.

### CORS Configuration

The application automatically configures CORS origins:

- **HF Spaces**: Dynamically resolves the HF Space URL for CORS
- **Local**: Uses `http://localhost:5001`

Ensure your FastAPI backend includes the HF Space URL in its CORS configuration.

## Troubleshooting

### Common Issues

#### 1. API Connection Errors

**Symptoms**: Dashboard shows "API unreachable" or empty data

**Solutions**:
- Verify `API_BASE_URL` is correct and accessible from the internet
- Check your FastAPI backend is running and healthy
- Ensure CORS is configured to allow requests from your HF Space URL
- Test API connectivity: `curl https://your-api.example.com/health/live`

#### 2. Build Failures

**Symptoms**: HF Spaces build fails with dependency errors

**Solutions**:
- Check build logs in HF Spaces **Logs** tab
- Verify all dependencies are listed in `requirements.txt`
- Ensure `Dockerfile` syntax is correct
- Check for missing system dependencies

#### 3. Application Startup Errors

**Symptoms**: Build succeeds but application fails to start

**Solutions**:
- Check `SECRET_KEY` is set in HF Spaces environment variables
- Verify `API_BASE_URL` format is correct (include `https://`)
- Review application logs for specific error messages
- Ensure port `7860` is exposed in Dockerfile

#### 4. Health Check Failures

**Symptoms**: `/health` endpoint returns errors or timeouts

**Solutions**:
- Verify FastAPI backend is reachable from HF Spaces
- Check network connectivity between HF Spaces and your backend
- Ensure health check endpoint exists on your FastAPI backend
- Review timeout settings in Flask configuration

### Debug Commands

```bash
# Test API connectivity from your local machine
curl -I https://your-api.example.com/health/live

# Generate a secure secret key
python -c "import secrets; print(secrets.token_hex(32))"

# Validate Dockerfile locally
docker build -t hf-spaces-test .
docker run --rm -p 7860:7860 -e API_BASE_URL="https://your-api.example.com" -e SECRET_KEY="test-key" hf-spaces-test

# Test health endpoint
curl http://localhost:7860/health
```

## Security Considerations

### Environment Variables

- **Never commit secrets** to your repository
- Use HF Spaces **Settings** tab to configure sensitive variables
- Generate strong random keys for `SECRET_KEY`
- Use HTTPS URLs for `API_BASE_URL`

### Network Security

- Ensure your FastAPI backend uses HTTPS in production
- Configure proper CORS origins to restrict access
- Consider IP whitelisting if your backend supports it
- Use authentication tokens if your API requires them

### Data Privacy

- The Flask admin interface does not store sensitive data locally
- All data is fetched from your FastAPI backend via HTTPS
- Session data is encrypted using the `SECRET_KEY`
- Consider data residency requirements for your use case

## Performance Optimization

### Caching

The Flask admin implements intelligent caching:

- **Dashboard data**: Cached for 5 minutes
- **Folder lists**: Cached for 5 minutes  
- **Health status**: Cached for 1 minute
- **Classification results**: Cached for 15 minutes

### Resource Limits

HF Spaces provides:

- **CPU**: Shared CPU resources
- **Memory**: 16GB RAM limit
- **Storage**: 50GB disk space
- **Bandwidth**: Generous limits for typical usage

### Scaling Considerations

For high-traffic deployments:

1. **Backend Scaling**: Scale your FastAPI backend independently
2. **CDN**: Use a CDN for static assets if needed
3. **Load Balancing**: Deploy multiple HF Spaces for redundancy
4. **Monitoring**: Implement proper monitoring and alerting

## Maintenance and Updates

### Updating Your Deployment

```bash
# Make changes to your code
git add .
git commit -m "Update Flask admin interface"

# Push updates to HF Spaces
git push hf main
```

HF Spaces will automatically rebuild and redeploy your application.

### Monitoring

- **HF Spaces Logs**: Monitor application logs in the HF Spaces interface
- **Health Checks**: Set up external monitoring for your HF Space URL
- **Backend Monitoring**: Monitor your FastAPI backend separately
- **User Feedback**: Monitor user reports and error rates

### Backup and Recovery

- **Code**: Your code is stored in the HF Spaces Git repository
- **Configuration**: Document your environment variables
- **Data**: All persistent data is stored in your FastAPI backend
- **Disaster Recovery**: Keep your FastAPI backend properly backed up

## Advanced Configuration

### Custom Domain

HF Spaces supports custom domains for Pro users:

1. Upgrade to HF Pro subscription
2. Configure custom domain in Space settings
3. Update DNS records as instructed
4. Update CORS configuration in your FastAPI backend

### Multiple Environments

Deploy separate HF Spaces for different environments:

- **Development**: `your-username/tickets-admin-dev`
- **Staging**: `your-username/tickets-admin-staging`  
- **Production**: `your-username/tickets-admin-prod`

Each can point to different FastAPI backend environments.

### Integration with CI/CD

Automate deployments using GitHub Actions:

```yaml
name: Deploy to HF Spaces
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Push to HF Spaces
        run: |
          git remote add hf https://huggingface.co/spaces/${{ secrets.HF_USERNAME }}/${{ secrets.HF_SPACE_NAME }}
          git push hf main
```

## Support and Resources

- **HF Spaces Documentation**: [huggingface.co/docs/hub/spaces](https://huggingface.co/docs/hub/spaces)
- **Docker Documentation**: [docs.docker.com](https://docs.docker.com)
- **Flask Documentation**: [flask.palletsprojects.com](https://flask.palletsprojects.com)
- **Community Support**: HF Spaces Discord and forums

For application-specific issues, check the project's GitHub repository and documentation.
