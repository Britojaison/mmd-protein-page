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

CRITICAL DIETARY GUIDELINES:
- If diet includes "non-vegetarian": ALL meals must contain chicken or eggs as primary protein. NO vegetarian-only meals. Always combine with Milky Mist dairy products.
- If diet includes "vegetarian": STRICTLY VEGETARIAN - NO eggs, NO chicken, NO meat, NO fish. Only plant-based ingredients and Milky Mist dairy products (paneer, yogurt, milk). EGGS ARE NOT VEGETARIAN.
- If diet includes "gluten-free": Avoid wheat, barley, rye, and gluten-containing ingredients.
- ALWAYS include Milky Mist dairy products in every meal (Greek Yogurt, Paneer, Skyr, Milk, etc.)

IMPORTANT: EGGS ARE NOT VEGETARIAN. If user selects vegetarian, do not include any eggs in any recipe.

EXAMPLES FOR NON-VEGETARIAN:
- Breakfast: "Chicken Sausage & Greek Yogurt Parfait" (NOT "Paneer Pancakes")
- Lunch: "Grilled Chicken & Paneer Salad" (NOT "Pure Paneer Salad")  
- Dinner: "Egg & Paneer Bhurji" (NOT "Pasta")

Return ONLY valid JSON with this structure:
{
  "weeklyPlan": [
    {
      "day": "Monday",
      "dayNumber": 1,
      "meals": [
        {
          "type": "Breakfast",
          "recipeName": "Chicken & Greek Yogurt Bowl",
          "milkyMistProduct": "Milky Mist Greek Yogurt",
          "ingredients": ["150g grilled chicken", "1 cup Greek yogurt (15g protein)"],
          "steps": ["Grill chicken", "Add yogurt"],
          "nutrition": {"protein": 45, "calories": 400, "carbs": 15, "fats": 12},
          "dietary": ["non-vegetarian"]
        }
      ]
    }
  ]
}

Requirements: 3 meals/day, include Milky Mist products in ALL meals, respect dietary preferences strictly, realistic portions.`;

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
      
      // Validate that vegetarian meals don't contain eggs
      if (dietaryPreferences.includes('vegetarian')) {
        console.log('Validating vegetarian meal plan from Gemini...');
        mealPlanData.weeklyPlan.forEach(day => {
          day.meals.forEach(meal => {
            const hasEggs = meal.ingredients && meal.ingredients.some(ingredient => 
              ingredient.toLowerCase().includes('egg')
            );
            const hasChicken = meal.ingredients && meal.ingredients.some(ingredient => 
              ingredient.toLowerCase().includes('chicken')
            );
            
            if (hasEggs || hasChicken) {
              console.log(`WARNING: Non-vegetarian ingredient found in meal: ${meal.recipeName}`);
              console.log(`Ingredients: ${meal.ingredients.join(', ')}`);
              console.log('Falling back to curated recipes...');
              throw new Error('Non-vegetarian ingredients in vegetarian meal plan');
            }
          });
        });
      }
      
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
        // Handle non-vegetarian preference - ONLY non-veg recipes
        if (dietaryPreferences.includes('non-vegetarian')) {
          // Must have non-vegetarian tag OR contain chicken/egg in name
          const isNonVeg = (recipe.dietary && recipe.dietary.includes('non-vegetarian')) ||
                          recipe.recipeName.toLowerCase().includes('chicken') ||
                          recipe.recipeName.toLowerCase().includes('egg');
          
          // Check for gluten-free if also selected
          if (dietaryPreferences.includes('gluten-free')) {
            return isNonVeg && recipe.dietary && recipe.dietary.includes('gluten-free');
          }
          
          return isNonVeg;
        }
        
        // Handle vegetarian preference (exclude non-veg)
        if (dietaryPreferences.includes('vegetarian')) {
          const isVegetarian = recipe.dietary && recipe.dietary.includes('vegetarian') &&
                              !recipe.dietary.includes('non-vegetarian') &&
                              !recipe.recipeName.toLowerCase().includes('chicken') &&
                              !recipe.recipeName.toLowerCase().includes('egg');
          
          // Additional check: ensure no eggs in ingredients
          const hasEggs = recipe.ingredients && recipe.ingredients.some(ingredient => 
            ingredient.toLowerCase().includes('egg')
          );
          
          if (hasEggs) {
            return false; // Exclude recipes with eggs from vegetarian selection
          }
          
          // Check for gluten-free if also selected
          if (dietaryPreferences.includes('gluten-free')) {
            return isVegetarian && recipe.dietary && recipe.dietary.includes('gluten-free');
          }
          
          return isVegetarian;
        }
        
        // Handle other preferences (gluten-free only)
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

