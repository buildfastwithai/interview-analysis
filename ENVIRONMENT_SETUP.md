# Environment Setup Guide - Fix 524 Error

## Quick Fix for 524 Error

The 524 error indicates a timeout when calling your FastAPI backend. Follow these steps to resolve it:

### 1. Create Environment File

Create a `.env.local` file in your project root with the following content:

```env
# Digital Ocean Spaces Configuration
NEXT_PUBLIC_DO_SPACES_ENDPOINT=https://nyc3.digitaloceanspaces.com
NEXT_PUBLIC_DO_SPACES_BUCKET=your-bucket-name
NEXT_PUBLIC_DO_SPACES_REGION=nyc3
DIGITAL_OCEAN_SPACES_KEY=your-access-key
DIGITAL_OCEAN_SPACES_SECRET=your-secret-key

# FastAPI Backend URL - CRITICAL: Update this to your actual FastAPI server URL
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### 2. Update FastAPI Backend URL

**Replace `http://localhost:8000` with your actual FastAPI server URL:**

- **If running locally**: `http://localhost:8000`
- **If running on a server**: `http://your-server-ip:8000`
- **If using HTTPS**: `https://your-domain.com`
- **If using a different port**: `http://localhost:YOUR_PORT`

### 3. Verify FastAPI Backend is Running

Make sure your FastAPI backend is:

- ✅ Running and accessible
- ✅ Listening on the correct port
- ✅ Not blocked by firewall
- ✅ Responding to health checks

### 4. Test the Connection

You can test if your FastAPI backend is reachable by running:

```bash
curl http://your-fastapi-url:port/health
# or
curl http://your-fastapi-url:port/docs
```

### 5. Common Issues and Solutions

| Issue               | Solution                        |
| ------------------- | ------------------------------- |
| FastAPI not running | Start your FastAPI server       |
| Wrong URL/Port      | Update `NEXT_PUBLIC_API_URL`    |
| Firewall blocking   | Allow the port in your firewall |
| CORS issues         | Configure CORS in FastAPI       |
| Network timeout     | Check network connectivity      |

### 6. Restart Your Next.js App

After updating the environment variables:

```bash
npm run dev
```

## Additional Improvements Made

I've also added timeout handling to prevent 524 errors:

- **4-minute timeout** for API calls
- **Better error handling** for network issues
- **Graceful timeout responses** with meaningful error messages

## Debugging Steps

If you still get 524 errors:

1. Check browser console for detailed error messages
2. Verify FastAPI backend logs
3. Test API endpoints directly with curl/Postman
4. Check network connectivity between frontend and backend
5. Ensure no proxy/firewall is blocking the connection
