# Gemini API Setup Instructions

## Get Your Gemini API Key

1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy your API key

## Configure the Application

1. Open the `.env.local` file in the root directory
2. Replace `your_gemini_api_key_here` with your actual API key:
   ```
   GEMINI_API_KEY=AIzaSy...your_actual_key_here
   ```
3. Save the file

## Restart the Development Server

After adding your API key, restart the server:
```bash
npm run dev
```

## How It Works

The application now uses Gemini AI to:
- Generate personalized 7-day meal plans based on user profile
- Create unique recipes featuring Milky Mist products
- Adapt meals to dietary preferences (vegetarian, vegan, gluten-free, lactose-free)
- Calculate accurate nutrition information
- Provide variety across the week

Each meal plan is dynamically generated and tailored to:
- User's protein requirements
- Age and gender
- Dietary restrictions
- Milky Mist product availability

## Features

✅ AI-powered recipe generation
✅ Personalized meal plans
✅ Dietary preference filtering
✅ Accurate nutrition calculations
✅ Step-by-step cooking instructions
✅ Milky Mist product integration
