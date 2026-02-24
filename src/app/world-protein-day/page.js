'use client';

import { useState, useEffect, lazy, Suspense } from 'react';
import ProteinForm from './ProteinForm';
import { calculateProtein } from '../../utils/protein';
import jsPDF from 'jspdf';

// Lazy load the MealPlan component
const MealPlan = lazy(() => import('./MealPlan'));

const Step = ({ number, title, desc, active, isCompleted, isLast }) => {
  return (
    <div className="flex relative z-10 w-full group" style={{ paddingBottom: isLast ? '0' : '52px' }}>
      {!isLast && (
        <div className="absolute left-[17px] top-[44px] bottom-[12px] w-[2px] -ml-[1px] z-0 rounded-full overflow-hidden">
          <div className="h-full w-full bg-indigo-100" style={{ display: isCompleted ? 'none' : 'block' }} />
          <div className="h-full w-full bg-gradient-to-b from-[#0f284e] to-indigo-100/50" style={{ display: isCompleted ? 'block' : 'none' }} />
        </div>
      )}

      <div className={`flex-shrink-0 w-[34px] h-[34px] rounded-xl flex items-center justify-center font-bold text-[14px] z-10 
        ${active ? 'bg-[#0f284e] text-white shadow-[0_4px_12px_rgba(15,40,78,0.3)]' : 'bg-white text-gray-400 border border-gray-100 shadow-[0_2px_8px_rgba(0,0,0,0.02)]'} 
        ${isCompleted ? 'bg-[#0f284e] text-white shadow-[0_4px_12px_rgba(15,40,78,0.3)]' : ''} transition-all duration-300`}
      >
        {number}
      </div>
      <div className="ml-4 flex-1 pt-[1px]">
        <h3 className="text-[15px] font-bold text-[#04142f] mb-1.5">{title}</h3>
        <p className="text-[13px] text-gray-500 leading-snug">{desc}</p>
      </div>
    </div>
  );
};

