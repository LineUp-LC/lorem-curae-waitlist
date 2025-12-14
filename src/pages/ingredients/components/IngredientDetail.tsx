interface IngredientDetailProps {
  ingredientId: string;
  onBack: () => void;
}

const IngredientDetail = ({ ingredientId, onBack }: IngredientDetailProps) => {
  // Mock data - in real app, fetch based on ingredientId
  const ingredient = {
    name: 'Hyaluronic Acid',
    scientificName: 'Sodium Hyaluronate',
    rating: 4.8,
    reviews: 1243,
    safetyRating: 'Excellent',
    icon: 'ri-drop-line',
    color: 'text-blue-500',
    bgColor: 'bg-blue-50',
    description: 'Hyaluronic acid is a naturally occurring substance in the skin that has the remarkable ability to attract and hold vast amounts of moisture. It works as a humectant, drawing water from the environment and deeper layers of skin to hydrate the surface.',
    benefits: [
      'Provides intense hydration to all skin types',
      'Plumps skin and reduces appearance of fine lines',
      'Improves skin texture and elasticity',
      'Supports skin barrier function',
      'Non-comedogenic and suitable for sensitive skin',
    ],
    howToUse: 'Apply to damp skin after cleansing and before moisturizer. Use morning and evening for best results. Can be layered with other serums.',
    concentration: '0.5% - 2% is most effective',
    skinTypes: ['All Skin Types', 'Dry', 'Dehydrated', 'Sensitive', 'Mature'],
    concerns: ['Dehydration', 'Fine Lines', 'Dullness', 'Texture'],
    myths: [
      {
        myth: 'Hyaluronic acid dries out your skin',
        truth: 'When used correctly on damp skin, HA is incredibly hydrating. The myth comes from using it in very dry environments without proper moisturizer on top.',
      },
      {
        myth: 'Higher molecular weight is always better',
        truth: 'Different molecular weights serve different purposes. Low molecular weight penetrates deeper, while high molecular weight provides surface hydration. A combination is ideal.',
      },
    ],
  };

  const communityReviews = [
    {
      id: 1,
      author: 'Emma L.',
      skinType: 'Dry',
      rating: 5,
      date: '2 weeks ago',
      comment: 'Game changer for my dehydrated skin! I noticed plumper, more hydrated skin within days. Now a staple in my routine.',
      helpful: 234,
    },
    {
      id: 2,
      author: 'Marcus T.',
      skinType: 'Combination',
      rating: 5,
      date: '1 month ago',
      comment: 'Works beautifully under moisturizer. Lightweight and absorbs quickly. My skin looks so much healthier.',
      helpful: 189,
    },
    {
      id: 3,
      author: 'Priya K.',
      skinType: 'Sensitive',
      rating: 4,
      date: '3 weeks ago',
      comment: 'Very gentle and effective. No irritation at all. Just remember to apply on damp skin for best results!',
      helpful: 156,
    },
  ];

  return (
    <div className="min-h-screen py-12 px-6 lg:px-12">
      <div className="max-w-6xl mx-auto">
        {/* Back Button */}
        <button
          onClick={onBack}
          className="flex items-center space-x-2 text-gray-600 hover:text-sage-600 mb-8 transition-colors cursor-pointer"
        >
          <i className="ri-arrow-left-line text-xl"></i>
          <span className="font-medium">Back to Library</span>
        </button>

        {/* Header */}
        <div className="bg-white rounded-3xl p-8 lg:p-12 shadow-lg mb-8">
          <div className="flex flex-col lg:flex-row gap-8 items-start">
            <div className={`w-24 h-24 flex items-center justify-center ${ingredient.bgColor} rounded-2xl flex-shrink-0`}>
              <i className={`${ingredient.icon} text-5xl ${ingredient.color}`}></i>
            </div>
            <div className="flex-1">
              <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
                <div>
                  <h1 className="text-4xl lg:text-5xl font-serif text-forest-900 mb-2">
                    {ingredient.name}
                  </h1>
                  <p className="text-xl text-gray-600">{ingredient.scientificName}</p>
                </div>
                <div className={`px-4 py-2 rounded-full text-sm font-semibold ${
                  ingredient.safetyRating === 'Excellent' 
                    ? 'bg-green-100 text-green-700' 
                    : 'bg-amber-100 text-amber-700'
                }`}>
                  Safety: {ingredient.safetyRating}
                </div>
              </div>
              <div className="flex items-center space-x-4 mb-6">
                <div className="flex items-center space-x-2">
                  <div className="flex items-center">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <i
                        key={star}
                        className={`ri-star-fill text-lg ${
                          star <= Math.round(ingredient.rating) ? 'text-amber-400' : 'text-gray-300'
                        }`}
                      ></i>
                    ))}
                  </div>
                  <span className="text-lg font-semibold text-forest-900">{ingredient.rating}</span>
                  <span className="text-gray-600">({ingredient.reviews} reviews)</span>
                </div>
              </div>
              <p className="text-lg text-gray-700 leading-relaxed">
                {ingredient.description}
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Benefits */}
            <div className="bg-white rounded-2xl p-8 shadow-md">
              <h2 className="text-2xl font-serif text-forest-900 mb-6">Key Benefits</h2>
              <ul className="space-y-3">
                {ingredient.benefits.map((benefit, index) => (
                  <li key={index} className="flex items-start space-x-3">
                    <i className="ri-checkbox-circle-fill text-xl text-sage-600 flex-shrink-0 mt-0.5"></i>
                    <span className="text-gray-700">{benefit}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* How to Use */}
            <div className="bg-gradient-to-br from-sage-50 to-cream-100 rounded-2xl p-8">
              <h2 className="text-2xl font-serif text-forest-900 mb-4">How to Use</h2>
              <p className="text-gray-700 leading-relaxed mb-4">{ingredient.howToUse}</p>
              <div className="bg-white rounded-xl p-4 border-l-4 border-sage-600">
                <p className="text-sm font-semibold text-forest-900 mb-1">Optimal Concentration</p>
                <p className="text-sm text-gray-600">{ingredient.concentration}</p>
              </div>
            </div>

            {/* Myth Busting */}
            <div className="bg-white rounded-2xl p-8 shadow-md">
              <h2 className="text-2xl font-serif text-forest-900 mb-6">Myth Busting</h2>
              <div className="space-y-6">
                {ingredient.myths.map((item, index) => (
                  <div key={index} className="border-l-4 border-coral-500 pl-6">
                    <div className="flex items-start space-x-2 mb-2">
                      <i className="ri-close-circle-line text-xl text-coral-500 flex-shrink-0 mt-0.5"></i>
                      <p className="font-semibold text-forest-900">{item.myth}</p>
                    </div>
                    <div className="flex items-start space-x-2">
                      <i className="ri-checkbox-circle-line text-xl text-sage-600 flex-shrink-0 mt-0.5"></i>
                      <p className="text-gray-700">{item.truth}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Community Reviews */}
            <div className="bg-white rounded-2xl p-8 shadow-md">
              <h2 className="text-2xl font-serif text-forest-900 mb-6">Community Reviews</h2>
              <div className="space-y-6">
                {communityReviews.map((review) => (
                  <div key={review.id} className="border-b border-gray-100 last:border-0 pb-6 last:pb-0">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="font-semibold text-forest-900">{review.author}</p>
                        <p className="text-sm text-gray-600">{review.skinType} • {review.date}</p>
                      </div>
                      <div className="flex items-center">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <i
                            key={star}
                            className={`ri-star-fill text-sm ${
                              star <= review.rating ? 'text-amber-400' : 'text-gray-300'
                            }`}
                          ></i>
                        ))}
                      </div>
                    </div>
                    <p className="text-gray-700 leading-relaxed mb-3">{review.comment}</p>
                    <button className="flex items-center space-x-2 text-sm text-gray-600 hover:text-sage-600 transition-colors cursor-pointer">
                      <i className="ri-thumb-up-line"></i>
                      <span>Helpful ({review.helpful})</span>
                    </button>
                  </div>
                ))}
              </div>
              <button className="w-full mt-6 py-3 border-2 border-sage-600 text-sage-600 rounded-full font-semibold hover:bg-sage-50 transition-colors whitespace-nowrap cursor-pointer">
                Read All Reviews
              </button>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Best For */}
            <div className="bg-white rounded-2xl p-6 shadow-md">
              <h3 className="text-lg font-semibold text-forest-900 mb-4">Best For</h3>
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-2">Skin Types</p>
                  <div className="flex flex-wrap gap-2">
                    {ingredient.skinTypes.map((type, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-sage-100 text-sage-700 text-xs font-medium rounded-full"
                      >
                        {type}
                      </span>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-2">Concerns</p>
                  <div className="flex flex-wrap gap-2">
                    {ingredient.concerns.map((concern, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-coral-100 text-coral-700 text-xs font-medium rounded-full"
                      >
                        {concern}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* CTA */}
            <div className="bg-gradient-to-br from-forest-800 to-forest-900 rounded-2xl p-6 text-white">
              <h3 className="text-xl font-serif mb-3">Find Products</h3>
              <p className="text-cream-200 text-sm mb-6">
                Discover products featuring this ingredient in our curated marketplace.
              </p>
              <button className="w-full py-3 bg-white text-forest-900 rounded-full font-semibold hover:bg-cream-100 transition-colors whitespace-nowrap cursor-pointer">
                Shop Now
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IngredientDetail;