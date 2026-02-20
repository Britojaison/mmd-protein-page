'use client';

import { useState, useEffect } from 'react';
import ProteinForm from './ProteinForm';
import MealPlan from './MealPlan';
import { calculateProtein } from '../../utils/protein';

export default function WorldProteinDay() {
  const [result, setResult] = useState(null);
  const [userCount, setUserCount] = useState(0);

  useEffect(() => {
    fetchUserCount();
  }, []);

  const fetchUserCount = async () => {
    try {
      const res = await fetch('/api/user-count');
      const data = await res.json();
      setUserCount(data.count);
    } catch (error) {
      console.error('Failed to fetch user count:', error);
    }
  };

  const handleSubmit = async (formData) => {
    const proteinRequired = parseFloat(calculateProtein(formData.weight));

    const userData = {
      ...formData,
      proteinRequired,
      timestamp: new Date().toISOString()
    };

    try {
      // Save to local JSON
      const saveResponse = await fetch('/api/save-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData)
      });

      if (!saveResponse.ok) {
        throw new Error('Failed to save user data');
      }

      // Generate meal plan with recipes
      const mealPlanResponse = await fetch('/api/generate-meal-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData)
      });

      const mealPlanData = await mealPlanResponse.json();

      if (mealPlanData.success) {
        // Send to external API (placeholder)
        if (process.env.NEXT_PUBLIC_PROTEIN_API) {
          fetch(process.env.NEXT_PUBLIC_PROTEIN_API, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(userData)
          }).catch(err => console.log('External API call failed:', err));
        }

        setResult({ 
          proteinRequired, 
          totalProtein: mealPlanData.totalProtein,
          achieved: mealPlanData.achieved,
          meals: mealPlanData.meals 
        });
        fetchUserCount();
      }
    } catch (error) {
      console.error('Failed to save user:', error);
      alert('Failed to save data. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Navigation */}
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-center">
            <h1 className="text-2xl font-bold text-green-600">Milky Mist</h1>
          </div>
        </div>
      </header>

      {/* User Count */}
      {userCount > 0 && (
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="text-center">
              <p className="text-gray-600">
                <span className="font-bold text-green-600 text-xl">{userCount}</span> people have checked their protein goal today!
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        {!result ? (
          <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-lg shadow-md p-8 md:p-12">
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-gray-900 mb-3">
                  Calculate Your Protein Goal
                </h2>
                <p className="text-gray-600">
                  Enter your details to get a personalized meal plan with Milky Mist products
                </p>
              </div>
              <ProteinForm onSubmit={handleSubmit} />
            </div>
          </div>
        ) : (
          <div>
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
                Your Personalized Meal Plan
              </h2>
              <p className="text-gray-600 text-lg">
                Crafted with premium Milky Mist dairy products
              </p>
            </div>

            <MealPlan 
              meals={result.meals}
              totalProtein={result.totalProtein}
              proteinRequired={result.proteinRequired}
              achieved={result.achieved}
            />
            
            <div className="text-center mt-12">
              <button
                onClick={() => setResult(null)}
                className="bg-green-600 text-white px-8 py-3 rounded-md font-semibold hover:bg-green-700 transition-colors duration-200"
              >
                Calculate for Another Person
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h3 className="text-2xl font-bold text-green-400 mb-3">Milky Mist</h3>
            <p className="text-gray-400 mb-2">Dairy Food Limited</p>
            <p className="text-gray-500 text-sm">
              Fresh Dairy Products | Making India, a healthy India
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
