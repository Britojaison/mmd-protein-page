import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Cache for static recipes to avoid repeated file reads
let recipesCache = null;

// Function to get cuisine-specific guidelines
function getCuisineGuidelines(cuisinePreference) {
  const guidelines = {
    'north-indian': `
- Use spices like cumin, coriander, garam masala, turmeric, red chili powder
- Include dishes like dal, roti, paratha, curry, raita, lassi
- Cooking methods: tandoor-style, curry-based, ghee tempering, slow cooking
- Common ingredients: wheat, basmati rice, onions, tomatoes, ginger-garlic
- Recipe examples: Paneer Butter Masala, Dal Makhani, Chicken Curry, Aloo Paratha, Tandoori Chicken, Rajma, Chole
- Protein sources: paneer, chicken, yogurt, milk, ghee-based preparations
- VARIETY: Use different cooking styles - Day 1: Curry-based, Day 2: Tandoori, Day 3: Dal-based, Day 4: Paratha/Bread, Day 5: Rice dishes, Day 6: Dry sabzi, Day 7: Fusion`,

    'south-indian': `
- Use spices like mustard seeds, curry leaves, coconut, tamarind, sambar powder
- Include dishes like dosa, idli, sambar, rasam, coconut chutney, curd rice
- Cooking methods: steaming, tempering with curry leaves, coconut-based gravies
- Common ingredients: rice, lentils, coconut, curry leaves, tamarind
- Recipe examples: Coconut Chicken Curry, Protein Dosa, Sambar with Paneer, Rasam, Appam, Uttapam, Fish Curry
- Protein sources: coconut milk, lentils, chicken, paneer in South Indian style
- VARIETY: Day 1: Coconut curries, Day 2: Steamed items, Day 3: Sambar/Rasam, Day 4: Dosa varieties, Day 5: Rice preparations, Day 6: Dry curries, Day 7: Chettinad style`,

    'west-indian': `
- Use spices like kokum, jaggery, peanuts, sesame seeds, red chilies
- Include dishes like dhokla, thepla, pav bhaji, vada pav, gujarati dal
- Cooking methods: steaming, sweet and savory combinations, peanut-based gravies
- Common ingredients: gram flour, jaggery, peanuts, sesame, kokum
- Recipe examples: Protein Dhokla, Paneer Thepla, Gujarati Dal with Yogurt
- Protein sources: gram flour, paneer, yogurt, milk-based sweets`,

    'east-indian': `
- Use spices like panch phoron, mustard oil, nigella seeds, poppy seeds
- Include dishes like fish curry, rice, posto, mishti doi, sandesh
- Cooking methods: mustard oil tempering, steaming, sweet preparations
- Common ingredients: rice, fish, mustard oil, poppy seeds, jaggery
- Recipe examples: Chicken in Mustard Sauce, Paneer Posto, Sweet Yogurt
- Protein sources: fish/chicken, paneer, milk-based sweets, yogurt`,

    'punjabi': `
- Use spices like garam masala, kasoori methi, amchur, red chili powder
- Include dishes like butter chicken, dal makhani, naan, lassi, sarson ka saag
- Cooking methods: tandoor, rich gravies with cream/butter, slow cooking
- Common ingredients: wheat, dairy products, onions, tomatoes, cream
- Recipe examples: Butter Chicken, Paneer Makhani, Protein Lassi, Dal Makhani
- Protein sources: chicken, paneer, butter, cream, milk, yogurt`,

    'gujarati': `
- Use spices like hing, jaggery, sesame seeds, green chilies, turmeric
- Include dishes like dhokla, khandvi, undhiyu, gujarati dal, thepla
- Cooking methods: steaming, sweet-savory balance, minimal oil
- Common ingredients: gram flour, jaggery, peanuts, sesame, vegetables
- Recipe examples: Protein Dhokla, Paneer Khandvi, Sweet Yogurt Curry
- Protein sources: gram flour, paneer, yogurt, milk, buttermilk`,

    'maharashtrian': `
- Use spices like goda masala, kokum, tamarind, jaggery, red chilies
- Include dishes like vada pav, misal pav, puran poli, bhel puri
- Cooking methods: steaming, street food style, coconut-based gravies
- Common ingredients: rice, lentils, coconut, jaggery, peanuts
- Recipe examples: Protein Misal, Paneer Vada, Coconut Chicken Curry
- Protein sources: lentils, paneer, chicken, coconut, yogurt`,

    'bengali': `
- Use spices like panch phoron, mustard seeds, poppy seeds, nigella seeds
- Include dishes like fish curry, rice, posto bata, mishti doi, rasgulla
- Cooking methods: mustard oil tempering, steaming, sweet preparations
- Common ingredients: rice, fish, mustard oil, poppy seeds, coconut
- Recipe examples: Chicken in Poppy Seed Sauce, Paneer Posto, Mishti Doi, Macher Jhol, Kosha Mangsho, Chingri Malai Curry
- Protein sources: fish/chicken, paneer, milk sweets, yogurt, coconut
- VARIETY: Day 1: Fish curries, Day 2: Posto dishes, Day 3: Kosha preparations, Day 4: Steamed items, Day 5: Sweet dishes, Day 6: Dry preparations, Day 7: Festival specials`,

    'tamil': `
- Use spices like curry leaves, tamarind, coconut, sambar powder, rasam powder
- Include dishes like sambar, rasam, curd rice, dosa, idli
- Cooking methods: tempering with curry leaves, tamarind-based gravies
- Common ingredients: rice, lentils, coconut, curry leaves, tamarind
- Recipe examples: Coconut Chicken Curry, Protein Sambar, Curd Rice with Paneer
- Protein sources: lentils, coconut, chicken, paneer, yogurt, milk`,

    'kerala': `
- Use spices like coconut, curry leaves, black pepper, cardamom, cinnamon
- Include dishes like fish curry, appam, puttu, coconut chutney, payasam
- Cooking methods: coconut-based gravies, steaming, spice tempering
- Common ingredients: coconut, rice, fish, curry leaves, coconut oil
- Recipe examples: Coconut Chicken Curry, Protein Appam, Coconut Milk Payasam
- Protein sources: coconut milk, chicken, paneer, milk-based desserts`,

    'mixed': `
- Use a variety of Indian spices from different regions
- Include popular dishes from North, South, East, and West India
- Cooking methods: mix of tandoor, steaming, curry-based, and regional techniques
- Common ingredients: rice, wheat, lentils, vegetables, dairy, spices
- Recipe examples: Mix of regional favorites adapted with Milky Mist products
- Protein sources: paneer, chicken, yogurt, milk, regional specialties`
  };

  return guidelines[cuisinePreference] || guidelines['mixed'];
}

