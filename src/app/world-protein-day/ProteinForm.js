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
    setFormData(prev => ({
      ...prev,
      dietaryPreferences: prev.dietaryPreferences.includes(preference)
        ? prev.dietaryPreferences.filter(p => p !== preference)
        : [...prev.dietaryPreferences, preference]
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
    { value: 'lactose-free', label: 'Lactose Free', icon: '🍼', block: true },
    { value: 'gluten-free', label: 'Gluten Free', icon: '🌾', block: true },
    { value: 'vegetarian', label: 'Vegetarian', icon: '🥗', block: false },
    { value: 'vegan', label: 'Vegan', icon: '🌿', block: false }
  ];

  const InputLabel = ({ title }) => (
    <label className="block text-[14px] font-medium text-[#0f284e] mb-2">
      {title} <span className="text-red-500">*</span>
    </label>
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-6" noValidate>

      {/* Name Field */}
      <div className="animate-slideUp" style={{ animationDelay: '0.1s' }}>
        <InputLabel title="Name" />
        <input
          type="text"
          name="name"
          value={formData.name}
          onChange={handleChange}
          className={`w-full px-5 py-3.5 border rounded-[1.25rem] bg-white shadow-[0_2px_10px_rgba(0,0,0,0.01)] focus:ring-2 focus:ring-[#0f284e]/20 focus:border-[#0f284e] outline-none transition-all duration-300 hover:shadow-[0_4px_16px_rgba(0,0,0,0.03)] text-[15px] ${errors.name ? 'border-red-400' : 'border-gray-100'
            }`}
        />
        {errors.name && (
          <p className="text-red-500 text-xs mt-1.5">{errors.name}</p>
        )}
      </div>

      {/* Age & Gender Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="animate-slideUp" style={{ animationDelay: '0.2s' }}>
          <InputLabel title="Age" />
          <input
            type="number"
            name="age"
            value={formData.age}
            onChange={handleChange}
            placeholder="e.g. 25"
            className={`w-full px-5 py-3.5 border rounded-[1.25rem] bg-white shadow-[0_2px_10px_rgba(0,0,0,0.01)] focus:ring-2 focus:ring-[#0f284e]/20 focus:border-[#0f284e] outline-none transition-all duration-300 hover:shadow-[0_4px_16px_rgba(0,0,0,0.03)] text-[15px] ${errors.age ? 'border-red-400' : 'border-gray-100'
              }`}
          />
          {errors.age && (
            <p className="text-red-500 text-xs mt-1.5">{errors.age}</p>
          )}
        </div>

        <div className="animate-slideUp" style={{ animationDelay: '0.3s' }}>
          <InputLabel title="Gender" />
          <div className="relative">
            <select
              name="gender"
              value={formData.gender}
              onChange={handleChange}
              className={`w-full px-5 py-3.5 border rounded-[1.25rem] bg-white shadow-[0_2px_10px_rgba(0,0,0,0.01)] focus:ring-2 focus:ring-[#0f284e]/20 focus:border-[#0f284e] outline-none transition-all duration-300 hover:shadow-[0_4px_16px_rgba(0,0,0,0.03)] text-[15px] appearance-none ${errors.gender ? 'border-red-400' : 'border-gray-100'
                }`}
            >
              <option value="" disabled className="text-gray-400">Select...</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
            {/* Custom arrow right icon */}
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-5 text-gray-400">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
          {errors.gender && (
            <p className="text-red-500 text-xs mt-1.5">{errors.gender}</p>
          )}
        </div>
      </div>

      {/* Height & Weight Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="animate-slideUp" style={{ animationDelay: '0.4s' }}>
          <InputLabel title="Height (cm)" />
          <input
            type="number"
            name="height"
            value={formData.height}
            onChange={handleChange}
            placeholder="e.g. 175"
            className={`w-full px-5 py-3.5 border rounded-[1.25rem] bg-white shadow-[0_2px_10px_rgba(0,0,0,0.01)] focus:ring-2 focus:ring-[#0f284e]/20 focus:border-[#0f284e] outline-none transition-all duration-300 hover:shadow-[0_4px_16px_rgba(0,0,0,0.03)] text-[15px] ${errors.height ? 'border-red-400' : 'border-gray-100'
              }`}
          />
          {errors.height && (
            <p className="text-red-500 text-xs mt-1.5">{errors.height}</p>
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
            className={`w-full px-5 py-3.5 border rounded-[1.25rem] bg-white shadow-[0_2px_10px_rgba(0,0,0,0.01)] focus:ring-2 focus:ring-[#0f284e]/20 focus:border-[#0f284e] outline-none transition-all duration-300 hover:shadow-[0_4px_16px_rgba(0,0,0,0.03)] text-[15px] ${errors.weight ? 'border-red-400' : 'border-gray-100'
              }`}
          />
          {errors.weight && (
            <p className="text-red-500 text-xs mt-1.5">{errors.weight}</p>
          )}
        </div>
      </div>

      <div className="animate-slideUp" style={{ animationDelay: '0.6s' }}>
        <label className="block text-[16px] font-medium text-[#0f284e] mb-4 mt-2">
          Dietary Preferences
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {dietaryOptions.map((option) => {
            const isSelected = formData.dietaryPreferences.includes(option.value);
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => handleDietaryChange(option.value)}
                className={`py-5 px-3 rounded-3xl border transition-all duration-300 flex flex-col items-center justify-center gap-2 group cursor-pointer ${isSelected
                    ? 'border-[#0f284e] bg-[#f8fbff] shadow-sm ring-1 ring-[#0f284e] transform scale-[1.02]'
                    : 'border-gray-100 bg-white hover:border-[#0f284e]/40 hover:bg-[#f8fbff] hover:shadow-md transform hover:-translate-y-1'
                  }`}
              >
                <div className="text-[32px] mb-1 relative flex items-center justify-center w-12 h-12">
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
                <div className={`text-[13px] font-medium transition-colors duration-300 ${isSelected ? 'text-[#0f284e]' : 'text-gray-500 group-hover:text-[#0f284e]'}`}>
                  {option.label}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="pt-6 animate-slideUp flex justify-end" style={{ animationDelay: '0.7s' }}>
        <button
          type="submit"
          disabled={isLoading}
          className="bg-gradient-to-r from-[#17435B] to-[#116d7a] text-white py-3.5 px-10 rounded-2xl font-semibold text-[15px] hover:shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:-translate-y-0.5"
        >
          {isLoading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
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
