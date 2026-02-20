export function calculateProtein(weight, gender = 'male', activityLevel = 'moderate', age = 30) {
  // Base protein requirement: 0.8g per kg for sedentary adults (RDA minimum)
  // Adjusted based on activity level and other factors
  
  let proteinPerKg;
  
  // Activity level multipliers
  const activityMultipliers = {
    sedentary: 0.8,      // Minimal physical activity
    light: 1.0,          // Light exercise 1-3 days/week
    moderate: 1.2,       // Moderate exercise 3-5 days/week
    active: 1.4,         // Heavy exercise 6-7 days/week
    veryActive: 1.6      // Very intense exercise, physical job
  };
  
  proteinPerKg = activityMultipliers[activityLevel] || activityMultipliers.moderate;
  
  // Gender adjustment (males typically need slightly more)
  if (gender === 'male') {
    proteinPerKg += 0.1;
  }
  
  // Age adjustment (older adults need more protein to prevent muscle loss)
  if (age >= 65) {
    proteinPerKg += 0.2;
  } else if (age >= 50) {
    proteinPerKg += 0.1;
  }
  
  // Calculate total daily protein
  const totalProtein = weight * proteinPerKg;
  
  // Round to 1 decimal place
  return totalProtein.toFixed(1);
}

// Simplified version for backward compatibility
export function calculateProteinSimple(weight) {
  return calculateProtein(weight, 'male', 'moderate', 30);
}

export function generateMealPlan(proteinRequired) {
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  
  const mealTemplates = [
    {
      breakfast: { product: 'Milky Mist Greek Yogurt', serving: 200, protein: 20 },
      lunch: { product: 'Milky Mist High Protein Paneer', serving: 150, protein: 27 },
      dinner: { product: 'Milky Mist Skyr', serving: 150, protein: 16.5 }
    },
    {
      breakfast: { product: 'Milky Mist Skyr', serving: 200, protein: 22 },
      lunch: { product: 'Milky Mist High Protein Paneer', serving: 100, protein: 18 },
      dinner: { product: 'Milky Mist Greek Yogurt', serving: 250, protein: 25 }
    },
    {
      breakfast: { product: 'Milky Mist Greek Yogurt', serving: 150, protein: 15 },
      lunch: { product: 'Milky Mist High Protein Paneer', serving: 200, protein: 36 },
      dinner: { product: 'Milky Mist Skyr', serving: 100, protein: 11 }
    }
  ];

  return days.map((day, index) => {
    const template = mealTemplates[index % 3];
    const totalProtein = template.breakfast.protein + template.lunch.protein + template.dinner.protein;
    
    return {
      day,
      meals: {
        breakfast: template.breakfast,
        lunch: template.lunch,
        dinner: template.dinner
      },
      totalProtein: totalProtein.toFixed(1),
      achieved: totalProtein >= proteinRequired,
      remaining: Math.max(0, proteinRequired - totalProtein).toFixed(1)
    };
  });
}
