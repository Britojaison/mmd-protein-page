'use client';

import { useState } from 'react';

// Helper function to get delivery links for products
function getDeliveryLink(productName, platform) {
  // Create a search query from the product name
  const searchQuery = productName.toLowerCase().replace(/\s+/g, '+');
  
  if (platform === 'zepto') {
    return `https://www.zeptonow.com/search?query=${searchQuery}`;
  }
  
  return '#';
}

export default function MealPlan({ weeklyPlan, proteinRequired, averageDailyProtein, averageDailyCalories, weeklyTotalProtein, weeklyTotalCalories, dietaryPreferences }) {
  const [selectedDay, setSelectedDay] = useState(0);
  const currentDayPlan = weeklyPlan[selectedDay];
  
  // Check if plan meets requirements
  const meetsTarget = averageDailyProtein >= proteinRequired;
  const proteinDifference = Math.abs(averageDailyProtein - proteinRequired);

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-fadeIn">
      {/* Weekly Overview Card */}
      <div className="bg-gradient-to-br from-[#1e3a5f] via-[#2d4a6f] to-[#1e3a5f] text-white rounded-2xl p-6 md:p-8 shadow-xl animate-slideDown">
        <div className="text-center mb-6">
          <h2 className="text-2xl md:text-3xl font-bold mb-2 animate-fadeIn">Your 7-Day Protein Plan</h2>
          <p className="text-blue-100 text-sm animate-fadeIn" style={{ animationDelay: '0.1s' }}>Follow this meal plan to meet your daily protein goals</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white/10 backdrop-blur rounded-xl p-4 text-center border border-white/20 hover:bg-white/20 transition-all duration-300 hover:scale-105 animate-slideUp" style={{ animationDelay: '0.1s' }}>
            <p className="text-blue-200 text-xs font-semibold uppercase mb-1">Daily Target</p>
            <p className="text-3xl font-bold">{proteinRequired}g</p>
            <p className="text-blue-100 text-xs mt-1">Your goal</p>
          </div>
          <div className="bg-white/10 backdrop-blur rounded-xl p-4 text-center border border-white/20 hover:bg-white/20 transition-all duration-300 hover:scale-105 animate-slideUp" style={{ animationDelay: '0.2s' }}>
            <p className="text-blue-200 text-xs font-semibold uppercase mb-1">Average Per Day</p>
            <p className="text-3xl font-bold">{averageDailyProtein}g</p>
            {meetsTarget ? (
              <p className="text-green-300 text-xs mt-1">Exceeds target by {proteinDifference}g</p>
            ) : (
              <p className="text-orange-300 text-xs mt-1">Short by {proteinDifference}g</p>
            )}
          </div>
          <div className="bg-white/10 backdrop-blur rounded-xl p-4 text-center border border-white/20 hover:bg-white/20 transition-all duration-300 hover:scale-105 animate-slideUp" style={{ animationDelay: '0.3s' }}>
            <p className="text-blue-200 text-xs font-semibold uppercase mb-1">Weekly Total</p>
            <p className="text-3xl font-bold">{weeklyTotalProtein}g</p>
            <p className="text-blue-100 text-xs mt-1">If you follow plan</p>
          </div>
          <div className="bg-white/10 backdrop-blur rounded-xl p-4 text-center border border-white/20 hover:bg-white/20 transition-all duration-300 hover:scale-105 animate-slideUp" style={{ animationDelay: '0.4s' }}>
            <p className="text-blue-200 text-xs font-semibold uppercase mb-1">Plan Quality</p>
            <div className="flex items-center justify-center gap-2">
              {meetsTarget ? (
                <>
                  <svg className="w-6 h-6 text-green-300 animate-bounce" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="text-xl font-bold">Optimal</span>
                </>
              ) : (
                <>
                  <svg className="w-6 h-6 text-blue-300" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  <span className="text-xl font-bold">Good</span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Day Selector - Calendar Style */}
      <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 animate-slideUp" style={{ animationDelay: '0.2s' }}>
        <h3 className="text-xl font-bold mb-4" style={{ color: '#1e3a5f' }}>Select a Day</h3>
        <div className="grid grid-cols-7 gap-2">
          {weeklyPlan.map((day, index) => (
            <button
              key={index}
              onClick={() => setSelectedDay(index)}
              className={`p-3 rounded-xl transition-all duration-300 transform ${
                selectedDay === index
                  ? 'shadow-lg scale-110'
                  : 'hover:scale-105 hover:shadow-md'
              }`}
              style={{
                backgroundColor: selectedDay === index ? '#1e3a5f' : '#f0f4f8',
                color: selectedDay === index ? 'white' : '#1e3a5f',
                animationDelay: `${0.3 + index * 0.05}s`
              }}
            >
              <div className="text-center">
                <p className="text-sm font-bold mb-1">
                  {day.day}
                </p>
                <p className="text-xs font-semibold">{day.totalProtein}g</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Selected Day Details */}
      <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 animate-slideUp" style={{ animationDelay: '0.3s' }}>
        <div className="flex items-center justify-between mb-6">
          <div className="animate-fadeIn">
            <h3 className="text-2xl font-bold" style={{ color: '#1e3a5f' }}>{currentDayPlan.day}</h3>
            <p className="text-gray-600">Day {currentDayPlan.dayNumber} of your meal plan</p>
          </div>
          <div className="text-right animate-fadeIn" style={{ animationDelay: '0.1s' }}>
            <p className="text-sm text-gray-600">Total Protein</p>
            <p className="text-3xl font-bold" style={{ color: '#1e3a5f' }}>{currentDayPlan.totalProtein}g</p>
          </div>
        </div>

        {/* Meals Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {currentDayPlan.meals.map((meal, index) => (
            <div key={index} className="animate-slideUp" style={{ animationDelay: `${0.4 + index * 0.1}s` }}>
              <MealCard meal={meal} dietaryPreferences={dietaryPreferences} />
            </div>
          ))}
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fadeIn {
          animation: fadeIn 0.6s ease-out forwards;
        }

        .animate-slideDown {
          animation: slideDown 0.6s ease-out forwards;
        }

        .animate-slideUp {
          animation: slideUp 0.6s ease-out forwards;
        }
      `}</style>
    </div>
  );
}

function MealCard({ meal, dietaryPreferences }) {
  const [showDetails, setShowDetails] = useState(false);

  const mealColors = {
    'Breakfast': { bg: 'from-[#1e3a5f] to-[#2d4a6f]' },
    'Lunch': { bg: 'from-[#2d4a6f] to-[#3d5a7f]' },
    'Dinner': { bg: 'from-[#3d5a7f] to-[#1e3a5f]' }
  };

  const mealStyle = mealColors[meal.type] || mealColors['Breakfast'];

  return (
    <div className="bg-gray-50 rounded-xl overflow-hidden border border-gray-200 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
      {/* Meal Header */}
      <div className={`bg-gradient-to-r ${mealStyle.bg} text-white p-4 transition-all duration-300`}>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold uppercase tracking-wider">{meal.type}</span>
        </div>
        <h4 className="text-lg font-bold">{meal.recipeName}</h4>
      </div>

      {/* Meal Info */}
      <div className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Protein</span>
          <span className="text-2xl font-bold transition-all duration-300 hover:scale-110" style={{ color: '#1e3a5f' }}>{meal.nutrition.protein}g</span>
        </div>

        <div className="bg-blue-50 rounded-lg p-3 border border-blue-100 transition-all duration-300 hover:bg-blue-100">
          <p className="text-xs font-semibold mb-1" style={{ color: '#1e3a5f' }}>Featured Product</p>
          <p className="text-sm font-bold text-gray-900 mb-2">{meal.milkyMistProduct}</p>
          
          {/* Delivery Platform Link */}
          <div className="space-y-2">
            <p className="text-xs font-semibold text-gray-600">Order Now:</p>
            <div className="flex flex-wrap gap-2">
              <a
                href={getDeliveryLink(meal.milkyMistProduct, 'zepto')}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 px-3 py-2 bg-purple-100 hover:bg-purple-200 text-purple-700 text-sm font-semibold rounded-lg transition-colors duration-200 hover:scale-105 transform"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.293l-3-3a1 1 0 00-1.414 1.414L10.586 9.5H7a1 1 0 100 2h3.586l-1.293 1.293a1 1 0 101.414 1.414l3-3a1 1 0 000-1.414z" clipRule="evenodd" />
                </svg>
                Order on Zepto
              </a>
            </div>
          </div>
        </div>

        {/* Dietary Tags */}
        {meal.dietary && meal.dietary.length > 0 && dietaryPreferences && dietaryPreferences.length > 0 && !dietaryPreferences.includes('all') && (
          <div className="flex flex-wrap gap-1">
            {meal.dietary.map((tag) => (
              <span key={tag} className="px-2 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full">
                {tag}
              </span>
            ))}
          </div>
        )}

        <button
          onClick={() => setShowDetails(!showDetails)}
          className="w-full text-sm font-semibold py-2 rounded-lg transition-all duration-300 transform hover:scale-105"
          style={{
            backgroundColor: showDetails ? '#1e3a5f' : '#f0f4f8',
            color: showDetails ? 'white' : '#1e3a5f'
          }}
        >
          {showDetails ? 'Hide Details' : 'View Recipe'}
        </button>

        <div 
          className={`overflow-hidden transition-all duration-500 ease-in-out ${
            showDetails ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'
          }`}
        >
          <div className="space-y-3 pt-3 border-t">
            <div className="animate-fadeIn">
              <p className="text-xs font-bold mb-2" style={{ color: '#1e3a5f' }}>INGREDIENTS</p>
              <ul className="space-y-1">
                {meal.ingredients.map((ingredient, idx) => {
                  // Split ingredient to highlight protein amount
                  const proteinMatch = ingredient.match(/\(([^)]+protein)\)/);
                  const beforeProtein = ingredient.split('(')[0];
                  const proteinAmount = proteinMatch ? proteinMatch[1] : null;
                  
                  return (
                    <li 
                      key={idx} 
                      className="text-xs text-gray-700 flex items-start transition-all duration-300 hover:translate-x-1"
                      style={{ animationDelay: `${idx * 0.05}s` }}
                    >
                      <span className="mr-2" style={{ color: '#1e3a5f' }}>•</span>
                      <span>
                        {beforeProtein}
                        {proteinAmount && (
                          <span className="font-bold ml-1" style={{ color: '#1e3a5f' }}>
                            ({proteinAmount})
                          </span>
                        )}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>

            <div className="animate-fadeIn" style={{ animationDelay: '0.2s' }}>
              <p className="text-xs font-bold mb-2" style={{ color: '#1e3a5f' }}>INSTRUCTIONS</p>
              <ol className="space-y-1">
                {meal.steps.map((step, idx) => (
                  <li 
                    key={idx} 
                    className="text-xs text-gray-700 flex items-start transition-all duration-300 hover:translate-x-1"
                    style={{ animationDelay: `${idx * 0.05}s` }}
                  >
                    <span className="font-bold mr-2" style={{ color: '#1e3a5f' }}>{idx + 1}.</span>
                    <span>{step}</span>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}