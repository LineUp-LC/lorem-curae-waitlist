import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import QuizFlow from '../skin-survey/components/QuizFlow';
import Navbar from '../../components/feature/Navbar';
import Footer from '../../components/feature/Footer';

export default function SkinSurveyAccountPage() {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    checkAuthAndRedirect();
  }, []);

  const checkAuthAndRedirect = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        // User not logged in, redirect to login with return URL
        navigate('/auth/login?redirect=/skin-survey-account', { replace: true });
      } else {
        // User is logged in, show the survey
        setIsAuthenticated(true);
      }
    } catch (error) {
      console.error('Error checking auth:', error);
      navigate('/auth/login?redirect=/skin-survey-account', { replace: true });
    }
  };

  const handleQuizComplete = (data: any) => {
    // Save quiz data
    localStorage.setItem('skinSurveyData', JSON.stringify(data));
    // Navigate to results
    navigate('/skin-survey/results');
  };

  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen bg-cream-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-sage-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream-50">
      <Navbar />
      <main className="pt-20">
        <QuizFlow onComplete={handleQuizComplete} />
      </main>
      <Footer />
    </div>
  );
}
