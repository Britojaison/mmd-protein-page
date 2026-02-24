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

    // Create optimized prompt for Gemini - simplified for complete response
    const prompt = `Generate a COMPLETE 7-day meal plan. Age ${age}, Gender ${gender}, Weight ${weight}kg, Protein target ${proteinRequired}g/day, Diet: ${dietaryString}, Cuisine: ${cuisinePreference}, Activity: ${activityLevel}. 

CRITICAL PROTEIN CALCULATION RULES:
1. ALWAYS calculate protein by ADDING ALL protein sources in each recipe
2. Use these EXACT values: Chicken=31g/100g, Eggs=6g/each, Paneer=18g/100g, Greek Yogurt=10g/100g
3. Example: 100g chicken + 100g paneer + 150g yogurt = 31+18+15 = 64g protein (NOT 18g!)
4. ADJUST INGREDIENT PORTIONS to meet target protein ranges naturally
5. Don't create recipes with excessive protein that need to be capped later

SMART INGREDIENT PORTIONING:
- For ${Math.round(proteinRequired * 0.2)}-${Math.round(proteinRequired * 0.3)}g breakfast: Use 80-120g chicken OR 2 eggs + 100g paneer OR 200g yogurt + 50g paneer
- For ${Math.round(proteinRequired * 0.3)}-${Math.round(proteinRequired * 0.4)}g lunch: Use 100-150g chicken OR 3 eggs + 80g paneer OR 150g paneer + 100g yogurt  
- For ${Math.round(proteinRequired * 0.25)}-${Math.round(proteinRequired * 0.35)}g dinner: Use 80-120g chicken OR 2 eggs + 80g paneer OR 120g paneer + 100g yogurt

PORTION CONTROL EXAMPLES:
- Target 20g protein breakfast: 80g chicken (25g) + 50g yogurt (5g) = 30g ✓
- Target 25g protein lunch: 100g chicken (31g) + NO extra high-protein ingredients = 31g ✓  
- Target 18g protein dinner: 2 eggs (12g) + 50g paneer (9g) = 21g ✓

CUISINE VARIETY REQUIREMENTS FOR ${cuisinePreference.toUpperCase()}:
- Create DIFFERENT ${cuisinePreference} dishes for each day - NO repetition of cooking methods
- Day 1: Traditional curry-based meals, Day 2: Grilled/tandoori, Day 3: Steamed/light
- Day 4: Rich gravies, Day 5: Dry preparations, Day 6: Soup-based, Day 7: Fusion dishes
- Use diverse spice levels: mild, medium, spicy across different days
- Include different meal types: rice dishes, bread-based, soup-based, dry preparations

RULES:
${isVegetarian ? '- VEGETARIAN ONLY: NO eggs, NO chicken, NO meat, NO fish - STRICTLY VEGETARIAN' : ''}
${isNonVegetarian ? '- NON-VEGETARIAN: MUST include chicken OR eggs in EVERY meal. Use ONLY chicken and eggs (no other meat/fish)' : ''}
${!isVegetarian && !isNonVegetarian ? '- Vegetarian: NO eggs, NO chicken, NO meat\n- Non-vegetarian: ONLY chicken and eggs allowed' : ''}
- Each meal MUST include a Milky Mist product
- CUISINE FOCUS: Create recipes inspired by ${cuisinePreference} cuisine with traditional spices, cooking methods, and flavor profiles
- ACTIVITY CONSIDERATION: ${getActivityGuidelines(activityLevel)}
- Keep ingredients SHORT (max 4 items)
- Keep steps DETAILED (4-6 preparation steps with specific instructions)
- Steps should include prep, cooking method, timing, and serving suggestions
- DO NOT include protein/calorie/fat/carbs details in ingredient strings - just list the ingredient and quantity
- Target ${proteinRequired}g protein per day (distribute: breakfast 12-18g, lunch 15-22g, dinner 12-20g)
- CRITICAL: Daily total should be ${proteinRequired}g ± 5g maximum (between ${proteinRequired - 5}g and ${proteinRequired + 5}g)
- Adjust ingredient portions to meet target precisely, don't exceed by more than 5g per day
- Calculate nutrition.protein and nutrition.calories based on standard nutritional values
- Example ingredient format: "100g chicken breast" NOT "100g chicken breast (31g protein)"

CUISINE GUIDELINES:
${getCuisineGuidelines(primaryCuisine)}

ACTIVITY-BASED MEAL PLANNING:
${getActivityMealGuidelines(activityLevel, primaryCuisine)}

EXAMPLE RECIPE ADAPTATIONS BY ACTIVITY LEVEL:

SEDENTARY PERSON (${cuisinePreference} cuisine):
- Breakfast: Light ${cuisinePreference} breakfast with yogurt/milk, easy to digest
- Lunch: Moderate portion ${cuisinePreference} curry with paneer, not too heavy
- Dinner: Simple ${cuisinePreference} preparation with minimal oil, focus on protein

LIGHT ACTIVE PERSON (${cuisinePreference} cuisine):
- Breakfast: Energizing ${cuisinePreference} breakfast with balanced macros
- Lunch: Traditional ${cuisinePreference} meal with good protein for recovery
- Dinner: Satisfying ${cuisinePreference} dinner with muscle-supporting protein

MODERATE ACTIVE PERSON (${cuisinePreference} cuisine):
- Breakfast: Substantial ${cuisinePreference} breakfast with complex carbs and protein
- Lunch: Well-balanced ${cuisinePreference} meal for sustained energy
- Dinner: Protein-rich ${cuisinePreference} dinner for overnight recovery

VERY ACTIVE PERSON (${cuisinePreference} cuisine):
- Breakfast: High-energy ${cuisinePreference} breakfast with premium protein
- Lunch: Recovery-focused ${cuisinePreference} meal with ample nutrients
- Dinner: Muscle-building ${cuisinePreference} dinner with complete proteins

EXTREMELY ACTIVE PERSON (${cuisinePreference} cuisine):
- Breakfast: Power-packed ${cuisinePreference} breakfast with maximum nutrition
- Lunch: Performance ${cuisinePreference} meal with high-quality protein
- Dinner: Intensive recovery ${cuisinePreference} dinner with premium ingredients

PROTEIN TIMING FOR ${activityLevel.toUpperCase()} ACTIVITY LEVEL:
${getProteinTimingGuidance(activityLevel)}

PRODUCTS (use variety):
1. Milky Mist Skyr (15g protein/150g)
2. Milky Mist Greek Yogurt Natural (10g protein/150g)
3. Milky Mist Greek Yogurt Cereal (10g protein/150g)
4. Milky Mist Greek Yogurt Blueberry (10g protein/150g)
5. Milky Mist Greek Yogurt Honey and Fig (10g protein/150g)
6. Milky Mist High Protein Paneer (18g protein/100g)
7. Milky Mist High Protein Cheddar Cheese (20g protein/80g)
8. Milky Mist Butter (0g protein/tbsp, use with protein-rich foods)
9. Milky Mist Ghee (0g protein/tbsp, use with protein-rich foods)
10. Milky Mist Frozen Khova (6g protein/80g)
11. Milky Mist Toned Milk (7g protein/200ml)

PROTEIN REFERENCE VALUES (use these to calculate nutrition.protein):
- Chicken breast: 31g protein per 100g
- Eggs: 6g protein per large egg (50g)
- Paneer: 18g protein per 100g
- Greek Yogurt: 10g protein per 100g
- Cheddar Cheese: 25g protein per 100g
- Skyr: 11g protein per 100g
- Toned Milk: 3.5g protein per 100ml
- Rice: 2.7g protein per 100g cooked
- Bread: 3g protein per slice
- Lentils: 9g protein per 100g cooked
- Quinoa: 4.4g protein per 100g cooked
- Oats: 13g protein per 100g
- Butter/Ghee: 0g protein

CRITICAL CALCULATION RULE:
For each meal, ADD UP the protein from ALL ingredients using the reference values above.
Example: "2 eggs + 100g chicken breast + 150g paneer" = (2×6) + (100×0.31) + (150×0.18) = 12 + 31 + 27 = 70g → nutrition.protein: 70

INTELLIGENT RECIPE CREATION:
- Design recipes with ingredient portions that naturally hit target protein ranges
- Don't combine multiple high-protein ingredients unless needed for higher targets
- Use supporting ingredients (rice, vegetables, spices) to complete the meal
- Balance protein sources with carbs and fats for complete nutrition

SMART PORTION EXAMPLES:
For 22g protein target:
- "80g chicken breast + vegetables + rice" = 25g protein ✓
- "2 eggs + 60g paneer + bread" = 12+11 = 23g protein ✓
NOT: "150g chicken + 100g paneer" = 46g protein (too high!)

PROTEIN RANGE REQUIREMENTS:
- Breakfast: ${Math.round(proteinRequired * 0.2)}-${Math.round(proteinRequired * 0.3)}g protein
- Lunch: ${Math.round(proteinRequired * 0.3)}-${Math.round(proteinRequired * 0.4)}g protein  
- Dinner: ${Math.round(proteinRequired * 0.25)}-${Math.round(proteinRequired * 0.35)}g protein
- Daily Total: ${proteinRequired - 3}g to ${proteinRequired + 3}g protein (strict range)

MANDATORY: Create recipes with ingredient portions that naturally fit the target ranges. Don't over-engineer with excessive protein!

IMPORTANT: Each day use 3 DIFFERENT products. No repeats in same day.

CRITICAL: You MUST generate ALL 7 DAYS. Do not stop early. Complete the entire JSON structure.

Return ONLY valid JSON (no markdown, no code blocks). Structure:
{"weeklyPlan":[{"day":"Monday","dayNumber":1,"meals":[{"type":"Breakfast","recipeName":"Name","milkyMistProduct":"Milky Mist Greek Yogurt Cereal","ingredients":["200g Milky Mist Greek Yogurt Cereal","1 banana","2 tbsp nuts"],"steps":["Gather all ingredients and ensure yogurt is at room temperature","Layer yogurt in bowl as base","Add sliced banana and nuts in layers","Mix gently to combine flavors","Serve immediately or chill for enhanced taste"],"nutrition":{"protein":18,"calories":350,"carbs":35,"fats":12},"dietary":["vegetarian"]},{"type":"Lunch","recipeName":"Name","milkyMistProduct":"Milky Mist High Protein Paneer","ingredients":["100g Milky Mist Paneer","1 cup rice","vegetables"],"steps":["Cook rice according to package instructions","Heat oil in pan over medium heat","Add paneer and vegetables, cook for 5 minutes","Season with spices and mix well","Serve hot with garnish"],"nutrition":{"protein":20,"calories":420,"carbs":45,"fats":15},"dietary":["vegetarian"]},{"type":"Dinner","recipeName":"Name","milkyMistProduct":"Milky Mist Skyr","ingredients":["150g Milky Mist Skyr","chicken breast","vegetables"],"steps":["Marinate chicken in Skyr and spices for 30 minutes","Preheat grill to medium-high heat","Grill chicken for 4-5 minutes per side","Prepare vegetables as side dish","Let rest 2 minutes before serving"],"nutrition":{"protein":18,"calories":380,"carbs":25,"fats":14},"dietary":["non-vegetarian"]}]},{"day":"Tuesday","dayNumber":2,"meals":[...]},{"day":"Wednesday","dayNumber":3,"meals":[...]},{"day":"Thursday","dayNumber":4,"meals":[...]},{"day":"Friday","dayNumber":5,"meals":[...]},{"day":"Saturday","dayNumber":6,"meals":[...]},{"day":"Sunday","dayNumber":7,"meals":[...]}]}

MANDATORY RECIPE REQUIREMENTS:
1. CUISINE AUTHENTICITY: Every recipe MUST reflect authentic ${cuisinePreference} flavors, spices, and cooking techniques
2. ACTIVITY OPTIMIZATION: Recipes MUST be optimized for ${activityLevel} activity level with appropriate portions and nutrition density
3. MILKY MIST INTEGRATION: Each recipe MUST creatively incorporate Milky Mist products as key ingredients, not just additions
4. REGIONAL COOKING METHODS: Use traditional ${cuisinePreference} cooking methods (steaming, tempering, slow cooking, etc.)
5. SPICE PROFILES: Apply authentic ${cuisinePreference} spice combinations and flavor profiles
6. MEAL TIMING: Consider ${activityLevel} activity level for optimal meal timing and macronutrient distribution

RECIPE NAMING CONVENTION:
- Use ${cuisinePreference} style names (e.g., "Paneer Makhani with Greek Yogurt" for North Indian)
- Include cooking method when relevant (e.g., "Steamed", "Tandoori", "Coconut Curry")
- Highlight the Milky Mist product integration

GENERATE ALL 7 DAYS NOW. START WITH MONDAY AND END WITH SUNDAY.`;

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

      // Validate and fix protein calculations
      console.log('Validating protein calculations...');

      mealPlanData.weeklyPlan.forEach(day => {
        day.meals.forEach(meal => {
          // Calculate expected protein from ingredients
          let calculatedProtein = 0;

          // Enhanced ingredient analysis with better pattern matching
          const allIngredientsText = meal.ingredients ? meal.ingredients.join(' ').toLowerCase() : '';
          const recipeNameText = meal.recipeName ? meal.recipeName.toLowerCase() : '';
          const combinedText = `${allIngredientsText} ${recipeNameText}`;

          console.log(`Analyzing meal: ${meal.recipeName}`);
          console.log(`Ingredients: ${meal.ingredients.join(', ')}`);
          console.log(`Combined text for analysis: ${combinedText}`);

          // Count eggs (various patterns)
          const eggPatterns = [
            /(\d+)\s*(?:large\s+)?eggs?/gi,
            /(\d+)\s*eggs?/gi,
            /(\d+)\s*scrambled\s+eggs?/gi
          ];

          for (const pattern of eggPatterns) {
            let match;
            while ((match = pattern.exec(combinedText)) !== null) {
              const eggCount = parseInt(match[1]);
              if (eggCount > 0 && eggCount <= 10) { // Reasonable range check
                calculatedProtein += eggCount * 6;
                console.log(`Found ${eggCount} eggs: +${eggCount * 6}g protein`);
              }
            }
          }

          // Count chicken (various patterns) - more comprehensive
          const chickenPatterns = [
            /(\d+)g?\s*(?:cooked\s+)?(?:chicken\s+)?breast/gi,
            /(\d+)g?\s*chicken\s*(?:breast|thigh|pieces?)?/gi,
            /(\d+)g?\s*(?:grilled\s+|roasted\s+|steamed\s+)?chicken/gi,
            /(\d+)g?\s*(?:boneless\s+)?chicken/gi
          ];

          for (const pattern of chickenPatterns) {
            let match;
            while ((match = pattern.exec(combinedText)) !== null) {
              const chickenGrams = parseInt(match[1]);
              if (chickenGrams > 0 && chickenGrams <= 500) { // Reasonable range check
                const chickenProtein = chickenGrams * 0.31;
                calculatedProtein += chickenProtein;
                console.log(`Found ${chickenGrams}g chicken: +${chickenProtein.toFixed(1)}g protein`);
              }
            }
          }

          // Count paneer (various patterns)
          const paneerPatterns = [
            /(\d+)g?\s*(?:milky\s+mist\s+)?(?:high\s+protein\s+)?paneer/gi,
            /(\d+)g?\s*paneer/gi
          ];

          for (const pattern of paneerPatterns) {
            let match;
            while ((match = pattern.exec(combinedText)) !== null) {
              const paneerGrams = parseInt(match[1]);
              if (paneerGrams > 0 && paneerGrams <= 300) { // Reasonable range check
                const paneerProtein = paneerGrams * 0.18;
                calculatedProtein += paneerProtein;
                console.log(`Found ${paneerGrams}g paneer: +${paneerProtein.toFixed(1)}g protein`);
              }
            }
          }

          // Count cheddar cheese
          const cheesePatterns = [
            /(\d+)g?\s*(?:milky\s+mist\s+)?(?:high\s+protein\s+)?cheddar\s+cheese/gi,
            /(\d+)g?\s*cheddar/gi,
            /(\d+)g?\s*cheese/gi
          ];

          for (const pattern of cheesePatterns) {
            let match;
            while ((match = pattern.exec(combinedText)) !== null) {
              const cheeseGrams = parseInt(match[1]);
              if (cheeseGrams > 0 && cheeseGrams <= 200) { // Reasonable range check
                const cheeseProtein = cheeseGrams * 0.25;
                calculatedProtein += cheeseProtein;
                console.log(`Found ${cheeseGrams}g cheese: +${cheeseProtein.toFixed(1)}g protein`);
              }
            }
          }

          // Count yogurt (various patterns)
          const yogurtPatterns = [
            /(\d+)g?\s*(?:milky\s+mist\s+)?(?:greek\s+)?yogurt/gi,
            /(\d+)g?\s*yogurt/gi
          ];

          for (const pattern of yogurtPatterns) {
            let match;
            while ((match = pattern.exec(combinedText)) !== null) {
              const yogurtGrams = parseInt(match[1]);
              if (yogurtGrams > 0 && yogurtGrams <= 400) { // Reasonable range check
                const yogurtProtein = yogurtGrams * 0.10;
                calculatedProtein += yogurtProtein;
                console.log(`Found ${yogurtGrams}g yogurt: +${yogurtProtein.toFixed(1)}g protein`);
              }
            }
          }

          // Count skyr
          const skyrPatterns = [
            /(\d+)g?\s*(?:milky\s+mist\s+)?skyr/gi
          ];

          for (const pattern of skyrPatterns) {
            let match;
            while ((match = pattern.exec(combinedText)) !== null) {
              const skyrGrams = parseInt(match[1]);
              if (skyrGrams > 0 && skyrGrams <= 300) { // Reasonable range check
                const skyrProtein = skyrGrams * 0.11;
                calculatedProtein += skyrProtein;
                console.log(`Found ${skyrGrams}g skyr: +${skyrProtein.toFixed(1)}g protein`);
              }
            }
          }

          // Count milk
          const milkPatterns = [
            /(\d+)ml?\s*(?:milky\s+mist\s+)?(?:toned\s+)?milk/gi
          ];

          for (const pattern of milkPatterns) {
            let match;
            while ((match = pattern.exec(combinedText)) !== null) {
              const milkMl = parseInt(match[1]);
              if (milkMl > 0 && milkMl <= 500) { // Reasonable range check
                const milkProtein = milkMl * 0.035;
                calculatedProtein += milkProtein;
                console.log(`Found ${milkMl}ml milk: +${milkProtein.toFixed(1)}g protein`);
              }
            }
          }

          // Add some protein from other common ingredients
          if (combinedText.includes('rice')) {
            calculatedProtein += 3; // Approximate for 1 cup rice
            console.log(`Found rice: +3g protein`);
          }
          if (combinedText.includes('bread') || combinedText.includes('slice')) {
            calculatedProtein += 3; // Per slice
            console.log(`Found bread: +3g protein`);
          }
          if (combinedText.includes('lentils') || combinedText.includes('dal')) {
            calculatedProtein += 9; // Approximate for 1 cup
            console.log(`Found lentils/dal: +9g protein`);
          }

          console.log(`Total calculated protein: ${calculatedProtein.toFixed(1)}g`);
          console.log(`Gemini stated protein: ${meal.nutrition.protein}g`);

          // If calculated protein differs significantly from stated protein, fix it
          if (calculatedProtein > 0) {
            const difference = Math.abs(calculatedProtein - meal.nutrition.protein);
            if (difference > 1) { // Very aggressive threshold - 1g difference
              console.log(`FIXING protein for ${meal.recipeName}: ${meal.nutrition.protein}g -> ${Math.round(calculatedProtein)}g`);
              const oldProtein = meal.nutrition.protein;
              meal.nutrition.protein = Math.round(calculatedProtein);
              // Adjust calories proportionally
              if (oldProtein > 0) {
                const ratio = calculatedProtein / oldProtein;
                meal.nutrition.calories = Math.round(meal.nutrition.calories * ratio);
              } else {
                meal.nutrition.calories = Math.round(meal.nutrition.calories + calculatedProtein * 4);
              }
            } else {
              console.log(`Protein calculation acceptable (difference: ${difference.toFixed(1)}g)`);
            }
          } else {
            // If we couldn't calculate protein from ingredients, apply minimum realistic values based on meal type and ingredients
            let minimumProtein = 15; // Default minimum

            // Check for high-protein ingredients and set realistic minimums
            if (combinedText.includes('chicken')) {
              minimumProtein = Math.max(25, meal.nutrition.protein); // Chicken meals should have at least 25g
            }
            if (combinedText.includes('paneer')) {
              minimumProtein = Math.max(20, meal.nutrition.protein); // Paneer meals should have at least 20g
            }
            if (combinedText.includes('egg')) {
              minimumProtein = Math.max(18, meal.nutrition.protein); // Egg meals should have at least 18g
            }

            if (meal.nutrition.protein < minimumProtein) {
              console.log(`BOOSTING low protein for ${meal.recipeName}: ${meal.nutrition.protein}g -> ${minimumProtein}g`);
              meal.nutrition.protein = minimumProtein;
              meal.nutrition.calories = Math.max(meal.nutrition.calories, minimumProtein * 6); // Rough calorie adjustment
            }
          }

          // Cap excessive protein values to prevent unrealistic totals - but be more lenient
          const maxProteinPerMeal = Math.ceil(proteinRequired * 0.6); // Increased from 45% to 60% per meal
          if (meal.nutrition.protein > maxProteinPerMeal) {
            console.log(`CAPPING excessive protein for ${meal.recipeName}: ${meal.nutrition.protein}g -> ${maxProteinPerMeal}g`);
            meal.nutrition.protein = maxProteinPerMeal;
            meal.nutrition.calories = Math.round(meal.nutrition.calories * 0.9); // Reduce calories proportionally
          }

          console.log('---');
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
    const dayTotalCarbs = day.meals.reduce((sum, meal) => sum + meal.nutrition.carbs, 0);
    const dayTotalFats = day.meals.reduce((sum, meal) => sum + meal.nutrition.fats, 0);

    return {
      ...day,
      totalProtein: Math.round(dayTotalProtein), // Round daily totals
      totalCalories: Math.round(dayTotalCalories),
      totalCarbs: Math.round(dayTotalCarbs),
      totalFats: Math.round(dayTotalFats),
      achieved: dayTotalProtein >= proteinRequired
    };
  });

  const weeklyTotalProtein = weeklyPlan.reduce((sum, day) => sum + day.totalProtein, 0);
  const weeklyTotalCalories = weeklyPlan.reduce((sum, day) => sum + day.totalCalories, 0);
  let averageDailyProtein = Math.round(weeklyTotalProtein / 7);
  const averageDailyCalories = Math.round(weeklyTotalCalories / 7);

  // Ensure average doesn't exceed target by more than 8g
  const maxAllowedAverage = proteinRequired + 8;
  if (averageDailyProtein > maxAllowedAverage) {
    console.log(`Capping excessive average protein: ${averageDailyProtein}g -> ${maxAllowedAverage}g`);

    // Proportionally reduce all daily totals
    const reductionRatio = maxAllowedAverage / averageDailyProtein;
    weeklyPlan.forEach(day => {
      day.totalProtein = Math.round(day.totalProtein * reductionRatio);
      day.totalCalories = Math.round(day.totalCalories * reductionRatio);

      // Also reduce individual meal proteins
      day.meals.forEach(meal => {
        meal.nutrition.protein = Math.round(meal.nutrition.protein * reductionRatio);
        meal.nutrition.calories = Math.round(meal.nutrition.calories * reductionRatio);
      });
    });

    // Recalculate averages
    const newWeeklyTotalProtein = weeklyPlan.reduce((sum, day) => sum + day.totalProtein, 0);
    const newWeeklyTotalCalories = weeklyPlan.reduce((sum, day) => sum + day.totalCalories, 0);
    averageDailyProtein = Math.round(newWeeklyTotalProtein / 7);

    return NextResponse.json({
      success: true,
      weeklyPlan,
      proteinRequired,
      averageDailyProtein,
      averageDailyCalories: Math.round(newWeeklyTotalCalories / 7),
      weeklyTotalProtein: Math.round(newWeeklyTotalProtein), // Round weekly total
      weeklyTotalCalories: Math.round(newWeeklyTotalCalories),
      dietaryPreferences: dietaryPreferences.length > 0 ? dietaryPreferences : ['all']
    });
  }

  return NextResponse.json({
    success: true,
    weeklyPlan,
    proteinRequired,
    averageDailyProtein,
    averageDailyCalories,
    weeklyTotalProtein: Math.round(weeklyTotalProtein), // Round weekly total
    weeklyTotalCalories: Math.round(weeklyTotalCalories),
    dietaryPreferences: dietaryPreferences.length > 0 ? dietaryPreferences : ['all']
  });
}

