export function calculateProtein(weight, gender = 'male', activityLevel = 'moderate', age = 30, height = 170) {
  // Enhanced protein calculation considering multiple factors
  
  let proteinPerKg;
  
  // Base protein requirements by age and gender
  if (age < 18) {
    // Growing adolescents need more protein
    proteinPerKg = gender === 'male' ? 1.0 : 0.9;
  } else if (age >= 65) {
    // Older adults need more protein to prevent sarcopenia
    proteinPerKg = 1.2;
  } else if (age >= 50) {
    // Middle-aged adults need slightly more
    proteinPerKg = 1.0;
  } else {
    // Adults 18-49
    proteinPerKg = gender === 'male' ? 0.9 : 0.8;
  }
  
  // Activity level multipliers (more realistic ranges)
  const activityMultipliers = {
    sedentary: 1.0,      // Desk job, minimal exercise
    light: 1.2,          // Light exercise 1-3 days/week
    moderate: 1.4,       // Moderate exercise 3-5 days/week  
    active: 1.6,         // Heavy exercise 6-7 days/week
    veryActive: 1.8      // Very intense exercise, physical job
  };
  
  proteinPerKg *= (activityMultipliers[activityLevel] || activityMultipliers.moderate);
  
  // BMI consideration (height factor)
  const heightInMeters = height / 100;
  const bmi = weight / (heightInMeters * heightInMeters);
  
  // Adjust for BMI - underweight people may need more protein for muscle building
  if (bmi < 18.5) {
    proteinPerKg += 0.2; // Underweight - need more protein
  } else if (bmi > 30) {
    proteinPerKg += 0.1; // Obese - slightly more for muscle preservation
  }
  
  // Calculate total daily protein
  const totalProtein = weight * proteinPerKg;
  
  // Ensure minimum and maximum reasonable limits
  const minProtein = weight * 0.8; // Never below RDA minimum
  const maxProtein = weight * 2.2; // Never above safe upper limit
  
  const finalProtein = Math.max(minProtein, Math.min(maxProtein, totalProtein));
  
  // Round to nearest whole number for practical use
  return Math.round(finalProtein);
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
