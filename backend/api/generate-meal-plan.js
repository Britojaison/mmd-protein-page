import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function POST(request) {
  try {
    const { name, age, height, weight, proteinRequired } = await request.json();
    
    // Read recipes from JSON
    const recipesPath = path.join(process.cwd(), 'src', 'data', 'recipes.json');
    const recipesData = JSON.parse(fs.readFileSync(recipesPath, 'utf-8'));
    
    // Select recipes that match protein requirements
    const targetPerMeal = proteinRequired / 3;
    
    // Select best matching recipes for each meal type
    const breakfast = selectBestRecipe(recipesData.breakfast, targetPerMeal);
    const lunch = selectBestRecipe(recipesData.lunch, targetPerMeal);
    const dinner = selectBestRecipe(recipesData.dinner, targetPerMeal);
    
    const meals = [
      { type: 'Breakfast', ...breakfast },
      { type: 'Lunch', ...lunch },
      { type: 'Dinner', ...dinner }
    ];
    
    const totalProtein = meals.reduce((sum, meal) => sum + meal.protein, 0);
    
    return NextResponse.json({
      success: true,
      totalProtein,
      proteinRequired,
      achieved: totalProtein >= proteinRequired,
      meals
    });
  } catch (error) {
    console.error('Error generating meal plan:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to generate meal plan' },
      { status: 500 }
    );
  }
}

function selectBestRecipe(recipes, targetProtein) {
  // Find recipe closest to target protein
  return recipes.reduce((best, current) => {
    const currentDiff = Math.abs(current.protein - targetProtein);
    const bestDiff = Math.abs(best.protein - targetProtein);
    return currentDiff < bestDiff ? current : best;
  });
}
