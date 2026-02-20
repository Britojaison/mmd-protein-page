'use client';

import { useState } from 'react';

export default function ProteinForm({ onSubmit }) {
  const [formData, setFormData] = useState({
    name: '',
    age: '',
    height: '',
    weight: ''
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    await onSubmit(formData);
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Full Name
        </label>
        <input
          type="text"
          name="name"
          required
          value={formData.name}
          onChange={handleChange}
          placeholder="Enter your name"
          className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all"
        />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
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
            className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
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
            className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
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
            className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all"
          />
        </div>
      </div>
      
      <button
        type="submit"
        disabled={loading}
        className="w-full bg-green-600 text-white py-4 rounded-md font-semibold text-lg hover:bg-green-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? 'Calculating...' : 'Get My Personalized Meal Plan'}
      </button>
    </form>
  );
}
