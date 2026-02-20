'use client';

export default function MealPlan({ meals, totalProtein, proteinRequired, achieved }) {
  const progressPercentage = Math.min((totalProtein / proteinRequired) * 100, 100);

  return (
    <div className="space-y-12 max-w-7xl mx-auto">
      {/* Header Section */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900">Daily Meal Plan</h1>
        <p className="text-gray-600 text-lg">Nutritious recipes featuring premium Milky Mist products</p>
      </div>

      {/* Protein Progress Card */}
      <div className="bg-gradient-to-br from-slate-800 via-slate-900 to-slate-950 text-white rounded-3xl p-8 md:p-12 shadow-2xl">
        <div className="space-y-8">
          <div>
            <p className="text-slate-400 text-sm font-medium uppercase tracking-wider mb-2">
              Daily Nutrition Goal
            </p>
            <h2 className="text-4xl md:text-5xl font-bold mb-2">Your Protein Progress</h2>
            <p className="text-slate-300">Track your daily intake and achieve your nutritional goals</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
            <div className="bg-slate-800/50 backdrop-blur rounded-2xl p-6 border border-slate-700">
              <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">
                Daily Target
              </p>
              <p className="text-5xl font-bold text-white mb-1">{proteinRequired}g</p>
              <p className="text-slate-300 text-sm">Required Protein</p>
            </div>

            <div className="bg-emerald-900/30 backdrop-blur rounded-2xl p-6 border border-emerald-700/50">
              <p className="text-emerald-300 text-xs font-semibold uppercase tracking-wider mb-2">
                Currently Achieved
              </p>
              <p className="text-5xl font-bold text-emerald-400 mb-1">{totalProtein}g</p>
              <p className="text-emerald-200 text-sm">From Your Meals</p>
            </div>

            <div className="bg-blue-900/30 backdrop-blur rounded-2xl p-6 border border-blue-700/50">
              <p className="text-blue-300 text-xs font-semibold uppercase tracking-wider mb-2">
                Status
              </p>
              <div className="flex items-center gap-3">
                <svg className="w-8 h-8 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <div>
                  <p className="text-3xl font-bold text-white">Done</p>
                  <p className="text-blue-200 text-sm">Target achieved!</p>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-slate-300 font-medium">Progress</span>
              <span className="text-emerald-400 font-bold">{progressPercentage.toFixed(0)}%</span>
            </div>
            <div className="h-3 bg-slate-800 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-emerald-500 to-blue-500 rounded-full transition-all duration-500"
                style={{ width: `${progressPercentage}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      {/* Today's Recipes Section */}
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">Today's Recipes</h2>
          <p className="text-gray-600">Nutritious meals crafted with premium Milky Mist products</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {meals.map((meal, index) => (
            <RecipeCard key={index} meal={meal} />
          ))}
        </div>
      </div>
    </div>
  );
}

function RecipeCard({ meal }) {
  const mealColors = {
    'Breakfast': {
      bg: 'from-orange-500 to-orange-600',
      badge: 'bg-orange-500',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      )
    },
    'Lunch': {
      bg: 'from-blue-500 to-blue-600',
      badge: 'bg-blue-500',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
      )
    },
    'Dinner': {
      bg: 'from-purple-500 to-purple-600',
      badge: 'bg-purple-500',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
        </svg>
      )
    }
  };

  const mealStyle = mealColors[meal.type] || mealColors['Breakfast'];

  return (
    <div className="bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300">
      {/* Card Header */}
      <div className={`bg-gradient-to-r ${mealStyle.bg} text-white p-6`}>
        <div className="flex items-center gap-3 mb-3">
          <div className="bg-white/20 backdrop-blur p-2 rounded-lg">
            {mealStyle.icon}
          </div>
          <span className="text-sm font-bold uppercase tracking-wider">
            {meal.type}
          </span>
        </div>
        <h3 className="text-2xl font-bold">{meal.recipeName}</h3>
      </div>

      {/* Card Body */}
      <div className="p-6 space-y-6">
        {/* Featured Product */}
        <div className="bg-blue-50 rounded-xl p-4">
          <p className="text-xs text-gray-600 font-semibold uppercase tracking-wider mb-1">
            Featured Product
          </p>
          <p className="text-gray-900 font-bold text-lg">{meal.milkyMistProduct}</p>
        </div>

        {/* Protein Content */}
        <div className="bg-emerald-50 rounded-xl p-4">
          <p className="text-xs text-emerald-700 font-semibold uppercase tracking-wider mb-1">
            Protein Content
          </p>
          <p className="text-4xl font-bold text-emerald-600">{meal.protein}g</p>
        </div>

        {/* Ingredients */}
        <div>
          <h4 className="font-bold text-gray-900 mb-3 flex items-center">
            <svg className="w-5 h-5 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            Ingredients
          </h4>
          <ul className="space-y-2">
            {meal.ingredients.map((ingredient, idx) => (
              <li key={idx} className="text-gray-700 flex items-start text-sm">
                <span className="text-emerald-600 font-bold mr-2">•</span>
                <span>{ingredient}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Instructions */}
        <div>
          <h4 className="font-bold text-gray-900 mb-3 flex items-center">
            <svg className="w-5 h-5 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Instructions
          </h4>
          <div className="space-y-2">
            {meal.steps.map((step, idx) => (
              <div key={idx} className="flex items-start text-sm">
                <span className="bg-emerald-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold mr-3 flex-shrink-0 mt-0.5">
                  {idx + 1}
                </span>
                <span className="text-gray-700">{step}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
