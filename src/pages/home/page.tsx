import { useEffect } from 'react';
import Navbar from '../../components/feature/Navbar';
import Footer from '../../components/feature/Footer';
import HeroSection from './components/HeroSection';
import SmartProductSearch from './components/SmartProductSearch';
import PersonalizedAIGuidance from './components/PersonalizedAIGuidance';
import ProductComparison from './components/ProductComparison';
import QuizCTA from './components/QuizCTA';
import IngredientCarousel from './components/IngredientCarousel';
import RoutineTracker from './components/RoutineTracker';
import MarketplaceSection from './components/MarketplaceSection';
import TrustBanner from './components/TrustBanner';

const HomePage = () => {
  useEffect(() => {
    // Add FAQ structured data
    const faqSchema = {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "mainEntity": [
        {
          "@type": "Question",
          "name": "What is Curae?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Curae is a camera-powered skincare intelligence app. Point your phone at any skincare product and Curae instantly analyzes every ingredient against your skin profile, flagging allergens, detecting conflicts with your existing routine, and scoring compatibility. Every result is personalized to your specific skin type, concerns, and sensitivities."
          }
        },
        {
          "@type": "Question",
          "name": "How does Curae find compatible products?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "After you scan a product, Curae compares its ingredient profile against your skin data and your existing routine. It surfaces products that are compatible with both, scored by fit, not by paid placement. You can also see where to buy any of them directly in the app."
          }
        },
        {
          "@type": "Question",
          "name": "What do Confirmed, Likely, and Unknown mean?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Curae labels every ingredient conflict and caution with one of three confidence levels. Confirmed means the interaction or concern is well-established in the research. Likely means there is meaningful evidence but it isn't definitive. Unknown means we don't yet have reliable data, and we say so rather than guessing."
          }
        },
        {
          "@type": "Question",
          "name": "How does allergen detection work?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "When you set up your skin profile, you can specify allergens and sensitivities. Every time you scan a product, Curae cross-checks the full ingredient list against your allergens and surfaces any matches at the top of your results, above everything else. It checks ingredient synonyms and INCI names, not just exact matches."
          }
        },
        {
          "@type": "Question",
          "name": "How does routine conflict detection work?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "When you add products to your routine, Curae builds a cross-shelf ingredient map. Every new scan checks the incoming product's ingredients against everything already on your shelf and flags clashes like retinol + AHAs, vitamin C + niacinamide, and others. Each conflict is labeled Confirmed, Likely, or Unknown so you know how seriously to take it."
          }
        }
      ]
    };

    // Add Organization structured data
    const organizationSchema = {
      "@context": "https://schema.org",
      "@type": "Organization",
      "name": "Curae",
      "url": "https://loremcurae.com",
      "logo": "https://loremcurae.com/logo.png",
      "description": "Know if a skincare product is right for your skin. Scan any product, verify every ingredient across multiple sources, and catch formula changes automatically as brands reformulate.",
      "sameAs": [
        "https://facebook.com/loremcurae",
        "https://instagram.com/loremcurae",
        "https://twitter.com/loremcurae"
      ],
      "contactPoint": {
        "@type": "ContactPoint",
        "contactType": "Customer Service",
        "email": "support@loremcurae.com",
        "availableLanguage": "English"
      }
    };

    // Add WebSite structured data
    const websiteSchema = {
      "@context": "https://schema.org",
      "@type": "WebSite",
      "name": "Curae",
      "url": "https://loremcurae.com",
      "description": "Camera-powered skincare intelligence. Know what's in every product. Know if it's right for your skin.",
      "potentialAction": {
        "@type": "SearchAction",
        "target": "https://loremcurae.com/discover?q={search_term_string}",
        "query-input": "required name=search_term_string"
      }
    };

    const faqScript = document.createElement('script');
    faqScript.type = 'application/ld+json';
    faqScript.text = JSON.stringify(faqSchema);
    document.head.appendChild(faqScript);

    const orgScript = document.createElement('script');
    orgScript.type = 'application/ld+json';
    orgScript.text = JSON.stringify(organizationSchema);
    document.head.appendChild(orgScript);

    const websiteScript = document.createElement('script');
    websiteScript.type = 'application/ld+json';
    websiteScript.text = JSON.stringify(websiteSchema);
    document.head.appendChild(websiteScript);

    return () => {
      document.head.removeChild(faqScript);
      document.head.removeChild(orgScript);
      document.head.removeChild(websiteScript);
    };
  }, []);

  return (
    <div className="min-h-screen bg-cream-50">
      <Navbar />
      <main>
        <HeroSection />
        <SmartProductSearch />
        <PersonalizedAIGuidance />
        <ProductComparison />
        <QuizCTA />
        <IngredientCarousel />
        <RoutineTracker />
        <MarketplaceSection />
        <TrustBanner />
      </main>
      <Footer />
    </div>
  );
};

export default HomePage;
