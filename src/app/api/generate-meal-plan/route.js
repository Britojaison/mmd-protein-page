import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export async function POST(request) {
  let requestData;
  
  try {
    requestData = await request.json();
    const { name, age, height, weight, proteinRequired, dietaryPreferences = [], gender } = requestData;
    
    // Check if API key exists
    if (!process.env.GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY is not configured');
    }
    
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    
    // Build dietary preferences string
    const dietaryString = dietaryPreferences.length > 0 
      ? dietaryPreferences.join(', ') 
      : 'no specific restrictions';
    
    // Create prompt for Gemini
    const prompt = `Generate a personalized 7-day meal plan for a person with the following details:
- Name: ${name}
- Age: ${age} years
- Gender: ${gender}
- Height: ${height} cm
- Weight: ${weight} kg
- Daily Protein Target: ${proteinRequired}g
- Dietary Preferences: ${dietaryString}

Create a complete 7-day meal plan (Monday to Sunday) with breakfast, lunch, and dinner for each day.
Each meal should include:
- Recipe name
- Detailed ingredients list with protein amounts where applicable
- Step-by-step cooking instructions
- Nutritional information (protein, calories, carbs, fats)
- A relevant Milky Mist dairy product to use (like Greek Yogurt, Paneer, Milk, Curd, etc.)
- Dietary tags if applicable (vegetarian, vegan, gluten-free, lactose-free)

Ensure the meals are varied, delicious, and meet the protein requirements. Format the response as a JSON object with this exact structure:

{
  "weeklyPlan": [
    {
      "day": "Monday",
      "dayNumber": 1,
      "meals": [
        {
          "type": "Breakfast",
          "recipeName": "High Protein Oatmeal Bowl",
          "milkyMistProduct": "Milky Mist Greek Yogurt",
          "ingredients": ["1 cup oats", "1 cup Milky Mist Greek Yogurt (15g protein)", "1 banana", "2 tbsp almonds"],
          "steps": ["Cook oats with water", "Top with Greek yogurt", "Add sliced banana and almonds", "Serve warm"],
          "nutrition": {
            "protein": 30,
            "calories": 400,
            "carbs": 45,
            "fats": 12
          },
          "dietary": ["vegetarian"]
        }
      ]
    }
  ]
}

Make sure:
- Each day has exactly 3 meals (Breakfast, Lunch, Dinner)
- Total daily protein is close to ${proteinRequired}g
- Include Milky Mist dairy products in recipes
- Respect dietary preferences: ${dietaryString}
- Provide realistic portion sizes and nutritional values
- Return ONLY valid JSON, no additional text`;

    console.log('Calling Gemini API...');
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-1.5-flash',
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 8192,
      }
    });
    
    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();
    
    console.log('Gemini response received, length:', text.length);
    
    // Extract JSON from response (handle markdown code blocks)
    let jsonText = text.trim();
    if (jsonText.includes('```json')) {
      jsonText = jsonText.split('```json')[1].split('```')[0].trim();
    } else if (jsonText.includes('```')) {
      jsonText = jsonText.split('```')[1].split('```')[0].trim();
    }
    
    // Remove any leading/trailing text that's not JSON
    const jsonStart = jsonText.indexOf('{');
    const jsonEnd = jsonText.lastIndexOf('}');
    if (jsonStart !== -1 && jsonEnd !== -1) {
      jsonText = jsonText.substring(jsonStart, jsonEnd + 1);
    }
    
    console.log('Parsing JSON response...');
    const mealPlanData = JSON.parse(jsonText);
    console.log('Successfully parsed meal plan data');
    
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
  } catch (error) {
    console.error('Error generating meal plan:', error);
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    if (error.stack) console.error('Error stack:', error.stack);
    
    // Fallback to static recipes if AI generation fails
    if (requestData) {
      try {
        const fs = require('fs');
        const path = require('path');
        const recipesPath = path.join(process.cwd(), 'src', 'data', 'recipes-enhanced.json');
        const recipesData = JSON.parse(fs.readFileSync(recipesPath, 'utf-8'));
        
        const { dietaryPreferences = [], proteinRequired } = requestData;
        
        console.log('AI generation failed, using fallback static recipes. Error was:', error.message);
        
        // Filter recipes based on dietary preferences
        const filterRecipes = (recipes) => {
          if (dietaryPreferences.length === 0) return recipes;
          return recipes.filter(recipe => {
            return dietaryPreferences.every(pref => 
              recipe.dietary && recipe.dietary.includes(pref)
            );
          });
        };
        
        const filteredBreakfast = filterRecipes(recipesData.breakfast);
        const filteredLunch = filterRecipes(recipesData.lunch);
        const filteredDinner = filterRecipes(recipesData.dinner);
        
        const breakfastOptions = filteredBreakfast.length > 0 ? filteredBreakfast : recipesData.breakfast;
        const lunchOptions = filteredLunch.length > 0 ? filteredLunch : recipesData.lunch;
        const dinnerOptions = filteredDinner.length > 0 ? filteredDinner : recipesData.dinner;
        
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
        
        const weeklyTotalProtein = weeklyPlan.reduce((sum, day) => sum + day.totalProtein, 0);
        const weeklyTotalCalories = weeklyPlan.reduce((sum, day) => sum + day.totalCalories, 0);
        const averageDailyProtein = Math.round(weeklyTotalProtein / 7);
        const averageDailyCalories = Math.round(weeklyTotalCalories / 7);
        
        console.log('Successfully generated fallback meal plan');
        return NextResponse.json({
          success: true,
          weeklyPlan,
          proteinRequired,
          averageDailyProtein,
          averageDailyCalories,
          weeklyTotalProtein,
          weeklyTotalCalories,
          dietaryPreferences: dietaryPreferences.length > 0 ? dietaryPreferences : ['all'],
          usedFallback: true,
          fallbackReason: error.message
        });
      } catch (fallbackError) {
        console.error('Fallback also failed:', fallbackError);
      }
    }
    
    return NextResponse.json(
      { success: false, error: 'Failed to generate meal plan: ' + error.message },
      { status: 500 }
    );
  }
}

