import { useState, useMemo, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { productData } from '../../../mocks/products';

interface Product {
  id: number;
  name: string;
  brand: string;
  category: string;
  price: number;
  rating: number;
  reviewCount: number;
  image: string;
  description: string;
  skinTypes: string[];
  concerns: string[];
  keyIngredients: string[];
  inStock: boolean;
}

interface ProductCatalogProps {
  onStartQuiz?: () => void;
}

export default function ProductCatalog({ onStartQuiz }: ProductCatalogProps) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedSkinType, setSelectedSkinType] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('popular');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [compareList, setCompareList] = useState<number[]>([]);
  const [showCompareBar, setShowCompareBar] = useState(false);
  const [surveyCompleted, setSurveyCompleted] = useState(false);

  // Check if user has completed the skin survey
  useEffect(() => {
    const userProfile = localStorage.getItem('userProfile');
    const skinSurveyData = localStorage.getItem('skinSurveyData');
    setSurveyCompleted(!!(userProfile || skinSurveyData));
  }, []);

  // Handle category from URL params (from homepage CTAs)
  useEffect(() => {
    const categoryParam = searchParams.get('category');
    if (categoryParam) {
      setSelectedCategory(categoryParam);
    }
  }, [searchParams]);

  const categories = [
    { value: 'all', label: 'All Products', icon: 'ri-grid-line' },
    { value: 'cleanser', label: 'Cleansers', icon: 'ri-drop-line' },
    { value: 'toner', label: 'Toners', icon: 'ri-contrast-drop-line' },
    { value: 'serum', label: 'Serums', icon: 'ri-flask-line' },
    { value: 'moisturizer', label: 'Moisturizers', icon: 'ri-contrast-drop-2-line' },
    { value: 'sunscreen', label: 'Sunscreen', icon: 'ri-sun-line' },
    { value: 'treatment', label: 'Treatments', icon: 'ri-heart-pulse-line' },
    { value: 'mask', label: 'Masks', icon: 'ri-user-smile-line' },
  ];

  const skinTypes = [
    { value: 'all', label: 'All Skin Types' },
    { value: 'dry', label: 'Dry' },
    { value: 'oily', label: 'Oily' },
    { value: 'combination', label: 'Combination' },
    { value: 'normal', label: 'Normal' },
    { value: 'sensitive', label: 'Sensitive' },
  ];

  const products = productData;

  const filteredProducts = products.filter((product) => {
    const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
    const matchesSkinType = selectedSkinType === 'all' || product.skinTypes.includes(selectedSkinType);
    const matchesSearch = searchQuery === '' || 
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.keyIngredients.some(ing => ing.toLowerCase().includes(searchQuery.toLowerCase()));
    
    return matchesCategory && matchesSkinType && matchesSearch;
  });

  const sortedProducts = [...filteredProducts].sort((a, b) => {
    switch (sortBy) {
      case 'price-low':
        return a.price - b.price;
      case 'price-high':
        return b.price - a.price;
      case 'rating':
        return b.rating - a.rating;
      case 'popular':
      default:
        return b.reviewCount - a.reviewCount;
    }
  });

  const handleAddToCompare = (productId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (compareList.includes(productId)) {
      setCompareList(compareList.filter(id => id !== productId));
      if (compareList.length === 1) {
        setShowCompareBar(false);
      }
    } else if (compareList.length < 4) {
      const newList = [...compareList, productId];
      setCompareList(newList);
      setShowCompareBar(true);
    }
  };

  const handleCompare = () => {
    const compareIds = compareList.join(',');
    navigate(`/product-detail?compare=${compareIds}`);
  };

  const handleClearCompare = () => {
    setCompareList([]);
    setShowCompareBar(false);
  };

  const renderStars = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;

    for (let i = 0; i < fullStars; i++) {
      stars.push(<i key={`full-${i}`} className="ri-star-fill text-amber-500"></i>);
    }
    if (hasHalfStar) {
      stars.push(<i key="half" className="ri-star-half-fill text-amber-500"></i>);
    }
    const emptyStars = 5 - Math.ceil(rating);
    for (let i = 0; i < emptyStars; i++) {
      stars.push(<i key={`empty-${i}`} className="ri-star-line text-amber-500"></i>);
    }
    return stars;
  };

  return (
    <div className="max-w-7xl mx-auto px-6 lg:px-12 py-12">
      {/* Hero Section */}
      <div className="text-center mb-12">
        <h1 className="text-5xl lg:text-6xl font-serif text-forest-900 mb-6">
          Discover Your Perfect Match
        </h1>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
          Explore our curated collection of clean, science-backed skincare products tailored to your unique needs
        </p>
        
        {/* Quiz CTA Banner - Only show if survey not completed */}
        {!surveyCompleted && (
          <div className="bg-gradient-to-r from-sage-600 to-sage-700 rounded-3xl p-8 mb-12 shadow-xl">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="text-left text-white">
                <h3 className="text-2xl font-serif mb-2">Not sure where to start?</h3>
                <p className="text-sage-100">Take our personalized skin quiz to find products perfect for you</p>
              </div>
              <button 
                onClick={() => navigate('/skin-survey-account')}
                className="px-8 py-4 bg-white text-sage-700 rounded-full font-semibold hover:bg-cream-50 transition-all shadow-lg whitespace-nowrap cursor-pointer flex items-center space-x-2"
              >
                <i className="ri-questionnaire-line text-xl"></i>
                <span>Start Skin Quiz</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Search Bar */}
      <div className="mb-8">
        <div className="relative max-w-2xl mx-auto">
          <i className="ri-search-line absolute left-4 top-1/2 -translate-y-1/2 text-xl text-gray-400"></i>
          <input
            type="text"
            placeholder="Search products, brands, or ingredients..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-4 rounded-full border-2 border-gray-200 focus:border-sage-600 focus:outline-none text-sm transition-all"
          />
        </div>
      </div>

      {/* Filters */}
      <div className="mb-8">
        {/* Category Filter */}
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Categories</h3>
          <div className="flex flex-wrap gap-3">
            {categories.map((category) => (
              <button
                key={category.value}
                onClick={() => setSelectedCategory(category.value)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-full font-medium text-sm transition-all whitespace-nowrap cursor-pointer ${
                  selectedCategory === category.value
                    ? 'bg-sage-600 text-white shadow-md'
                    : 'bg-white text-gray-700 border border-gray-200 hover:border-sage-300'
                }`}
              >
                <i className={`${category.icon} text-base`}></i>
                <span>{category.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Skin Type & Sort */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <label className="text-sm font-semibold text-gray-700">Skin Type:</label>
            <select
              value={selectedSkinType}
              onChange={(e) => setSelectedSkinType(e.target.value)}
              className="px-4 py-2 rounded-full border border-gray-200 focus:border-sage-600 focus:outline-none text-sm cursor-pointer"
            >
              {skinTypes.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center space-x-3">
            <label className="text-sm font-semibold text-gray-700">Sort by:</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-4 py-2 rounded-full border border-gray-200 focus:border-sage-600 focus:outline-none text-sm cursor-pointer"
            >
              <option value="popular">Most Popular</option>
              <option value="rating">Highest Rated</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
            </select>
          </div>
        </div>
      </div>

      {/* Results Count */}
      <div className="mb-6">
        <p className="text-sm text-gray-600">
          Showing <span className="font-semibold text-forest-900">{sortedProducts.length}</span> products
        </p>
      </div>

      {/* Product Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6" data-product-shop>
        {sortedProducts.map((product) => (
          <div
            key={product.id}
            onClick={() => navigate(`/product-detail?id=${product.id}`)}
            className="bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all border border-gray-100 group cursor-pointer relative"
          >
            {/* Comparison Button */}
            <button
              onClick={(e) => {
                e.preventDefault();
                handleAddToCompare(product.id, e);
              }}
              className={`absolute top-3 right-3 w-10 h-10 flex items-center justify-center rounded-full transition-all cursor-pointer shadow-md z-10 ${
                compareList.includes(product.id)
                  ? 'bg-sage-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-sage-100'
              }`}
              title={compareList.includes(product.id) ? 'Remove from comparison' : 'Add to comparison'}
            >
              {compareList.includes(product.id) ? (
                <i className="ri-check-line text-xl"></i>
              ) : (
                <i className="ri-scales-line text-xl"></i>
              )}
            </button>

            {/* Product Image */}
            <div className="relative w-full h-80 overflow-hidden bg-gray-50">
              <img
                src={product.image}
                alt={product.name}
                className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-300"
              />
              {!product.inStock && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <span className="px-4 py-2 bg-white text-gray-900 font-semibold rounded-full text-sm">
                    Out of Stock
                  </span>
                </div>
              )}
            </div>

            {/* Product Info */}
            <div className="p-5">
              {/* Brand */}
              <p className="text-xs font-semibold text-sage-600 uppercase tracking-wide mb-2">
                {product.brand}
              </p>

              {/* Product Name */}
              <h3 className="text-lg font-semibold text-forest-900 mb-2 line-clamp-2">
                {product.name}
              </h3>

              {/* Rating */}
              <div className="flex items-center space-x-2 mb-3">
                <div className="flex items-center space-x-1">
                  {renderStars(product.rating)}
                </div>
                <span className="text-sm font-medium text-gray-700">{product.rating}</span>
                <span className="text-sm text-gray-500">({product.reviewCount})</span>
              </div>

              {/* Description */}
              <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                {product.description}
              </p>

              {/* Key Ingredients */}
              <div className="mb-4">
                <p className="text-xs font-semibold text-gray-700 mb-2">Key Ingredients:</p>
                <div className="flex flex-wrap gap-1">
                  {product.keyIngredients.slice(0, 2).map((ingredient, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-1 bg-cream-100 text-gray-700 text-xs rounded-full"
                    >
                      {ingredient}
                    </span>
                  ))}
                  {product.keyIngredients.length > 2 && (
                    <span className="px-2 py-1 bg-cream-100 text-gray-700 text-xs rounded-full">
                      +{product.keyIngredients.length - 2}
                    </span>
                  )}
                </div>
              </div>

              {/* Price & CTA */}
              <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                <div>
                  <p className="text-xs text-gray-500 mb-1">Estimated price range</p>
                  <span className="text-xl font-bold text-forest-900">
                    ${(product.price * 0.9).toFixed(2)} - ${(product.price * 1.1).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* No Results */}
      {sortedProducts.length === 0 && (
        <div className="text-center py-16">
          <div className="w-20 h-20 flex items-center justify-center bg-gray-100 rounded-full mx-auto mb-4">
            <i className="ri-search-line text-4xl text-gray-400"></i>
          </div>
          <h3 className="text-2xl font-serif text-forest-900 mb-2">No products found</h3>
          <p className="text-gray-600 mb-6">
            Try adjusting your filters or search query
          </p>
          <button
            onClick={() => {
              setSelectedCategory('all');
              setSelectedSkinType('all');
              setSearchQuery('');
            }}
            className="px-6 py-3 bg-sage-600 text-white rounded-full font-semibold hover:bg-sage-700 transition-all whitespace-nowrap cursor-pointer"
          >
            Clear All Filters
          </button>
        </div>
      )}

      {/* Comparison Bar */}
      {showCompareBar && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t-2 border-sage-600 shadow-2xl z-50 transition-all">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <div className="w-10 h-10 flex items-center justify-center bg-sage-100 rounded-full">
                    <i className="ri-scales-3-line text-xl text-sage-600"></i>
                  </div>
                  <div>
                    <h3 className="font-semibold text-forest-900">Compare Products</h3>
                    <p className="text-sm text-gray-600">
                      {compareList.length} of 4 products selected
                    </p>
                  </div>
                </div>
                <div className="hidden md:flex items-center space-x-2">
                  {compareList.map((productId) => {
                    const product = products.find(p => p.id === productId);
                    return product ? (
                      <div key={productId} className="flex items-center space-x-2 px-3 py-2 bg-sage-50 rounded-full">
                        <span className="text-sm font-medium text-forest-900">{product.brand}</span>
                        <button
                          onClick={(e) => handleAddToCompare(productId, e)}
                          className="w-5 h-5 flex items-center justify-center text-gray-500 hover:text-red-600 cursor-pointer"
                        >
                          <i className="ri-close-line text-base"></i>
                        </button>
                      </div>
                    ) : null;
                  })}
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <button
                  onClick={handleClearCompare}
                  className="px-4 py-2 text-gray-700 hover:text-gray-900 font-medium transition-colors whitespace-nowrap cursor-pointer"
                >
                  Clear All
                </button>
                <button
                  onClick={handleCompare}
                  disabled={compareList.length < 2}
                  className={`px-6 py-3 rounded-full font-semibold transition-all whitespace-nowrap ${
                    compareList.length >= 2
                      ? 'bg-sage-600 text-white hover:bg-sage-700 shadow-md cursor-pointer'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  Compare Now ({compareList.length})
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}