// Function to get activity-specific guidelines
function getActivityGuidelines(activityLevel) {
  const guidelines = {
    'sedentary': 'Focus on lighter, easily digestible meals with moderate portions. Emphasize protein quality over quantity.',
    'light': 'Include balanced meals with good protein distribution. Add some pre/post workout friendly options.',
    'moderate': 'Create well-balanced meals with adequate protein for muscle recovery. Include energy-sustaining ingredients.',
    'active': 'Design protein-rich meals for muscle recovery and energy replenishment. Include complex carbs for sustained energy.',
    'veryActive': 'Focus on high-protein, nutrient-dense meals for intense training recovery. Include quick-digesting and slow-release proteins.'
  };

  return guidelines[activityLevel] || guidelines['moderate'];
}

// Function to get activity and cuisine-specific meal planning guidelines
function getActivityMealGuidelines(activityLevel, cuisinePreference) {
  const baseGuidelines = {
    'sedentary': {
      breakfast: 'Light, protein-rich breakfast with easy digestion',
      lunch: 'Balanced meal with moderate portions, focus on sustained energy',
      dinner: 'Lighter dinner with good protein, avoid heavy preparations'
    },
    'light': {
      breakfast: 'Energizing breakfast with balanced macros',
      lunch: 'Nutritious meal with adequate protein for light activity recovery',
      dinner: 'Satisfying dinner with muscle-supporting protein'
    },
    'moderate': {
      breakfast: 'Substantial breakfast with quality protein and complex carbs',
      lunch: 'Well-balanced meal for sustained energy and recovery',
      dinner: 'Protein-rich dinner for overnight muscle recovery'
    },
    'active': {
      breakfast: 'High-energy breakfast with premium protein sources',
      lunch: 'Recovery-focused meal with ample protein and nutrients',
      dinner: 'Muscle-building dinner with complete amino acid profiles'
    },
    'veryActive': {
      breakfast: 'Power-packed breakfast with maximum protein and energy',
      lunch: 'Performance meal with high-quality protein and recovery nutrients',
      dinner: 'Intensive recovery dinner with premium protein sources'
    }
  };

  const activityGuide = baseGuidelines[activityLevel] || baseGuidelines['moderate'];

  // Add cuisine-specific cooking methods based on activity level
  let cookingMethods = '';
  if (activityLevel === 'sedentary') {
    cookingMethods = 'Use lighter cooking methods like steaming, grilling, or minimal oil preparations.';
  } else if (activityLevel === 'light' || activityLevel === 'moderate') {
    cookingMethods = 'Use balanced cooking methods with moderate use of ghee/oil for flavor and nutrition.';
  } else {
    cookingMethods = 'Use nutrient-dense cooking methods, can include richer preparations with ghee/butter for energy needs.';
  }

  return `
BREAKFAST: ${activityGuide.breakfast}
LUNCH: ${activityGuide.lunch}  
DINNER: ${activityGuide.dinner}
COOKING METHODS: ${cookingMethods}

ACTIVITY-SPECIFIC RECIPE ADAPTATIONS:
- Sedentary: Lighter portions, emphasis on digestibility, minimal heavy spices
- Light Active: Balanced portions, moderate spice levels, good protein distribution
- Moderate Active: Standard portions, traditional spice levels, adequate carbs for energy
- Very Active: Larger portions, can handle richer preparations, focus on muscle recovery
- Extremely Active: Maximum nutrition density, premium ingredients, optimal protein timing`;
}

