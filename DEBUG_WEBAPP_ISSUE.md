# Debug: Webapp Fails But Test Script Works

## Issue
- ✅ Test script works: `node test-drive-api.js FOLDER_ID API_KEY` succeeds
- ❌ Webapp fails: Inputting API key in Settings fails to fetch files

## Possible Causes

### 1. Backend Server Not Running
**Check:**
- Is the backend server running? `cd server && npm run dev`
- Is it running on port 3001?
- Check backend console for errors

**Fix:**
```bash
cd server
npm run dev
```

### 2. CORS or Network Error
**Check:**
- Open browser console (F12)
- Look for network errors
- Check if request reaches backend

**Fix:**
- Backend should handle CORS
- Check backend logs for incoming requests

### 3. API URL Configuration
**Check:**
- Frontend uses: `import.meta.env.VITE_API_URL || 'http://localhost:3001/api'`
- Vite proxy: `/api` → `http://localhost:3001`
- Make sure backend is on port 3001

**Fix:**
- Check `vite.config.js` proxy configuration
- Verify backend port matches

### 4. Authentication Token Issue
**Check:**
- Frontend sends: `localStorage.getItem('authToken') || 'test-token'`
- Backend accepts test token in dev mode
- Check backend logs for auth errors

**Fix:**
- Backend should accept `test-token` in development
- Check backend auth middleware

### 5. Request Format Issue
**Check:**
- Frontend sends: `{ folderId, apiKey }`
- Backend expects: `{ folderId, apiKey }`
- Check backend logs for request body

**Fix:**
- Verify request body format matches

## Debug Steps

### Step 1: Check Backend is Running
```bash
cd server
npm run dev
```

You should see:
```
Server running on port 3001
```

### Step 2: Check Browser Console
1. Open browser (F12 → Console)
2. Try to load files via Settings
3. Look for:
   - `🌐 Calling backend API: ...`
   - `📥 Backend Response: ...`
   - Any error messages

### Step 3: Check Backend Console
When you try to load files, backend should show:
- `📡 Fetching from Google Drive API:`
- `📥 Google Drive API Response:`
- Any errors

### Step 4: Test Backend Endpoint Directly
```bash
curl -X POST http://localhost:3001/api/drive/fetch \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer test-token" \
  -d '{"folderId":"15p8KRq2np1fiClobWLDjOOAV95tBtorE","apiKey":"AIzaSyC4G6RunYuWGlOJHPLsBI8jg9sikqJ3sXk"}'
```

This should return the same result as the test script.

### Step 5: Check Network Tab
1. Open browser (F12 → Network tab)
2. Try to load files
3. Find the `/api/drive/fetch` request
4. Check:
   - Request URL
   - Request headers
   - Request payload
   - Response status
   - Response body

## Common Issues

### Issue: "Failed to fetch" or "NetworkError"
**Cause:** Backend not running or wrong URL

**Fix:**
1. Make sure backend is running: `cd server && npm run dev`
2. Check backend is on port 3001
3. Check frontend API URL configuration

### Issue: "401 Unauthorized" or "403 Forbidden"
**Cause:** Authentication token issue

**Fix:**
1. Check backend accepts test token in dev mode
2. Verify token is sent in Authorization header
3. Check backend auth middleware

### Issue: "400 Bad Request"
**Cause:** Request format issue

**Fix:**
1. Check request body format
2. Verify folderId and apiKey are sent
3. Check backend validation

### Issue: "500 Internal Server Error"
**Cause:** Backend error

**Fix:**
1. Check backend console for errors
2. Check backend logs
3. Verify Google Drive API call works

## Quick Fix Checklist

- [ ] Backend server is running (`cd server && npm run dev`)
- [ ] Backend is on port 3001
- [ ] Frontend can reach backend (check Network tab)
- [ ] Request format is correct (check Network tab → Payload)
- [ ] Backend receives request (check backend console)
- [ ] Backend makes Google Drive API call (check backend console)
- [ ] Google Drive API returns success (check backend console)
- [ ] Response is sent to frontend (check Network tab → Response)

## Still Not Working?

1. **Check Backend Logs:**
   - Look for `📡 Fetching from Google Drive API`
   - Check for any errors
   - Verify API key is being used correctly

2. **Check Browser Console:**
   - Look for `🌐 Calling backend API`
   - Check for network errors
   - Verify response

3. **Check Network Tab:**
   - Verify request is being sent
   - Check response status
   - Check response body

4. **Test Backend Directly:**
   - Use curl command above
   - Compare with test script
   - Check if they both work

5. **Share Debug Info:**
   - Backend console output
   - Browser console output
   - Network tab screenshot
   - Error messages

