# CPE Sync Deployment Guide

This guide will help you deploy the CPE Sync application to various hosting platforms. Choose the option that best fits your needs.

## 🚀 Quick Deployment Options

### Option 1: Railway (Recommended - Easiest)

Railway is the easiest way to deploy Node.js applications with database support.

1. **Create a Railway Account**
   - Go to [railway.app](https://railway.app)
   - Sign up with GitHub

2. **Deploy from GitHub**
   - Click "Deploy from GitHub repo"
   - Connect your GitHub account
   - Select your CPE Sync repository
   - Click "Deploy Now"

3. **Configure Environment Variables** (Optional)
   - In your Railway dashboard, go to Variables
   - Add `PORT=3000` if needed

4. **Your app will be live!**
   - Railway will provide you with a public URL
   - The SQLite database will persist automatically

### Option 2: Render (Free Tier Available)

Render offers a generous free tier perfect for this application.

1. **Create a Render Account**
   - Go to [render.com](https://render.com)
   - Sign up with GitHub

2. **Create a New Web Service**
   - Click "New +" → "Web Service"
   - Connect your GitHub repository
   - Choose your CPE Sync repo

3. **Configure the Service**
   - **Name**: `cpe-sync`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: Choose "Free" for testing

4. **Deploy**
   - Click "Create Web Service"
   - Wait for deployment to complete
   - Your app will be available at the provided URL

### Option 3: Heroku (Credit Card Required)

1. **Install Heroku CLI**
   ```bash
   # On Windows (using chocolatey)
   choco install heroku-cli
   
   # On macOS (using homebrew)
   brew tap heroku/brew && brew install heroku
   
   # On Ubuntu/Debian
   sudo snap install heroku --classic
   ```

2. **Login and Create App**
   ```bash
   heroku login
   heroku create your-cpe-sync-app
   ```

3. **Deploy**
   ```bash
   git add .
   git commit -m "Initial deployment"
   git push heroku main
   ```

4. **Open Your App**
   ```bash
   heroku open
   ```

### Option 4: Vercel (Serverless)

1. **Install Vercel CLI**
   ```bash
   npm i -g vercel
   ```

2. **Deploy**
   ```bash
   vercel --prod
   ```

3. **Follow the prompts**
   - Link to existing project or create new
   - Choose settings (defaults are usually fine)

### Option 5: DigitalOcean App Platform

1. **Create DigitalOcean Account**
   - Go to [digitalocean.com](https://digitalocean.com)
   - Sign up and verify your account

2. **Create New App**
   - Go to Apps section
   - Click "Create App"
   - Connect GitHub and select your repository

3. **Configure App**
   - **Type**: Web Service
   - **Build Command**: `npm install`
   - **Run Command**: `npm start`
   - **HTTP Port**: 3000

## 🔧 Environment Variables

Most platforms will work with the default configuration, but you can set these optional variables:

- `PORT`: Server port (default: 3000)
- `NODE_ENV`: Set to "production" for production deployment

## 📱 Testing Your Deployment

Once deployed, test your application:

1. **Access the Application**
   - Visit the provided URL
   - You should see the CPE Sync landing page

2. **Test Student Registration**
   - Click "Register"
   - Create a test student account
   - Try logging in

3. **Test Admin Access**
   - Click "Login" → "Admin" tab
   - Use admin code: `CPE-SYNC-ADMIN-2025`
   - Create a test event

4. **Test Real-time Features**
   - Open the app in multiple browser tabs
   - Log in as admin in one tab, student in another
   - Create an event as admin and see it appear for student instantly

## 🔄 Database Persistence

**Important**: The SQLite database file will persist on:
- ✅ Railway (persistent disk)
- ✅ Render (persistent disk on paid plans)
- ❌ Heroku (ephemeral filesystem - data will be lost on restart)
- ❌ Vercel (serverless - not suitable for SQLite)

For Heroku or Vercel, consider these alternatives:
- Use PostgreSQL instead of SQLite
- Use external database services like MongoDB Atlas
- Use Planetscale or Supabase for managed databases

## 🌐 Custom Domain (Optional)

Most platforms allow custom domains:

1. **Railway**: Go to Settings → Domains
2. **Render**: Go to Settings → Custom Domains
3. **Heroku**: Use `heroku domains:add yourdomain.com`
4. **Vercel**: Automatic domain management in dashboard

## 🚨 Production Considerations

Before going live with real users:

1. **Change Admin Code**
   - Edit `server.js` line with `ADMIN_CODE`
   - Use a more secure code

2. **Enable HTTPS**
   - All mentioned platforms provide HTTPS automatically

3. **Set Up Monitoring**
   - Most platforms provide basic monitoring
   - Consider tools like Sentry for error tracking

4. **Backup Strategy**
   - Regular database backups if using SQLite
   - Consider automated backup solutions

5. **Scale Planning**
   - Monitor usage and upgrade plans as needed
   - Consider load balancing for high traffic

## 🆘 Troubleshooting

### Common Issues:

1. **App won't start**
   - Check build logs for errors
   - Ensure all dependencies are listed in package.json

2. **Database not persisting**
   - Check if platform supports persistent storage
   - Consider using managed database services

3. **Real-time features not working**
   - Ensure WebSocket connections are allowed
   - Check firewall settings

4. **File uploads failing**
   - Verify platform supports file uploads
   - Check upload size limits

## 📞 Support

If you encounter issues:
1. Check platform-specific documentation
2. Review application logs
3. Test locally first to isolate issues

---

**Recommended for beginners**: Start with Railway or Render for the easiest deployment experience!