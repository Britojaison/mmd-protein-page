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
  const [progress, setProgress] = useState(0);
  const [loadingText, setLoadingText] = useState('Analyzing your profile...');

  useEffect(() => {
    let progressInterval;
    let textInterval;

    if (isLoading) {
      setProgress(0);
      let currentProgress = 0;
      
      progressInterval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 95) {
            clearInterval(progressInterval);
            return 95;
          }
          
          // Slow and steady progress - starts faster, then slows down
          let increment;
          if (prev < 30) {
            increment = 2; // Faster in the beginning
          } else if (prev < 60) {
            increment = 1.5; // Medium speed
          } else if (prev < 80) {
            increment = 1; // Slower
          } else {
            increment = 0.5; // Very slow near the end
          }
          
          return Math.min(prev + increment, 95);
        });
      }, 800); // Slower interval for steadier progress

      const texts = [
        'Analyzing your profile...',
        'Calculating protein requirements...',
        'Curating Milky Mist recipes...',
        'Crafting your personalized meal plan...',
        'Almost ready...'
      ];
      let textIndex = 0;
      setLoadingText(texts[0]);

      textInterval = setInterval(() => {
        textIndex = (textIndex + 1) % texts.length;
        setLoadingText(texts[textIndex]);
      }, 3000); // Slightly slower text changes

    } else {
      setProgress(100);
    }

    return () => {
      clearInterval(progressInterval);
      clearInterval(textInterval);
    };
  }, [isLoading]);

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
      pdf.text('Daily Target', pageWidth / 2 - 40, 75, { align: 'center' });
      pdf.text('Weekly Total', pageWidth / 2 + 40, 75, { align: 'center' });

      pdf.setFontSize(14);
      pdf.setTextColor(16, 109, 107);
      pdf.text(`${result.proteinRequired - 2}-${result.proteinRequired + 2}g`, pageWidth / 2 - 40, 85, { align: 'center' });
      pdf.text(`${result.weeklyTotalProtein - 14}-${result.weeklyTotalProtein + 14}g`, pageWidth / 2 + 40, 85, { align: 'center' });

      // Add Web Banner image at the bottom of the first page
      try {
        const bannerImg = new Image();
        bannerImg.crossOrigin = 'anonymous';
        
        await new Promise((resolve, reject) => {
          bannerImg.onload = () => {
            try {
              console.log('Banner image loaded successfully:', bannerImg.width, 'x', bannerImg.height);
              
              // Create a canvas to convert the image with high quality
              const canvas = document.createElement('canvas');
              const ctx = canvas.getContext('2d');
              
              // Calculate image dimensions - use full page width and maintain aspect ratio
              const imgWidth = pageWidth; // Full page width (210mm)
              const aspectRatio = bannerImg.width / bannerImg.height;
              const imgHeight = imgWidth / aspectRatio;
              
              // Position image at the bottom of the page
              const imgX = 0; // No margin - start from edge
              const imgY = pageHeight - imgHeight - 10; // 10mm from bottom
              
              // Set canvas size for high resolution
              const scale = 4; // Higher scale for better quality
              canvas.width = bannerImg.width * scale;
              canvas.height = bannerImg.height * scale;
              
              // Enable image smoothing for better quality
              ctx.imageSmoothingEnabled = true;
              ctx.imageSmoothingQuality = 'high';
              
              // Draw image to canvas at high resolution
              ctx.drawImage(bannerImg, 0, 0, canvas.width, canvas.height);
              
              // Convert canvas to high-quality data URL
              const dataURL = canvas.toDataURL('image/jpeg', 1.0); // Maximum quality
              
              console.log('Adding full-width image to PDF at bottom:', imgX, imgY, imgWidth, imgHeight);
              
              // Add image to PDF using data URL
              pdf.addImage(dataURL, 'JPEG', imgX, imgY, imgWidth, imgHeight);
              resolve();
            } catch (error) {
              console.error('Failed to add banner image to PDF:', error);
              resolve(); // Continue without image
            }
          };
          
          bannerImg.onerror = (error) => {
            console.error('Failed to load Web Banner image:', error);
            console.log('Attempted path: /assets/images/Web Banner.jpg');
            resolve(); // Continue without image
          };
          
          bannerImg.src = '/assets/images/Web Banner.jpg';
        });
      } catch (error) {
        console.error('Error loading banner image:', error);
      }

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
        <div className="min-h-screen w-full flex items-start justify-center px-4 py-4 lg:py-0 lg:h-full lg:items-center">
          <div className="w-full max-w-[1056px] lg:w-[1056px] min-h-[700px] lg:h-[540px] bg-gradient-to-b from-[#E8F4F8] to-[#FFFFFF] rounded-[16px] shadow-[0_4px_20px_rgba(0,0,0,0.08)] border border-gray-100 flex flex-col items-center pt-[20px] lg:pt-[48px] px-4 lg:px-12 pb-8 lg:pb-0">
            {/* Progress Steps */}
            <div className="flex items-center justify-center mb-6 lg:mb-8">
              <div className="flex items-center space-x-2 lg:space-x-3">
                <div className="flex flex-col lg:flex-row items-center lg:items-center">
                  <div className="w-7 h-7 lg:w-8 lg:h-8 bg-[#2B4C6F] text-white rounded-[6px] flex items-center justify-center text-sm lg:text-sm font-semibold">
                    1
                  </div>
                  <span className="mt-1 lg:mt-0 lg:ml-2 text-xs lg:text-base text-[#2B4C6F] font-medium text-center">Personal Info</span>
                </div>
                <div className="w-6 lg:w-10 h-[2px] bg-[#2B4C6F] mt-4 lg:mt-0"></div>
                <div className="flex flex-col lg:flex-row items-center lg:items-center">
                  <div className="w-7 h-7 lg:w-8 lg:h-8 bg-[#2B4C6F] text-white rounded-[6px] flex items-center justify-center text-sm lg:text-sm font-semibold">
                    2
                  </div>
                  <span className="mt-1 lg:mt-0 lg:ml-2 text-xs lg:text-base font-semibold text-[#2B4C6F] text-center">Plan for You</span>
                </div>
                <div className="w-6 lg:w-10 h-[2px] bg-gray-300 mt-4 lg:mt-0"></div>
                <div className="flex flex-col lg:flex-row items-center lg:items-center">
                  <div className="w-7 h-7 lg:w-8 lg:h-8 bg-gray-300 text-gray-500 rounded-[6px] flex items-center justify-center text-sm lg:text-sm font-semibold">
                    3
                  </div>
                  <span className="mt-1 lg:mt-0 lg:ml-2 text-xs lg:text-base text-gray-400 text-center">Meal Plan</span>
                </div>
              </div>
            </div>

            {/* Title Section with Step indicator */}
            <div className="w-full max-w-[960px] flex flex-col lg:flex-row lg:items-start lg:justify-between mb-4 lg:mb-6 lg:mt-8 text-left lg:text-left">
              <div className="flex flex-col">
                <h1 className="text-[22px] lg:text-[30px] text-[#2B4C6F] leading-[1.2] mb-2 lg:mb-1" style={{ fontFamily: 'Founders Grotesk, sans-serif', fontWeight: 600 }}>
                  {result.userData?.name ? `${result.userData.name}'s Personalized Meal Plan` : 'Your Personalised Meal Plan'}
                </h1>
                <p className="text-[13px] lg:text-[14px] text-gray-500 leading-[1.4]" style={{ fontFamily: 'Inter, sans-serif', fontWeight: 400 }}>
                  Crafted with Premium Milky Mist Dairy Products
                </p>
              </div>
              <p className="text-[12px] lg:text-[12px] text-gray-400 leading-[1.4] mt-3 lg:mt-0 hidden lg:block" style={{ fontFamily: 'Inter, sans-serif', fontWeight: 400 }}>Step 2/3</p>
            </div>

            {/* Protein Summary Cards */}
            <div className="w-full max-w-[960px] grid grid-cols-1 lg:flex lg:justify-center gap-3 lg:gap-8 mb-4 lg:mb-10 px-2 lg:px-8">
              <div className="w-full lg:w-[220px] h-[120px] lg:h-[180px] flex flex-col items-center justify-center p-3 lg:p-6 bg-white border border-[#E5E7EB] rounded-[12px]">
                <div className="text-[10px] lg:text-[13px] text-gray-500 tracking-wider uppercase mb-2 lg:mb-4 text-center" style={{ fontFamily: 'Founders Grotesk, sans-serif', fontWeight: 600 }}>DAILY TARGET</div>
                <div className="w-[48px] h-[40px] lg:w-[70px] lg:h-[64px] flex items-center justify-center bg-gradient-to-b from-[#F3F4F6] to-[#E0E7FF] rounded-[10px] mb-2 lg:mb-4">
                  <span className="text-[16px] lg:text-[22px] leading-[1.2] bg-gradient-to-r from-[#211E57] to-[#106D6B] bg-clip-text text-transparent" style={{ fontFamily: 'Founders Grotesk, sans-serif', fontWeight: 600 }}>
                    {result.proteinRequired - 2}-{result.proteinRequired + 2}g
                  </span>
                </div>
                <div className="text-[10px] lg:text-[13px] text-gray-400 text-center" style={{ fontFamily: 'Inter, sans-serif', fontWeight: 400 }}>Your goal</div>
              </div>

              <div className="w-full lg:w-[220px] h-[120px] lg:h-[180px] flex flex-col items-center justify-center p-3 lg:p-6 bg-white border border-[#E5E7EB] rounded-[12px]">
                <div className="text-[10px] lg:text-[13px] text-gray-500 tracking-wider uppercase mb-2 lg:mb-4 text-center" style={{ fontFamily: 'Founders Grotesk, sans-serif', fontWeight: 600 }}>WEEKLY TOTAL</div>
                <div className="w-[48px] h-[40px] lg:w-[70px] lg:h-[64px] flex items-center justify-center bg-gradient-to-b from-[#F3F4F6] to-[#E0E7FF] rounded-[10px] mb-2 lg:mb-4">
                  <span className="text-[16px] lg:text-[22px] leading-[1.2] bg-gradient-to-r from-[#211E57] to-[#106D6B] bg-clip-text text-transparent" style={{ fontFamily: 'Founders Grotesk, sans-serif', fontWeight: 600 }}>
                    {result.weeklyTotalProtein - 14}-{result.weeklyTotalProtein + 14}g
                  </span>
                </div>
                <div className="text-[10px] lg:text-[13px] text-gray-400 text-center" style={{ fontFamily: 'Inter, sans-serif', fontWeight: 400 }}>If you follow plan</div>
              </div>

              <div className="w-full lg:w-[220px] h-[120px] lg:h-[180px] flex flex-col items-center justify-center p-3 lg:p-6 bg-white border border-[#E5E7EB] rounded-[12px]">
                <div className="text-[10px] lg:text-[13px] text-gray-500 tracking-wider uppercase mb-2 lg:mb-4 text-center" style={{ fontFamily: 'Founders Grotesk, sans-serif', fontWeight: 600 }}>PLAN QUALITY</div>
                <div className="w-[48px] h-[40px] lg:w-[70px] lg:h-[64px] flex items-center justify-center bg-gradient-to-b from-[#F3F4F6] to-[#E0E7FF] rounded-[10px] mb-2 lg:mb-4">
                  <img src="/assets/logos/tick/Form/V2/Vector.png" alt="✓" className="w-4 h-4 lg:w-7 lg:h-7" />
                </div>
                <div className="text-[10px] lg:text-[13px] text-gray-400 text-center" style={{ fontFamily: 'Inter, sans-serif', fontWeight: 400 }}>Optimal</div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="w-full max-w-[960px] flex flex-col lg:flex-row justify-between gap-4 lg:gap-0 mt-auto mb-6 lg:mb-8 px-4 lg:px-0">
              <button
                onClick={() => {
                  setResult(null);
                  setError(null);
                  setShowMealPlan(false);
                }}
                className="w-full lg:w-[150px] h-[52px] lg:h-[48px] flex items-center justify-center px-[18px] py-[16px] border border-[#D1D5DB] text-[#2B4C6F] rounded-[8px] font-semibold text-[16px] lg:text-[16px] hover:bg-gray-50 transition-all duration-300 bg-white"
              >
                Back
              </button>
              <button
                onClick={() => setShowMealPlan(true)}
                className="w-full lg:w-[150px] h-[52px] lg:h-[48px] flex items-center justify-center px-[18px] py-[16px] bg-gradient-to-b from-[#211E57] to-[#106D6B] text-white rounded-[8px] font-semibold text-[16px] lg:text-[16px] hover:opacity-90 transition-all duration-300 shadow-sm"
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      ) : (
        // Form, Day Selector, and Meal Plan Pages - Normal Layout
        <div className={`${showMealPlan ? 'min-h-screen' : 'h-screen'} w-full flex flex-col lg:flex-row justify-center items-start gap-4 lg:gap-8 py-4 lg:py-8 px-4 lg:px-0`}>

          {/* Left Stepper Sidebar - Only show on desktop and only on form page */}
          {!result && (
            <div className="bg-gradient-to-b from-[#FFFFFF] to-[#E6F0FF] rounded-[1.5rem] lg:rounded-[2.5rem] w-full lg:w-[348px] h-auto lg:h-[746px] flex-col justify-between shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-white/50 relative shrink-0 p-4 lg:p-8 hidden lg:flex">
              <div>
                <div className="mb-4 lg:mb-8 pb-4 lg:pb-8 border-b border-indigo-50/70 flex justify-center">
                  <img src="/assets/logos/logo.png" alt="MilkyMist" className="h-8 lg:h-10 object-contain ml-3" />
                </div>

                <div className="space-y-0 relative px-2">
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

              <div className="mt-4 lg:mt-16 flex items-center justify-between px-2">
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
          <div className={`${result && showMealPlan
              ? 'w-full min-h-screen flex items-start justify-center py-4 lg:py-8'
              : 'bg-gradient-to-b from-[#E8F4F8] to-[#FFFFFF] rounded-[1.5rem] lg:rounded-[2.5rem] shadow-[0_8px_30px_rgb(0,0,0,0.08)] border border-gray-100/50 w-full lg:w-[680px] h-auto lg:h-[746px] flex items-center justify-center p-4 lg:p-12 overflow-hidden'
            }`}>
            {!result ? (
              <div className="w-full max-w-3xl h-full flex flex-col px-2">
                {!isLoading && (
                  <h2 className="text-2xl lg:text-2xl xl:text-[28px] font-bold text-[#0f284e] mb-6 lg:mb-8 text-center lg:text-left shrink-0">
                    Calculate Your Protein Today!
                  </h2>
                )}
                {error && !isLoading && (
                  <div className="mb-4 lg:mb-6 p-4 lg:p-4 bg-red-50 border-l-4 border-red-500 rounded-r-xl shrink-0">
                    <p className="text-red-600 text-[14px] lg:text-[15px]">{error}</p>
                  </div>
                )}

                <div className="flex-1 overflow-y-auto">
                  {isLoading ? (
                    <div className="flex flex-col items-center justify-center h-full min-h-[400px] animate-fade-in fade-in-up">
                      <div className="w-24 h-24 mb-8 relative">
                        <svg className="animate-spin w-full h-full text-[#116d7a] opacity-20" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        </svg>
                        <svg className="animate-spin w-full h-full text-[#116d7a] absolute top-0 left-0" style={{ animationDuration: '2s' }} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                      </div>
                      <h3 className="text-[22px] lg:text-[26px] font-bold text-[#2B4C6F] mb-3 text-center transition-all duration-500" style={{ fontFamily: 'Founders Grotesk, sans-serif' }}>
                        {loadingText}
                      </h3>
                      <p className="text-gray-500 text-center mb-10 max-w-[320px] text-[15px]" style={{ fontFamily: 'Inter, sans-serif' }}>
                        Our AI is crafting a personalized, protein-rich meal plan just for you. This might take a moment.
                      </p>

                      <div className="w-full max-w-[80%] bg-gray-200 rounded-full h-3 overflow-hidden shadow-inner">
                        <div
                          className="bg-gradient-to-r from-[#211E57] to-[#106D6B] h-full rounded-full transition-all duration-300 ease-out relative"
                          style={{ width: `${Math.min(progress, 100)}%` }}
                        >
                          <div className="absolute top-0 left-0 right-0 bottom-0 bg-white/20 animate-pulse rounded-full"></div>
                        </div>
                      </div>
                      <p className="text-[16px] font-bold text-[#2B4C6F] mt-4" style={{ fontFamily: 'Founders Grotesk, sans-serif' }}>
                        {Math.round(Math.min(progress, 100))}%
                      </p>
                    </div>
                  ) : (
                    <ProteinForm onSubmit={handleSubmit} isLoading={false} />
                  )}
                </div>
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
                        <h2 className="text-[24px] lg:text-[28px] text-[#2B4C6F] mb-1" style={{ fontFamily: 'Founders Grotesk, sans-serif', fontWeight: 700 }}>
                          Available plans for {result.userData?.name || 'You'}
                        </h2>
                        <p className="text-[14px] lg:text-[13px] text-gray-500" style={{ fontFamily: 'Inter, sans-serif', fontWeight: 400 }}>
                          Select the plan that best fits you and explore your protein recipes now
                        </p>
                      </div>

                      {/* Day Selector */}
                      <div className="mb-6 lg:mb-8">
                        {/* Mobile: Horizontal scrolling */}
                        <div className="flex lg:hidden overflow-x-auto gap-2 pb-2 scrollbar-hide">
                          <div className="flex gap-2 min-w-max px-4">
                            {result.weeklyPlan.map((dayPlan, index) => (
                              <button
                                key={dayPlan.day}
                                onClick={() => setSelectedDay(dayPlan.day)}
                                className={`w-[110px] h-[40px] rounded-[12px] transition-all duration-300 flex items-center justify-between px-3 bg-white flex-shrink-0 ${selectedDay === dayPlan.day
                                    ? 'border-2 border-[#2B4C6F]'
                                    : 'border border-gray-200 hover:border-[#2B4C6F]'
                                  }`}
                              >
                                <span className="text-[14px] text-[#2B4C6F]" style={{ fontFamily: 'AG Display, sans-serif', fontWeight: 700 }}>
                                  {dayPlan.day.substring(0, 3)}
                                </span>
                                <div className={`w-[16px] h-[16px] rounded-full ${selectedDay === dayPlan.day ? 'bg-gradient-to-r from-[#211E57] to-[#106D6B]' : 'border-2 border-gray-300'
                                  }`}>
                                </div>
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Desktop: Flex wrap */}
                        <div className="hidden lg:flex flex-wrap gap-2 justify-center">
                          {result.weeklyPlan.map((dayPlan, index) => (
                            <button
                              key={dayPlan.day}
                              onClick={() => setSelectedDay(dayPlan.day)}
                              className={`w-[129px] h-[40px] rounded-[12px] transition-all duration-300 flex items-center justify-between px-4 bg-white ${selectedDay === dayPlan.day
                                  ? 'border-2 border-[#2B4C6F]'
                                  : 'border border-gray-200 hover:border-[#2B4C6F]'
                                }`}
                            >
                              <span className="text-[13px] text-[#2B4C6F]" style={{ fontFamily: 'AG Display, sans-serif', fontWeight: 700 }}>
                                {dayPlan.day.substring(0, 3)}
                              </span>
                              <div className={`w-[18px] h-[18px] rounded-full ${selectedDay === dayPlan.day ? 'bg-gradient-to-r from-[#211E57] to-[#106D6B]' : 'border-2 border-gray-300'
                                }`}>
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Day Title and Protein Info */}
                      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-4 lg:mb-6">
                        {/* Mobile: Left aligned title, right aligned protein */}
                        <div className="flex justify-between items-start lg:hidden">
                          <div className="text-left">
                            <h3 className="text-[24px] text-[#2B4C6F] mb-1" style={{ fontFamily: 'Founders Grotesk, sans-serif', fontWeight: 700 }}>
                              {currentDayPlan.day}
                            </h3>
                            <p className="text-[14px] text-gray-500" style={{ fontFamily: 'Inter, sans-serif', fontWeight: 400 }}>
                              Day {currentDayPlan.dayNumber} of your Meal Plan
                            </p>
                          </div>
                          <div className="flex flex-col items-end text-right">
                            <p className="text-[14px] text-gray-500 mb-2" style={{ fontFamily: 'Inter, sans-serif', fontWeight: 400 }}>
                              Total Protein
                            </p>
                            <div className="w-[90px] h-[50px] bg-gradient-to-br from-blue-50 via-purple-50 to-blue-100 rounded-[10px] flex items-center justify-center shadow-sm">
                              <p className="text-[18px] font-bold bg-gradient-to-r from-[#211E57] to-[#106D6B] bg-clip-text text-transparent" style={{ fontFamily: 'Founders Grotesk, sans-serif', fontWeight: 700 }}>
                                {currentDayPlan.totalProtein - 6}-{currentDayPlan.totalProtein + 6}g
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Desktop: Original layout */}
                        <div className="hidden lg:flex lg:items-center lg:justify-between w-full text-center lg:text-left">
                          <div>
                            <h3 className="text-[28px] text-[#2B4C6F] mb-1" style={{ fontFamily: 'Founders Grotesk, sans-serif', fontWeight: 700 }}>
                              {currentDayPlan.day}
                            </h3>
                            <p className="text-[13px] text-gray-500" style={{ fontFamily: 'Inter, sans-serif', fontWeight: 400 }}>
                              Day {currentDayPlan.dayNumber} of your Meal Plan
                            </p>
                          </div>
                          <div className="flex flex-col items-center">
                            <p className="text-[13px] text-gray-500 mb-2" style={{ fontFamily: 'Inter, sans-serif', fontWeight: 400 }}>
                              Total Protein
                            </p>
                            <div className="w-[95px] h-[56px] bg-gradient-to-br from-blue-50 via-purple-50 to-blue-100 rounded-[10px] flex items-center justify-center shadow-sm">
                              <p className="text-[20px] font-bold bg-gradient-to-r from-[#211E57] to-[#106D6B] bg-clip-text text-transparent" style={{ fontFamily: 'Founders Grotesk, sans-serif', fontWeight: 700 }}>
                                {currentDayPlan.totalProtein - 6}-{currentDayPlan.totalProtein + 6}g
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Meal Cards - Always expanded, centered and middle aligned */}
                      <div className="w-full flex justify-center items-center mb-6 lg:mb-8">
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-6 w-full max-w-[350px] lg:max-w-none">
                          {currentDayPlan.meals.map((meal, index) => (
                            <div
                              key={index}
                              className="bg-white rounded-[12px] overflow-hidden w-full lg:w-[320px] h-[450px] lg:h-[450px] border border-gray-200 mx-auto flex flex-col"
                            >
                              {/* Fixed Header Section */}
                              <div className="p-4 lg:p-4 flex-shrink-0">
                                <div className="flex items-center justify-between mb-1">
                                  <h4 className="text-[16px] lg:text-[16px] font-bold text-[#2B4C6F]" style={{ fontFamily: 'Founders Grotesk, sans-serif' }}>
                                    {meal.type}
                                  </h4>
                                </div>

                                {/* Recipe Name - Always show */}
                                <p className="text-gray-700 mb-2 text-[14px] lg:text-[13px] font-semibold" style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600, lineHeight: '1.4' }}>
                                  {meal.recipeName}
                                </p>

                                {/* Product Images - Show all Milky Mist products */}
                                <div className="flex justify-center items-center gap-2 mb-2 flex-wrap">
                                  {extractMilkyMistProducts(meal.ingredients, meal.milkyMistProduct).map((product, idx) => (
                                    <img
                                      key={idx}
                                      src={getProductImage(product)}
                                      alt={product}
                                      className="object-contain h-[100px] lg:h-[85px] min-w-[80px] lg:min-w-[70px] max-w-[120px] lg:max-w-[105px]"
                                      style={{ objectFit: 'contain', objectPosition: 'center' }}
                                    />
                                  ))}
                                </div>

                                {/* Tags */}
                                <div className="flex flex-wrap gap-2 lg:gap-2 mb-3 justify-center">
                                  {meal.dietary && meal.dietary.slice(0, 1).map((tag, tagIndex) => {
                                    const isNonVeg = tag === 'non-vegetarian';
                                    const tagText = tag === 'non-vegetarian' ? 'Non-Veg' : tag === 'vegetarian' ? 'Veg' : tag === 'gluten-free' ? 'Gluten Free' : tag;
                                    return (
                                      <span
                                        key={tagIndex}
                                        className={`px-3 lg:px-3 h-[26px] lg:h-[24px] bg-transparent border border-green-600 text-[#2B4C6F] text-[12px] lg:text-[13px] rounded-[6px] flex items-center justify-center whitespace-nowrap min-w-fit`}
                                        style={{ fontFamily: 'system-ui, sans-serif', fontWeight: 700 }}
                                      >
                                        {tagText}
                                      </span>
                                    );
                                  })}
                                  <span
                                    className="px-3 lg:px-3 h-[26px] lg:h-[24px] bg-transparent border border-green-600 text-[#2B4C6F] text-[12px] lg:text-[13px] rounded-[6px] flex items-center justify-center whitespace-nowrap min-w-fit"
                                    style={{ fontFamily: 'system-ui, sans-serif', fontWeight: 700 }}
                                  >
                                    {meal.nutrition.protein - 2}-{meal.nutrition.protein + 2}g Protein
                                  </span>
                                  <span
                                    className="px-3 lg:px-3 h-[26px] lg:h-[24px] bg-transparent border border-blue-600 text-[#2B4C6F] text-[12px] lg:text-[13px] rounded-[6px] flex items-center justify-center whitespace-nowrap min-w-fit"
                                    style={{ fontFamily: 'system-ui, sans-serif', fontWeight: 700 }}
                                  >
                                    {meal.nutrition.calories} Cal
                                  </span>
                                </div>
                              </div>

                              {/* Scrollable Content Section */}
                              <div className="flex-1 overflow-y-auto px-4 lg:px-4 pb-4 lg:pb-4 custom-scrollbar relative">
                                {/* Ingredients - Always show */}
                                <div className="mb-4">
                                  <h5 className="text-[16px] lg:text-[16px] font-bold text-[#2B4C6F] mb-2 py-1" style={{ fontFamily: 'Founders Grotesk, sans-serif' }}>
                                    Ingredients
                                  </h5>
                                  <ul className="space-y-2">
                                    {meal.ingredients && meal.ingredients.map((ingredient, idx) => (
                                      <li key={idx} className="text-[14px] lg:text-[14px] text-gray-600 flex items-start" style={{ fontFamily: 'Inter, sans-serif' }}>
                                        <span className="mr-2 flex-shrink-0">•</span>
                                        <span className="break-words leading-relaxed">{ingredient}</span>
                                      </li>
                                    ))}
                                  </ul>
                                </div>

                                {/* How to Prepare - Always show */}
                                <div className="mb-1">
                                  <h5 className="text-[16px] lg:text-[16px] font-bold text-[#2B4C6F] mb-2" style={{ fontFamily: 'Founders Grotesk, sans-serif' }}>
                                    How to Prepare
                                  </h5>
                                  <ol className="space-y-2">
                                    {meal.steps && meal.steps.map((step, idx) => (
                                      <li key={idx} className="text-[14px] lg:text-[14px] text-gray-600 flex items-start" style={{ fontFamily: 'Inter, sans-serif' }}>
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
                          className="w-full max-w-[320px] lg:w-[320px] h-[52px] lg:h-[48px] flex items-center justify-center px-[18px] py-[16px] bg-gradient-to-r from-[#17435B] to-[#116d7a] text-white rounded-[8px] font-semibold text-[16px] lg:text-[14px] hover:opacity-90 transition-all duration-300 shadow-sm"
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
                          className="w-full max-w-[320px] lg:w-[320px] h-[52px] lg:h-[48px] flex items-center justify-center px-[18px] py-[16px] bg-gradient-to-r from-[#211E57] to-[#106D6B] text-white rounded-[8px] font-semibold text-[16px] lg:text-[14px] hover:opacity-90 transition-all duration-300 shadow-sm"
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
        
        /* Hide scrollbar for day selector on mobile */
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
}