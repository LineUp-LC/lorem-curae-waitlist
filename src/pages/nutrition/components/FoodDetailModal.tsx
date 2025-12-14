
import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';

interface Food {
  id: string;
  name: string;
  category: string;
  ethnicity: string;
  skin_benefits: string[];
  other_benefits: string[];
  nutrients: Record<string, number>;
  calories: number;
  allergens: string[];
  preparation_time: number;
  difficulty_level: string;
  recipe_instructions: string;
  usage_count: number;
  creator_name?: string;
}

interface Store {
  id: string;
  name: string;
  type: string;
  city: string;
  state: string;
  website_url: string;
  delivery_available: boolean;
  organic_options: boolean;
  price: number;
  in_stock: boolean;
}

interface FoodDetailModalProps {
  food: Food;
  onClose: () => void;
  onAddToPlan: (food: Food) => void;
}

const FoodDetailModal = ({ food, onClose, onAddToPlan }: FoodDetailModalProps) => {
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFilter, setSelectedFilter] = useState('all');

  useEffect(() => {
    loadStores();
    incrementUsageCount();
  }, [food.id]);

  const loadStores = async () => {
    try {
      const { data, error } = await supabase
        .from('food_store_availability')
        .select(`
          price,
          in_stock,
          nutrition_stores (
            id,
            name,
            type,
            city,
            state,
            website_url,
            delivery_available,
            organic_options
          )
        `)
        .eq('food_id', food.id)
        .eq('in_stock', true);

      if (error) throw error;

      const storesData = data.map(item => ({
        ...item.nutrition_stores,
        price: item.price,
        in_stock: item.in_stock
      }));

      setStores(storesData);
    } catch (error) {
      console.error('Error loading stores:', error);
    } finally {
      setLoading(false);
    }
  };

  const incrementUsageCount = async () => {
    try {
      await supabase.rpc('increment', {
        row_id: food.id,
        table_name: 'nutrition_foods',
        column_name: 'usage_count'
      });
    } catch (error) {
      console.error('Error incrementing usage:', error);
    }
  };

  const filteredStores = stores.filter(store => {
    if (selectedFilter === 'delivery') return store.delivery_available;
    if (selectedFilter === 'organic') return store.organic_options;
    return true;
  });

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">{food.name}</h2>
          <button
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors cursor-pointer"
          >
            <i className="ri-close-line text-2xl text-gray-600"></i>
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Quick Info */}
          <div className="flex flex-wrap items-center gap-4">
            <span className="px-3 py-1 bg-sage-100 text-sage-700 rounded-full text-sm font-medium">
              {food.category}
            </span>
            {food.ethnicity && (
              <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium">
                {food.ethnicity} Cuisine
              </span>
            )}
            <span className="text-sm text-gray-600">
              <i className="ri-time-line mr-1"></i>
              {food.preparation_time} min
            </span>
            <span className="text-sm text-gray-600">
              <i className="ri-bar-chart-line mr-1"></i>
              {food.difficulty_level}
            </span>
            <span className="text-sm text-gray-600">
              <i className="ri-fire-line mr-1"></i>
              {food.calories} calories
            </span>
          </div>

          {/* Skin Benefits */}
          <div>
            <h3 className="text-lg font-bold text-gray-900 mb-3">Skin Benefits</h3>
            <div className="flex flex-wrap gap-2">
              {food.skin_benefits.map((benefit, idx) => (
                <span key={idx} className="px-3 py-2 bg-sage-50 text-sage-700 rounded-lg text-sm">
                  ✨ {benefit}
                </span>
              ))}
            </div>
          </div>

          {/* Other Benefits */}
          <div>
            <h3 className="text-lg font-bold text-gray-900 mb-3">Other Health Benefits</h3>
            <div className="flex flex-wrap gap-2">
              {food.other_benefits.map((benefit, idx) => (
                <span key={idx} className="px-3 py-2 bg-blue-50 text-blue-700 rounded-lg text-sm">
                  💪 {benefit}
                </span>
              ))}
            </div>
          </div>

          {/* Allergens */}
          {food.allergens.length > 0 && food.allergens[0] !== 'None' && (
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-3">⚠️ Allergens</h3>
              <div className="flex flex-wrap gap-2">
                {food.allergens.map((allergen, idx) => (
                  <span key={idx} className="px-3 py-2 bg-red-50 text-red-700 rounded-lg text-sm font-medium">
                    {allergen}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Recipe Instructions */}
          <div>
            <h3 className="text-lg font-bold text-gray-900 mb-3">How to Make This</h3>
            <div className="bg-cream-50 rounded-xl p-4">
              <p className="text-gray-700 leading-relaxed">{food.recipe_instructions}</p>
            </div>
          </div>

          {/* Where to Buy */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">Where to Buy Ingredients</h3>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setSelectedFilter('all')}
                  className={`px-3 py-1 rounded-full text-sm font-medium transition-colors whitespace-nowrap cursor-pointer ${
                    selectedFilter === 'all'
                      ? 'bg-sage-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setSelectedFilter('delivery')}
                  className={`px-3 py-1 rounded-full text-sm font-medium transition-colors whitespace-nowrap cursor-pointer ${
                    selectedFilter === 'delivery'
                      ? 'bg-sage-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Delivery
                </button>
                <button
                  onClick={() => setSelectedFilter('organic')}
                  className={`px-3 py-1 rounded-full text-sm font-medium transition-colors whitespace-nowrap cursor-pointer ${
                    selectedFilter === 'organic'
                      ? 'bg-sage-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Organic
                </button>
              </div>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin w-8 h-8 flex items-center justify-center border-4 border-sage-600 border-t-transparent rounded-full"></div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredStores.map(store => (
                  <div key={store.id} className="border border-gray-200 rounded-xl p-4 hover:border-sage-300 transition-colors">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h4 className="font-semibold text-gray-900">{store.name}</h4>
                        <p className="text-sm text-gray-600">{store.type}</p>
                        <p className="text-xs text-gray-500">{store.city}, {store.state}</p>
                      </div>
                      <span className="text-lg font-bold text-sage-600">${store.price}</span>
                    </div>
                    
                    <div className="flex items-center space-x-3 mb-3">
                      {store.delivery_available && (
                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                          🚚 Delivery
                        </span>
                      )}
                      {store.organic_options && (
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                          🌱 Organic
                        </span>
                      )}
                    </div>

                    {store.website_url && (
                      <a
                        href={store.website_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block w-full px-4 py-2 bg-sage-600 text-white text-center rounded-lg text-sm font-medium hover:bg-sage-700 transition-colors whitespace-nowrap cursor-pointer"
                      >
                        Visit Store
                      </a>
                    )}
                  </div>
                ))}
              </div>
            )}

            {!loading && filteredStores.length === 0 && (
              <p className="text-center text-gray-600 py-8">No stores found with selected filters</p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-4 pt-4 border-t border-gray-200">
            <button
              onClick={() => onAddToPlan(food)}
              className="flex-1 px-6 py-3 bg-sage-600 text-white rounded-xl font-semibold hover:bg-sage-700 transition-colors whitespace-nowrap cursor-pointer"
            >
              <i className="ri-calendar-line mr-2"></i>
              Add to Meal Plan
            </button>
            <button
              onClick={onClose}
              className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-colors whitespace-nowrap cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FoodDetailModal;
