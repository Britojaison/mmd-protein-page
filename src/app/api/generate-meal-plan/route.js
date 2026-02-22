import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Cache for static recipes to avoid repeated file reads
let recipesCache = null;

export async function POST(request) {
  let requestData;
  
  try {
    requestData = await request.json();
    const { name, age, height, weight, proteinRequired, dietaryPreferences = [], gender } = requestData;
    
    // Server-side validation
    const validationErrors = [];
    
    // Validate age
    const ageNum = parseInt(age);
    if (!age || isNaN(ageNum) || ageNum < 1 || ageNum > 100) {
      validationErrors.push('Age must be between 1 and 100 years');
    }
    
    // Validate height
    const heightNum = parseFloat(height);
    if (!height || isNaN(heightNum) || heightNum < 50 || heightNum > 272) {
      validationErrors.push('Height must be between 50 and 272 cm');
    }
    
    // Validate weight
    const weightNum = parseFloat(weight);
    if (!weight || isNaN(weightNum) || weightNum < 5 || weightNum > 500) {
      validationErrors.push('Weight must be between 5 and 500 kg');
    }
    
    // Validate name
    if (!name || name.trim().length < 2) {
      validationErrors.push('Name must be at least 2 characters long');
    }
    
    // Validate gender
    if (!gender || !['male', 'female', 'other'].includes(gender)) {
      validationErrors.push('Please select a valid gender');
    }
    
    if (validationErrors.length > 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Validation failed', 
          validationErrors 
        },
        { status: 400 }
      );
    }
    
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
    
    // Create optimized prompt for Gemini - simplified for complete response
    const prompt = `Generate a 7-day meal plan for: Age ${age}, Gender ${gender}, Weight ${weight}kg, Protein target ${proteinRequired}g, Diet: ${dietaryString}. 

CRITICAL RULES:
- If vegetarian: NO eggs, NO chicken, NO meat. Only plant-based + Milky Mist dairy.
- If non-vegetarian: ONLY chicken and eggs + Milky Mist dairy.
- ALWAYS include Milky Mist products in EVERY meal.
- Keep ingredients list SHORT (max 5 items).
- Keep steps SHORT (max 3 steps).

MILKY MIST PRODUCTS TO USE (vary across meals):
- Milky Mist Skyr
- Milky Mist Greek Yogurt Natural
- Milky Mist Greek Yogurt Cereal
- Milky Mist Greek Yogurt Honey and Fig
- Milky Mist High Protein Paneer
- Milky Mist High Protein Cheddar Cheese

IMPORTANT: Use DIFFERENT Milky Mist products across different meals. Don't repeat the same product too often.

Return ONLY this JSON (complete all 7 days, Monday-Sunday):
{
  "weeklyPlan": [
    {
      "day": "Monday",
      "dayNumber": 1,
      "meals": [
        {
          "type": "Breakfast",
          "recipeName": "Short name",
          "milkyMistProduct": "Milky Mist Greek Yogurt Honey and Fig",
          "ingredients": ["item1", "item2", "item3"],
          "steps": ["step1", "step2"],
          "nutrition": {"protein": 30, "calories": 400, "carbs": 40, "fats": 15},
          "dietary": ["vegetarian"]
        },
        {
          "type": "Lunch",
          "recipeName": "Short name",
          "milkyMistProduct": "Milky Mist High Protein Paneer",
          "ingredients": ["item1", "item2"],
          "steps": ["step1", "step2"],
          "nutrition": {"protein": 35, "calories": 450, "carbs": 45, "fats": 18},
          "dietary": ["vegetarian"]
        },
        {
          "type": "Dinner",
          "recipeName": "Short name",
          "milkyMistProduct": "Milky Mist Skyr",
          "ingredients": ["item1", "item2"],
          "steps": ["step1", "step2"],
          "nutrition": {"protein": 30, "calories": 400, "carbs": 35, "fats": 16},
          "dietary": ["vegetarian"]
        }
      ]
    }
  ]
}

IMPORTANT: Keep ALL text SHORT. Use VARIETY of Milky Mist products. Generate ALL 7 days. Return ONLY valid JSON, no markdown.`;

    console.log('Calling Gemini API...');
    
    // Use gemini-2.5-flash which is available in your API key
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-2.5-flash',
      generationConfig: {
        temperature: 0.3,
        topK: 20,
        topP: 0.8,
        maxOutputTokens: 8192, // Increased to ensure complete response
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
      console.log('Raw response preview:', text.substring(0, 200));
      
      // Extract JSON from response with better error handling
      let jsonText = text.trim();
      
      // Remove markdown code blocks if present
      if (jsonText.includes('```json')) {
        jsonText = jsonText.split('```json')[1].split('```')[0].trim();
      } else if (jsonText.includes('```')) {
        jsonText = jsonText.split('```')[1].split('```')[0].trim();
      }
      
      // Find JSON boundaries
      const jsonStart = jsonText.indexOf('{');
      const jsonEnd = jsonText.lastIndexOf('}');
      
      if (jsonStart === -1 || jsonEnd === -1 || jsonStart >= jsonEnd) {
        console.error('Could not find valid JSON boundaries in response');
        throw new Error('Invalid JSON structure in Gemini response');
      }
      
      jsonText = jsonText.substring(jsonStart, jsonEnd + 1);
      
      console.log('Extracted JSON length:', jsonText.length);
      
      let mealPlanData;
      try {
        mealPlanData = JSON.parse(jsonText);
      } catch (parseError) {
        console.error('JSON Parse Error:', parseError.message);
        console.error('Failed JSON preview (first 500 chars):', jsonText.substring(0, 500));
        console.error('Failed JSON preview (last 500 chars):', jsonText.substring(Math.max(0, jsonText.length - 500)));
        throw new Error('Failed to parse Gemini response as JSON');
      }
      
      // Validate the structure
      if (!mealPlanData.weeklyPlan || !Array.isArray(mealPlanData.weeklyPlan) || mealPlanData.weeklyPlan.length !== 7) {
        console.error('Invalid meal plan structure:', mealPlanData);
        throw new Error('Gemini returned incomplete meal plan');
      }
      
      // Validate that vegetarian meals don't contain eggs or chicken
      if (dietaryPreferences.includes('vegetarian')) {
        console.log('Validating vegetarian meal plan from Gemini...');
        mealPlanData.weeklyPlan.forEach(day => {
          day.meals.forEach(meal => {
            // Check for whole word matches only, not substrings
            const ingredientsText = meal.ingredients ? meal.ingredients.join(' ').toLowerCase() : '';
            const recipeNameText = meal.recipeName ? meal.recipeName.toLowerCase() : '';
            
            // Use word boundaries to match whole words only
            const hasEggs = /\begg\b|\beggs\b/.test(ingredientsText) || /\begg\b|\beggs\b/.test(recipeNameText);
            const hasChicken = /\bchicken\b/.test(ingredientsText) || /\bchicken\b/.test(recipeNameText);
            const hasMeat = /\bmeat\b|\bbeef\b|\bpork\b|\bfish\b/.test(ingredientsText) || /\bmeat\b|\bbeef\b|\bpork\b|\bfish\b/.test(recipeNameText);
            
            if (hasEggs || hasChicken || hasMeat) {
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
      console.error('Gemini API Error Details:', {
        message: apiError.message,
        status: apiError.status,
        statusText: apiError.statusText,
        name: apiError.name
      });
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

