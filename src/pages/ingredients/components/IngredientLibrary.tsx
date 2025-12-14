import { useState } from 'react';

interface IngredientLibraryProps {
  onSelectIngredient: (id: string) => void;
}

const IngredientLibrary = ({ onSelectIngredient }: IngredientLibraryProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const categories = [
    { id: 'all', name: 'All Ingredients', icon: 'ri-grid-line' },
    { id: 'hydration', name: 'Hydration', icon: 'ri-drop-line' },
    { id: 'brightening', name: 'Brightening', icon: 'ri-sun-line' },
    { id: 'antiaging', name: 'Anti-Aging', icon: 'ri-time-line' },
    { id: 'soothing', name: 'Soothing', icon: 'ri-heart-line' },
    { id: 'exfoliation', name: 'Exfoliation', icon: 'ri-contrast-drop-2-line' },
  ];

  const ingredients = [
    {
      id: 'hyaluronic-acid',
      name: 'Hyaluronic Acid',
      category: 'hydration',
      scientificName: 'Sodium Hyaluronate',
      rating: 4.8,
      reviews: 1243,
      benefits: ['Deep Hydration', 'Plumping', 'Anti-Aging'],
      description: 'A powerful humectant that attracts and retains moisture in the skin.',
      safetyRating: 'Excellent',
      icon: 'ri-drop-line',
      color: 'text-gray-600',
      bgColor: 'bg-gray-50',
    },
    {
      id: 'niacinamide',
      name: 'Niacinamide',
      category: 'brightening',
      scientificName: 'Vitamin B3',
      rating: 4.9,
      reviews: 2156,
      benefits: ['Brightening', 'Pore Minimizing', 'Barrier Support'],
      description: 'A versatile vitamin that improves skin tone and strengthens the barrier.',
      safetyRating: 'Excellent',
      icon: 'ri-star-line',
      color: 'text-gray-600',
      bgColor: 'bg-gray-50',
    },
    {
      id: 'retinol',
      name: 'Retinol',
      category: 'antiaging',
      scientificName: 'Vitamin A',
      rating: 4.7,
      reviews: 1876,
      benefits: ['Anti-Aging', 'Cell Turnover', 'Texture Improvement'],
      description: 'A gold-standard ingredient for reducing signs of aging and improving texture.',
      safetyRating: 'Good',
      icon: 'ri-flashlight-line',
      color: 'text-gray-600',
      bgColor: 'bg-gray-50',
    },
    {
      id: 'vitamin-c',
      name: 'Vitamin C',
      category: 'brightening',
      scientificName: 'Ascorbic Acid',
      rating: 4.6,
      reviews: 1654,
      benefits: ['Brightening', 'Antioxidant', 'Collagen Support'],
      description: 'A powerful antioxidant that brightens and protects skin from damage.',
      safetyRating: 'Excellent',
      icon: 'ri-sun-line',
      color: 'text-gray-600',
      bgColor: 'bg-gray-50',
    },
    {
      id: 'ceramides',
      name: 'Ceramides',
      category: 'hydration',
      scientificName: 'Ceramide Complex',
      rating: 4.8,
      reviews: 987,
      benefits: ['Barrier Repair', 'Hydration', 'Protection'],
      description: 'Essential lipids that restore and maintain the skin\'s protective barrier.',
      safetyRating: 'Excellent',
      icon: 'ri-shield-line',
      color: 'text-gray-600',
      bgColor: 'bg-gray-50',
    },
    {
      id: 'peptides',
      name: 'Peptides',
      category: 'antiaging',
      scientificName: 'Amino Acid Chains',
      rating: 4.7,
      reviews: 1123,
      benefits: ['Collagen Support', 'Firming', 'Anti-Aging'],
      description: 'Amino acid chains that signal skin to produce more collagen.',
      safetyRating: 'Excellent',
      icon: 'ri-links-line',
      color: 'text-gray-600',
      bgColor: 'bg-gray-50',
    },
    {
      id: 'centella-asiatica',
      name: 'Centella Asiatica',
      category: 'soothing',
      scientificName: 'Cica / Tiger Grass',
      rating: 4.9,
      reviews: 1432,
      benefits: ['Soothing', 'Healing', 'Anti-Inflammatory'],
      description: 'A botanical extract known for its calming and healing properties.',
      safetyRating: 'Excellent',
      icon: 'ri-leaf-line',
      color: 'text-gray-600',
      bgColor: 'bg-gray-50',
    },
    {
      id: 'salicylic-acid',
      name: 'Salicylic Acid',
      category: 'exfoliation',
      scientificName: 'Beta Hydroxy Acid (BHA)',
      rating: 4.5,
      reviews: 1765,
      benefits: ['Exfoliation', 'Pore Clearing', 'Acne Treatment'],
      description: 'A BHA that penetrates pores to clear congestion and prevent breakouts.',
      safetyRating: 'Good',
      icon: 'ri-contrast-drop-2-line',
      color: 'text-gray-600',
      bgColor: 'bg-gray-50',
    },
    {
      id: 'glycolic-acid',
      name: 'Glycolic Acid',
      category: 'exfoliation',
      scientificName: 'Alpha Hydroxy Acid (AHA)',
      rating: 4.6,
      reviews: 1543,
      benefits: ['Exfoliation', 'Brightening', 'Texture Improvement'],
      description: 'An AHA that exfoliates the surface to reveal brighter, smoother skin.',
      safetyRating: 'Good',
      icon: 'ri-contrast-line',
      color: 'text-gray-600',
      bgColor: 'bg-gray-50',
    },
  ];

  const filteredIngredients = ingredients.filter((ingredient) => {
    const matchesSearch = ingredient.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ingredient.scientificName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || ingredient.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen py-12 px-6 lg:px-12">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl lg:text-6xl font-serif text-forest-900 mb-4">
            Ingredient Library
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Explore our comprehensive database of skincare ingredients with science-backed explanations, safety ratings, and community reviews.
          </p>
        </div>

        {/* Search Bar */}
        <div className="max-w-2xl mx-auto mb-12">
          <div className="relative">
            <i className="ri-search-line absolute left-6 top-1/2 -translate-y-1/2 text-2xl text-gray-400"></i>
            <input
              type="text"
              placeholder="Search ingredients by name or scientific name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-16 pr-6 py-4 bg-white border-2 border-gray-200 rounded-full text-base focus:outline-none focus:border-sage-600 transition-colors"
            />
          </div>
        </div>

        {/* Category Filter */}
        <div className="flex flex-wrap items-center justify-center gap-3 mb-12">
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`flex items-center space-x-2 px-6 py-3 rounded-full font-medium transition-all whitespace-nowrap cursor-pointer ${
                selectedCategory === category.id
                  ? 'bg-sage-600 text-white shadow-lg'
                  : 'bg-white text-gray-700 border border-gray-200 hover:border-sage-600 hover:text-sage-600'
              }`}
            >
              <i className={`${category.icon} text-lg`}></i>
              <span>{category.name}</span>
            </button>
          ))}
        </div>

        {/* Results Count */}
        <div className="mb-8">
          <p className="text-gray-600">
            Showing <strong>{filteredIngredients.length}</strong> ingredients
          </p>
        </div>

        {/* Ingredients Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredIngredients.map((ingredient) => (
            <div
              key={ingredient.id}
              onClick={() => onSelectIngredient(ingredient.id)}
              className="bg-white rounded-2xl p-6 shadow-md hover:shadow-xl transition-all border border-gray-100 cursor-pointer group"
            >
              <div className="flex items-start justify-between mb-4">
                <div className={`w-14 h-14 flex items-center justify-center ${ingredient.bgColor} rounded-full`}>
                  <i className={`${ingredient.icon} text-2xl ${ingredient.color}`}></i>
                </div>
              </div>

              <h3 className="text-xl font-semibold text-forest-900 mb-1 group-hover:text-sage-600 transition-colors">
                {ingredient.name}
              </h3>
              <p className="text-sm text-gray-500 mb-3">{ingredient.scientificName}</p>

              <p className="text-sm text-gray-600 leading-relaxed mb-4">
                {ingredient.description}
              </p>

              <div className="flex flex-wrap gap-2 mb-4">
                {ingredient.benefits.slice(0, 3).map((benefit, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-cream-100 text-forest-800 text-xs font-medium rounded-full"
                  >
                    {benefit}
                  </span>
                ))}
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                <div className="flex items-center space-x-2">
                  <div className="flex items-center">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <i
                        key={star}
                        className={`ri-star-fill text-sm ${
                          star <= Math.round(ingredient.rating) ? 'text-amber-400' : 'text-gray-300'
                        }`}
                      ></i>
                    ))}
                  </div>
                  <span className="text-sm text-gray-600">({ingredient.reviews})</span>
                </div>
                <i className="ri-arrow-right-line text-xl text-sage-600 group-hover:translate-x-1 transition-transform"></i>
              </div>
            </div>
          ))}
        </div>

        {filteredIngredients.length === 0 && (
          <div className="text-center py-16">
            <i className="ri-search-line text-6xl text-gray-300 mb-4"></i>
            <p className="text-xl text-gray-600">No ingredients found matching your search.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default IngredientLibrary;
