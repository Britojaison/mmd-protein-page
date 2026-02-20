'use client';

import { useState } from 'react';

export default function ProteinForm({ onSubmit, isLoading = false }) {
  const [formData, setFormData] = useState({
    name: '',
    age: '',
    gender: '',
    height: '',
    weight: '',
    dietaryPreferences: []
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleDietaryChange = (preference) => {
    setFormData(prev => ({
      ...prev,
      dietaryPreferences: prev.dietaryPreferences.includes(preference)
        ? prev.dietaryPreferences.filter(p => p !== preference)
        : [...prev.dietaryPreferences, preference]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await onSubmit(formData);
  };

  const dietaryOptions = [
    { value: 'vegetarian', label: 'Vegetarian', icon: '🥗' },
    { value: 'non-vegetarian', label: 'Non-Vegetarian', icon: '🍗' },
    { value: 'gluten-free', label: 'Gluten-Free', icon: '🌾' }
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="animate-slideUp" style={{ animationDelay: '0.1s' }}>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Full Name
        </label>
        <input
          type="text"
          name="name"
          required
          value={formData.name}
          onChange={handleChange}
          placeholder="Enter your name"
          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1e3a5f] focus:border-[#1e3a5f] outline-none transition-all duration-300 hover:border-[#1e3a5f]"
        />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="animate-slideUp" style={{ animationDelay: '0.2s' }}>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Age
          </label>
          <input
            type="number"
            name="age"
            required
            min="1"
            max="120"
            value={formData.age}
            onChange={handleChange}
            placeholder="Age"
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1e3a5f] focus:border-[#1e3a5f] outline-none transition-all duration-300 hover:border-[#1e3a5f]"
          />
        </div>

        <div className="animate-slideUp" style={{ animationDelay: '0.3s' }}>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Gender
          </label>
          <select
            name="gender"
            required
            value={formData.gender}
            onChange={handleChange}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1e3a5f] focus:border-[#1e3a5f] outline-none transition-all duration-300 hover:border-[#1e3a5f] bg-white"
          >
            <option value="">Select Gender</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
          </select>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="animate-slideUp" style={{ animationDelay: '0.4s' }}>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Height (cm)
          </label>
          <input
            type="number"
            name="height"
            required
            min="1"
            value={formData.height}
            onChange={handleChange}
            placeholder="Height"
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1e3a5f] focus:border-[#1e3a5f] outline-none transition-all duration-300 hover:border-[#1e3a5f]"
          />
        </div>
        
        <div className="animate-slideUp" style={{ animationDelay: '0.5s' }}>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Weight (kg)
          </label>
          <input
            type="number"
            name="weight"
            required
            min="1"
            value={formData.weight}
            onChange={handleChange}
            placeholder="Weight"
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1e3a5f] focus:border-[#1e3a5f] outline-none transition-all duration-300 hover:border-[#1e3a5f]"
          />
        </div>
      </div>

      <div className="animate-slideUp" style={{ animationDelay: '0.6s' }}>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          Dietary Preferences (Optional)
        </label>
        <div className="grid grid-cols-3 gap-2">
          {dietaryOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => handleDietaryChange(option.value)}
              className={`p-2 rounded-lg border-2 transition-all duration-300 transform hover:scale-105 ${
                formData.dietaryPreferences.includes(option.value)
                  ? 'border-[#1e3a5f] bg-[#1e3a5f] text-white shadow-md'
                  : 'border-gray-300 bg-white text-gray-700 hover:border-[#1e3a5f]'
              }`}
            >
              <div className="text-center">
                <div className="text-lg mb-0.5">{option.icon}</div>                <div className="text-xs font-semibold">{option.label}</div>
              </div>
            </button>
          ))}
        </div>
      </div>
      
      <button
        type="submit"
        disabled={isLoading}
        className="w-full bg-[#1e3a5f] text-white py-2.5 rounded-full font-semibold text-base hover:bg-[#2d4a6f] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-xl transform hover:scale-105 animate-slideUp"
        style={{ animationDelay: '0.7s' }}
      >
        {isLoading ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span>Generating your personalized meal plan...</span>
          </span>
        ) : (
          'Get My Personalized Meal Plan'
        )}
      </button>

      <style jsx>{`
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

        .animate-slideUp {
          animation: slideUp 0.6s ease-out forwards;
        }
      `}</style>
    </form>
  );
}
