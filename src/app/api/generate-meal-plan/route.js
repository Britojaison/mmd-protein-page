import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Cache for static recipes to avoid repeated file reads
let recipesCache = null;

export async function POST(request) {
  let requestData;
  
  try {
    requestData = await request.json();
    const { name, age, height, weight, proteinRequired, dietaryPreferences = [], gender } = requestData;
    
    // Check if API key exists
    if (!process.env.GEMINI_API_KEY) {
      console.log('GEMINI_API_KEY not configured, using fallback recipes');
      return generateFallbackMealPlan(requestData);
    }
    
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    
    // Build dietary preferences string
    const dietaryString = dietaryPreferences.length > 0 
      ? dietaryPreferences.join(', ') 
      : 'no specific restrictions';
    
    // Create optimized prompt for Gemini
    const prompt = `Generate a 7-day meal plan for: Age ${age}, Gender ${gender}, Weight ${weight}kg, Protein target ${proteinRequired}g, Diet: ${dietaryString}. 
    
Return ONLY valid JSON with this structure:
{
  "weeklyPlan": [
    {
      "day": "Monday",
      "dayNumber": 1,
      "meals": [
        {
          "type": "Breakfast",
          "recipeName": "High Protein Oatmeal",
          "milkyMistProduct": "Milky Mist Greek Yogurt",
          "ingredients": ["1 cup oats", "1 cup Greek yogurt (15g protein)"],
          "steps": ["Cook oats", "Add yogurt"],
          "nutrition": {"protein": 30, "calories": 400, "carbs": 45, "fats": 12},
          "dietary": ["vegetarian"]
        }
      ]
    }
  ]
}

Requirements: 3 meals/day, include Milky Mist products, respect dietary preferences, realistic portions.`;

    console.log('Calling Gemini API...');
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-1.5-flash',
      generationConfig: {
        temperature: 0.3, // Lower temperature for more consistent results
        topK: 20,
        topP: 0.8,
        maxOutputTokens: 4096, // Reduced for faster response
      }
    });
    
    // Set timeout for API call
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
    
    try {
      const result = await model.generateContent(prompt);
      clearTimeout(timeoutId);
      
      const response = result.response;
      const text = response.text();
      
      console.log('Gemini response received, length:', text.length);
      
      // Extract JSON from response
      let jsonText = text.trim();
      if (jsonText.includes('```json')) {
        jsonText = jsonText.split('```json')[1].split('```')[0].trim();
      } else if (jsonText.includes('```')) {
        jsonText = jsonText.split('```')[1].split('```')[0].trim();
      }
      
      const jsonStart = jsonText.indexOf('{');
      const jsonEnd = jsonText.lastIndexOf('}');
      if (jsonStart !== -1 && jsonEnd !== -1) {
        jsonText = jsonText.substring(jsonStart, jsonEnd + 1);
      }
      
      const mealPlanData = JSON.parse(jsonText);
      return formatMealPlanResponse(mealPlanData, requestData);
      
    } catch (apiError) {
      clearTimeout(timeoutId);
      console.log('Gemini API failed, using fallback:', apiError.message);
      return generateFallbackMealPlan(requestData);
    }
    
  } catch (error) {
    console.error('Error generating meal plan:', error);
    return generateFallbackMealPlan(requestData);
  }
}