// Function to get protein timing guidance based on activity level
function getProteinTimingGuidance(activityLevel) {
  const guidance = {
    'sedentary': `
- Distribute protein evenly across meals for steady metabolism
- Focus on high-quality, easily digestible proteins
- No specific timing requirements, prioritize consistency`,

    'light': `
- Slightly higher protein at breakfast for sustained energy
- Moderate protein at lunch for afternoon energy
- Adequate protein at dinner for overnight recovery`,

    'moderate': `
- Good protein at breakfast for workout fuel if exercising
- Balanced protein at lunch for sustained energy and recovery
- Higher protein at dinner for muscle repair during sleep`,

    'active': `
- High protein breakfast for energy and pre-workout fuel
- Recovery-focused protein at lunch after morning workouts
- Maximum protein at dinner for intensive overnight muscle repair`,

    'veryActive': `
- Premium protein breakfast for intense training preparation
- High-quality protein lunch for rapid recovery between sessions
- Maximum protein dinner for optimal muscle synthesis and recovery`
  };

  return guidance[activityLevel] || guidance['moderate'];
}

export async function POST(request) {
  let requestData;

  try {
    requestData = await request.json();
    const { name, age, height, weight, proteinRequired, dietaryPreferences = [], gender, cuisinePreference: cuisinePreferenceRaw, activityLevel } = requestData;

    // Ensure cuisinePreference is a string and handle array from the frontend
    const cuisinePreference = Array.isArray(cuisinePreferenceRaw) ? cuisinePreferenceRaw.join(' and ') : String(cuisinePreferenceRaw || '');
    const primaryCuisine = Array.isArray(cuisinePreferenceRaw) ? cuisinePreferenceRaw[0] : cuisinePreferenceRaw;
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

    // Validate cuisine preference
    if (!cuisinePreference) {
      validationErrors.push('Please select your preferred cuisine');
    }

    // Validate activity level
    if (!activityLevel) {
      validationErrors.push('Please select your activity level');
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

    // Determine if user wants vegetarian or non-vegetarian
    const isVegetarian = dietaryPreferences.includes('vegetarian');
    const isNonVegetarian = dietaryPreferences.includes('non-vegetarian');

    // Create optimized prompt for Gemini
    const prompt = `Generate a COMPLETE 7-day meal plan as valid JSON.

IMPORTANT: All recipes are for a SINGLE PERSON, ONE SERVING per meal. Ingredient quantities, protein, and calories must reflect what ONE individual eats in ONE sitting.

USER PROFILE:
- Age: ${age}, Gender: ${gender}, Height: ${height}cm, Weight: ${weight}kg
- Daily protein target: ${proteinRequired}g/day
- Diet: ${dietaryString}
- Cuisine: ${cuisinePreference}
- Activity level: ${activityLevel}

DIETARY RULES:
${isVegetarian ? '- STRICTLY VEGETARIAN: NO eggs, NO chicken, NO meat, NO fish' : ''}
${isNonVegetarian ? '- NON-VEGETARIAN: MUST include chicken OR eggs in EVERY meal. Use ONLY chicken and eggs (no other meat/fish)' : ''}
${!isVegetarian && !isNonVegetarian ? '- Vegetarian: NO eggs, NO chicken, NO meat\n- Non-vegetarian: ONLY chicken and eggs allowed' : ''}

CUISINE GUIDELINES:
${getCuisineGuidelines(primaryCuisine)}
- Create DIFFERENT dishes each day. NO repetition of recipes or cooking methods across the week.

ACTIVITY LEVEL CONSIDERATION:
- ${getActivityGuidelines(activityLevel)}
- Adjust portion sizes based on activity: sedentary=smaller portions, very active=larger portions

MEAL STRUCTURE:
- Each meal MUST include exactly 1 Milky Mist product
- Each day use 3 DIFFERENT Milky Mist products (no repeats in same day)
- Max 4 ingredients per meal
- 4-6 detailed preparation steps per meal
- DO NOT include nutritional info in ingredient strings

PROTEIN TARGETS PER MEAL (must add up to ~${proteinRequired}g/day ± 3g):
- Breakfast: ${Math.round(proteinRequired * 0.25)}-${Math.round(proteinRequired * 0.35)}g
- Lunch: ${Math.round(proteinRequired * 0.35)}-${Math.round(proteinRequired * 0.40)}g
- Dinner: ${Math.round(proteinRequired * 0.25)}-${Math.round(proteinRequired * 0.35)}g

PROTEIN VALUES PER INGREDIENT (use to calculate nutrition.protein):
- Chicken breast: 31g/100g | Eggs: 6g/egg | Paneer: 18g/100g
- Greek Yogurt: 10g/100g | Skyr: 11g/100g | Cheddar Cheese: 25g/100g
- Toned Milk: 3.5g/100ml | Lentils/Dal: 9g/100g cooked | Oats: 13g/100g
- Rice: 2.7g/100g cooked | Bread: 3g/slice | Butter/Ghee: 0g

CALORIE VALUES PER INGREDIENT (use to calculate nutrition.calories as INTEGER):
- Chicken breast: 165 cal/100g | Eggs: 70 cal/egg | Paneer: 265 cal/100g
- Greek Yogurt: 59 cal/100g | Skyr: 63 cal/100g | Cheddar Cheese: 400 cal/100g
- Toned Milk: 58 cal/100ml | Rice (cooked): 130 cal/100g | Bread: 80 cal/slice
- Lentils (cooked): 116 cal/100g | Oats (dry): 389 cal/100g
- Butter/Ghee: 100 cal/tbsp | Oil: 120 cal/tbsp | Vegetables: 30 cal/100g
- Curry/Gravy: 80 cal/100g | Fruits: 60 cal/100g | Nuts: 600 cal/100g
- Honey: 64 cal/tbsp

CALCULATION METHOD (MANDATORY for every meal):
1. For each ingredient, multiply its quantity by the per-unit value above
2. Add all ingredient values together
3. Return INTEGER values only (no decimals)

Example: "45g chicken + 150g rice + 100g gravy + 1 tbsp ghee"
- Protein: (45×0.31) + (150×0.027) + 0 + 0 = 14 + 4 + 0 + 0 = 18g
- Calories: (45×1.65) + (150×1.30) + (100×0.80) + 100 = 74 + 195 + 80 + 100 = 449

MILKY MIST PRODUCTS (use variety across the week):
1. Milky Mist Skyr (15g protein/150g)
2. Milky Mist Greek Yogurt Natural (10g protein/150g)
3. Milky Mist Greek Yogurt Cereal (10g protein/150g)
4. Milky Mist Greek Yogurt Blueberry (10g protein/150g)
5. Milky Mist Greek Yogurt Honey and Fig (10g protein/150g)
6. Milky Mist High Protein Paneer (18g protein/100g)
7. Milky Mist High Protein Cheddar Cheese (20g protein/80g)
8. Milky Mist Butter (0g protein/tbsp)
9. Milky Mist Ghee (0g protein/tbsp)
10. Milky Mist Frozen Khova (6g protein/80g)
11. Milky Mist Toned Milk (7g protein/200ml)

Return ONLY valid JSON (no markdown, no code blocks):
{"weeklyPlan":[{"day":"Monday","dayNumber":1,"meals":[{"type":"Breakfast","recipeName":"Name","milkyMistProduct":"Milky Mist Greek Yogurt Cereal","ingredients":["200g Milky Mist Greek Yogurt Cereal","1 banana","2 tbsp nuts"],"steps":["Step 1","Step 2","Step 3","Step 4"],"nutrition":{"protein":18,"calories":350,"carbs":35,"fats":12},"dietary":["vegetarian"]},...more meals...],...all 7 days...]}

You MUST generate ALL 7 DAYS (Monday to Sunday). Do not stop early.`;

    console.log('Calling Gemini API...');

    // Use gemini-2.5-flash which is available in your API key
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      generationConfig: {
        temperature: 0.1,  // Very low temperature for consistent, complete output
        topK: 10,
        topP: 0.9,
        maxOutputTokens: 32768, // Maximum tokens to ensure complete 7-day response
      }
    });

    // Set timeout for API call
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 90000); // 90 second timeout for complete response

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
        console.error('Response text:', text);
        throw new Error('Invalid JSON structure in Gemini response - using fallback');
      }

      jsonText = jsonText.substring(jsonStart, jsonEnd + 1);

      console.log('Extracted JSON length:', jsonText.length);

      // Check if JSON seems incomplete (missing closing brackets)
      const openBraces = (jsonText.match(/{/g) || []).length;
      const closeBraces = (jsonText.match(/}/g) || []).length;
      const openBrackets = (jsonText.match(/\[/g) || []).length;
      const closeBrackets = (jsonText.match(/\]/g) || []).length;

      if (openBraces !== closeBraces || openBrackets !== closeBrackets) {
        console.error('Incomplete JSON detected:', {
          openBraces,
          closeBraces,
          openBrackets,
          closeBrackets,
          jsonLength: jsonText.length,
          missingBraces: openBraces - closeBraces,
          missingBrackets: openBrackets - closeBrackets
        });
        console.log('Attempting to complete JSON structure...');

        // Try to complete the JSON by adding missing brackets
        let completedJson = jsonText;
        const missingBrackets = openBrackets - closeBrackets;
        const missingBraces = openBraces - closeBraces;

        for (let i = 0; i < missingBrackets; i++) {
          completedJson += ']';
        }
        for (let i = 0; i < missingBraces; i++) {
          completedJson += '}';
        }

        console.log('Attempting to parse completed JSON...');
        try {
          const testParse = JSON.parse(completedJson);
          console.log('Successfully completed JSON structure');
          jsonText = completedJson;
        } catch (e) {
          console.error('Could not auto-complete JSON, using fallback');
          throw new Error('Incomplete JSON from Gemini - using fallback');
        }
      }

      let mealPlanData;
      try {
        mealPlanData = JSON.parse(jsonText);
      } catch (parseError) {
        console.error('JSON Parse Error:', parseError.message);
        console.error('Failed JSON preview (first 500 chars):', jsonText.substring(0, 500));
        console.error('Failed JSON preview (last 500 chars):', jsonText.substring(Math.max(0, jsonText.length - 500)));
        throw new Error('Failed to parse Gemini response as JSON - using fallback');
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
            const mealIngredientsText = meal.ingredients ? meal.ingredients.join(' ').toLowerCase() : '';
            const mealRecipeNameText = meal.recipeName ? meal.recipeName.toLowerCase() : '';

            // Use word boundaries to match whole words only
            const hasEggs = /\begg\b|\beggs\b/.test(mealIngredientsText) || /\begg\b|\beggs\b/.test(mealRecipeNameText);
            const hasChicken = /\bchicken\b/.test(mealIngredientsText) || /\bchicken\b/.test(mealRecipeNameText);
            const hasMeat = /\bmeat\b|\bbeef\b|\bpork\b|\bfish\b/.test(mealIngredientsText) || /\bmeat\b|\bbeef\b|\bpork\b|\bfish\b/.test(mealRecipeNameText);

            if (hasEggs || hasChicken || hasMeat) {
              console.log(`WARNING: Non-vegetarian ingredient found in meal: ${meal.recipeName}`);
              console.log(`Ingredients: ${meal.ingredients.join(', ')}`);
              console.log('Falling back to curated recipes...');
              throw new Error('Non-vegetarian ingredients in vegetarian meal plan');
            }
          });
        });
      }

      // Validate and round nutrition values to integers
      console.log('Validating nutrition values...');

      mealPlanData.weeklyPlan.forEach(day => {
        day.meals.forEach(meal => {
          // Round all nutrition values to integers
          meal.nutrition.protein = Math.round(meal.nutrition.protein);
          meal.nutrition.calories = Math.round(meal.nutrition.calories);
          if (meal.nutrition.carbs) meal.nutrition.carbs = Math.round(meal.nutrition.carbs);
          if (meal.nutrition.fats) meal.nutrition.fats = Math.round(meal.nutrition.fats);

          console.log(`Meal: ${meal.recipeName} - Protein: ${meal.nutrition.protein}g, Calories: ${meal.nutrition.calories}`);
        });
      });

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

    const { dietaryPreferences = [], proteinRequired, cuisinePreference, activityLevel } = requestData;

    // Filter recipes based on dietary preferences and cuisine
    const filterRecipes = (recipes) => {
      if (dietaryPreferences.length === 0 && !cuisinePreference) return recipes;

      return recipes.filter(recipe => {
        // Handle dietary preferences
        let matchesDietary = true;
        if (dietaryPreferences.length > 0) {
          // Handle non-vegetarian preference - ONLY non-veg recipes
          if (dietaryPreferences.includes('non-vegetarian')) {
            // Must have non-vegetarian tag OR contain chicken/egg in name
            const isNonVeg = (recipe.dietary && recipe.dietary.includes('non-vegetarian')) ||
              recipe.recipeName.toLowerCase().includes('chicken') ||
              recipe.recipeName.toLowerCase().includes('egg');

            // Check for gluten-free if also selected
            if (dietaryPreferences.includes('gluten-free')) {
              matchesDietary = isNonVeg && recipe.dietary && recipe.dietary.includes('gluten-free');
            } else {
              matchesDietary = isNonVeg;
            }
          }

          // Handle vegetarian preference (exclude non-veg)
          else if (dietaryPreferences.includes('vegetarian')) {
            const isVegetarian = recipe.dietary && recipe.dietary.includes('vegetarian') &&
              !recipe.dietary.includes('non-vegetarian') &&
              !recipe.recipeName.toLowerCase().includes('chicken') &&
              !recipe.recipeName.toLowerCase().includes('egg');

            // Additional check: ensure no eggs in ingredients
            const hasEggs = recipe.ingredients && recipe.ingredients.some(ingredient =>
              ingredient.toLowerCase().includes('egg')
            );

            if (hasEggs) {
              matchesDietary = false; // Exclude recipes with eggs from vegetarian selection
            } else {
              // Check for gluten-free if also selected
              if (dietaryPreferences.includes('gluten-free')) {
                matchesDietary = isVegetarian && recipe.dietary && recipe.dietary.includes('gluten-free');
              } else {
                matchesDietary = isVegetarian;
              }
            }
          }

          // Handle other preferences (gluten-free only)
          else {
            matchesDietary = dietaryPreferences.every(pref =>
              recipe.dietary && recipe.dietary.includes(pref)
            );
          }
        }

        // Handle cuisine preference (basic matching for now)
        let matchesCuisine = true;
        if (cuisinePreference && cuisinePreference !== 'mixed') {
          // For now, we'll use all recipes but could add cuisine tags to recipes in future
          // This is a placeholder for cuisine-based filtering
          matchesCuisine = true;
        }

        return matchesDietary && matchesCuisine;
      });
    };

    const filteredBreakfast = filterRecipes(recipesCache.breakfast);
    const filteredLunch = filterRecipes(recipesCache.lunch);
    const filteredDinner = filterRecipes(recipesCache.dinner);

    const breakfastOptions = filteredBreakfast.length > 0 ? filteredBreakfast : recipesCache.breakfast;
    const lunchOptions = filteredLunch.length > 0 ? filteredLunch : recipesCache.lunch;
    const dinnerOptions = filteredDinner.length > 0 ? filteredDinner : recipesCache.dinner;

    // Ensure product variety across the week
    const milkyMistProducts = [
      'Milky Mist Skyr',
      'Milky Mist Greek Yogurt Natural',
      'Milky Mist Greek Yogurt Cereal',
      'Milky Mist Greek Yogurt Blueberry',
      'Milky Mist Greek Yogurt Honey and Fig',
      'Milky Mist High Protein Paneer',
      'Milky Mist High Protein Cheddar Cheese',
      'Milky Mist Butter',
      'Milky Mist Ghee',
      'Milky Mist Frozen Khova',
      'Milky Mist Toned Milk'
    ];

    // Function to select recipes with product variety and activity level consideration
    const selectRecipeWithProduct = (recipes, targetProduct, usedProducts, mealType, activityLevel) => {
      // First try to find a recipe with the target product
      let recipe = recipes.find(r => r.milkyMistProduct.includes(targetProduct));

      // If not found, try to find a recipe with a product we haven't used much
      if (!recipe) {
        const productCounts = {};
        usedProducts.forEach(p => {
          productCounts[p] = (productCounts[p] || 0) + 1;
        });

        // Sort products by usage count (least used first)
        const availableProducts = milkyMistProducts.filter(p =>
          recipes.some(r => r.milkyMistProduct.includes(p))
        ).sort((a, b) => (productCounts[a] || 0) - (productCounts[b] || 0));

        // Find recipe with least used product
        for (const product of availableProducts) {
          recipe = recipes.find(r => r.milkyMistProduct.includes(product));
          if (recipe) break;
        }
      }

      // Fallback to first recipe if nothing found
      recipe = recipe || recipes[0];

      // Adjust recipe based on activity level
      if (recipe && activityLevel) {
        recipe = adjustRecipeForActivity(recipe, activityLevel, mealType);
      }

      return recipe;
    };

    // Function to adjust recipe portions based on activity level
    const adjustRecipeForActivity = (recipe, activityLevel, mealType) => {
      const activityMultipliers = {
        'sedentary': 0.9,
        'light': 1.0,
        'moderate': 1.1,
        'active': 1.2,
        'veryActive': 1.3
      };

      const multiplier = activityMultipliers[activityLevel] || 1.0;

      // Create a copy of the recipe to avoid modifying the original
      const adjustedRecipe = JSON.parse(JSON.stringify(recipe));

      // Adjust protein and calories based on activity level
      adjustedRecipe.nutrition.protein = Math.round(recipe.nutrition.protein * multiplier);
      adjustedRecipe.nutrition.calories = Math.round(recipe.nutrition.calories * multiplier);

      // Adjust other macros proportionally
      if (recipe.nutrition.carbs) {
        adjustedRecipe.nutrition.carbs = Math.round(recipe.nutrition.carbs * multiplier);
      }
      if (recipe.nutrition.fats) {
        adjustedRecipe.nutrition.fats = Math.round(recipe.nutrition.fats * multiplier);
      }

      return adjustedRecipe;
    };

    const weeklyPlan = [];
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const usedProducts = [];

    // Pre-plan product distribution to ensure variety
    const productDistribution = [
      // Day 1: Mix of different products
      ['Milky Mist Greek Yogurt Cereal', 'Milky Mist High Protein Paneer', 'Milky Mist Skyr'],
      // Day 2: Different mix with new products
      ['Milky Mist Greek Yogurt Blueberry', 'Milky Mist Butter', 'Milky Mist Greek Yogurt Natural'],
      // Day 3: Another mix with new products
      ['Milky Mist Greek Yogurt Honey and Fig', 'Milky Mist Ghee', 'Milky Mist High Protein Paneer'],
      // Day 4: Continue variety with new products
      ['Milky Mist Toned Milk', 'Milky Mist High Protein Cheddar Cheese', 'Milky Mist Frozen Khova'],
      // Day 5: More variety
      ['Milky Mist Skyr', 'Milky Mist Toned Milk', 'Milky Mist Greek Yogurt Honey and Fig'],
      // Day 6: Different combination with new products
      ['Milky Mist Butter', 'Milky Mist Greek Yogurt Natural', 'Milky Mist High Protein Cheddar Cheese'],
      // Day 7: Final variety with new products
      ['Milky Mist Frozen Khova', 'Milky Mist Ghee', 'Milky Mist Greek Yogurt Blueberry']
    ];

    for (let i = 0; i < 7; i++) {
      const [breakfastProduct, lunchProduct, dinnerProduct] = productDistribution[i];

      const breakfast = selectRecipeWithProduct(breakfastOptions, breakfastProduct, usedProducts, 'breakfast', activityLevel);
      usedProducts.push(breakfast.milkyMistProduct);

      const lunch = selectRecipeWithProduct(lunchOptions, lunchProduct, usedProducts, 'lunch', activityLevel);
      usedProducts.push(lunch.milkyMistProduct);

      const dinner = selectRecipeWithProduct(dinnerOptions, dinnerProduct, usedProducts, 'dinner', activityLevel);
      usedProducts.push(dinner.milkyMistProduct);

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
    const dayTotalCarbs = day.meals.reduce((sum, meal) => sum + (meal.nutrition.carbs || 0), 0);
    const dayTotalFats = day.meals.reduce((sum, meal) => sum + (meal.nutrition.fats || 0), 0);

    return {
      ...day,
      totalProtein: Math.round(dayTotalProtein),
      totalCalories: Math.round(dayTotalCalories),
      totalCarbs: Math.round(dayTotalCarbs),
      totalFats: Math.round(dayTotalFats),
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
    weeklyTotalProtein: Math.round(weeklyTotalProtein),
    weeklyTotalCalories: Math.round(weeklyTotalCalories),
    dietaryPreferences: dietaryPreferences.length > 0 ? dietaryPreferences : ['all']
  });
}

