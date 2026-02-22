'use client';

import { useState, useEffect, lazy, Suspense } from 'react';
import ProteinForm from './ProteinForm';
import { calculateProtein } from '../../utils/protein';

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
        'moderate',
        formData.age
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
        setShowDaySelector(false); // Reset day selector
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

  return (
    <div
      className="min-h-screen bg-[#F8FAFF] font-sans tracking-tight overflow-y-auto"
      style={{ backgroundImage: "url('/assets/images/BG.png')", backgroundSize: 'cover', backgroundPosition: 'center', backgroundAttachment: 'fixed' }}
    >
      {/* Summary Page - Full Screen Centered */}
      {result && !showMealPlan && !showDaySelector ? (
        <div className="h-full w-full flex items-center justify-center">
          <div className="w-[1056px] h-[540px] bg-white rounded-[16px] shadow-[0_4px_20px_rgba(0,0,0,0.08)] border border-gray-100 flex flex-col items-center pt-[48px] px-12">
            {/* Progress Steps */}
            <div className="flex items-center justify-center mb-8">
              <div className="flex items-center space-x-3">
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-[#2B4C6F] text-white rounded-[6px] flex items-center justify-center text-sm font-semibold">
                    1
                  </div>
                  <span className="ml-2 text-base text-[#2B4C6F] font-medium">Personal Info</span>
                </div>
                <div className="w-10 h-[2px] bg-[#2B4C6F]"></div>
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-[#2B4C6F] text-white rounded-[6px] flex items-center justify-center text-sm font-semibold">
                    2
                  </div>
                  <span className="ml-2 text-base font-semibold text-[#2B4C6F]">Plan for You</span>
                </div>
                <div className="w-10 h-[2px] bg-gray-300"></div>
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-gray-300 text-gray-500 rounded-[6px] flex items-center justify-center text-sm font-semibold">
                    3
                  </div>
                  <span className="ml-2 text-base text-gray-400">Meal Plan</span>
                </div>
              </div>
            </div>

            {/* Title Section with Step indicator */}
            <div className="w-[960px] flex items-start justify-between mb-6 mt-8">
              <div className="flex flex-col">
                <h1 className="text-[30px] text-[#2B4C6F] leading-[1.2] mb-1" style={{ fontFamily: 'Founders Grotesk, sans-serif', fontWeight: 600 }}>
                  Your Personalised Meal Plan
                </h1>
                <p className="text-[14px] text-gray-500 leading-[1.4]" style={{ fontFamily: 'Inter, sans-serif', fontWeight: 400 }}>
                  Crafted with Premium Milky Mist Dairy Products
                </p>
              </div>
              <p className="text-[12px] text-gray-400 leading-[1.4]" style={{ fontFamily: 'Inter, sans-serif', fontWeight: 400 }}>Step 2/3</p>
            </div>

            {/* Protein Summary Cards */}
            <div className="w-[960px] flex justify-center gap-6 mb-10 px-8">
              <div className="w-[180px] h-[162px] flex flex-col items-center justify-center p-5 bg-white border border-[#E5E7EB] rounded-[12px]">
                <div className="text-[12px] text-gray-500 tracking-wider uppercase mb-3" style={{ fontFamily: 'Founders Grotesk, sans-serif', fontWeight: 600 }}>DAILY TARGET</div>
                <div className="w-[62px] h-[56px] flex items-center justify-center bg-gradient-to-b from-[#F3F4F6] to-[#E0E7FF] rounded-[10px] mb-3">
                  <span className="text-[20px] leading-[1.2] bg-gradient-to-r from-[#211E57] to-[#106D6B] bg-clip-text text-transparent" style={{ fontFamily: 'Founders Grotesk, sans-serif', fontWeight: 600 }}>
                    {result.proteinRequired}g
                  </span>
                </div>
                <div className="text-[12px] text-gray-400" style={{ fontFamily: 'Inter, sans-serif', fontWeight: 400 }}>Your goal</div>
              </div>
              
              <div className="w-[180px] h-[162px] flex flex-col items-center justify-center p-5 bg-white border border-[#E5E7EB] rounded-[12px]">
                <div className="text-[12px] text-gray-500 tracking-wider uppercase mb-3" style={{ fontFamily: 'Founders Grotesk, sans-serif', fontWeight: 600 }}>AVERAGE PER DAY</div>
                <div className="w-[62px] h-[56px] flex items-center justify-center bg-gradient-to-b from-[#F3F4F6] to-[#E0E7FF] rounded-[10px] mb-3">
                  <span className="text-[20px] leading-[1.2] bg-gradient-to-r from-[#211E57] to-[#106D6B] bg-clip-text text-transparent" style={{ fontFamily: 'Founders Grotesk, sans-serif', fontWeight: 600 }}>
                    {result.averageDailyProtein}g
                  </span>
                </div>
                <div className="text-[12px] text-gray-400" style={{ fontFamily: 'Inter, sans-serif', fontWeight: 400 }}>Exceeds by {result.averageDailyProtein - result.proteinRequired}g</div>
              </div>
              
              <div className="w-[180px] h-[162px] flex flex-col items-center justify-center p-5 bg-white border border-[#E5E7EB] rounded-[12px]">
                <div className="text-[12px] text-gray-500 tracking-wider uppercase mb-3" style={{ fontFamily: 'Founders Grotesk, sans-serif', fontWeight: 600 }}>WEEKLY TOTAL</div>
                <div className="w-[62px] h-[56px] flex items-center justify-center bg-gradient-to-b from-[#F3F4F6] to-[#E0E7FF] rounded-[10px] mb-3">
                  <span className="text-[20px] leading-[1.2] bg-gradient-to-r from-[#211E57] to-[#106D6B] bg-clip-text text-transparent" style={{ fontFamily: 'Founders Grotesk, sans-serif', fontWeight: 600 }}>
                    {result.weeklyTotalProtein}g
                  </span>
                </div>
                <div className="text-[12px] text-gray-400" style={{ fontFamily: 'Inter, sans-serif', fontWeight: 400 }}>If you follow plan</div>
              </div>
              
              <div className="w-[180px] h-[162px] flex flex-col items-center justify-center p-5 bg-white border border-[#E5E7EB] rounded-[12px]">
                <div className="text-[12px] text-gray-500 tracking-wider uppercase mb-3" style={{ fontFamily: 'Founders Grotesk, sans-serif', fontWeight: 600 }}>PLAN QUALITY</div>
                <div className="w-[62px] h-[56px] flex items-center justify-center bg-gradient-to-b from-[#F3F4F6] to-[#E0E7FF] rounded-[10px] mb-3">
                  <img src="/assets/logos/tick/Form/V2/Vector.png" alt="✓" className="w-6 h-6" />
                </div>
                <div className="text-[12px] text-gray-400" style={{ fontFamily: 'Inter, sans-serif', fontWeight: 400 }}>Optimal</div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="w-[960px] flex justify-between mt-auto mb-8">
              <button
                onClick={() => {
                  setResult(null);
                  setError(null);
                  setShowMealPlan(false);
                  setShowDaySelector(false);
                }}
                className="w-[150px] h-[48px] flex items-center justify-center px-[18px] py-[16px] border border-[#D1D5DB] text-[#2B4C6F] rounded-[8px] font-semibold text-[16px] hover:bg-gray-50 transition-all duration-300 bg-white"
              >
                Back
              </button>
              <button
                onClick={() => setShowDaySelector(true)}
                className="w-[150px] h-[48px] flex items-center justify-center px-[18px] py-[16px] bg-gradient-to-b from-[#211E57] to-[#106D6B] text-white rounded-[8px] font-semibold text-[16px] hover:opacity-90 transition-all duration-300 shadow-sm"
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      ) : (
        // Form, Day Selector, and Meal Plan Pages - Normal Layout
        <div className="min-h-screen w-full flex justify-center items-start gap-8 py-8">

          {/* Left Stepper Sidebar - Only show on form page, not on day selector or meal plan */}
          {!result && (
          <div className="bg-gradient-to-b from-[#FFFFFF] to-[#E6F0FF] rounded-[2.5rem] w-[348px] h-[746px] flex flex-col justify-between shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-white/50 relative shrink-0 p-8">
            <div>
              <div className="mb-8 pb-8 border-b border-indigo-50/70 flex justify-center">
                <img src="/assets/logos/logo.png" alt="MilkyMist" className="h-10 object-contain ml-3" />
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
                  title="Select Your Plan"
                  desc="Choose the plan that fits your needs."
                  active={!!result && showMealPlan}
                  isCompleted={false}
                />
                <Step
                  number={4}
                  title="Explore Curated Recipes"
                  desc="Have the best days with our Milkymist products."
                  active={false}
                  isLast={true}
                />
              </div>
            </div>

            <div className="mt-16 flex items-center justify-between px-2">
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
          result && (showDaySelector || showMealPlan)
            ? 'w-full min-h-screen flex items-start justify-center py-8'
            : 'bg-white rounded-[2.5rem] shadow-[0_8px_30px_rgb(0,0,0,0.08)] border border-gray-100/50 w-[680px] h-[746px] flex items-center justify-center p-12'
        }`}>
          {!result ? (
            <div className="w-full max-w-3xl">
              <h2 className="text-2xl lg:text-[28px] font-bold text-[#0f284e] mb-8">
                Calculate Your Protein Today!
              </h2>
              {error && (
                <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-r-xl">
                  <p className="text-red-600 text-[15px]">{error}</p>
                </div>
              )}
              <ProteinForm onSubmit={handleSubmit} isLoading={isLoading} />
            </div>
          ) : showDaySelector && !showMealPlan ? (
            // Day Selector Page - Centered without sidebar
            <div className="flex flex-col items-center gap-6 py-8">
              {/* Progress Indicator Box */}
              <div className="bg-white rounded-[16px] shadow-[0_4px_20px_rgba(0,0,0,0.08)] border border-gray-100 w-[1122px] h-[79px] flex items-center justify-center px-12" style={{ backgroundColor: 'rgb(243, 244, 255)' }}>
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center">
                    <div className="w-[31px] h-[31px] bg-white rounded-[6px] flex items-center justify-center shrink-0">
                      <img src="/assets/logos/filled tick/Form/Filled/Check circle.png" alt="✓" className="w-[16px] h-[16px]" />
                    </div>
                    <span className="ml-2 text-base text-[#2B4C6F] font-medium">Personal Info</span>
                  </div>
                  <div className="flex-1 h-[4px] bg-[#2B4C6F] mx-4"></div>
                  <div className="flex items-center">
                    <div className="w-[31px] h-[31px] shrink-0 bg-gradient-to-b from-[#211E57] to-[#106D6B] text-white rounded-[6px] flex items-center justify-center text-sm font-semibold">
                      2
                    </div>
                    <span className="ml-2 text-base font-semibold text-[#2B4C6F]">Plan type</span>
                  </div>
                  <div className="flex-1 h-[4px] bg-gray-300 mx-4"></div>
                  <div className="flex items-center">
                    <div className="w-[31px] h-[31px] shrink-0 bg-gray-300 text-gray-500 rounded-[6px] flex items-center justify-center text-sm font-semibold">
                      3
                    </div>
                    <span className="ml-2 text-base text-gray-400">Meal Plan</span>
                  </div>
                </div>
              </div>

              {/* Available Plans Box */}
              <div className="bg-white rounded-[16px] shadow-[0_4px_20px_rgba(0,0,0,0.08)] border border-gray-100 w-[1122px] h-[360px] flex flex-col p-8">
                {/* Header */}
                <div className="mb-10">
                  <h2 className="text-[28px] text-[#2B4C6F] mb-1" style={{ fontFamily: 'Founders Grotesk, sans-serif', fontWeight: 700 }}>
                    Available plans
                  </h2>
                  <p className="text-[13px] text-gray-500" style={{ fontFamily: 'Inter, sans-serif', fontWeight: 400 }}>
                    Select the plan that best fits your needs and budget.
                  </p>
                </div>

                {/* Day Selector */}
                <div className="flex gap-2 mb-6 justify-center">
                  {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day) => (
                    <button
                      key={day}
                      onClick={() => setSelectedDay(day)}
                      className={`w-[129px] h-[40px] rounded-[12px] transition-all duration-300 flex items-center justify-between px-4 bg-white ${
                        selectedDay === day
                          ? 'border-2 border-[#2B4C6F]'
                          : 'border border-gray-200 hover:border-[#2B4C6F]'
                      }`}
                    >
                      <span className="text-[13px] text-[#2B4C6F]" style={{ fontFamily: 'AG Display, sans-serif', fontWeight: 700 }}>
                        {day}
                      </span>
                      <div className={`w-[18px] h-[18px] rounded-full ${
                        selectedDay === day ? 'bg-[#2B4C6F]' : 'border-2 border-gray-300'
                      }`}>
                      </div>
                    </button>
                  ))}
                </div>

                {/* Meal Plan Content Placeholder */}
                <div className="flex-1"></div>

                {/* Bottom Navigation */}
                <div className="flex items-center justify-between mt-6">
                  <p className="text-[13px] text-gray-500" style={{ fontFamily: 'Inter, sans-serif', fontWeight: 400 }}>
                    Step 3 of 3
                  </p>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setShowDaySelector(false)}
                      className="w-[160px] h-[48px] flex items-center justify-center border border-[#D1D5DB] text-[#2B4C6F] rounded-[8px] font-semibold text-[14px] hover:bg-gray-50 transition-all duration-300 bg-white"
                    >
                      Back
                    </button>
                    <button
                      onClick={() => setShowMealPlan(true)}
                      className="w-[160px] h-[48px] flex items-center justify-center bg-gradient-to-b from-[#211E57] to-[#106D6B] text-white rounded-[8px] font-semibold text-[14px] hover:opacity-90 transition-all duration-300 shadow-sm"
                    >
                      Next
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : showMealPlan ? (
            // Check if a meal is selected for detail view
            // Check if a meal is selected for detail view
            selectedMeal ? (
              // Recipe Detail View - Cards expand in place
              (() => {
                // Find the selected day's data from weeklyPlan
                const dayIndex = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].indexOf(selectedDay);
                const currentDayPlan = result.weeklyPlan[dayIndex] || result.weeklyPlan[0];
                
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
                  }
                  
                  // Default fallback - generic Milky Mist search
                  return 'https://www.zepto.com/search?query=milky+mist';
                };

                return (
              <div className="w-full min-h-screen flex items-start justify-center py-8">
                <div className="w-[1122px] bg-white rounded-[16px] shadow-[0_4px_20px_rgba(0,0,0,0.08)] border border-gray-100 p-8">
                  {/* Top Header - Available plans */}
                  <div className="mb-8">
                    <h2 className="text-[28px] text-[#2B4C6F] mb-1" style={{ fontFamily: 'Founders Grotesk, sans-serif', fontWeight: 700 }}>
                      Available plans
                    </h2>
                    <p className="text-[13px] text-gray-500" style={{ fontFamily: 'Inter, sans-serif', fontWeight: 400 }}>
                      Select the plan that best fits you and explore your protein recipes now
                    </p>
                  </div>

                  {/* Day Selector */}
                  <div className="flex gap-2 mb-8 justify-center">
                    {result.weeklyPlan.map((dayPlan, index) => (
                      <button
                        key={dayPlan.day}
                        onClick={() => setSelectedDay(dayPlan.day)}
                        className={`w-[129px] h-[40px] rounded-[12px] transition-all duration-300 flex items-center justify-between px-4 bg-white ${
                          selectedDay === dayPlan.day
                            ? 'border-2 border-[#2B4C6F]'
                            : 'border border-gray-200 hover:border-[#2B4C6F]'
                        }`}
                      >
                        <span className="text-[13px] text-[#2B4C6F]" style={{ fontFamily: 'AG Display, sans-serif', fontWeight: 700 }}>
                          {dayPlan.day}
                        </span>
                        <div className={`w-[18px] h-[18px] rounded-full ${
                          selectedDay === dayPlan.day ? 'bg-[#2B4C6F]' : 'border-2 border-gray-300'
                        }`}>
                        </div>
                      </button>
                    ))}
                  </div>

                  {/* Day Title and Protein Info */}
                  <div className="flex items-center justify-between mb-6">
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
                      <div className="w-[62px] h-[56px] bg-gradient-to-br from-blue-50 via-purple-50 to-blue-100 rounded-[10px] flex items-center justify-center shadow-sm">
                        <p className="text-[20px] font-bold text-[#2B4C6F]" style={{ fontFamily: 'Founders Grotesk, sans-serif', fontWeight: 700 }}>
                          {currentDayPlan.totalProtein}g
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Meal Cards - Expandable in place */}
                  <div className="grid grid-cols-3 gap-6 mb-8">
                    {currentDayPlan.meals.map((meal, index) => {
                      const isSelected = selectedMeal && selectedMeal.type === meal.type;
                      
                      return (
                        <div 
                          key={index}
                          className={`bg-white rounded-[12px] overflow-hidden transition-all duration-300 ${
                            isSelected 
                              ? 'w-[320px] h-[450px] border-2 border-[#2B4C6F]' 
                              : 'w-[320px] h-[254px] border border-gray-200'
                          }`}
                        >
                          <div className="p-4 h-full flex flex-col">
                            <div className="flex items-center justify-between mb-1">
                              <h4 className="text-[16px] font-bold text-[#2B4C6F]" style={{ fontFamily: 'Founders Grotesk, sans-serif' }}>
                                {meal.type}
                              </h4>
                              {isSelected && (
                                <button
                                  onClick={() => setSelectedMeal(null)}
                                  className="w-6 h-6 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                  </svg>
                                </button>
                              )}
                            </div>
                            
                            {/* Recipe Name - Always show */}
                            <p className={`text-gray-700 mb-2 ${isSelected ? 'text-[13px] font-semibold' : 'text-[11px]'}`} style={{ fontFamily: 'Inter, sans-serif', fontWeight: isSelected ? 600 : 400, lineHeight: isSelected ? '1.4' : '1.3' }}>
                              {meal.recipeName}
                            </p>
                            
                            {/* Product Image - Always show */}
                            <div className="flex justify-center mb-2">
                              <img 
                                src={getProductImage(meal.milkyMistProduct)} 
                                alt={meal.milkyMistProduct}
                                className={`object-contain ${isSelected ? 'h-[70px]' : 'max-h-[75px] max-w-[95px]'}`}
                              />
                            </div>

                            {/* Tags */}
                            <div className="flex flex-wrap gap-2 mb-2 justify-center">
                              {meal.dietary && meal.dietary.slice(0, 1).map((tag, tagIndex) => {
                                const isNonVeg = tag === 'non-vegetarian';
                                const tagText = tag === 'non-vegetarian' ? 'Non-Veg' : tag === 'vegetarian' ? 'Veg' : tag === 'gluten-free' ? 'Gluten Free' : tag;
                                return (
                                  <span 
                                    key={tagIndex}
                                    className={`${isNonVeg ? 'w-[65px]' : 'w-[47px]'} h-[22px] bg-transparent border border-green-600 text-[#2B4C6F] text-[13px] rounded-[6px] flex items-center justify-center`}
                                    style={{ fontFamily: 'system-ui, sans-serif', fontWeight: 700 }}
                                  >
                                    {tagText}
                                  </span>
                                );
                              })}
                              <span 
                                className="w-[97px] h-[22px] bg-transparent border border-green-600 text-[#2B4C6F] text-[13px] rounded-[6px] flex items-center justify-center" 
                                style={{ fontFamily: 'system-ui, sans-serif', fontWeight: 700 }}
                              >
                                {meal.nutrition.protein}g of Protein
                              </span>
                            </div>

                            {/* Expanded Content - Only show when selected */}
                            {isSelected && (
                              <>
                                {/* Featured Product */}
                                <div className="mb-2">
                                  <div className="flex items-center justify-between mb-1">
                                    <p className="text-[9px] text-gray-500" style={{ fontFamily: 'Inter, sans-serif', fontWeight: 500 }}>
                                      Featured Product
                                    </p>
                                    {/* Zepto Icon Link */}
                                    <a 
                                      href={getZeptoLink(meal.milkyMistProduct)}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="w-5 h-5 bg-purple-600 hover:bg-purple-700 rounded-full flex items-center justify-center transition-colors duration-200 z-10"
                                      title="Order on Zepto"
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      <svg className="w-3 h-3 text-white" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M7 18c-1.1 0-1.99.9-1.99 2S5.9 22 7 22s2-.9 2-2-.9-2-2-2zM1 2v2h2l3.6 7.59-1.35 2.45c-.16.28-.25.61-.25.96 0 1.1.9 2 2 2h12v-2H7.42c-.14 0-.25-.11-.25-.25l.03-.12.9-1.63h7.45c.75 0 1.41-.41 1.75-1.03l3.58-6.49c.08-.14.12-.31.12-.48 0-.55-.45-1-1-1H5.21l-.94-2H1zm16 16c-1.1 0-1.99.9-1.99 2s.89 2 1.99 2 2-.9 2-2-.9-2-2-2z"/>
                                      </svg>
                                    </a>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      setSelectedMeal(isSelected ? null : meal);
                                    }}
                                    className="w-full h-[40px] bg-gradient-to-r from-[#211E57] to-[#106D6B] text-white text-[12px] font-semibold rounded-[8px] leading-tight flex items-center justify-center hover:opacity-90 hover:scale-[1.02] transition-all cursor-pointer active:scale-[0.98]"
                                    style={{ fontFamily: 'Inter, sans-serif', pointerEvents: 'auto' }}
                                  >
                                    {meal.milkyMistProduct}
                                  </button>
                                </div>

                                {/* Ingredients */}
                                <div className="mb-2">
                                  <h5 className="text-[11px] font-bold text-[#2B4C6F] mb-1" style={{ fontFamily: 'Founders Grotesk, sans-serif' }}>
                                    Ingredients
                                  </h5>
                                  <ul className="space-y-0">
                                    {meal.ingredients && meal.ingredients.slice(0, 4).map((ingredient, idx) => (
                                      <li key={idx} className="text-[9px] text-gray-600 flex items-start" style={{ fontFamily: 'Inter, sans-serif' }}>
                                        <span className="mr-1 flex-shrink-0">•</span>
                                        <span className="line-clamp-1">{ingredient}</span>
                                      </li>
                                    ))}
                                  </ul>
                                </div>

                                {/* How to Use */}
                                <div className="mb-1">
                                  <h5 className="text-[11px] font-bold text-[#2B4C6F] mb-1" style={{ fontFamily: 'Founders Grotesk, sans-serif' }}>
                                    How to Use
                                  </h5>
                                  <ol className="space-y-0">
                                    {meal.steps && meal.steps.slice(0, 3).map((step, idx) => (
                                      <li key={idx} className="text-[9px] text-gray-600 flex items-start" style={{ fontFamily: 'Inter, sans-serif' }}>
                                        <span className="mr-1 flex-shrink-0">{idx + 1}.</span>
                                        <span className="line-clamp-1">{step}</span>
                                      </li>
                                    ))}
                                  </ol>
                                </div>
                              </>
                            )}

                            {/* Featured Product - Only show when NOT expanded */}
                            {!isSelected && (
                              <div className="mt-auto">
                                <div className="flex items-center justify-between mb-1">
                                  <p className="text-[10px] text-gray-500" style={{ fontFamily: 'Inter, sans-serif', fontWeight: 500 }}>
                                    Featured Product
                                  </p>
                                  {/* Zepto Icon Link */}
                                  <a 
                                    href={getZeptoLink(meal.milkyMistProduct)}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="w-6 h-6 bg-purple-600 hover:bg-purple-700 rounded-full flex items-center justify-center transition-colors duration-200 z-10"
                                    title="Order on Zepto"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <svg className="w-3.5 h-3.5 text-white" viewBox="0 0 24 24" fill="currentColor">
                                      <path d="M7 18c-1.1 0-1.99.9-1.99 2S5.9 22 7 22s2-.9 2-2-.9-2-2-2zM1 2v2h2l3.6 7.59-1.35 2.45c-.16.28-.25.61-.25.96 0 1.1.9 2 2 2h12v-2H7.42c-.14 0-.25-.11-.25-.25l.03-.12.9-1.63h7.45c.75 0 1.41-.41 1.75-1.03l3.58-6.49c.08-.14.12-.31.12-.48 0-.55-.45-1-1-1H5.21l-.94-2H1zm16 16c-1.1 0-1.99.9-1.99 2s.89 2 1.99 2 2-.9 2-2-.9-2-2-2z"/>
                                    </svg>
                                  </a>
                                </div>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    setSelectedMeal(isSelected ? null : meal);
                                  }}
                                  className="w-[278px] h-[47px] bg-gradient-to-r from-[#211E57] to-[#106D6B] text-white text-[14px] font-semibold rounded-[8px] leading-tight flex items-center justify-center hover:opacity-90 hover:scale-[1.02] transition-all cursor-pointer active:scale-[0.98]"
                                  style={{ fontFamily: 'Inter, sans-serif', pointerEvents: 'auto' }}
                                >
                                  {meal.milkyMistProduct}
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Bottom Button - Only show when a meal is expanded */}
                  {selectedMeal && (
                    <div className="flex justify-center">
                      <button
                        onClick={() => {
                          setResult(null);
                          setError(null);
                          setShowMealPlan(false);
                          setShowDaySelector(false);
                          setSelectedMeal(null);
                        }}
                        className="w-[320px] h-[48px] bg-gradient-to-r from-[#211E57] to-[#106D6B] text-white text-[14px] font-semibold rounded-[8px] hover:opacity-90 transition-all"
                      >
                        Calculate for Another Person
                      </button>
                    </div>
                  )}
                </div>
              </div>
              );
            })()
            ) : (
            // Actual Meal Plan Display - Single Day View
            (() => {
              // Find the selected day's data from weeklyPlan
              const dayIndex = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].indexOf(selectedDay);
              const currentDayPlan = result.weeklyPlan[dayIndex] || result.weeklyPlan[0];
              
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
                }
                
                // Default fallback - generic Milky Mist search
                return 'https://www.zepto.com/search?query=milky+mist';
              };
              
              return (
                <div className="w-full min-h-screen flex items-start justify-center py-8">
                  <div className="w-[1122px] bg-white rounded-[16px] shadow-[0_4px_20px_rgba(0,0,0,0.08)] border border-gray-100 p-8">
                    {/* Top Header - Available plans */}
                    <div className="mb-8">
                      <h2 className="text-[28px] text-[#2B4C6F] mb-1" style={{ fontFamily: 'Founders Grotesk, sans-serif', fontWeight: 700 }}>
                        Available plans
                      </h2>
                      <p className="text-[13px] text-gray-500" style={{ fontFamily: 'Inter, sans-serif', fontWeight: 400 }}>
                        Select the plan that best fits you and explore your protein recipes now
                      </p>
                    </div>

                    {/* Day Selector */}
                    <div className="flex gap-2 mb-8 justify-center">
                      {result.weeklyPlan.map((dayPlan, index) => (
                        <button
                          key={dayPlan.day}
                          onClick={() => setSelectedDay(dayPlan.day)}
                          className={`w-[129px] h-[40px] rounded-[12px] transition-all duration-300 flex items-center justify-between px-4 bg-white ${
                            selectedDay === dayPlan.day
                              ? 'border-2 border-[#2B4C6F]'
                              : 'border border-gray-200 hover:border-[#2B4C6F]'
                          }`}
                        >
                          <span className="text-[13px] text-[#2B4C6F]" style={{ fontFamily: 'AG Display, sans-serif', fontWeight: 700 }}>
                            {dayPlan.day}
                          </span>
                          <div className={`w-[18px] h-[18px] rounded-full ${
                            selectedDay === dayPlan.day ? 'bg-[#2B4C6F]' : 'border-2 border-gray-300'
                          }`}>
                          </div>
                        </button>
                      ))}
                    </div>

                    {/* Day Title and Protein Info */}
                    <div className="flex items-center justify-between mb-6">
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
                        <div className="w-[62px] h-[56px] bg-gradient-to-br from-blue-50 via-purple-50 to-blue-100 rounded-[10px] flex items-center justify-center shadow-sm">
                          <p className="text-[20px] font-bold text-[#2B4C6F]" style={{ fontFamily: 'Founders Grotesk, sans-serif', fontWeight: 700 }}>
                            {currentDayPlan.totalProtein}g
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Meal Cards */}
                    <div className="grid grid-cols-3 gap-6 mb-8">
                      {currentDayPlan.meals.map((meal, index) => (
                        <div 
                          key={index}
                          className={`bg-white rounded-[12px] overflow-hidden w-[320px] h-[254px] ${
                            index === 1 ? 'border-2 border-[#2B4C6F]' : 'border border-gray-200'
                          }`}
                        >
                          <div className="p-4 h-full flex flex-col">
                            <h4 className="text-[16px] font-bold text-[#2B4C6F] mb-2" style={{ fontFamily: 'Founders Grotesk, sans-serif' }}>
                              {meal.type}
                            </h4>
                            <p className="text-[13px] text-gray-700 mb-3 line-clamp-1" style={{ fontFamily: 'Inter, sans-serif', fontWeight: 400 }}>
                              {meal.recipeName}
                            </p>
                            
                            {/* Tags and Product Image in same row */}
                            <div className="flex items-start justify-between mb-2">
                              {/* Tags */}
                              <div className="flex flex-wrap gap-2">
                                {meal.dietary && meal.dietary.slice(0, 1).map((tag, tagIndex) => {
                                  const isNonVeg = tag === 'non-vegetarian';
                                  const tagText = tag === 'non-vegetarian' ? 'Non-Veg' : tag === 'vegetarian' ? 'Veg' : tag === 'gluten-free' ? 'Gluten Free' : tag;
                                  return (
                                    <span 
                                      key={tagIndex}
                                      className={`${isNonVeg ? 'w-[65px]' : 'w-[47px]'} h-[22px] bg-transparent border border-green-600 text-[#2B4C6F] text-[13px] rounded-[6px] flex items-center justify-center`}
                                      style={{ fontFamily: 'system-ui, sans-serif', fontWeight: 700 }}
                                    >
                                      {tagText}
                                    </span>
                                  );
                                })}
                                <span 
                                  className="w-[97px] h-[22px] bg-transparent border border-green-600 text-[#2B4C6F] text-[13px] rounded-[6px] flex items-center justify-center" 
                                  style={{ fontFamily: 'system-ui, sans-serif', fontWeight: 700 }}
                                >
                                  {meal.nutrition.protein}g of Protein
                                </span>
                              </div>

                              {/* Product Image */}
                              <div className="flex items-center justify-end">
                                <img 
                                  src={getProductImage(meal.milkyMistProduct)} 
                                  alt={meal.milkyMistProduct}
                                  className="max-h-[90px] max-w-[110px] object-contain"
                                />
                              </div>
                            </div>

                            {/* Featured Product */}
                            <div className="mt-auto">
                              <div className="flex items-center justify-between mb-1">
                                <p className="text-[10px] text-gray-500" style={{ fontFamily: 'Inter, sans-serif', fontWeight: 500 }}>
                                  Featured Product
                                </p>
                                {/* Zepto Icon Link */}
                                <a 
                                  href={getZeptoLink(meal.milkyMistProduct)}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="w-6 h-6 bg-purple-600 hover:bg-purple-700 rounded-full flex items-center justify-center transition-colors duration-200 z-10"
                                  title="Order on Zepto"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <svg className="w-3.5 h-3.5 text-white" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M7 18c-1.1 0-1.99.9-1.99 2S5.9 22 7 22s2-.9 2-2-.9-2-2-2zM1 2v2h2l3.6 7.59-1.35 2.45c-.16.28-.25.61-.25.96 0 1.1.9 2 2 2h12v-2H7.42c-.14 0-.25-.11-.25-.25l.03-.12.9-1.63h7.45c.75 0 1.41-.41 1.75-1.03l3.58-6.49c.08-.14.12-.31.12-.48 0-.55-.45-1-1-1H5.21l-.94-2H1zm16 16c-1.1 0-1.99.9-1.99 2s.89 2 1.99 2 2-.9 2-2-.9-2-2-2z"/>
                                  </svg>
                                </a>
                              </div>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  console.log('Button clicked, meal:', meal);
                                  setSelectedMeal(meal);
                                }}
                                className="w-[278px] h-[47px] bg-gradient-to-r from-[#211E57] to-[#106D6B] text-white text-[14px] font-semibold rounded-[8px] leading-tight flex items-center justify-center hover:opacity-90 hover:scale-[1.02] transition-all cursor-pointer active:scale-[0.98]"
                                style={{ fontFamily: 'Inter, sans-serif', pointerEvents: 'auto' }}
                              >
                                {meal.milkyMistProduct}
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })()
            )
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
      `}</style>
    </div>
  );
}

