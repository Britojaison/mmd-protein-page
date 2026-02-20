# Fix Gemini API Integration

## Problem
Your current Gemini API key is not working. The error indicates the models are not found.

## Solution: Get a New API Key

### Step 1: Get a Fresh API Key
1. Go to https://aistudio.google.com/app/apikey
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy the new API key

### Step 2: Update .env.local
Replace the current key in `.env.local`:
```
GEMINI_API_KEY=YOUR_NEW_API_KEY_HERE
```

### Step 3: Test the API Key
Run this command to test:
```bash
node test-gemini.js
```

You should see: "✅ gemini-1.5-flash works!"

### Step 4: Restart the Server
```bash
npm run dev
```

## If Still Not Working

The API key might have restrictions. Check:
1. API key is enabled for "Generative Language API"
2. No IP restrictions are set
3. The key is not expired

## Alternative: Use Google AI Studio Directly
If you can't get the API working, you can:
1. Generate meal plans manually in Google AI Studio
2. Copy the JSON output
3. Paste it into the app

Let me know if you need help!
