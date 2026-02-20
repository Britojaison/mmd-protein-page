'use client';

import { useState, useEffect, lazy, Suspense } from 'react';
import ProteinForm from './ProteinForm';
import { calculateProtein } from '../../utils/protein';

// Lazy load the MealPlan component
const MealPlan = lazy(() => import('./MealPlan'));

export default function WorldProteinDay() {
  const [result, setResult] = useState(null);
  const [userCount, setUserCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [userCountLoaded, setUserCountLoaded] = useState(false);
  const [error, setError] = useState(null);

  // Lazy load user count only when needed
  useEffect(() => {
    if (!userCountLoaded) {
      const timer = setTimeout(() => {
        fetchUserCount();
      }, 100); // Delay to prioritize main content
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
      // Use improved protein calculation with gender and age
      const proteinRequired = parseFloat(calculateProtein(
        formData.weight, 
        formData.gender, 
        'moderate', // Default activity level
        formData.age
      ));

      const userData = {
        ...formData,
        proteinRequired,
        timestamp: new Date().toISOString()
      };

      // Execute API calls in parallel for better performance
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
        // Send to external API asynchronously (non-blocking)
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
        
        // Update user count asynchronously
        fetchUserCount();
      } else {
        // Handle validation errors
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

  // Loading component for MealPlan
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
    <div className="min-h-screen bg-gray-50">
      {/* Header Navigation */}
      <header className="bg-white shadow-sm sticky top-0 z-50 border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-start">
            <h1 className="text-3xl font-bold" style={{ color: '#1e3a5f' }}>milkyMist</h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        {!result ? (
          <div className="max-w-xl mx-auto">
            <div className="bg-white rounded-2xl shadow-lg p-5 md:p-6 border border-gray-100">
              <div className="text-center mb-4">
                <h2 className="text-2xl md:text-3xl font-bold mb-1" style={{ color: '#1e3a5f' }}>
                  Calculate Your Protein Goal
                </h2>
                <p className="text-gray-600 text-sm">
                  Enter your details to get a personalized meal plan
                </p>
                {error && (
                  <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-red-600 text-sm">{error}</p>
                  </div>
                )}
              </div>
              <ProteinForm onSubmit={handleSubmit} isLoading={isLoading} />
            </div>
          </div>
        ) : (
          <div>
            <div className="text-center mb-8">
              <h2 className="text-3xl md:text-4xl font-bold mb-2" style={{ color: '#1e3a5f' }}>
                Your Personalized Meal Plan
              </h2>
              <p className="text-gray-600 text-lg">
                Crafted with premium Milky Mist dairy products
              </p>
            </div>

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
            
            <div className="text-center mt-8">
              <button
                onClick={() => {
                  setResult(null);
                  setError(null);
                }}
                className="bg-[#1e3a5f] text-white px-8 py-3 rounded-full font-semibold hover:bg-[#2d4a6f] transition-colors duration-200 shadow-md"
              >
                Calculate for Another Person
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="bg-[#1e3a5f] text-white py-8 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h3 className="text-2xl font-bold mb-2">milkyMist</h3>
            <p className="text-blue-200 mb-1">Dairy Food Limited</p>
            <p className="text-blue-300 text-sm">
              Fresh Dairy Products | Making India, a healthy India
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
