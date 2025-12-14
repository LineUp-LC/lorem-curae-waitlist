import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import Navbar from '../../components/feature/Navbar';
import Footer from '../../components/feature/Footer';
import ProductOverview from '../product-detail/components/ProductOverview';
import ProductReviews from '../product-detail/components/ProductReviews';
import SimilarProducts from '../product-detail/components/SimilarProducts';
import ProductComparison from '../product-detail/components/ProductComparison';
import PurchaseOptions from '../product-detail/components/PurchaseOptions';

const ProductDetailPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const productId = searchParams.get('id');
  const [showComparison, setShowComparison] = useState(false);
  const [selectedForComparison, setSelectedForComparison] = useState<number[]>([]);

  useEffect(() => {
    if (!productId) {
      navigate('/discover');
    }
  }, [productId, navigate]);

  const handleAddToComparison = (id: number) => {
    if (selectedForComparison.includes(id)) {
      setSelectedForComparison(selectedForComparison.filter(pid => pid !== id));
    } else if (selectedForComparison.length < 3) {
      setSelectedForComparison([...selectedForComparison, id]);
    }
  };

  return (
    <div className="min-h-screen bg-cream-50">
      <Navbar />
      <main className="pt-20">
        {productId && (
          <>
            <ProductOverview 
              productId={parseInt(productId)} 
              onAddToComparison={handleAddToComparison}
              isInComparison={selectedForComparison.includes(parseInt(productId))}
            />
            
            <PurchaseOptions productId={parseInt(productId)} />
            
            <ProductReviews productId={parseInt(productId)} />
            
            <SimilarProducts 
              productId={parseInt(productId)}
              onAddToComparison={handleAddToComparison}
              selectedForComparison={selectedForComparison}
            />

            {selectedForComparison.length > 0 && (
              <div className="fixed top-24 left-6 z-40">
                <button
                  onClick={() => setShowComparison(true)}
                  className="flex items-center space-x-3 px-6 py-4 bg-forest-900 text-white rounded-full shadow-2xl hover:bg-forest-800 transition-all cursor-pointer whitespace-nowrap"
                >
                  <i className="ri-scales-line text-xl"></i>
                  <span className="font-semibold">Compare ({selectedForComparison.length})</span>
                </button>
              </div>
            )}

            {showComparison && (
              <ProductComparison
                productIds={selectedForComparison}
                onClose={() => setShowComparison(false)}
                onRemove={handleAddToComparison}
              />
            )}
          </>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default ProductDetailPage;
