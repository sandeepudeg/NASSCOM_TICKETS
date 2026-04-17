# 🔧 Backend API Deployment Options

## Your FastAPI Backend Needs to be Deployed First

The Flask admin interface (HF Spaces) is just the frontend. You need your FastAPI backend running somewhere accessible from the internet.

## 🚀 Quick Deployment Options

### Option 1: Railway (Recommended - Free Tier)
```bash
# 1. Install Railway CLI
npm install -g @railway/cli

# 2. Login to Railway
railway login

# 3. Deploy your FastAPI backend
railway init
railway up
```
- **Free tier**: 500 hours/month
- **URL**: `https://your-app.railway.app`
- **Setup time**: 5 minutes

### Option 2: Render (Free Tier)
1. Go to https://render.com
2. Connect your GitHub repo
3. Create new **Web Service**
4. Build command: `pip install -r requirements.txt`
5. Start command: `uvicorn main:app --host 0.0.0.0 --port $PORT`
- **URL**: `https://your-app.onrender.com`

### Option 3: Fly.io (Free Tier)
```bash
# 1. Install Fly CLI
curl -L https://fly.io/install.sh | sh

# 2. Login and deploy
fly auth login
fly launch
fly deploy
```
- **URL**: `https://your-app.fly.dev`

### Option 4: Heroku (Paid)
```bash
# 1. Install Heroku CLI
# 2. Login and create app
heroku login
heroku create your-tickets-api
git push heroku main
```
- **URL**: `https://your-tickets-api.herokuapp.com`

## 📁 What to Deploy

You need to deploy your **FastAPI backend** which includes:
```
├── main.py              # FastAPI app entry point
├── src/                 # Your application code
├── requirements.txt     # Python dependencies
├── alembic/            # Database migrations
└── config/             # Configuration files
```

## 🔧 Backend Configuration

### 1. Update main.py for Production
```python
# main.py
import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="Tickets API")

# Add CORS for HF Spaces
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://huggingface.co",
        "https://*.hf.space",
        "http://localhost:5001"  # Local development
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Your existing routes...

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
```

### 2. Environment Variables for Backend
Set these in your backend deployment:
```bash
DATABASE_URL=postgresql://user:pass@host:port/db
OLLAMA_BASE_URL=http://localhost:11434  # Or your Ollama service
SECRET_KEY=your-backend-secret-key
```

## 🎯 Recommended: Railway Deployment

Railway is the easiest for beginners:

### Step 1: Prepare Your Backend
```bash
# Make sure you have these files in your project root:
ls main.py requirements.txt
```

### Step 2: Deploy to Railway
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login (opens browser)
railway login

# Initialize and deploy
railway init
railway up
```

### Step 3: Get Your API URL
After deployment, Railway will give you a URL like:
```
https://your-project-name.railway.app
```

### Step 4: Update Flask Admin
Use this URL as your `API_BASE_URL` in HF Spaces:
```
API_BASE_URL=https://your-project-name.railway.app
```

## 🔍 Testing Your Backend

Once deployed, test these endpoints:
```bash
# Health check
curl https://your-api-url.com/health/live

# API endpoints
curl https://your-api-url.com/api/v1/folders
curl https://your-api-url.com/api/v1/tickets
```

## 🚨 Important Notes

1. **Database**: You'll need a PostgreSQL database (Railway provides one free)
2. **Ollama**: You might need to disable AI features initially or use a cloud LLM service
3. **CORS**: Make sure to add your HF Space URL to CORS origins
4. **Environment Variables**: Set all required env vars in your deployment platform

## 🎉 Next Steps

1. Choose a deployment platform (Railway recommended)
2. Deploy your FastAPI backend
3. Get the deployment URL
4. Use that URL as `API_BASE_URL` in your HF Spaces deployment
5. Deploy Flask admin to HF Spaces

Would you like me to help you with any specific deployment platform?