async function generateFallbackMealPlan(requestData) {
  try {
    // Use cached recipes or load them
    if (!recipesCache) {
      const fs = require('fs');
      const path = require('path');
      const recipesPath = path.join(process.cwd(), 'src', 'data', 'recipes-enhanced.json');
      recipesCache = JSON.parse(fs.readFileSync(recipesPath, 'utf-8'));
    }
    
    const { dietaryPreferences = [], proteinRequired } = requestData;
    
    // Filter recipes based on dietary preferences
    const filterRecipes = (recipes) => {
      if (dietaryPreferences.length === 0) return recipes;
      return recipes.filter(recipe => {
        return dietaryPreferences.every(pref => 
          recipe.dietary && recipe.dietary.includes(pref)
        );
      });
    };
    
    const filteredBreakfast = filterRecipes(recipesCache.breakfast);
    const filteredLunch = filterRecipes(recipesCache.lunch);
    const filteredDinner = filterRecipes(recipesCache.dinner);
    
    const breakfastOptions = filteredBreakfast.length > 0 ? filteredBreakfast : recipesCache.breakfast;
    const lunchOptions = filteredLunch.length > 0 ? filteredLunch : recipesCache.lunch;
    const dinnerOptions = filteredDinner.length > 0 ? filteredDinner : recipesCache.dinner;
    
    const weeklyPlan = [];
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    
    for (let i = 0; i < 7; i++) {
      const breakfast = breakfastOptions[i % breakfastOptions.length];
      const lunch = lunchOptions[i % lunchOptions.length];
      const dinner = dinnerOptions[i % dinnerOptions.length];
      
      const dayMeals = [
        { type: 'Breakfast', ...breakfast },
        { type: 'Lunch', ...lunch },
        { type: 'Dinner', ...dinner }
      ];
      
      const dayTotalProtein = dayMeals.reduce((sum, meal) => sum + meal.nutrition.protein, 0);
      const dayTotalCalories = dayMeals.reduce((sum, meal) => sum + meal.nutrition.calories, 0);
      const dayTotalCarbs = dayMeals.reduce((sum, meal) => sum + meal.nutrition.carbs, 0);
      const dayTotalFats = dayMeals.reduce((sum, meal) => sum + meal.nutrition.fats, 0);
      
      weeklyPlan.push({
        day: days[i],
        dayNumber: i + 1,
        meals: dayMeals,
        totalProtein: dayTotalProtein,
        totalCalories: dayTotalCalories,
        totalCarbs: dayTotalCarbs,
        totalFats: dayTotalFats,
        achieved: dayTotalProtein >= proteinRequired
      });
    }
    
    return formatMealPlanResponse({ weeklyPlan }, requestData);
    
  } catch (fallbackError) {
    console.error('Fallback also failed:', fallbackError);
    return NextResponse.json(
      { success: false, error: 'Failed to generate meal plan' },
      { status: 500 }
    );
  }
}

function formatMealPlanResponse(mealPlanData, requestData) {
  const { proteinRequired, dietaryPreferences = [] } = requestData;
  
  // Calculate totals for each day
  const weeklyPlan = mealPlanData.weeklyPlan.map(day => {
    const dayTotalProtein = day.meals.reduce((sum, meal) => sum + meal.nutrition.protein, 0);
    const dayTotalCalories = day.meals.reduce((sum, meal) => sum + meal.nutrition.calories, 0);
    const dayTotalCarbs = day.meals.reduce((sum, meal) => sum + meal.nutrition.carbs, 0);
    const dayTotalFats = day.meals.reduce((sum, meal) => sum + meal.nutrition.fats, 0);
    
    return {
      ...day,
      totalProtein: dayTotalProtein,
      totalCalories: dayTotalCalories,
      totalCarbs: dayTotalCarbs,
      totalFats: dayTotalFats,
      achieved: dayTotalProtein >= proteinRequired
    };
  });
  
  const weeklyTotalProtein = weeklyPlan.reduce((sum, day) => sum + day.totalProtein, 0);
  const weeklyTotalCalories = weeklyPlan.reduce((sum, day) => sum + day.totalCalories, 0);
  const averageDailyProtein = Math.round(weeklyTotalProtein / 7);
  const averageDailyCalories = Math.round(weeklyTotalCalories / 7);
  
  return NextResponse.json({
    success: true,
    weeklyPlan,
    proteinRequired,
    averageDailyProtein,
    averageDailyCalories,
    weeklyTotalProtein,
    weeklyTotalCalories,
    dietaryPreferences: dietaryPreferences.length > 0 ? dietaryPreferences : ['all']
  });
}

