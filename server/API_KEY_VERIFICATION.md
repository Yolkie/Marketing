# Google Drive API Key Verification Guide

## Quick Test

Test your API key directly using the test script:

```bash
cd server
node test-drive-api.js YOUR_FOLDER_ID YOUR_API_KEY
```

This will show you exactly what error Google is returning.

## Common "API key not valid" Issues

### 1. API Key Format

**Correct format:**
- Starts with `AIzaSy...`
- Usually 39 characters long
- No spaces before or after

**Wrong formats:**
- ❌ `GOCSPX-...` (This is a client secret, not an API key)
- ❌ Has spaces: `AIzaSy ...` 
- ❌ Has newlines or special characters

### 2. Google Drive API Not Enabled

**Check:**
1. Go to [Google Cloud Console](https://console.cloud.google.com/apis/library)
2. Search for "Google Drive API"
3. Make sure it shows **"Enabled"** (not "Enable")

**Enable it:**
1. Click on "Google Drive API"
2. Click **"Enable"** button
3. Wait 1-2 minutes for it to activate

### 3. API Key Restrictions

**Check restrictions:**
1. Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Click on your API key
3. Check **"API restrictions"**:
   - If "Don't restrict key" → Should work
   - If "Restrict key" → Make sure **"Google Drive API"** is checked

**Fix:**
1. Under "API restrictions", select "Restrict key"
2. Check **"Google Drive API"**
3. Click **"Save"**

### 4. Application Restrictions

**Check:**
1. Click on your API key
2. Check **"Application restrictions"**:
   - If "None" → Should work
   - If restricted → May block requests

**For testing:**
1. Set to **"None"** (or "HTTP referrers" and add `localhost`)
2. Click **"Save"**

### 5. Billing Required

Some Google APIs require billing to be enabled.

**Check:**
1. Go to [Google Cloud Console](https://console.cloud.google.com/billing)
2. Make sure billing is enabled for your project

## Step-by-Step Verification

### Step 1: Verify API Key Format

```bash
# Check your API key
echo "YOUR_API_KEY" | wc -c  # Should be around 39-40 characters
echo "YOUR_API_KEY" | head -c 6  # Should start with "AIzaSy"
```

### Step 2: Test API Key Directly

```bash
# Test with curl
curl "https://www.googleapis.com/drive/v3/files?q='YOUR_FOLDER_ID'+in+parents&key=YOUR_API_KEY"
```

### Step 3: Use Test Script

```bash
cd server
node test-drive-api.js YOUR_FOLDER_ID YOUR_API_KEY
```

### Step 4: Check Backend Logs

When you try to load files, check the backend console:
- Look for "📡 Fetching from Google Drive API"
- Check "📥 Google Drive API Response"
- Look for "❌ Google Drive API Error Details"

## What to Check

1. **API Key:**
   - ✅ Format: `AIzaSy...`
   - ✅ Length: ~39 characters
   - ✅ No spaces
   - ✅ Not expired

2. **Google Drive API:**
   - ✅ Enabled in Google Cloud Console
   - ✅ Enabled for your project
   - ✅ Active (not disabled)

3. **API Key Restrictions:**
   - ✅ Google Drive API is allowed
   - ✅ Application restrictions don't block requests

4. **Folder:**
   - ✅ Folder ID is correct
   - ✅ Folder is shared ("Anyone with the link")
   - ✅ Folder contains video/image files

## Still Not Working?

1. **Regenerate API Key:**
   - Create a new API key
   - Don't restrict it initially
   - Test it
   - Then add restrictions if needed

2. **Check Error Details:**
   - Look at backend console logs
   - Check the full error response
   - Share the exact error message

3. **Test in Different Environment:**
   - Try the test script
   - Try curl command
   - Check if it's a CORS issue (shouldn't be with backend)

## Debug Checklist

- [ ] API key format is correct (`AIzaSy...`)
- [ ] API key has no extra spaces
- [ ] Google Drive API is enabled
- [ ] API key restrictions allow Google Drive API
- [ ] Application restrictions don't block requests
- [ ] Folder ID is correct
- [ ] Folder is shared
- [ ] Backend server is running
- [ ] Check backend console for detailed errors

