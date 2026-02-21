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
          dietaryPreferences: mealPlanData.dietaryPreferences
        });

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
      className="min-h-screen bg-[#F8FAFF] py-6 px-4 sm:px-6 lg:px-8 flex items-center justify-center font-sans tracking-tight"
      style={{ backgroundImage: "url('/assets/images/BG.png')", backgroundSize: 'cover', backgroundPosition: 'center', backgroundAttachment: 'fixed' }}
    >
      <div className="max-w-[1240px] w-full flex flex-col md:flex-row gap-6 lg:gap-8 justify-center items-stretch py-4">

        {/* Left Stepper Sidebar */}
        <div className="bg-gradient-to-b from-[#FFFFFF] to-[#E6F0FF] rounded-[2.5rem] p-8 lg:p-10 w-full md:w-[360px] lg:w-[380px] flex flex-col justify-between shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-white/50 relative shrink-0">
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
                active={!!result}
                isCompleted={false}
              />
              <Step
                number={3}
                title="Select Your Plan"
                desc="Choose the plan that fits your needs."
                active={false}
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
                <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"></path>
              </svg>
            </div>
          </div>
        </div>

        {/* Right Content Area */}
        <div className="bg-white rounded-[2.5rem] shadow-[0_8px_30px_rgb(0,0,0,0.08)] border border-gray-100/50 flex-1 p-8 md:p-10 lg:p-14">
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
          ) : (
            <div className="w-full h-full flex flex-col">
              <div className="mb-8 flex items-center justify-between">
                <div>
                  <h2 className="text-2xl lg:text-[28px] font-bold text-[#0f284e] mb-2">
                    Your Personalized Meal Plan
                  </h2>
                  <p className="text-gray-500 text-[15px]">
                    Crafted with premium Milky Mist dairy products
                  </p>
                </div>
                <button
                  onClick={() => setResult(null)}
                  className="px-5 py-2.5 rounded-2xl border-2 border-[#0f284e] text-[#0f284e] font-semibold text-sm hover:bg-[#0f284e] hover:text-white transition-all duration-300"
                >
                  Recalculate
                </button>
              </div>

              <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                <Suspense fallback={<MealPlanLoader />}>
                  <MealPlan
                    weeklyPlan={result.weeklyPlan}
                    proteinRequired={result.proteinRequired}
                    averageDailyProtein={result.averageDailyProtein}
                    averageDailyCalories={result.averageDailyCalories}
                    weeklyTotalProtein={result.weeklyTotalProtein}
                    weeklyTotalCalories={result.weeklyTotalCalories}
                    dietaryPreferences={result.dietaryPreferences}
                  />
                </Suspense>
              </div>
            </div>
          )}
        </div>

      </div>

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

