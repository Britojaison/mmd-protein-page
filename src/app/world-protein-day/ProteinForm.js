'use client';

import { useState } from 'react';

export default function ProteinForm({ onSubmit, isLoading = false }) {
  const [formData, setFormData] = useState({
    name: '',
    age: '',
    gender: '',
    height: '',
    weight: '',
    dietaryPreferences: [],
    cuisinePreference: [],
    activityLevel: ''
  });

  const [errors, setErrors] = useState({});

  const validateField = (name, value) => {
    const newErrors = { ...errors };

    switch (name) {
      case 'name':
        if (!value || value.trim().length < 2) {
          newErrors.name = 'Please enter your name';
        } else {
          delete newErrors.name;
        }
        break;

      case 'gender':
        if (!value) {
          newErrors.gender = 'Please select a gender';
        } else {
          delete newErrors.gender;
        }
        break;

      case 'age':
        const age = parseInt(value);
        if (!value || isNaN(age) || age < 1 || age > 100) {
          newErrors.age = 'Age must be between 1 and 100 years';
        } else {
          delete newErrors.age;
        }
        break;

      case 'height':
        const height = parseFloat(value);
        if (!value || isNaN(height) || height < 50 || height > 272) {
          newErrors.height = 'Height must be between 50 and 272 cm';
        } else {
          delete newErrors.height;
        }
        break;

      case 'weight':
        const weight = parseFloat(value);
        if (!value || isNaN(weight) || weight < 5 || weight > 500) {
          newErrors.weight = 'Weight must be between 5 and 500 kg';
        } else {
          delete newErrors.weight;
        }
        break;

      default:
        break;
    }

    setErrors(newErrors);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    validateField(name, value);
  };

  const handleDietaryChange = (preference) => {
    // For vegetarian/non-vegetarian, make it mutually exclusive
    if (preference === 'vegetarian' || preference === 'non-vegetarian') {
      setFormData(prev => ({
        ...prev,
        dietaryPreferences: [preference] // Replace with single selection
      }));
    } else {
      // For other preferences (if any), allow multiple selection
      setFormData(prev => ({
        ...prev,
        dietaryPreferences: prev.dietaryPreferences.includes(preference)
          ? prev.dietaryPreferences.filter(p => p !== preference)
          : [...prev.dietaryPreferences, preference]
      }));
    }
  };

  const handleCuisineChange = (cuisine) => {
    setFormData(prev => ({
      ...prev,
      cuisinePreference: prev.cuisinePreference.includes(cuisine)
        ? prev.cuisinePreference.filter(c => c !== cuisine)
        : [...prev.cuisinePreference, cuisine]
    }));
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name || formData.name.trim().length < 2) {
      newErrors.name = 'Please enter your name';
    }

    if (!formData.gender) {
      newErrors.gender = 'Please select a gender';
    }

    const age = parseInt(formData.age);
    if (!formData.age || isNaN(age) || age < 1 || age > 100) {
      newErrors.age = 'Please enter a valid age between 1 and 100 years';
    }

    const height = parseFloat(formData.height);
    if (!formData.height || isNaN(height) || height < 50 || height > 272) {
      newErrors.height = 'Please enter a valid height between 50 and 272 cm';
    }

    const weight = parseFloat(formData.weight);
    if (!formData.weight || isNaN(weight) || weight < 5 || weight > 500) {
      newErrors.weight = 'Please enter a valid weight between 5 and 500 kg';
    }

    if (!formData.cuisinePreference || formData.cuisinePreference.length === 0) {
      newErrors.cuisinePreference = 'Please select at least one preferred cuisine';
    }

    if (!formData.activityLevel) {
      newErrors.activityLevel = 'Please select your activity level';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    await onSubmit(formData);
  };

  const dietaryOptions = [
    { value: 'vegetarian', label: 'Vegetarian', icon: '🥗', block: false },
    { value: 'non-vegetarian', label: 'Non-Vegetarian', icon: '🍗', block: false }
  ];

  const InputLabel = ({ title }) => (
    <label className="block text-[18px] lg:text-[16px] font-medium text-[#0f284e] mb-3 lg:mb-2">
      {title} <span className="text-red-500">*</span>
    </label>
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-4 lg:space-y-3 xl:space-y-6" noValidate>

      {/* Name Field */}
      <div className="animate-slideUp" style={{ animationDelay: '0.1s' }}>
        <InputLabel title="Name" />
        <input
          type="text"
          name="name"
          value={formData.name}
          onChange={handleChange}
          className={`w-full px-4 py-4 lg:py-3 border rounded-[1rem] bg-white shadow-[0_2px_10px_rgba(0,0,0,0.01)] focus:ring-2 focus:ring-[#0f284e]/20 focus:border-[#0f284e] outline-none transition-all duration-300 hover:shadow-[0_4px_16px_rgba(0,0,0,0.03)] text-[18px] lg:text-[16px] ${errors.name ? 'border-red-400' : 'border-gray-100'
            }`}
        />
        {errors.name && (
          <p className="text-red-500 text-[16px] lg:text-[14px] mt-1">{errors.name}</p>
        )}
      </div>

      {/* Age & Gender Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 lg:gap-3 xl:gap-6">
        <div className="animate-slideUp" style={{ animationDelay: '0.2s' }}>
          <InputLabel title="Age" />
          <input
            type="number"
            name="age"
            value={formData.age}
            onChange={handleChange}
            placeholder="e.g. 25"
            className={`w-full px-4 py-4 lg:py-3 border rounded-[1rem] bg-white shadow-[0_2px_10px_rgba(0,0,0,0.01)] focus:ring-2 focus:ring-[#0f284e]/20 focus:border-[#0f284e] outline-none transition-all duration-300 hover:shadow-[0_4px_16px_rgba(0,0,0,0.03)] text-[18px] lg:text-[16px] ${errors.age ? 'border-red-400' : 'border-gray-100'
              }`}
          />
          {errors.age && (
            <p className="text-red-500 text-[16px] lg:text-[14px] mt-1">{errors.age}</p>
          )}
        </div>

        <div className="animate-slideUp" style={{ animationDelay: '0.3s' }}>
          <InputLabel title="Gender" />
          <div className="flex gap-6 lg:gap-4">
            {['male', 'female', 'other'].map((genderOption) => (
              <label key={genderOption} className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  name="gender"
                  value={genderOption}
                  checked={formData.gender === genderOption}
                  onChange={handleChange}
                  className="sr-only"
                />
                <div className={`w-6 h-6 lg:w-5 lg:h-5 rounded-full border-2 mr-3 lg:mr-2 flex items-center justify-center transition-all duration-200 ${
                  formData.gender === genderOption 
                    ? 'border-[#0f284e] bg-[#0f284e]' 
                    : 'border-gray-300 hover:border-[#0f284e]'
                }`}>
                  {formData.gender === genderOption && (
                    <div className="w-2.5 h-2.5 lg:w-2 lg:h-2 rounded-full bg-white"></div>
                  )}
                </div>
                <span className={`text-[18px] lg:text-[16px] capitalize ${
                  formData.gender === genderOption ? 'text-[#0f284e] font-medium' : 'text-gray-600'
                }`}>
                  {genderOption}
                </span>
              </label>
            ))}
          </div>
          {errors.gender && (
            <p className="text-red-500 text-[16px] lg:text-[14px] mt-1">{errors.gender}</p>
          )}
        </div>
      </div>

      {/* Height & Weight Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 lg:gap-3 xl:gap-6">
        <div className="animate-slideUp" style={{ animationDelay: '0.4s' }}>
          <InputLabel title="Height (cm)" />
          <input
            type="number"
            name="height"
            value={formData.height}
            onChange={handleChange}
            placeholder="e.g. 175"
            className={`w-full px-4 py-4 lg:py-3 border rounded-[1rem] bg-white shadow-[0_2px_10px_rgba(0,0,0,0.01)] focus:ring-2 focus:ring-[#0f284e]/20 focus:border-[#0f284e] outline-none transition-all duration-300 hover:shadow-[0_4px_16px_rgba(0,0,0,0.03)] text-[18px] lg:text-[16px] ${errors.height ? 'border-red-400' : 'border-gray-100'
              }`}
          />
          {errors.height && (
            <p className="text-red-500 text-[16px] lg:text-[14px] mt-1">{errors.height}</p>
          )}
        </div>

        <div className="animate-slideUp" style={{ animationDelay: '0.5s' }}>
          <InputLabel title="Weight(kg)" />
          <input
            type="number"
            name="weight"
            value={formData.weight}
            onChange={handleChange}
            placeholder="e.g. 70"
            className={`w-full px-4 py-4 lg:py-3 border rounded-[1rem] bg-white shadow-[0_2px_10px_rgba(0,0,0,0.01)] focus:ring-2 focus:ring-[#0f284e]/20 focus:border-[#0f284e] outline-none transition-all duration-300 hover:shadow-[0_4px_16px_rgba(0,0,0,0.03)] text-[18px] lg:text-[16px] ${errors.weight ? 'border-red-400' : 'border-gray-100'
              }`}
          />
          {errors.weight && (
            <p className="text-red-500 text-[16px] lg:text-[14px] mt-1">{errors.weight}</p>
          )}
        </div>
      </div>

      <div className="animate-slideUp" style={{ animationDelay: '0.6s' }}>
        <label className="block text-[18px] lg:text-[16px] font-medium text-[#0f284e] mb-3 lg:mb-2 mt-1">
          Dietary Preferences
        </label>
        <div className="grid grid-cols-2 gap-3 max-w-xs sm:max-w-md">
          {dietaryOptions.map((option) => {
            const isSelected = formData.dietaryPreferences.includes(option.value);
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => handleDietaryChange(option.value)}
                className={`py-3 px-2 rounded-2xl border transition-all duration-300 flex flex-col items-center justify-center gap-1 group cursor-pointer ${isSelected
                    ? 'border-[#0f284e] bg-[#f8fbff] shadow-sm ring-1 ring-[#0f284e] transform scale-[1.02]'
                    : 'border-gray-100 bg-white hover:border-[#0f284e]/40 hover:bg-[#f8fbff] hover:shadow-md transform hover:-translate-y-1'
                  }`}
              >
                <div className="text-[28px] mb-0 relative flex items-center justify-center w-10 h-10">
                  <span className={`transform transition-transform duration-300 ${isSelected ? 'scale-110' : 'group-hover:scale-110'}`}>
                    {option.icon}
                  </span>
                  {option.block && (
                    <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-0.5 shadow-sm">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10"></circle>
                        <line x1="4.93" y1="4.93" x2="19.07" y2="19.07"></line>
                      </svg>
                    </div>
                  )}
                </div>
                <div className={`text-[16px] lg:text-[14px] font-medium transition-colors duration-300 ${isSelected ? 'text-[#0f284e]' : 'text-gray-500 group-hover:text-[#0f284e]'}`}>
                  {option.label}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Indian Cuisine Preference */}
      <div className="animate-slideUp" style={{ animationDelay: '0.7s' }}>
        <InputLabel title="Preferred Indian Cuisine" />
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {[
            { value: 'north-indian', label: 'North Indian' },
            { value: 'south-indian', label: 'South Indian' },
            { value: 'west-indian', label: 'West Indian' },
            { value: 'east-indian', label: 'East Indian' },
            { value: 'punjabi', label: 'Punjabi' },
            { value: 'gujarati', label: 'Gujarati' },
            { value: 'maharashtrian', label: 'Maharashtrian' },
            { value: 'bengali', label: 'Bengali' },
            { value: 'tamil', label: 'Tamil' },
            { value: 'kerala', label: 'Kerala' },
            { value: 'mixed', label: 'Mixed/All Regions' }
          ].map((cuisine) => {
            const isSelected = formData.cuisinePreference.includes(cuisine.value);
            return (
              <button
                key={cuisine.value}
                type="button"
                onClick={() => handleCuisineChange(cuisine.value)}
                className={`py-3 px-4 rounded-xl border transition-all duration-300 text-center cursor-pointer ${
                  isSelected
                    ? 'border-[#0f284e] bg-[#f8fbff] text-[#0f284e] font-medium shadow-sm ring-1 ring-[#0f284e] transform scale-[1.02]'
                    : 'border-gray-200 bg-white text-gray-600 hover:border-[#0f284e]/40 hover:bg-[#f8fbff] hover:text-[#0f284e] hover:shadow-md transform hover:-translate-y-0.5'
                }`}
              >
                <div className="text-[16px] lg:text-[14px] font-medium">
                  {cuisine.label}
                </div>
              </button>
            );
          })}
        </div>
        {errors.cuisinePreference && (
          <p className="text-red-500 text-[16px] lg:text-[14px] mt-1">{errors.cuisinePreference}</p>
        )}
      </div>

      {/* Activity Level */}
      <div className="animate-slideUp" style={{ animationDelay: '0.8s' }}>
        <InputLabel title="Activity Level" />
        <div className="relative">
          <select
            name="activityLevel"
            value={formData.activityLevel}
            onChange={handleChange}
            className={`w-full px-4 py-4 lg:py-3 border rounded-[1rem] bg-white shadow-[0_2px_10px_rgba(0,0,0,0.01)] focus:ring-2 focus:ring-[#0f284e]/20 focus:border-[#0f284e] outline-none transition-all duration-300 hover:shadow-[0_4px_16px_rgba(0,0,0,0.03)] text-[18px] lg:text-[16px] appearance-none ${errors.activityLevel ? 'border-red-400' : 'border-gray-100'
              }`}
          >
            <option value="" disabled className="text-gray-400">Select activity level...</option>
            <option value="sedentary">Sedentary (Desk job, minimal exercise)</option>
            <option value="light">Lightly Active (Light exercise 1-3 days/week)</option>
            <option value="moderate">Moderately Active (Moderate exercise 3-5 days/week)</option>
            <option value="active">Very Active (Heavy exercise 6-7 days/week)</option>
            <option value="veryActive">Extremely Active (Intense exercise, physical job)</option>
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-400">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
        {errors.activityLevel && (
          <p className="text-red-500 text-[16px] lg:text-[14px] mt-1">{errors.activityLevel}</p>
        )}
      </div>

      <div className="pt-4 lg:pt-3 xl:pt-6 animate-slideUp flex justify-center" style={{ animationDelay: '0.9s' }}>
        <button
          type="submit"
          disabled={isLoading}
          className="bg-gradient-to-r from-[#17435B] to-[#116d7a] text-white py-4 lg:py-3 px-8 rounded-xl font-semibold text-[18px] lg:text-[16px] hover:shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:-translate-y-0.5"
        >
          {isLoading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-5 w-5 lg:h-4 lg:w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>Loading...</span>
            </span>
          ) : (
            'Continue'
          )}
        </button>
      </div>

      <style jsx>{`
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-slideUp {
          animation: slideUp 0.5s ease-out forwards;
        }
      `}</style>
    </form>
  );
}
