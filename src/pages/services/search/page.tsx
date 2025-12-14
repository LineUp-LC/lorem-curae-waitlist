import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Navbar from '../../../components/feature/Navbar';
import Footer from '../../../components/feature/Footer';

interface Business {
  id: string;
  name: string;
  rating: number;
  reviewCount: number;
  location: string;
  distance: string;
  specialties: string[];
  image: string;
  priceRange: string;
  availability: string;
}

const allBusinesses: Business[] = [
  {
    id: '1',
    name: 'Radiance Skin Studio',
    rating: 4.9,
    reviewCount: 342,
    location: 'Downtown, Los Angeles',
    distance: '2.3 miles',
    specialties: ['Acne Treatment', 'Chemical Peels', 'Microneedling'],
    image: 'https://readdy.ai/api/search-image?query=modern%20luxury%20skincare%20spa%20interior%20with%20treatment%20beds%20soft%20lighting%20elegant%20minimalist%20design%20professional%20aesthetic%20clean%20white%20surfaces&width=600&height=400&seq=spa-search-1&orientation=landscape',
    priceRange: '$$$',
    availability: 'Available Today',
  },
  {
    id: '2',
    name: 'Glow Aesthetics Clinic',
    rating: 4.8,
    reviewCount: 289,
    location: 'Beverly Hills, CA',
    distance: '5.1 miles',
    specialties: ['Laser Therapy', 'Anti-Aging', 'Hydrafacial'],
    image: 'https://readdy.ai/api/search-image?query=upscale%20medical%20spa%20treatment%20room%20with%20advanced%20skincare%20equipment%20modern%20professional%20interior%20soft%20ambient%20lighting%20luxury%20aesthetic&width=600&height=400&seq=spa-search-2&orientation=landscape',
    priceRange: '$$$$',
    availability: 'Available Tomorrow',
  },
  {
    id: '3',
    name: 'Pure Essence Spa',
    rating: 4.7,
    reviewCount: 456,
    location: 'Santa Monica, CA',
    distance: '8.7 miles',
    specialties: ['Organic Facials', 'LED Therapy', 'Dermaplaning'],
    image: 'https://readdy.ai/api/search-image?query=serene%20natural%20spa%20room%20with%20plants%20organic%20skincare%20products%20calming%20atmosphere%20zen%20aesthetic%20soft%20natural%20lighting%20wellness%20center&width=600&height=400&seq=spa-search-3&orientation=landscape',
    priceRange: '$$',
    availability: 'Available Today',
  },
  {
    id: '4',
    name: 'Clear Skin Dermatology',
    rating: 4.9,
    reviewCount: 521,
    location: 'West Hollywood, CA',
    distance: '4.2 miles',
    specialties: ['Medical Facials', 'Acne Scarring', 'Rosacea Treatment'],
    image: 'https://readdy.ai/api/search-image?query=clinical%20dermatology%20office%20with%20medical%20equipment%20professional%20skincare%20clinic%20modern%20clean%20aesthetic%20white%20coat%20medical%20setting&width=600&height=400&seq=spa-search-4&orientation=landscape',
    priceRange: '$$$$',
    availability: 'Available This Week',
  },
  {
    id: '5',
    name: 'Zen Beauty Lounge',
    rating: 4.6,
    reviewCount: 198,
    location: 'Pasadena, CA',
    distance: '12.5 miles',
    specialties: ['Relaxation Facials', 'Massage Therapy', 'Body Treatments'],
    image: 'https://readdy.ai/api/search-image?query=peaceful%20spa%20lounge%20with%20candles%20soft%20towels%20relaxing%20ambiance%20zen%20decor%20natural%20elements%20calming%20aesthetic%20wellness%20space&width=600&height=400&seq=spa-search-5&orientation=landscape',
    priceRange: '$$',
    availability: 'Available Today',
  },
  {
    id: '6',
    name: 'Elite Skin Solutions',
    rating: 4.8,
    reviewCount: 367,
    location: 'Culver City, CA',
    distance: '6.8 miles',
    specialties: ['Pigmentation Treatment', 'Skin Tightening', 'PRP Therapy'],
    image: 'https://readdy.ai/api/search-image?query=high-end%20skincare%20clinic%20with%20modern%20technology%20advanced%20treatment%20equipment%20luxury%20medical%20spa%20interior%20professional%20setting&width=600&height=400&seq=spa-search-6&orientation=landscape',
    priceRange: '$$$',
    availability: 'Available Tomorrow',
  },
];

