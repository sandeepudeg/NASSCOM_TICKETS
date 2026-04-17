# 🎫 TicketIQ - Local Development Guide

## 🎯 Quick Start - See the Unified Design System

### Prerequisites
- Docker Desktop installed and running
- Node.js 18+ installed
- Python 3.10+ installed
- Git installed

### 🚀 Option 1: Automated Setup (Recommended)

**For Linux/Mac:**
```bash
chmod +x run-local.sh
./run-local.sh
```

**For Windows:**
```cmd
.\run-local.bat
```

> **Note**: If you get "run-local.bat is not recognized", use `.\run-local.bat` instead of just `run-local.bat`

### 🔧 Option 2: Manual Setup

#### Step 1: Build Design System
```bash
cd design-system
npm install
npm run build
cd ..
```

#### Step 2: Install Dependencies
```bash
# Frontend dependencies
cd frontend
npm install
cd ..

# Python dependencies
pip install -r requirements.txt
```

#### Step 3: Start Infrastructure Services
```bash
cd docker
docker-compose up -d postgres minio keycloak
cd ..
```

#### Step 4: Start Applications

**Terminal 1 - React Frontend:**
```bash
cd frontend
npm run dev
```

**Terminal 2 - Flask Admin:**
```bash
# Option A: Using Python script (recommended for local dev)
python run_flask_local.py

# Option B: Direct module execution
python -m flask_admin.app
```

**Terminal 3 - Demo Page (Optional):**
```bash
# Serve the demo page
python -m http.server 8080 --directory demo
```

## 🌐 Access the Applications

### 🎨 Enhanced Unified Design System Interfaces

| Interface | URL | Description |
|-----------|-----|-------------|
| **Demo Page** | http://localhost:8080 | Original sophisticated dark theme (foundation) |
| **React Frontend** | http://localhost:3004 | **ENHANCED** - Professional quality matching demo |
| **Flask Admin** | http://localhost:5000 | **ENHANCED** - Completely redesigned with premium styling |

### 🔧 Infrastructure Services

| Service | URL | Credentials |
|---------|-----|-------------|
| MinIO Console | http://localhost:9001 | admin/minioadmin |
| Keycloak Admin | http://localhost:8080 | admin/admin |
| Grafana | http://localhost:3002 | admin/admin |
| Prometheus | http://localhost:9090 | - |

## 🎨 What You'll See - ENHANCED UI QUALITY

### Before Enhancement
- **Demo Page**: Beautiful dark theme with professional styling
- **React Frontend**: Basic Ant Design components with minimal styling
- **Flask Admin**: Plain design system components

### After Enhancement ✨ - PROFESSIONAL GRADE
- **All Interfaces**: Sophisticated dark theme matching demo page quality
- **Enhanced Typography**: Professional font hierarchy and spacing
- **Premium Components**: Cards with hover effects, shadows, and smooth animations
- **Sophisticated Navigation**: Backdrop blur, professional search, status indicators
- **Enhanced Statistics**: Large, bold numbers with proper visual hierarchy
- **Professional Buttons**: Hover animations, proper shadows, and state management
- **Advanced Tables**: Professional styling with hover states and proper spacing
- **Enhanced Forms**: Modern inputs with focus states and validation styling
- **Activity Feeds**: Professional timeline with icons and proper spacing
- **Theme Switching**: Seamless dark/light mode with proper color transitions

## 🎯 Key Enhanced Features

### 1. Professional Navigation
- **Backdrop Blur**: Sophisticated glass morphism effect
- **Enhanced Search**: Professional search input with proper focus states
- **Status Indicators**: Real-time system status with color coding
- **Quick Actions**: Prominent action buttons with hover animations

### 2. Premium Dashboard
- **Hero Section**: Gradient background matching demo page
- **Enhanced Stats Cards**: Large typography, proper spacing, hover effects
- **Professional Grid**: Responsive layout with consistent spacing
- **Activity Timeline**: Professional activity feed with icons and metadata

### 3. Sophisticated Components
- **Enhanced Cards**: Proper shadows, hover animations, border radius
- **Professional Tables**: Proper typography, hover states, spacing
- **Modern Forms**: Focus states, validation styling, proper spacing
- **Advanced Modals**: Backdrop blur, smooth animations, proper z-index

### 4. Enhanced Interactions
- **Smooth Animations**: CSS transitions with proper easing
- **Hover Effects**: Subtle transforms and shadow changes
- **Focus States**: Proper accessibility with visual feedback
- **Loading States**: Professional spinners and skeleton screens

## 🎯 Key Features to Test

### 1. Theme Switching
- Click the theme toggle (🌙/☀️) in any interface
- Notice how the theme persists across page reloads
- Switch between React and Flask - theme stays consistent

### 2. Component Consistency
- Compare buttons, cards, and modals across interfaces
- Notice identical styling and hover effects
- Check responsive behavior on mobile

### 3. Navigation Patterns
- Consistent header layout across React and Flask
- Same color scheme and spacing
- Unified search and action buttons

### 4. Design System Integration
- React uses `designSystemStyled` components
- Flask uses Jinja2 macros with design system classes
- Both consume the same CSS variables

## 🛠️ Development Workflow

### Making Changes to Design System
```bash
cd design-system
# Edit tokens in tokens/
npm run build
# Changes automatically reflect in both React and Flask
```

### React Frontend Development
```bash
cd frontend
npm run dev
# Hot reload enabled - changes reflect immediately
```

### Flask Admin Development
```bash
# Edit templates in flask_admin/templates/
python -m flask_admin.app
# Restart server to see changes
```

## 📊 Performance Monitoring

### Check Build Sizes
```bash
# Design system bundle size
cd design-system && npm run build

# React frontend bundle
cd frontend && npm run build

# Check bundle analyzer
npm run build -- --analyze
```

### Monitor Resource Usage
- Visit http://localhost:3002 (Grafana) for system metrics
- Check Docker container resource usage: `docker stats`

## 🐛 Troubleshooting

### Port Conflicts
If you get port conflicts, check these common issues:
- Port 3000: React dev server
- Port 5000: Flask admin
- Port 8080: Demo page server
- Port 5432: PostgreSQL
- Port 9001: MinIO console

### Design System Not Loading
```bash
# Rebuild design system
cd design-system
rm -rf dist node_modules
npm install
npm run build
```

### Flask Admin Errors
```bash
# Check Python dependencies
pip install -r requirements.txt

# Check Flask environment
export FLASK_ENV=development
python -m flask_admin.app
```

## 🎉 Success Indicators

You'll know the unified design system is working when:

1. **Visual Consistency**: All three interfaces look cohesive
2. **Theme Switching**: Works seamlessly across React and Flask
3. **Component Matching**: Buttons, cards, modals look identical
4. **Professional Appearance**: Enterprise-grade design everywhere
5. **Responsive Design**: Works perfectly on mobile and desktop

## 📝 Next Steps

Once you have the system running locally:

1. **Explore the Interfaces**: Navigate through all three applications
2. **Test Theme Switching**: Toggle between dark and light modes
3. **Check Responsiveness**: Resize browser window to test mobile view
4. **Compare Components**: Notice the consistent styling across platforms
5. **Review Code**: Examine how design system is integrated in both React and Flask

The unified design system successfully transforms three previously inconsistent interfaces into a cohesive, professional experience that maintains the sophisticated design language of the original demo page!