export default function WorldProteinDay() {
  const [result, setResult] = useState(null);
  const [userCount, setUserCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [userCountLoaded, setUserCountLoaded] = useState(false);
  const [error, setError] = useState(null);
  const [showMealPlan, setShowMealPlan] = useState(false);
  const [showDaySelector, setShowDaySelector] = useState(false);
  const [selectedDay, setSelectedDay] = useState('Monday');
  const [selectedMeal, setSelectedMeal] = useState(null);

  useEffect(() => {
    if (!userCountLoaded) {
      const timer = setTimeout(() => {
        fetchUserCount();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [userCountLoaded]);

  const fetchUserCount = async () => {
    try {
      const res = await fetch('/api/user-count');
      const data = await res.json();
      setUserCount(data.count);
      setUserCountLoaded(true);
    } catch (error) {
      console.error('Failed to fetch user count:', error);
      setUserCountLoaded(true);
    }
  };

  const handleSubmit = async (formData) => {
    setIsLoading(true);
    setError(null);

    try {
      const proteinRequired = parseFloat(calculateProtein(
        formData.weight,
        formData.gender,
        formData.activityLevel || 'moderate', // Use the selected activity level
        formData.age,
        formData.height
      ));

      const userData = {
        ...formData,
        proteinRequired,
        timestamp: new Date().toISOString()
      };

      const [saveResponse, mealPlanResponse] = await Promise.all([
        fetch('/api/save-user', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(userData)
        }),
        fetch('/api/generate-meal-plan', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(userData)
        })
      ]);

      if (!saveResponse.ok) {
        throw new Error('Failed to save user data');
      }

      const mealPlanData = await mealPlanResponse.json();

      if (mealPlanData.success) {
        if (process.env.NEXT_PUBLIC_PROTEIN_API) {
          fetch(process.env.NEXT_PUBLIC_PROTEIN_API, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(userData)
          }).catch(err => console.log('External API call failed:', err));
        }

        setResult({
          proteinRequired,
          weeklyPlan: mealPlanData.weeklyPlan,
          averageDailyProtein: mealPlanData.averageDailyProtein,
          averageDailyCalories: mealPlanData.averageDailyCalories,
          weeklyTotalProtein: mealPlanData.weeklyTotalProtein,
          weeklyTotalCalories: mealPlanData.weeklyTotalCalories,
          dietaryPreferences: mealPlanData.dietaryPreferences,
          userData: formData
        });
        setShowMealPlan(false); // Show summary first, not meal plan
        setSelectedDay('Monday'); // Reset to first day

        fetchUserCount();
      } else {
        if (mealPlanData.validationErrors) {
          setError(`Validation Error: ${mealPlanData.validationErrors.join(', ')}`);
        } else {
          throw new Error(mealPlanData.error || 'Failed to generate meal plan');
        }
      }
    } catch (error) {
      console.error('Failed to save user:', error);
      setError(error.message || 'Failed to save data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const MealPlanLoader = () => (
    <div className="space-y-6 max-w-7xl mx-auto animate-pulse">
      <div className="bg-gray-200 rounded-2xl h-48"></div>
      <div className="bg-gray-200 rounded-2xl h-32"></div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[1, 2, 3].map(i => (
          <div key={i} className="bg-gray-200 rounded-xl h-64"></div>
        ))}
      </div>
    </div>
  );

  // Helper function to extract all Milky Mist products from ingredients
  const extractMilkyMistProducts = (ingredients, milkyMistProduct) => {
    const products = new Set();
    
    // Add the main product
    if (milkyMistProduct) {
      products.add(milkyMistProduct);
    }
    
    // Check ingredients for additional Milky Mist products
    if (ingredients && Array.isArray(ingredients)) {
      ingredients.forEach(ingredient => {
        const lowerIngredient = ingredient.toLowerCase();
        if (lowerIngredient.includes('milky mist')) {
          // Extract product name from ingredient
          if (lowerIngredient.includes('butter')) products.add('Milky Mist Butter');
          if (lowerIngredient.includes('ghee')) products.add('Milky Mist Ghee');
          if (lowerIngredient.includes('khova')) products.add('Milky Mist Frozen Khova');
          if (lowerIngredient.includes('toned milk')) products.add('Milky Mist Toned Milk');
          if (lowerIngredient.includes('paneer')) products.add('Milky Mist High Protein Paneer');
          if (lowerIngredient.includes('cheddar')) products.add('Milky Mist High Protein Cheddar Cheese');
          if (lowerIngredient.includes('skyr')) products.add('Milky Mist Skyr');
          if (lowerIngredient.includes('greek yogurt')) {
            if (lowerIngredient.includes('blueberry')) products.add('Milky Mist Greek Yogurt Blueberry');
            else if (lowerIngredient.includes('cereal')) products.add('Milky Mist Greek Yogurt Cereal');
            else if (lowerIngredient.includes('honey') && lowerIngredient.includes('fig')) products.add('Milky Mist Greek Yogurt Honey and Fig');
            else if (lowerIngredient.includes('natural')) products.add('Milky Mist Greek Yogurt Natural');
            else products.add('Milky Mist Greek Yogurt Natural');
          }
        }
      });
    }
    
    return Array.from(products);
  };

  // Helper function to get product image based on product name
  const getProductImage = (productName) => {
    const lowerName = productName.toLowerCase();
    
    // Check for specific product variants
    if (lowerName.includes('blueberry')) {
      return '/assets/images/Greek Yogurt Blueberry.png';
    } else if (lowerName.includes('cereal')) {
      return '/assets/images/Greek Yogurt Cereals.png';
    } else if (lowerName.includes('honey') && lowerName.includes('fig')) {
      return '/assets/images/Greek Yogurt Honey and fig.png';
    } else if (lowerName.includes('cheddar')) {
      return '/assets/images/High Protein Cheddar Cheese.png';
    } else if (lowerName.includes('paneer')) {
      return '/assets/images/High Protein Panner.png';
    } else if (lowerName.includes('skyr')) {
      return '/assets/images/Skyr.png';
    } else if (lowerName.includes('butter')) {
      return '/assets/images/Butter.png';
    } else if (lowerName.includes('ghee')) {
      return '/assets/images/Ghee.png';
    } else if (lowerName.includes('khova')) {
      return '/assets/images/Khova.png';
    } else if (lowerName.includes('toned milk')) {
      return '/assets/images/Toned Milk.png';
    } else if (lowerName.includes('natural') || lowerName.includes('greek yogurt')) {
      return '/assets/images/Greek Yogurt Natural.png';
    } else if (lowerName.includes('yogurt')) {
      return '/assets/images/Greek Yogurt Natural.png';
    }
    
    // Default fallback
    return '/assets/images/Greek Yogurt Natural.png';
  };
  
  // Helper function to get Zepto link for Milky Mist products
  const getZeptoLink = (productName) => {
    const lowerName = productName.toLowerCase();
    
    // Specific search terms for different products
    if (lowerName.includes('cheddar')) {
      return 'https://www.zepto.com/search?query=milky+mist+cheddar+cheese';
    } else if (lowerName.includes('greek yogurt') || lowerName.includes('yogurt')) {
      return 'https://www.zepto.com/search?query=milky+mist+greek+yogurt';
    } else if (lowerName.includes('paneer')) {
      return 'https://www.zepto.com/search?query=milky+mist+paneer';
    } else if (lowerName.includes('skyr')) {
      return 'https://www.zepto.com/search?query=milky+mist+skyr';
    } else if (lowerName.includes('butter')) {
      return 'https://www.zepto.com/search?query=milky+mist+butter';
    } else if (lowerName.includes('ghee')) {
      return 'https://www.zepto.com/search?query=milky+mist+ghee';
    } else if (lowerName.includes('khova')) {
      return 'https://www.zepto.com/search?query=milky+mist+khova';
    } else if (lowerName.includes('toned milk')) {
      return 'https://www.zepto.com/search?query=milky+mist+toned+milk';
    }
    
    // Default fallback - generic Milky Mist search
    return 'https://www.zepto.com/search?query=milky+mist';
  };

  // PDF Download Function
  const downloadMealPlanAsPDF = async () => {
    try {
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = 210;
      const pageHeight = 297;
      const margin = 15;
      const contentWidth = pageWidth - (margin * 2);
      
      // Title Page
      pdf.setFontSize(24);
      pdf.setTextColor(43, 76, 111); // #2B4C6F
      const userName = result.userData?.name || 'Your';
      pdf.text(`${userName}'s Personalized Meal Plan`, pageWidth / 2, 40, { align: 'center' });
      
      pdf.setFontSize(12);
      pdf.setTextColor(102, 102, 102);
      pdf.text('Crafted with Premium Milky Mist Dairy Products', pageWidth / 2, 50, { align: 'center' });
      
      // Summary Box
      pdf.setFillColor(248, 249, 250);
      pdf.rect(margin, 60, contentWidth, 40, 'F');
      
      pdf.setFontSize(10);
      pdf.setTextColor(43, 76, 111);
      pdf.text('Daily Target', margin + 20, 75);
      pdf.text('Average Per Day', margin + 70, 75);
      pdf.text('Weekly Total', margin + 130, 75);
      
      pdf.setFontSize(14);
      pdf.setTextColor(16, 109, 107);
      pdf.text(`${result.proteinRequired - 2}-${result.proteinRequired + 2}g`, margin + 20, 85);
      pdf.text(`${result.averageDailyProtein - 2}-${result.averageDailyProtein + 2}g`, margin + 70, 85);
      pdf.text(`${result.weeklyTotalProtein - 14}-${result.weeklyTotalProtein + 14}g`, margin + 130, 85);
      
      // Generate each day on a separate page
      result.weeklyPlan.forEach((day, dayIndex) => {
        // Always add a new page for each day (including Day 1)
        if (dayIndex === 0) {
          pdf.addPage(); // Add new page for Day 1
        } else {
          pdf.addPage();
        }
        
        let yPosition = 20; // Start from top for all days
        
        // Day Header
        pdf.setFontSize(18);
        pdf.setTextColor(43, 76, 111);
        pdf.text(`${day.day} - Day ${day.dayNumber}`, margin, yPosition);
        
        pdf.setFontSize(12);
        pdf.setTextColor(102, 102, 102);
        pdf.text(`Total Protein: ${day.totalProtein - 6}-${day.totalProtein + 6}g`, pageWidth - margin - 40, yPosition, { align: 'right' });
        
        yPosition += 15;
        
        // Draw separator line
        pdf.setDrawColor(16, 109, 107);
        pdf.setLineWidth(0.5);
        pdf.line(margin, yPosition, pageWidth - margin, yPosition);
        yPosition += 10;
        
        // Calculate available space for meals
        const availableHeight = pageHeight - yPosition - 25; // Reduced footer space
        const mealHeight = availableHeight / 3; // Divide equally among 3 meals
        
        // Meals in vertical layout (one below another)
        day.meals.forEach((meal, mealIndex) => {
          const mealStartY = yPosition + (mealIndex * mealHeight);
          let currentY = mealStartY;
          
          // Meal header with background - reduced height
          pdf.setFillColor(248, 249, 250);
          pdf.rect(margin, currentY - 3, contentWidth, 10, 'F');
          
          pdf.setFontSize(12);
          pdf.setTextColor(43, 76, 111);
          pdf.text(meal.type, margin + 3, currentY + 3);
          
          // Tags on the right side of header - smaller tags
          pdf.setFontSize(7);
          let tagX = pageWidth - margin - 3;
          
          // Calorie tag
          pdf.setFillColor(0, 123, 255);
          pdf.rect(tagX - 22, currentY - 1, 22, 5, 'F');
          pdf.setTextColor(255, 255, 255);
          pdf.text(`${meal.nutrition.calories} Cal`, tagX - 21, currentY + 2);
          tagX -= 26;
          
          // Protein tag
          pdf.setFillColor(40, 167, 69);
          pdf.rect(tagX - 26, currentY - 1, 26, 5, 'F');
          pdf.setTextColor(255, 255, 255);
          pdf.text(`${meal.nutrition.protein - 2}-${meal.nutrition.protein + 2}g`, tagX - 25, currentY + 2);
          tagX -= 30;
          
          // Dietary tag
          if (meal.dietary && meal.dietary.length > 0) {
            const dietTag = meal.dietary[0] === 'non-vegetarian' ? 'Non-Veg' : 'Veg';
            const tagWidth = dietTag === 'Non-Veg' ? 18 : 12;
            pdf.setFillColor(40, 167, 69);
            pdf.rect(tagX - tagWidth, currentY - 1, tagWidth, 5, 'F');
            pdf.setTextColor(255, 255, 255);
            pdf.text(dietTag, tagX - tagWidth + 1, currentY + 2);
          }
          
          currentY += 12;
          
          // Recipe name - reduced spacing
          pdf.setFontSize(9);
          pdf.setTextColor(0, 0, 0);
          const recipeLines = pdf.splitTextToSize(meal.recipeName, contentWidth - 6);
          pdf.text(recipeLines, margin + 3, currentY);
          currentY += Math.max(recipeLines.length * 4, 6);
          
          // Single column layout for better text wrapping
          let contentY = currentY;
          
          // Ingredients section
          pdf.setFontSize(9);
          pdf.setTextColor(43, 76, 111);
          pdf.text('Ingredients:', margin + 3, contentY);
          contentY += 5;
          
          pdf.setFontSize(7);
          pdf.setTextColor(102, 102, 102);
          if (meal.ingredients) {
            meal.ingredients.slice(0, 6).forEach((ingredient, idx) => {
              // Use full width for better text wrapping
              const ingredientLines = pdf.splitTextToSize(`• ${ingredient}`, contentWidth - 6);
              pdf.text(ingredientLines, margin + 3, contentY);
              contentY += Math.max(ingredientLines.length * 3.5, 4);
            });
          }
          
          contentY += 3; // Space between sections
          
          // Preparation steps section
          pdf.setFontSize(9);
          pdf.setTextColor(43, 76, 111);
          pdf.text('How to Prepare:', margin + 3, contentY);
          contentY += 5;
          
          pdf.setFontSize(7);
          pdf.setTextColor(102, 102, 102);
          if (meal.steps) {
            meal.steps.slice(0, 6).forEach((step, idx) => {
              // Use full width for better text wrapping
              const stepLines = pdf.splitTextToSize(`${idx + 1}. ${step}`, contentWidth - 6);
              pdf.text(stepLines, margin + 3, contentY);
              contentY += Math.max(stepLines.length * 3.5, 4);
            });
          }
          
          // Draw separator line between meals (except for last meal)
          if (mealIndex < day.meals.length - 1) {
            pdf.setDrawColor(220, 220, 220);
            pdf.setLineWidth(0.2);
            pdf.line(margin, mealStartY + mealHeight - 3, pageWidth - margin, mealStartY + mealHeight - 3);
          }
        });
      });
      
      // Add footer to last page
      const totalPages = pdf.internal.getNumberOfPages();
      pdf.setPage(totalPages);
      
      pdf.setFontSize(8);
      pdf.setTextColor(102, 102, 102);
      pdf.text(
        'This meal plan was generated specifically for your protein requirements and dietary preferences.',
        pageWidth / 2,
        pageHeight - 20,
        { align: 'center' }
      );
      pdf.text(
        'For best results, follow the plan consistently and stay hydrated throughout the day.',
        pageWidth / 2,
        pageHeight - 15,
        { align: 'center' }
      );
      
      // Download PDF
      pdf.save(`${userName}_Meal_Plan.pdf`);
      
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Failed to generate PDF. Please try again.');
    }
  };

  return (
    <div
      className={`${showMealPlan ? 'min-h-screen overflow-y-auto' : 'h-screen overflow-hidden'} bg-[#F8FAFF] font-sans tracking-tight`}
      style={{ backgroundImage: "url('/assets/images/BG.png')", backgroundSize: 'cover', backgroundPosition: 'center', backgroundAttachment: 'fixed' }}
    >
      {/* Summary Page - Full Screen Centered */}
      {result && !showMealPlan ? (
        <div className="h-full w-full flex items-center justify-center px-4">
          <div className="w-full max-w-[1056px] lg:w-[1056px] lg:h-[540px] bg-gradient-to-b from-[#E8F4F8] to-[#FFFFFF] rounded-[16px] shadow-[0_4px_20px_rgba(0,0,0,0.08)] border border-gray-100 flex flex-col items-center pt-[24px] lg:pt-[48px] px-4 lg:px-12 pb-6 lg:pb-0">
            {/* Progress Steps */}
            <div className="flex items-center justify-center mb-6 lg:mb-8">
              <div className="flex items-center space-x-2 lg:space-x-3">
                <div className="flex items-center">
                  <div className="w-6 h-6 lg:w-8 lg:h-8 bg-[#2B4C6F] text-white rounded-[6px] flex items-center justify-center text-xs lg:text-sm font-semibold">
                    1
                  </div>
                  <span className="ml-1 lg:ml-2 text-sm lg:text-base text-[#2B4C6F] font-medium">Personal Info</span>
                </div>
                <div className="w-6 lg:w-10 h-[2px] bg-[#2B4C6F]"></div>
                <div className="flex items-center">
                  <div className="w-6 h-6 lg:w-8 lg:h-8 bg-[#2B4C6F] text-white rounded-[6px] flex items-center justify-center text-xs lg:text-sm font-semibold">
                    2
                  </div>
                  <span className="ml-1 lg:ml-2 text-sm lg:text-base font-semibold text-[#2B4C6F]">Plan for You</span>
                </div>
                <div className="w-6 lg:w-10 h-[2px] bg-gray-300"></div>
                <div className="flex items-center">
                  <div className="w-6 h-6 lg:w-8 lg:h-8 bg-gray-300 text-gray-500 rounded-[6px] flex items-center justify-center text-xs lg:text-sm font-semibold">
                    3
                  </div>
                  <span className="ml-1 lg:ml-2 text-sm lg:text-base text-gray-400">Meal Plan</span>
                </div>
              </div>
            </div>

            {/* Title Section with Step indicator */}
            <div className="w-full max-w-[960px] flex flex-col lg:flex-row lg:items-start lg:justify-between mb-4 lg:mb-6 lg:mt-8 text-center lg:text-left">
              <div className="flex flex-col">
                <h1 className="text-[20px] lg:text-[30px] text-[#2B4C6F] leading-[1.2] mb-1" style={{ fontFamily: 'Founders Grotesk, sans-serif', fontWeight: 600 }}>
                  Your Personalised Meal Plan
                </h1>
                <p className="text-[12px] lg:text-[14px] text-gray-500 leading-[1.4]" style={{ fontFamily: 'Inter, sans-serif', fontWeight: 400 }}>
                  Crafted with Premium Milky Mist Dairy Products
                </p>
              </div>
              <p className="text-[10px] lg:text-[12px] text-gray-400 leading-[1.4] mt-2 lg:mt-0" style={{ fontFamily: 'Inter, sans-serif', fontWeight: 400 }}>Step 2/3</p>
            </div>

            {/* Protein Summary Cards */}
            <div className="w-full max-w-[960px] grid grid-cols-2 lg:flex lg:justify-center gap-3 lg:gap-6 mb-6 lg:mb-10 px-2 lg:px-8">
              <div className="w-full lg:w-[180px] h-[140px] lg:h-[162px] flex flex-col items-center justify-center p-3 lg:p-5 bg-white border border-[#E5E7EB] rounded-[12px]">
                <div className="text-[10px] lg:text-[12px] text-gray-500 tracking-wider uppercase mb-2 lg:mb-3 text-center" style={{ fontFamily: 'Founders Grotesk, sans-serif', fontWeight: 600 }}>DAILY TARGET</div>
                <div className="w-[50px] h-[45px] lg:w-[62px] lg:h-[56px] flex items-center justify-center bg-gradient-to-b from-[#F3F4F6] to-[#E0E7FF] rounded-[10px] mb-2 lg:mb-3">
                  <span className="text-[16px] lg:text-[20px] leading-[1.2] bg-gradient-to-r from-[#211E57] to-[#106D6B] bg-clip-text text-transparent" style={{ fontFamily: 'Founders Grotesk, sans-serif', fontWeight: 600 }}>
                    {result.proteinRequired}g
                  </span>
                </div>
                <div className="text-[10px] lg:text-[12px] text-gray-400 text-center" style={{ fontFamily: 'Inter, sans-serif', fontWeight: 400 }}>Your goal</div>
              </div>
              
              <div className="w-full lg:w-[180px] h-[140px] lg:h-[162px] flex flex-col items-center justify-center p-3 lg:p-5 bg-white border border-[#E5E7EB] rounded-[12px]">
                <div className="text-[10px] lg:text-[12px] text-gray-500 tracking-wider uppercase mb-2 lg:mb-3 text-center" style={{ fontFamily: 'Founders Grotesk, sans-serif', fontWeight: 600 }}>AVERAGE PER DAY</div>
                <div className="w-[50px] h-[45px] lg:w-[62px] lg:h-[56px] flex items-center justify-center bg-gradient-to-b from-[#F3F4F6] to-[#E0E7FF] rounded-[10px] mb-2 lg:mb-3">
                  <span className="text-[16px] lg:text-[20px] leading-[1.2] bg-gradient-to-r from-[#211E57] to-[#106D6B] bg-clip-text text-transparent" style={{ fontFamily: 'Founders Grotesk, sans-serif', fontWeight: 600 }}>
                    {result.averageDailyProtein}g
                  </span>
                </div>
                <div className="text-[10px] lg:text-[12px] text-gray-400 text-center" style={{ fontFamily: 'Inter, sans-serif', fontWeight: 400 }}>Exceeds by {result.averageDailyProtein - result.proteinRequired}g</div>
              </div>
              
              <div className="w-full lg:w-[180px] h-[140px] lg:h-[162px] flex flex-col items-center justify-center p-3 lg:p-5 bg-white border border-[#E5E7EB] rounded-[12px]">
                <div className="text-[10px] lg:text-[12px] text-gray-500 tracking-wider uppercase mb-2 lg:mb-3 text-center" style={{ fontFamily: 'Founders Grotesk, sans-serif', fontWeight: 600 }}>WEEKLY TOTAL</div>
                <div className="w-[50px] h-[45px] lg:w-[62px] lg:h-[56px] flex items-center justify-center bg-gradient-to-b from-[#F3F4F6] to-[#E0E7FF] rounded-[10px] mb-2 lg:mb-3">
                  <span className="text-[16px] lg:text-[20px] leading-[1.2] bg-gradient-to-r from-[#211E57] to-[#106D6B] bg-clip-text text-transparent" style={{ fontFamily: 'Founders Grotesk, sans-serif', fontWeight: 600 }}>
                    {result.weeklyTotalProtein}g
                  </span>
                </div>
                <div className="text-[10px] lg:text-[12px] text-gray-400 text-center" style={{ fontFamily: 'Inter, sans-serif', fontWeight: 400 }}>If you follow plan</div>
              </div>
              
              <div className="w-full lg:w-[180px] h-[140px] lg:h-[162px] flex flex-col items-center justify-center p-3 lg:p-5 bg-white border border-[#E5E7EB] rounded-[12px]">
                <div className="text-[10px] lg:text-[12px] text-gray-500 tracking-wider uppercase mb-2 lg:mb-3 text-center" style={{ fontFamily: 'Founders Grotesk, sans-serif', fontWeight: 600 }}>PLAN QUALITY</div>
                <div className="w-[50px] h-[45px] lg:w-[62px] lg:h-[56px] flex items-center justify-center bg-gradient-to-b from-[#F3F4F6] to-[#E0E7FF] rounded-[10px] mb-2 lg:mb-3">
                  <img src="/assets/logos/tick/Form/V2/Vector.png" alt="✓" className="w-4 h-4 lg:w-6 lg:h-6" />
                </div>
                <div className="text-[10px] lg:text-[12px] text-gray-400 text-center" style={{ fontFamily: 'Inter, sans-serif', fontWeight: 400 }}>Optimal</div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="w-full max-w-[960px] flex flex-col lg:flex-row justify-between gap-4 lg:gap-0 mt-auto mb-4 lg:mb-8 px-4 lg:px-0">
              <button
                onClick={() => {
                  setResult(null);
                  setError(null);
                  setShowMealPlan(false);
                }}
                className="w-full lg:w-[150px] h-[48px] flex items-center justify-center px-[18px] py-[16px] border border-[#D1D5DB] text-[#2B4C6F] rounded-[8px] font-semibold text-[14px] lg:text-[16px] hover:bg-gray-50 transition-all duration-300 bg-white"
              >
                Back
              </button>
              <button
                onClick={() => setShowMealPlan(true)}
                className="w-full lg:w-[150px] h-[48px] flex items-center justify-center px-[18px] py-[16px] bg-gradient-to-b from-[#211E57] to-[#106D6B] text-white rounded-[8px] font-semibold text-[14px] lg:text-[16px] hover:opacity-90 transition-all duration-300 shadow-sm"
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      ) : (
        // Form, Day Selector, and Meal Plan Pages - Normal Layout
        <div className={`${showMealPlan ? 'min-h-screen' : 'h-screen'} w-full flex flex-col lg:flex-row justify-center items-start gap-4 lg:gap-8 py-4 lg:py-8 px-4 lg:px-0`}>

          {/* Left Stepper Sidebar - Only show on form page, not on day selector or meal plan */}
          {!result && (
          <div className="bg-gradient-to-b from-[#FFFFFF] to-[#E6F0FF] rounded-[1.5rem] lg:rounded-[2.5rem] w-full lg:w-[348px] h-auto lg:h-[746px] flex flex-col justify-between shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-white/50 relative shrink-0 p-4 lg:p-8">
            <div>
              <div className="mb-4 lg:mb-8 pb-4 lg:pb-8 border-b border-indigo-50/70 flex justify-center">
                <img src="/assets/logos/logo.png" alt="MilkyMist" className="h-8 lg:h-10 object-contain ml-3" />
              </div>

              <div className="space-y-0 relative px-2 hidden lg:block">
                <Step
                  number={1}
                  title="Enter the Details"
                  desc="Tell us who you are to get started."
                  active={!result}
                  isCompleted={!!result}
                />
                <Step
                  number={2}
                  title="View your Protein Need"
                  desc="View the personalized meal plan."
                  active={!!result && !showMealPlan}
                  isCompleted={!!result && showMealPlan}
                />
                <Step
                  number={3}
                  title="Explore Curated Recipes"
                  desc="Have the best days with our Milkymist products."
                  active={!!result && showMealPlan}
                  isLast={true}
                />
              </div>
            </div>

            <div className="mt-4 lg:mt-16 flex items-center justify-between px-2 hidden lg:flex">
              <div>
                <h4 className="font-bold text-[16px] text-[#04142f] mb-0.5">Need a help?</h4>
                <p className="text-[13px] text-gray-500 font-medium">chat with live support</p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center text-[#0f284e] shadow-[0_4px_16px_rgba(0,0,0,0.04)] hover:shadow-[0_6px_20px_rgba(0,0,0,0.06)] hover:scale-105 transition-all duration-300 transform cursor-pointer">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 18v-6a9 9 0 0 1 18 0v6"></path>
                  <path d="M21 19a2 2 0 0 1-2 2h1a2 2 0 0 1 2-2v-3a2 2 0 0 1-2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"></path>
                </svg>
              </div>
            </div>
          </div>
        )}

        {/* Right Content Area */}
        <div className={`${
          result && showMealPlan
            ? 'w-full min-h-screen flex items-start justify-center py-4 lg:py-8'
            : 'bg-gradient-to-b from-[#E8F4F8] to-[#FFFFFF] rounded-[1.5rem] lg:rounded-[2.5rem] shadow-[0_8px_30px_rgb(0,0,0,0.08)] border border-gray-100/50 w-[343px] h-[698px] lg:w-[680px] lg:h-[746px] flex items-center justify-center p-6 lg:p-12 overflow-hidden'
        }`}>
          {!result ? (
            <div className="w-full max-w-3xl h-full overflow-y-auto px-2">
              <h2 className="text-lg lg:text-2xl xl:text-[28px] font-bold text-[#0f284e] mb-4 lg:mb-8 text-center lg:text-left">
                Calculate Your Protein Today!
              </h2>
              {error && (
                <div className="mb-3 lg:mb-6 p-3 lg:p-4 bg-red-50 border-l-4 border-red-500 rounded-r-xl">
                  <p className="text-red-600 text-[12px] lg:text-[15px]">{error}</p>
                </div>
              )}
              <ProteinForm onSubmit={handleSubmit} isLoading={isLoading} />
            </div>
          ) : showMealPlan ? (
            // Meal Plan Display - Always expanded cards
            (() => {
              // Find the selected day's data from weeklyPlan
              const dayIndex = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].indexOf(selectedDay);
              const currentDayPlan = result.weeklyPlan[dayIndex] || result.weeklyPlan[0];
              
              return (
                <div className="w-full min-h-screen flex items-start justify-center py-4 lg:py-8 px-4 lg:px-0">
                  <div className="w-full max-w-[1122px] bg-white rounded-[16px] shadow-[0_4px_20px_rgba(0,0,0,0.08)] border border-gray-100 p-4 lg:p-8">
                    {/* Top Header - Available plans */}
                    <div className="mb-6 lg:mb-8">
                      <h2 className="text-[20px] lg:text-[28px] text-[#2B4C6F] mb-1" style={{ fontFamily: 'Founders Grotesk, sans-serif', fontWeight: 700 }}>
                        Available plans for {result.userData?.name || 'You'}
                      </h2>
                      <p className="text-[11px] lg:text-[13px] text-gray-500" style={{ fontFamily: 'Inter, sans-serif', fontWeight: 400 }}>
                        Select the plan that best fits you and explore your protein recipes now
                      </p>
                    </div>

                    {/* Day Selector */}
                    <div className="flex flex-wrap gap-2 mb-6 lg:mb-8 justify-center">
                      {result.weeklyPlan.map((dayPlan, index) => (
                        <button
                          key={dayPlan.day}
                          onClick={() => setSelectedDay(dayPlan.day)}
                          className={`w-[100px] lg:w-[129px] h-[35px] lg:h-[40px] rounded-[12px] transition-all duration-300 flex items-center justify-between px-2 lg:px-4 bg-white ${
                            selectedDay === dayPlan.day
                              ? 'border-2 border-[#2B4C6F]'
                              : 'border border-gray-200 hover:border-[#2B4C6F]'
                          }`}
                        >
                          <span className="text-[11px] lg:text-[13px] text-[#2B4C6F]" style={{ fontFamily: 'AG Display, sans-serif', fontWeight: 700 }}>
                            {dayPlan.day.substring(0, 3)}
                          </span>
                          <div className={`w-[14px] h-[14px] lg:w-[18px] lg:h-[18px] rounded-full ${
                            selectedDay === dayPlan.day ? 'bg-gradient-to-r from-[#211E57] to-[#106D6B]' : 'border-2 border-gray-300'
                          }`}>
                          </div>
                        </button>
                      ))}
                    </div>

                    {/* Day Title and Protein Info */}
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-4 lg:mb-6 text-center lg:text-left">
                      <div>
                        <h3 className="text-[20px] lg:text-[28px] text-[#2B4C6F] mb-1" style={{ fontFamily: 'Founders Grotesk, sans-serif', fontWeight: 700 }}>
                          {currentDayPlan.day}
                        </h3>
                        <p className="text-[11px] lg:text-[13px] text-gray-500" style={{ fontFamily: 'Inter, sans-serif', fontWeight: 400 }}>
                          Day {currentDayPlan.dayNumber} of your Meal Plan
                        </p>
                      </div>
                      <div className="flex flex-col items-center mt-4 lg:mt-0">
                        <p className="text-[11px] lg:text-[13px] text-gray-500 mb-2" style={{ fontFamily: 'Inter, sans-serif', fontWeight: 400 }}>
                          Total Protein
                        </p>
                        <div className="w-[80px] h-[45px] lg:w-[95px] lg:h-[56px] bg-gradient-to-br from-blue-50 via-purple-50 to-blue-100 rounded-[10px] flex items-center justify-center shadow-sm">
                          <p className="text-[16px] lg:text-[20px] font-bold bg-gradient-to-r from-[#211E57] to-[#106D6B] bg-clip-text text-transparent" style={{ fontFamily: 'Founders Grotesk, sans-serif', fontWeight: 700 }}>
                            {currentDayPlan.totalProtein - 6}-{currentDayPlan.totalProtein + 6}g
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Meal Cards - Always expanded, centered and middle aligned */}
                    <div className="w-full flex justify-center items-center mb-6 lg:mb-8">
                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6 w-full max-w-[320px] lg:max-w-none">
                        {currentDayPlan.meals.map((meal, index) => (
                          <div 
                            key={index}
                            className="bg-white rounded-[12px] overflow-hidden w-full lg:w-[320px] h-[400px] lg:h-[450px] border border-gray-200 mx-auto flex flex-col"
                          >
                            {/* Fixed Header Section */}
                            <div className="p-3 lg:p-4 flex-shrink-0">
                              <div className="flex items-center justify-between mb-1">
                                <h4 className="text-[14px] lg:text-[16px] font-bold text-[#2B4C6F]" style={{ fontFamily: 'Founders Grotesk, sans-serif' }}>
                                  {meal.type}
                                </h4>
                              </div>
                              
                              {/* Recipe Name - Always show */}
                              <p className="text-gray-700 mb-2 text-[11px] lg:text-[13px] font-semibold" style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600, lineHeight: '1.4' }}>
                                {meal.recipeName}
                              </p>
                                
                              {/* Product Images - Show all Milky Mist products */}
                              <div className="flex justify-center items-center gap-2 mb-2 flex-wrap">
                                {extractMilkyMistProducts(meal.ingredients, meal.milkyMistProduct).map((product, idx) => (
                                  <img 
                                    key={idx}
                                    src={getProductImage(product)} 
                                    alt={product}
                                    className="object-contain h-[75px] lg:h-[85px] min-w-[60px] lg:min-w-[70px] max-w-[95px] lg:max-w-[105px]"
                                    style={{ objectFit: 'contain', objectPosition: 'center' }}
                                  />
                                ))}
                              </div>

                              {/* Tags */}
                              <div className="flex flex-wrap gap-1 lg:gap-2 mb-3 justify-center">
                                {meal.dietary && meal.dietary.slice(0, 1).map((tag, tagIndex) => {
                                  const isNonVeg = tag === 'non-vegetarian';
                                  const tagText = tag === 'non-vegetarian' ? 'Non-Veg' : tag === 'vegetarian' ? 'Veg' : tag === 'gluten-free' ? 'Gluten Free' : tag;
                                  return (
                                    <span 
                                      key={tagIndex}
                                      className={`px-2 lg:px-3 h-[22px] lg:h-[24px] bg-transparent border border-green-600 text-[#2B4C6F] text-[11px] lg:text-[13px] rounded-[6px] flex items-center justify-center whitespace-nowrap min-w-fit`}
                                      style={{ fontFamily: 'system-ui, sans-serif', fontWeight: 700 }}
                                    >
                                      {tagText}
                                    </span>
                                  );
                                })}
                                <span 
                                  className="px-2 lg:px-3 h-[22px] lg:h-[24px] bg-transparent border border-green-600 text-[#2B4C6F] text-[11px] lg:text-[13px] rounded-[6px] flex items-center justify-center whitespace-nowrap min-w-fit" 
                                  style={{ fontFamily: 'system-ui, sans-serif', fontWeight: 700 }}
                                >
                                  {meal.nutrition.protein - 2}-{meal.nutrition.protein + 2}g Protein
                                </span>
                                <span 
                                  className="px-2 lg:px-3 h-[22px] lg:h-[24px] bg-transparent border border-blue-600 text-[#2B4C6F] text-[11px] lg:text-[13px] rounded-[6px] flex items-center justify-center whitespace-nowrap min-w-fit" 
                                  style={{ fontFamily: 'system-ui, sans-serif', fontWeight: 700 }}
                                >
                                  {meal.nutrition.calories} Cal
                                </span>
                              </div>
                            </div>

                            {/* Scrollable Content Section */}
                            <div className="flex-1 overflow-y-auto px-3 lg:px-4 pb-3 lg:pb-4 custom-scrollbar relative">
                              {/* Ingredients - Always show */}
                              <div className="mb-4">
                                <h5 className="text-[14px] lg:text-[16px] font-bold text-[#2B4C6F] mb-2 py-1" style={{ fontFamily: 'Founders Grotesk, sans-serif' }}>
                                  Ingredients
                                </h5>
                                <ul className="space-y-2">
                                  {meal.ingredients && meal.ingredients.map((ingredient, idx) => (
                                    <li key={idx} className="text-[12px] lg:text-[14px] text-gray-600 flex items-start" style={{ fontFamily: 'Inter, sans-serif' }}>
                                      <span className="mr-2 flex-shrink-0">•</span>
                                      <span className="break-words leading-relaxed">{ingredient}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>

                              {/* How to Prepare - Always show */}
                              <div className="mb-1">
                                <h5 className="text-[14px] lg:text-[16px] font-bold text-[#2B4C6F]" style={{ fontFamily: 'Founders Grotesk, sans-serif' }}>
                                  How to Prepare
                                </h5>
                                <ol className="space-y-2">
                                  {meal.steps && meal.steps.map((step, idx) => (
                                    <li key={idx} className="text-[12px] lg:text-[14px] text-gray-600 flex items-start" style={{ fontFamily: 'Inter, sans-serif' }}>
                                      <span className="mr-2 flex-shrink-0">{idx + 1}.</span>
                                      <span className="break-words leading-relaxed">{step}</span>
                                    </li>
                                  ))}
                                </ol>
                              </div>
                              
                              {/* Scroll indicator gradient */}
                              <div className="absolute bottom-0 left-0 right-0 h-4 bg-gradient-to-t from-white to-transparent pointer-events-none"></div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col lg:flex-row justify-center gap-4 mt-6 lg:mt-8 mb-4">
                      <button
                        onClick={downloadMealPlanAsPDF}
                        className="w-full max-w-[280px] lg:w-[320px] h-[48px] flex items-center justify-center px-[18px] py-[16px] bg-gradient-to-r from-[#17435B] to-[#116d7a] text-white rounded-[8px] font-semibold text-[12px] lg:text-[14px] hover:opacity-90 transition-all duration-300 shadow-sm"
                      >
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        Download as PDF
                      </button>
                      <button
                        onClick={() => {
                          setResult(null);
                          setError(null);
                          setShowMealPlan(false);
                          setSelectedDay('Monday');
                        }}
                        className="w-full max-w-[280px] lg:w-[320px] h-[48px] flex items-center justify-center px-[18px] py-[16px] bg-gradient-to-r from-[#211E57] to-[#106D6B] text-white rounded-[8px] font-semibold text-[12px] lg:text-[14px] hover:opacity-90 transition-all duration-300 shadow-sm"
                      >
                        Calculate for Another Person
                      </button>
                    </div>
                  </div>
                </div>
              );
            })()
          ) : null}
        </div>
      </div>
      )}

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #d1d5db;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #9ca3af;
        }
        
        /* Enhanced scrollbar for meal cards */
        .custom-scrollbar {
          scrollbar-width: thin;
          scrollbar-color: #d1d5db #f1f1f1;
        }
        
        /* Smooth scrolling */
        .custom-scrollbar {
          scroll-behavior: smooth;
        }
        
        /* Sticky headers in scroll area */
        .custom-scrollbar h5 {
          z-index: 10;
        }
      `}</style>
    </div>
  );
}