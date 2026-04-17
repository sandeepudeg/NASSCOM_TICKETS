# 🚀 Deploy Your Backend API First

## Step 1: Deploy FastAPI Backend to Railway (Easiest)

### Quick Railway Deployment:

1. **Install Railway CLI:**
```bash
npm install -g @railway/cli
```

2. **Login to Railway:**
```bash
railway login
```
(This opens your browser to login)

3. **Deploy Your Backend:**
```bash
# In your project root directory
railway init
railway up
```

4. **Add Environment Variables in Railway:**
Go to your Railway dashboard and add:
```
DATABASE_URL=postgresql://...  (Railway provides this)
OLLAMA_BASE_URL=http://localhost:11434
SECRET_KEY=your-secret-key
CORS_ORIGINS=https://huggingface.co,https://*.hf.space
```

5. **Get Your API URL:**
Railway will give you a URL like: `https://your-project.railway.app`

## Step 2: Test Your Backend

```bash
# Test health endpoint
curl https://your-project.railway.app/health/live

# Test API
curl https://your-project.railway.app/api/v1/folders
```

## Step 3: Update Flask Admin for HF Spaces

Use your Railway URL in HF Spaces environment variables:
```
API_BASE_URL=https://your-project.railway.app
SECRET_KEY=your-flask-secret-key
FLASK_ENV=production
```

## Alternative: Render.com (Also Free)

1. Go to https://render.com
2. Connect your GitHub repo
3. Create **Web Service**
4. Settings:
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `uvicorn main:app --host 0.0.0.0 --port $PORT`
5. Add environment variables in Render dashboard

## 🔧 Backend Requirements

Your backend needs:
- ✅ `main.py` (you have this)
- ✅ `requirements.txt` (you have this)  
- ✅ `src/` directory (you have this)
- ⚠️ Database (Railway/Render provides PostgreSQL)
- ⚠️ Ollama service (might need to disable AI features initially)

## 🎯 Simplified Deployment Flow

```
1. Deploy FastAPI backend → Railway/Render
2. Get backend URL → https://your-api.railway.app
3. Deploy Flask admin → HF Spaces (using backend URL)
4. Access admin → https://huggingface.co/spaces/username/space-name
```

## 🚨 Quick Start (No AI Features)

To deploy quickly without AI/Ollama complications:

1. **Temporarily disable AI routes** in `main.py`:
```python
# Comment out these lines temporarily:
# app.include_router(classification.router, prefix=settings.api_v1_prefix)
```

2. **Deploy backend** to Railway
3. **Deploy Flask admin** to HF Spaces  
4. **Test basic functionality** (folders, tickets without AI)
5. **Add AI features later** once basic deployment works

## 🎉 Ready to Deploy?

1. Choose Railway or Render
2. Deploy your FastAPI backend
3. Get the deployment URL
4. Use that URL in your HF Spaces Flask admin deployment

Would you like me to help you with the Railway deployment specifically?