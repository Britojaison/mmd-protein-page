export function calculateProtein(weight) {
  return (weight * 1.2).toFixed(1);
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
