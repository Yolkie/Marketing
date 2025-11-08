# Debug Steps for White Page

## Step 1: Check Browser Console
1. Open browser DevTools (F12)
2. Go to Console tab
3. Look for any red error messages
4. Copy any errors you see

## Step 2: Test Simple Component
1. Temporarily rename `src/App.jsx` to `src/App-original.jsx`
2. Rename `src/App-simple.jsx` to `src/App.jsx`
3. Restart dev server: `npm run dev`
4. If you see "React is Working!" message, React is fine - the issue is with component imports

## Step 3: Check Terminal Output
Look at the terminal where `npm run dev` is running:
- Are there any compilation errors?
- Does it say "Local: http://localhost:3000"?
- Any red error messages?

## Step 4: Verify File Structure
Make sure these files exist:
- ✅ `index.html` (root)
- ✅ `src/main.jsx`
- ✅ `src/App.jsx`
- ✅ `src/index.css`
- ✅ `content_workflow_platform.tsx` (root)
- ✅ `LoginComponent.tsx` (root)

## Step 5: Check Environment Variables
Create `.env` file in root:
```env
VITE_API_URL=http://localhost:3001/api
```

## Step 6: Common Issues

### Issue: "Cannot find module"
**Fix:** Run `npm install` again

### Issue: "process is not defined"
**Fix:** Use `import.meta.env` instead of `process.env` (already fixed)

### Issue: Components not loading
**Fix:** Check that component files are in root directory

### Issue: Port already in use
**Fix:** Change port in `vite.config.js` or kill process on port 3000

## Step 7: Nuclear Option
If nothing works:
1. Delete `node_modules` folder
2. Delete `package-lock.json`
3. Run `npm install`
4. Restart dev server

## Still Stuck?
Share:
1. Browser console errors
2. Terminal output
3. File structure
4. What you see (white page, error message, etc.)