export default function ServicesSearchPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const concernFilter = location.state?.concernFilter;

  const [searchQuery, setSearchQuery] = useState(concernFilter || '');
  const [businesses, setBusinesses] = useState<Business[]>(allBusinesses);
  const [sortBy, setSortBy] = useState<'rating' | 'distance' | 'price'>('rating');

  const handleSearch = () => {
    if (!searchQuery.trim()) {
      setBusinesses(allBusinesses);
      return;
    }

    const filtered = allBusinesses.filter(
      (business) =>
        business.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        business.specialties.some((s) => s.toLowerCase().includes(searchQuery.toLowerCase())) ||
        business.location.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setBusinesses(filtered);
  };

  const handleSort = (sortType: 'rating' | 'distance' | 'price') => {
    setSortBy(sortType);
    const sorted = [...businesses].sort((a, b) => {
      if (sortType === 'rating') return b.rating - a.rating;
      if (sortType === 'distance') return parseFloat(a.distance) - parseFloat(b.distance);
      if (sortType === 'price') return a.priceRange.length - b.priceRange.length;
      return 0;
    });
    setBusinesses(sorted);
  };

  const handleViewBusiness = (id: string) => {
    navigate(`/services/${id}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#F8F6F3] to-white">
      <Navbar />
      
      <main className="pt-24 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Search Header */}
          <div className="mb-8">
            <h1 className="font-['Cormorant_Garamond'] text-5xl font-bold text-[#2C5F4F] mb-4">
              Find Your Perfect Skincare Professional
            </h1>
            <p className="text-lg text-gray-600 mb-6">
              Search by treatment, location, or business name
            </p>

            {/* Search Bar */}
            <div className="flex gap-4 mb-6">
              <div className="flex-1 relative">
                <i className="ri-search-line absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-xl"></i>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  placeholder="Search for treatments, businesses, or locations..."
                  className="w-full pl-12 pr-4 py-4 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2C5F4F]/20 text-lg"
                />
              </div>
              <button
                onClick={handleSearch}
                className="px-8 py-4 bg-[#2C5F4F] text-white rounded-xl hover:bg-[#234839] transition-colors font-medium whitespace-nowrap cursor-pointer"
              >
                Search
              </button>
            </div>

            {/* Filters */}
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium text-gray-600">Sort by:</span>
              <div className="flex gap-2">
                <button
                  onClick={() => handleSort('rating')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                    sortBy === 'rating'
                      ? 'bg-[#2C5F4F] text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <i className="ri-star-line mr-1"></i>
                  Highest Rated
                </button>
                <button
                  onClick={() => handleSort('distance')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                    sortBy === 'distance'
                      ? 'bg-[#2C5F4F] text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <i className="ri-map-pin-line mr-1"></i>
                  Nearest
                </button>
                <button
                  onClick={() => handleSort('price')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                    sortBy === 'price'
                      ? 'bg-[#2C5F4F] text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <i className="ri-money-dollar-circle-line mr-1"></i>
                  Price
                </button>
              </div>
            </div>
          </div>

          {/* Results Count */}
          <div className="mb-6">
            <p className="text-gray-600">
              <span className="font-bold text-[#2C5F4F]">{businesses.length}</span> businesses found
              {searchQuery && <span> for "{searchQuery}"</span>}
            </p>
          </div>

          {/* Business List */}
          <div className="space-y-6">
            {businesses.map((business) => (
              <div
                key={business.id}
                className="bg-white rounded-2xl shadow-sm overflow-hidden hover:shadow-lg transition-all group cursor-pointer"
                onClick={() => handleViewBusiness(business.id)}
              >
                <div className="flex flex-col md:flex-row">
                  {/* Image */}
                  <div className="md:w-80 h-64 md:h-auto overflow-hidden flex-shrink-0">
                    <img
                      src={business.image}
                      alt={business.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>

                  {/* Content */}
                  <div className="flex-1 p-6">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-['Cormorant_Garamond'] text-3xl font-bold text-[#2C5F4F] mb-2">
                          {business.name}
                        </h3>
                        <div className="flex items-center gap-3 mb-2">
                          <div className="flex items-center gap-1">
                            <i className="ri-star-fill text-[#E8956C]"></i>
                            <span className="font-bold text-[#2C5F4F]">{business.rating}</span>
                            <span className="text-sm text-gray-500">({business.reviewCount} reviews)</span>
                          </div>
                          <span className="text-gray-400">•</span>
                          <span className="text-sm font-medium text-[#2C5F4F]">{business.priceRange}</span>
                        </div>
                      </div>
                      <div className="px-3 py-1 bg-green-50 text-green-700 rounded-full text-xs font-medium">
                        {business.availability}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
                      <i className="ri-map-pin-line text-[#2C5F4F]"></i>
                      <span>{business.location}</span>
                      <span className="text-gray-400">•</span>
                      <span>{business.distance}</span>
                    </div>

                    <div className="mb-4">
                      <p className="text-sm text-gray-600 mb-2">Specialties:</p>
                      <div className="flex flex-wrap gap-2">
                        {business.specialties.map((specialty, idx) => (
                          <span
                            key={idx}
                            className="px-3 py-1 bg-[#F8F6F3] text-[#2C5F4F] text-sm font-medium rounded-full"
                          >
                            {specialty}
                          </span>
                        ))}
                      </div>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleViewBusiness(business.id);
                      }}
                      className="px-6 py-3 bg-[#2C5F4F] text-white rounded-lg hover:bg-[#234839] transition-colors text-sm font-medium whitespace-nowrap cursor-pointer"
                    >
                      View Details &amp; Book Appointment
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Empty State */}
          {businesses.length === 0 && (
            <div className="text-center py-16">
              <div className="w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-6">
                <i className="ri-search-line text-gray-400 text-5xl"></i>
              </div>
              <h3 className="font-['Cormorant_Garamond'] text-3xl font-bold text-gray-400 mb-3">
                No Results Found
              </h3>
              <p className="text-gray-500 mb-8">
                Try adjusting your search or filters
              </p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setBusinesses(allBusinesses);
                }}
                className="px-8 py-4 bg-[#2C5F4F] text-white rounded-lg hover:bg-[#234839] transition-colors font-medium whitespace-nowrap cursor-pointer"
              >
                Clear Search
              </button>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
