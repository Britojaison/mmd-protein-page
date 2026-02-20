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

  const [errors, setErrors] = useState({});

  const validateField = (name, value) => {
    const newErrors = { ...errors };

    switch (name) {
      case 'age':
        const age = parseInt(value);
        if (value && (age < 1 || age > 100)) {
          newErrors.age = 'Age must be between 1 and 100 years';
        } else {
          delete newErrors.age;
        }
        break;

      case 'height':
        const height = parseInt(value);
        if (value && (height < 50 || height > 272)) {
          newErrors.height = 'Height must be between 50 and 272 cm';
        } else {
          delete newErrors.height;
        }
        break;

      case 'weight':
        const weight = parseFloat(value);
        if (value && (weight < 5 || weight > 500)) {
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
    setFormData(prev => ({
      ...prev,
      dietaryPreferences: prev.dietaryPreferences.includes(preference)
        ? prev.dietaryPreferences.filter(p => p !== preference)
        : [...prev.dietaryPreferences, preference]
    }));
  };

  const validateForm = () => {
    const newErrors = {};
    
    // Validate age
    const age = parseInt(formData.age);
    if (!formData.age || age < 1 || age > 100) {
      newErrors.age = 'Please enter a valid age between 1 and 100 years';
    }

    // Validate height
    const height = parseInt(formData.height);
    if (!formData.height || height < 50 || height > 272) {
      newErrors.height = 'Please enter a valid height between 50 and 272 cm';
    }

    // Validate weight
    const weight = parseFloat(formData.weight);
    if (!formData.weight || weight < 5 || weight > 500) {
      newErrors.weight = 'Please enter a valid weight between 5 and 500 kg';
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
            Age (years)
          </label>
          <input
            type="number"
            name="age"
            required
            min="1"
            max="100"
            value={formData.age}
            onChange={handleChange}
            className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-[#1e3a5f] focus:border-[#1e3a5f] outline-none transition-all duration-300 hover:border-[#1e3a5f] ${
              errors.age ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {errors.age && (
            <p className="text-red-500 text-xs mt-1">{errors.age}</p>
          )}
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
            min="50"
            max="272"
            step="0.1"
            value={formData.height}
            onChange={handleChange}
            className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-[#1e3a5f] focus:border-[#1e3a5f] outline-none transition-all duration-300 hover:border-[#1e3a5f] ${
              errors.height ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {errors.height && (
            <p className="text-red-500 text-xs mt-1">{errors.height}</p>
          )}
        </div>
        
        <div className="animate-slideUp" style={{ animationDelay: '0.5s' }}>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Weight (kg)
          </label>
          <input
            type="number"
            name="weight"
            required
            min="5"
            max="500"
            step="0.1"
            value={formData.weight}
            onChange={handleChange}
            className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-[#1e3a5f] focus:border-[#1e3a5f] outline-none transition-all duration-300 hover:border-[#1e3a5f] ${
              errors.weight ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {errors.weight && (
            <p className="text-red-500 text-xs mt-1">{errors.weight}</p>
          )}
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
                <div className="text-lg mb-0.5">{option.icon}</div>
                <div className="text-xs font-semibold">{option.label}</div>
              </div>
            </button>
          ))}
        </div>
      </div>
      
      <button
        type="submit"
        disabled={isLoading || Object.keys(errors).length > 0}
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
