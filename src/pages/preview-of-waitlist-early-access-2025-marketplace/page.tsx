import { Link } from 'react-router-dom';
import SupabaseWaitlistForm from '../../components/SupabaseWaitlistForm';

/**
 * MarketplaceWaitlistPage Component
 * 
 * Brand Voice: Calm, confident, science-backed, human
 * Color Mood: Warm cream, soft coral accents, grounded earth tones
 * Narrative Arc: Problem → Platform → Tools → Growth → Community → Action
 * 
 * This page mirrors the regular waitlist page's structure and emotional arc
 * but speaks directly to indie beauty creators.
 */

const MarketplaceWaitlistPage = () => {
  return (
    <div className="lc-marketplace-page">
      <style>{`
        .lc-marketplace-page {
          min-height: 100vh;
          background: linear-gradient(180deg, #FDF8F5 0%, #FFF9F5 50%, #FFFBF8 100%);
          font-family: var(--lc-font-serif, 'Cormorant Garamond', Georgia, serif);
          color: #2D2A26;
        }
        
        /* Header */
        .lc-header {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          background: rgba(253, 248, 245, 0.95);
          backdrop-filter: blur(10px);
          border-bottom: 1px solid rgba(196, 112, 77, 0.08);
          z-index: 50;
        }
        
        .lc-header-inner {
          max-width: 1200px;
          margin: 0 auto;
          padding: 1rem 1.5rem;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        
        .lc-logo {
          font-family: var(--lc-font-serif, 'Cormorant Garamond', Georgia, serif);
          font-size: 1.5rem;
          font-weight: 600;
          color: #2D2A26;
          text-decoration: none;
        }
        
        .lc-header-cta {
          font-family: var(--lc-font-sans, 'DM Sans', sans-serif);
          font-size: 0.875rem;
          font-weight: 600;
          padding: 0.625rem 1.5rem;
          background: #C4704D;
          color: white;
          border-radius: 100px;
          text-decoration: none;
          transition: background 0.3s ease;
        }
        
        .lc-header-cta:hover {
          background: #8B4D35;
        }
        
        /* Regular Waitlist Banner */
        .lc-regular-banner {
          background: rgba(196, 112, 77, 0.06);
          border-bottom: 1px solid rgba(196, 112, 77, 0.1);
          padding: 0.75rem 1.5rem;
          text-align: center;
          margin-top: 60px;
        }
        
        .lc-regular-link {
          font-family: var(--lc-font-sans, 'DM Sans', sans-serif);
          font-size: 0.875rem;
          font-weight: 500;
          color: #C4704D;
          text-decoration: none;
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          transition: color 0.3s ease;
        }
        
        .lc-regular-link:hover {
          color: #8B4D35;
        }
        
        /* Hero Section */
        .lc-hero {
          padding: 6rem 1.5rem 5rem;
          text-align: center;
          position: relative;
          overflow: hidden;
        }
        
        .lc-hero-bg {
          position: absolute;
          inset: 0;
          background: linear-gradient(
            135deg,
            #FDF8F5 0%,
            #F8F4F0 20%,
            #FDF8F5 40%,
            #E8D4CC 60%,
            #FDF8F5 80%,
            #FFFBF8 100%
          );
          background-size: 400% 400%;
          animation: gradientShift 20s ease infinite;
        }
        
        @keyframes gradientShift {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        
        .lc-hero-content {
          position: relative;
          z-index: 1;
          max-width: 900px;
          margin: 0 auto;
        }
        
        .lc-badge {
          font-family: var(--lc-font-sans, 'DM Sans', sans-serif);
          font-size: 0.75rem;
          font-weight: 600;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          color: #C4704D;
          background: rgba(196, 112, 77, 0.08);
          padding: 0.5rem 1.25rem;
          border-radius: 100px;
          margin-bottom: 2rem;
          display: inline-block;
          border: 1px solid rgba(196, 112, 77, 0.15);
        }
        
        .lc-headline {
          font-family: var(--lc-font-serif, 'Cormorant Garamond', Georgia, serif);
          font-size: clamp(2.5rem, 6vw, 4rem);
          font-weight: 500;
          line-height: 1.15;
          margin-bottom: 1.5rem;
          letter-spacing: -0.01em;
          color: #2D2A26;
        }
        
        .lc-headline em {
          font-style: italic;
          color: #C4704D;
        }
        
        .lc-subhead {
          font-family: var(--lc-font-sans, 'DM Sans', sans-serif);
          font-size: 1.125rem;
          color: #6B635A;
          max-width: 650px;
          margin: 0 auto 2.5rem;
          line-height: 1.7;
        }
        
        .lc-problem-box {
          font-family: var(--lc-font-sans, 'DM Sans', sans-serif);
          font-size: 0.9375rem;
          color: #6B635A;
          max-width: 650px;
          margin: 0 auto 3rem;
          line-height: 1.8;
          padding: 1.5rem 2rem;
          background: rgba(255, 255, 255, 0.7);
          border-radius: 16px;
          border: 1px solid rgba(196, 112, 77, 0.08);
          backdrop-filter: blur(10px);
        }
        
        .lc-problem-box strong {
          color: #2D2A26;
        }
        
        .lc-cta-group {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1rem;
        }
        
        @media (min-width: 640px) {
          .lc-cta-group {
            flex-direction: row;
            justify-content: center;
          }
        }
        
        .lc-btn-primary {
          font-family: var(--lc-font-sans, 'DM Sans', sans-serif);
          font-size: 1rem;
          font-weight: 600;
          padding: 1rem 2rem;
          background: #C4704D;
          color: white;
          border: none;
          border-radius: 100px;
          cursor: pointer;
          text-decoration: none;
          display: inline-block;
          transition: all 0.3s ease;
          width: 100%;
        }
        
        @media (min-width: 640px) {
          .lc-btn-primary {
            width: auto;
          }
        }
        
        .lc-btn-primary:hover {
          background: #8B4D35;
          transform: translateY(-2px);
          box-shadow: 0 10px 30px rgba(196, 112, 77, 0.2);
        }
        
        .lc-btn-secondary {
          font-family: var(--lc-font-sans, 'DM Sans', sans-serif);
          font-size: 1rem;
          font-weight: 600;
          padding: 1rem 2rem;
          background: white;
          color: #2D2A26;
          border: 1.5px solid rgba(45, 42, 38, 0.2);
          border-radius: 100px;
          cursor: pointer;
          text-decoration: none;
          display: inline-block;
          transition: all 0.3s ease;
          width: 100%;
        }
        
        @media (min-width: 640px) {
          .lc-btn-secondary {
            width: auto;
          }
        }
        
        .lc-btn-secondary:hover {
          border-color: #C4704D;
          color: #C4704D;
        }
        
        /* Why We Built This Section */
        .lc-why-section {
          padding: 5rem 1.5rem;
          background: linear-gradient(180deg, #FFFBF8 0%, #F8F4F0 100%);
          position: relative;
        }
        
        .lc-why-section::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(196, 112, 77, 0.2), transparent);
        }
        
        .lc-section-intro {
          text-align: center;
          max-width: 800px;
          margin: 0 auto 4rem;
        }
        
        .lc-section-label {
          font-family: var(--lc-font-sans, 'DM Sans', sans-serif);
          font-size: 0.75rem;
          font-weight: 600;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          color: #C4704D;
          margin-bottom: 1rem;
          display: block;
        }
        
        .lc-section-title {
          font-family: var(--lc-font-serif, 'Cormorant Garamond', Georgia, serif);
          font-size: clamp(1.75rem, 4vw, 2.5rem);
          font-weight: 500;
          margin-bottom: 1.25rem;
          color: #2D2A26;
        }
        
        .lc-section-description {
          font-family: var(--lc-font-sans, 'DM Sans', sans-serif);
          font-size: 1.0625rem;
          color: #6B635A;
          line-height: 1.7;
        }
        
        .lc-section-description em {
          font-style: italic;
          color: #C4704D;
        }
        
        .lc-pain-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 1.5rem;
          max-width: 1000px;
          margin: 0 auto;
        }
        
        .lc-pain-card {
          background: white;
          padding: 1.5rem;
          border-radius: 16px;
          border: 1px solid rgba(196, 112, 77, 0.08);
          display: flex;
          align-items: flex-start;
          gap: 1rem;
        }
        
        .lc-pain-icon {
          width: 32px;
          height: 32px;
          background: rgba(139, 77, 53, 0.08);
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          color: #8B4D35;
          font-size: 1rem;
        }
        
        .lc-pain-text {
          font-family: var(--lc-font-sans, 'DM Sans', sans-serif);
          font-size: 0.9375rem;
          color: #6B635A;
          line-height: 1.5;
        }
        
        /* Differentiation Section */
        .lc-differentiation {
          padding: 5rem 1.5rem;
          background: #2D2A26;
          color: white;
        }
        
        .lc-diff-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 3rem;
          max-width: 1000px;
          margin: 0 auto;
          align-items: center;
        }
        
        @media (min-width: 768px) {
          .lc-diff-grid {
            grid-template-columns: 1fr 1fr;
            gap: 4rem;
          }
        }
        
        .lc-diff-title {
          font-family: var(--lc-font-serif, 'Cormorant Garamond', Georgia, serif);
          font-size: clamp(1.75rem, 3.5vw, 2.5rem);
          font-weight: 500;
          margin-bottom: 1.5rem;
          line-height: 1.2;
        }
        
        .lc-diff-title em {
          font-style: italic;
          color: #E8A888;
        }
        
        .lc-diff-text {
          font-family: var(--lc-font-sans, 'DM Sans', sans-serif);
          font-size: 1rem;
          color: rgba(255, 255, 255, 0.7);
          line-height: 1.8;
          margin-bottom: 2rem;
        }
        
        .lc-diff-list {
          list-style: none;
          padding: 0;
          margin: 0;
        }
        
        .lc-diff-item {
          font-family: var(--lc-font-sans, 'DM Sans', sans-serif);
          font-size: 0.9375rem;
          padding: 1rem 0;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
          display: flex;
          align-items: flex-start;
          gap: 1rem;
          color: rgba(255, 255, 255, 0.85);
        }
        
        .lc-diff-item:last-child {
          border-bottom: none;
        }
        
        .lc-diff-item i {
          color: #E8A888;
          font-size: 1.25rem;
          flex-shrink: 0;
          margin-top: 0.125rem;
        }
        
        .lc-diff-item strong {
          color: white;
          font-weight: 600;
        }
        
        .lc-diff-visual {
          background: linear-gradient(135deg, rgba(196, 112, 77, 0.3), rgba(122, 139, 122, 0.2));
          border-radius: 24px;
          height: 300px;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 2rem;
          position: relative;
          overflow: hidden;
        }
        
        @media (min-width: 768px) {
          .lc-diff-visual {
            height: 400px;
          }
        }
        
        .lc-diff-visual::before {
          content: '';
          position: absolute;
          inset: 0;
          background: radial-gradient(circle at 30% 30%, rgba(232, 168, 136, 0.2), transparent 50%);
        }
        
        .lc-diff-quote {
          font-family: var(--lc-font-serif, 'Cormorant Garamond', Georgia, serif);
          font-size: 1.5rem;
          font-style: italic;
          color: rgba(255, 255, 255, 0.6);
          text-align: center;
          line-height: 1.6;
          position: relative;
          z-index: 1;
        }
        
        /* Who This Is For Section */
        .lc-who-section {
          padding: 5rem 1.5rem;
          background: linear-gradient(180deg, #F8F4F0 0%, #FFFBF8 100%);
        }
        
        .lc-who-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1.5rem;
          max-width: 1100px;
          margin: 0 auto;
        }
        
        .lc-who-card {
          background: white;
          padding: 2rem 1.5rem;
          border-radius: 20px;
          border: 1px solid rgba(196, 112, 77, 0.08);
          text-align: center;
          transition: all 0.3s ease;
        }
        
        .lc-who-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 15px 40px rgba(196, 112, 77, 0.08);
          border-color: rgba(196, 112, 77, 0.15);
        }
        
        .lc-who-icon {
          width: 56px;
          height: 56px;
          background: rgba(196, 112, 77, 0.08);
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 1.25rem;
          color: #C4704D;
          font-size: 1.5rem;
        }
        
        .lc-who-title {
          font-family: var(--lc-font-serif, 'Cormorant Garamond', Georgia, serif);
          font-size: 1.25rem;
          font-weight: 600;
          margin-bottom: 0.5rem;
          color: #2D2A26;
        }
        
        .lc-who-text {
          font-family: var(--lc-font-sans, 'DM Sans', sans-serif);
          font-size: 0.8125rem;
          color: #6B635A;
          line-height: 1.5;
        }
        
        /* Tools Section */
        .lc-tools-section {
          padding: 5rem 1.5rem;
          background: white;
        }
        
        .lc-tools-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 1.5rem;
          max-width: 1100px;
          margin: 0 auto;
        }
        
        .lc-tool-card {
          background: rgba(196, 112, 77, 0.04);
          padding: 1.5rem;
          border-radius: 16px;
          display: flex;
          align-items: flex-start;
          gap: 1rem;
          transition: all 0.3s ease;
        }
        
        .lc-tool-card:hover {
          background: rgba(196, 112, 77, 0.08);
        }
        
        .lc-tool-icon {
          width: 40px;
          height: 40px;
          background: white;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          color: #C4704D;
          font-size: 1.25rem;
          box-shadow: 0 4px 12px rgba(196, 112, 77, 0.1);
        }
        
        .lc-tool-content h3 {
          font-family: var(--lc-font-serif, 'Cormorant Garamond', Georgia, serif);
          font-size: 1.125rem;
          font-weight: 600;
          margin-bottom: 0.375rem;
          color: #2D2A26;
        }
        
        .lc-tool-content p {
          font-family: var(--lc-font-sans, 'DM Sans', sans-serif);
          font-size: 0.8125rem;
          color: #6B635A;
          line-height: 1.5;
        }
        
        /* Analytics Section */
        .lc-analytics-section {
          padding: 5rem 1.5rem;
          background: linear-gradient(180deg, #FFFBF8 0%, #F8F4F0 100%);
        }
        
        .lc-analytics-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1.5rem;
          max-width: 900px;
          margin: 0 auto;
        }
        
        .lc-analytics-card {
          background: white;
          padding: 2rem;
          border-radius: 16px;
          text-align: center;
          border: 1px solid rgba(196, 112, 77, 0.08);
        }
        
        .lc-analytics-icon {
          width: 48px;
          height: 48px;
          background: rgba(196, 112, 77, 0.08);
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 1rem;
          color: #C4704D;
          font-size: 1.5rem;
        }
        
        .lc-analytics-title {
          font-family: var(--lc-font-serif, 'Cormorant Garamond', Georgia, serif);
          font-size: 1.125rem;
          font-weight: 600;
          margin-bottom: 0.5rem;
          color: #2D2A26;
        }
        
        .lc-analytics-text {
          font-family: var(--lc-font-sans, 'DM Sans', sans-serif);
          font-size: 0.8125rem;
          color: #6B635A;
          line-height: 1.5;
        }
        
        /* Pricing Section */
        .lc-pricing-section {
          padding: 5rem 1.5rem;
          background: white;
        }
        
        .lc-pricing-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1.5rem;
          max-width: 900px;
          margin: 0 auto;
        }
        
        .lc-pricing-card {
          background: linear-gradient(135deg, rgba(196, 112, 77, 0.04), rgba(232, 212, 204, 0.08));
          padding: 2rem;
          border-radius: 20px;
          text-align: center;
          border: 1px solid rgba(196, 112, 77, 0.1);
          transition: all 0.3s ease;
        }
        
        .lc-pricing-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 15px 40px rgba(196, 112, 77, 0.1);
        }
        
        .lc-pricing-rate {
          font-family: var(--lc-font-serif, 'Cormorant Garamond', Georgia, serif);
          font-size: 2.5rem;
          font-weight: 600;
          color: #C4704D;
          margin-bottom: 0.25rem;
        }
        
        .lc-pricing-label {
          font-family: var(--lc-font-sans, 'DM Sans', sans-serif);
          font-size: 0.75rem;
          font-weight: 500;
          color: #6B635A;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          margin-bottom: 1rem;
        }
        
        .lc-pricing-tier {
          font-family: var(--lc-font-sans, 'DM Sans', sans-serif);
          font-size: 1rem;
          font-weight: 600;
          color: #2D2A26;
        }
        
        .lc-pricing-note {
          font-family: var(--lc-font-sans, 'DM Sans', sans-serif);
          font-size: 0.8125rem;
          color: #6B635A;
          margin-top: 0.5rem;
        }
        
        /* Final CTA Section */
        .lc-final-cta {
          padding: 6rem 1.5rem;
          background: #FDF8F5;
        }
        
        .lc-cta-box {
          max-width: 700px;
          margin: 0 auto;
          padding: 3rem 2rem;
          background: white;
          border-radius: 24px;
          border: 1px solid rgba(196, 112, 77, 0.1);
          box-shadow: 0 20px 60px rgba(45, 42, 38, 0.06);
          text-align: center;
          position: relative;
          overflow: hidden;
        }
        
        @media (min-width: 640px) {
          .lc-cta-box {
            padding: 4rem;
          }
        }
        
        .lc-cta-box::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 4px;
          background: linear-gradient(90deg, #C4704D, #E8A888, #7A8B7A);
        }
        
        .lc-cta-icon {
          width: 64px;
          height: 64px;
          background: rgba(196, 112, 77, 0.08);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 1.5rem;
          color: #C4704D;
          font-size: 2rem;
        }
        
        .lc-cta-box h2 {
          font-family: var(--lc-font-serif, 'Cormorant Garamond', Georgia, serif);
          font-size: clamp(1.75rem, 3vw, 2.25rem);
          font-weight: 500;
          margin-bottom: 1rem;
          color: #2D2A26;
        }
        
        .lc-cta-box > p {
          font-family: var(--lc-font-sans, 'DM Sans', sans-serif);
          font-size: 1rem;
          color: #6B635A;
          line-height: 1.7;
          margin-bottom: 2rem;
        }
        
        .lc-form-wrapper {
          max-width: 480px;
          margin: 0 auto;
        }
        
        .lc-privacy-note {
          font-family: var(--lc-font-sans, 'DM Sans', sans-serif);
          font-size: 0.8125rem;
          color: #6B635A;
          margin-top: 1.5rem;
        }
        
        /* Footer */
        .lc-footer {
          padding: 3rem 1.5rem;
          background: #2D2A26;
          color: white;
          text-align: center;
        }
        
        .lc-footer-logo {
          font-family: var(--lc-font-serif, 'Cormorant Garamond', Georgia, serif);
          font-size: 1.75rem;
          font-weight: 600;
          color: white;
          text-decoration: none;
          display: inline-block;
          margin-bottom: 0.5rem;
        }
        
        .lc-footer-tagline {
          font-family: var(--lc-font-sans, 'DM Sans', sans-serif);
          font-size: 0.9375rem;
          color: rgba(255, 255, 255, 0.6);
          margin-bottom: 1.5rem;
        }
        
        .lc-footer-links {
          font-family: var(--lc-font-sans, 'DM Sans', sans-serif);
          font-size: 0.875rem;
          color: rgba(255, 255, 255, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 1.5rem;
          flex-wrap: wrap;
        }
        
        .lc-footer-links a {
          color: rgba(255, 255, 255, 0.5);
          text-decoration: none;
          transition: color 0.3s ease;
        }
        
        .lc-footer-links a:hover {
          color: white;
        }
      `}</style>

      {/* Header */}
      <header className="lc-header">
        <div className="lc-header-inner">
          <Link to="/" className="lc-logo">
            Lorem Curae
          </Link>
          <a href="#waitlist" className="lc-header-cta">
            Join Creator Waitlist
          </a>
        </div>
      </header>

      {/* Regular Waitlist Banner - REQUIRED */}
      <div className="lc-regular-banner">
        <Link 
          to="/preview-of-waitlist-early-access-2025"
          className="lc-regular-link"
        >
          <span>Looking for personalized skincare instead? Visit the regular waitlist</span>
          <i className="ri-arrow-right-line"></i>
        </Link>
      </div>

      {/* Hero Section */}
      <section className="lc-hero">
        <div className="lc-hero-bg" />
        <div className="lc-hero-content">
          <div className="lc-badge">
            Creator Marketplace — Coming Soon
          </div>
          
          <h1 className="lc-headline">
            A new home for<br />
            <em>indie beauty creators</em>
          </h1>
          
          <p className="lc-subhead">
            Sell with confidence. Grow with clarity. Build with support. A transparent, creator-first platform designed to help you reach customers who value authenticity and intention.
          </p>
          
          <div className="lc-problem-box">
            <strong>The beauty world is shifting:</strong> Customers want transparency, authenticity, and products made with intention. Indie creators are leading that movement—but the platforms available today weren't built for you. We're changing that.
          </div>
          
          <div className="lc-cta-group">
            <a href="#waitlist" className="lc-btn-primary">
              Join the Creator Waitlist
            </a>
            <a href="#why" className="lc-btn-secondary">
              Why Lorem Curae
            </a>
          </div>
        </div>
      </section>

      {/* Why We Built This Section */}
      <section id="why" className="lc-why-section">
        <div className="lc-section-intro">
          <span className="lc-section-label">Why We Built This</span>
          <h2 className="lc-section-title">
            Indie creators deserve better
          </h2>
          <p className="lc-section-description">
            Most marketplaces weren't designed with indie creators in mind. They prioritize mass-market brands and leave small creators behind. We believe your craft deserves a platform that <em>respects it</em>.
          </p>
        </div>
        
        <div className="lc-pain-grid">
          <div className="lc-pain-card">
            <div className="lc-pain-icon">
              <i className="ri-eye-off-line"></i>
            </div>
            <p className="lc-pain-text">
              <strong>Hidden behind algorithms</strong> — Indie creators get buried while big brands dominate the spotlight.
            </p>
          </div>
          <div className="lc-pain-card">
            <div className="lc-pain-icon">
              <i className="ri-money-dollar-circle-line"></i>
            </div>
            <p className="lc-pain-text">
              <strong>High fees, low support</strong> — Platforms take a cut without offering real tools or guidance for growth.
            </p>
          </div>
          <div className="lc-pain-card">
            <div className="lc-pain-icon">
              <i className="ri-spam-2-line"></i>
            </div>
            <p className="lc-pain-text">
              <strong>Counterfeits and resellers</strong> — Your reputation suffers when marketplaces don't verify sellers.
            </p>
          </div>
          <div className="lc-pain-card">
            <div className="lc-pain-icon">
              <i className="ri-bar-chart-box-line"></i>
            </div>
            <p className="lc-pain-text">
              <strong>No customer insight</strong> — You're selling blind without data on who's buying and why.
            </p>
          </div>
          <div className="lc-pain-card">
            <div className="lc-pain-icon">
              <i className="ri-user-unfollow-line"></i>
            </div>
            <p className="lc-pain-text">
              <strong>No loyal audience</strong> — Building a following is nearly impossible when platforms control the relationship.
            </p>
          </div>
          <div className="lc-pain-card">
            <div className="lc-pain-icon">
              <i className="ri-store-line"></i>
            </div>
            <p className="lc-pain-text">
              <strong>One-size-fits-all</strong> — Mass-market platforms weren't designed for creators who formulate with intention.
            </p>
          </div>
        </div>
      </section>

      {/* Differentiation Section */}
      <section className="lc-differentiation">
        <div className="lc-diff-grid">
          <div>
            <h2 className="lc-diff-title">
              What makes Lorem Curae <em>different</em>
            </h2>
            <p className="lc-diff-text">
              We built a marketplace that puts creators first—because when you succeed, our community thrives. Every feature exists to help you grow sustainably while staying true to your craft.
            </p>
            
            <ul className="lc-diff-list">
              <li className="lc-diff-item">
                <i className="ri-check-line"></i>
                <div>
                  <strong>Creator-First Economics</strong> — Fair fees that decrease as you grow, not arbitrary cuts that punish success.
                </div>
              </li>
              <li className="lc-diff-item">
                <i className="ri-check-line"></i>
                <div>
                  <strong>Quality Over Quantity</strong> — A curated marketplace where indie creators aren't drowned out by mass-market noise.
                </div>
              </li>
              <li className="lc-diff-item">
                <i className="ri-check-line"></i>
                <div>
                  <strong>Built-In Trust</strong> — Verification badges and customer reviews that establish credibility from day one.
                </div>
              </li>
              <li className="lc-diff-item">
                <i className="ri-check-line"></i>
                <div>
                  <strong>Tools That Scale With You</strong> — From your first sale to your thousandth, we grow with you.
                </div>
              </li>
            </ul>
          </div>
          
          <div className="lc-diff-visual">
            <p className="lc-diff-quote">
              Your craft deserves a platform<br />
              built to elevate it.
            </p>
          </div>
        </div>
      </section>

      {/* Who This Is For Section */}
      <section className="lc-who-section">
        <div className="lc-section-intro">
          <span className="lc-section-label">Who This Marketplace Is For</span>
          <h2 className="lc-section-title">
            Whether you're just starting or ready to scale
          </h2>
          <p className="lc-section-description">
            Lorem Curae Marketplace welcomes creators at every stage of their journey—from testing your first formulation to building a recognized brand.
          </p>
        </div>
        
        <div className="lc-who-grid">
          <div className="lc-who-card">
            <div className="lc-who-icon">
              <i className="ri-seedling-line"></i>
            </div>
            <h3 className="lc-who-title">Hobbyists</h3>
            <p className="lc-who-text">Testing the waters with your first products and exploring what's possible</p>
          </div>
          <div className="lc-who-card">
            <div className="lc-who-icon">
              <i className="ri-flask-line"></i>
            </div>
            <h3 className="lc-who-title">Testers & Formulators</h3>
            <p className="lc-who-text">Experimenting with early batches and gathering real customer feedback</p>
          </div>
          <div className="lc-who-card">
            <div className="lc-who-icon">
              <i className="ri-lightbulb-line"></i>
            </div>
            <h3 className="lc-who-title">Emerging Creators</h3>
            <p className="lc-who-text">Launching your first products and building your brand identity</p>
          </div>
          <div className="lc-who-card">
            <div className="lc-who-icon">
              <i className="ri-store-2-line"></i>
            </div>
            <h3 className="lc-who-title">Growing Indie Brands</h3>
            <p className="lc-who-text">Ready to reach new audiences and scale sustainably</p>
          </div>
          <div className="lc-who-card">
            <div className="lc-who-icon">
              <i className="ri-vip-crown-line"></i>
            </div>
            <h3 className="lc-who-title">Established Creators</h3>
            <p className="lc-who-text">Seeking a transparent, supportive platform that respects your craft</p>
          </div>
        </div>
      </section>

      {/* Tools Section */}
      <section className="lc-tools-section">
        <div className="lc-section-intro">
          <span className="lc-section-label">Your Growth Toolkit</span>
          <h2 className="lc-section-title">
            Tools that help you stand out
          </h2>
          <p className="lc-section-description">
            Everything you need to build visibility, tell your story, and grow a loyal customer base.
          </p>
        </div>
        
        <div className="lc-tools-grid">
          <div className="lc-tool-card">
            <div className="lc-tool-icon">
              <i className="ri-star-line"></i>
            </div>
            <div className="lc-tool-content">
              <h3>Premium Placement</h3>
              <p>Get featured at the top of search results and category pages</p>
            </div>
          </div>
          <div className="lc-tool-card">
            <div className="lc-tool-icon">
              <i className="ri-palette-line"></i>
            </div>
            <div className="lc-tool-content">
              <h3>Custom Storefronts</h3>
              <p>Design your storefront to match your brand identity and values</p>
            </div>
          </div>
          <div className="lc-tool-card">
            <div className="lc-tool-icon">
              <i className="ri-megaphone-line"></i>
            </div>
            <div className="lc-tool-content">
              <h3>Promotional Tools</h3>
              <p>Run campaigns and promotions to boost visibility and drive sales</p>
            </div>
          </div>
          <div className="lc-tool-card">
            <div className="lc-tool-icon">
              <i className="ri-book-open-line"></i>
            </div>
            <div className="lc-tool-content">
              <h3>Brand Storytelling</h3>
              <p>Share your journey and values with rich content pages</p>
            </div>
          </div>
          <div className="lc-tool-card">
            <div className="lc-tool-icon">
              <i className="ri-team-line"></i>
            </div>
            <div className="lc-tool-content">
              <h3>Community Engagement</h3>
              <p>Build a following and engage with customers directly</p>
            </div>
          </div>
          <div className="lc-tool-card">
            <div className="lc-tool-icon">
              <i className="ri-medal-line"></i>
            </div>
            <div className="lc-tool-content">
              <h3>Verified Badge</h3>
              <p>Stand out with verification that builds customer trust</p>
            </div>
          </div>
        </div>
      </section>

      {/* Analytics Section */}
      <section className="lc-analytics-section">
        <div className="lc-section-intro">
          <span className="lc-section-label">Data That Drives Decisions</span>
          <h2 className="lc-section-title">
            Analytics & Insights
          </h2>
          <p className="lc-section-description">
            Track your performance with detailed analytics on views, engagement, and sales—so you can optimize your strategy with confidence.
          </p>
        </div>
        
        <div className="lc-analytics-grid">
          <div className="lc-analytics-card">
            <div className="lc-analytics-icon">
              <i className="ri-eye-line"></i>
            </div>
            <h3 className="lc-analytics-title">Performance Dashboard</h3>
            <p className="lc-analytics-text">Monitor views, clicks, and conversions in real-time</p>
          </div>
          <div className="lc-analytics-card">
            <div className="lc-analytics-icon">
              <i className="ri-user-heart-line"></i>
            </div>
            <h3 className="lc-analytics-title">Customer Insights</h3>
            <p className="lc-analytics-text">Understand who's buying and what drives their decisions</p>
          </div>
          <div className="lc-analytics-card">
            <div className="lc-analytics-icon">
              <i className="ri-line-chart-line"></i>
            </div>
            <h3 className="lc-analytics-title">Trend Analysis</h3>
            <p className="lc-analytics-text">Identify patterns and optimize your offerings</p>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="lc-pricing-section">
        <div className="lc-section-intro">
          <span className="lc-section-label">Transparent, Growth-Friendly</span>
          <h2 className="lc-section-title">
            Fees that reward your success
          </h2>
          <p className="lc-section-description">
            Transaction fees decrease as your monthly sales increase. The more you grow, the more you keep.
          </p>
        </div>
        
        <div className="lc-pricing-grid">
          <div className="lc-pricing-card">
            <div className="lc-pricing-rate">12%</div>
            <div className="lc-pricing-label">Transaction Fee</div>
            <div className="lc-pricing-tier">$10K+ Monthly GMV</div>
            <p className="lc-pricing-note">Growing creators</p>
          </div>
          <div className="lc-pricing-card">
            <div className="lc-pricing-rate">10%</div>
            <div className="lc-pricing-label">Transaction Fee</div>
            <div className="lc-pricing-tier">$25K+ Monthly GMV</div>
            <p className="lc-pricing-note">Scaling brands</p>
          </div>
          <div className="lc-pricing-card">
            <div className="lc-pricing-rate">8%</div>
            <div className="lc-pricing-label">Transaction Fee</div>
            <div className="lc-pricing-tier">$50K+ Monthly GMV</div>
            <p className="lc-pricing-note">Established creators</p>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section id="waitlist" className="lc-final-cta">
        <div className="lc-cta-box">
          <div className="lc-cta-icon">
            <i className="ri-hand-heart-line"></i>
          </div>
          <h2>Indie beauty is the future</h2>
          <p>
            Creators deserve a platform built to elevate their craft—not bury it. Join the waitlist and be among the first to sell on a marketplace designed with intention, transparency, and your success in mind.
          </p>
          
          <div className="lc-form-wrapper">
            <SupabaseWaitlistForm segment="creator" />
          </div>
          
          <p className="lc-privacy-note">
            We respect your privacy. No spam, ever.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="lc-footer">
        <Link to="/" className="lc-footer-logo">
          Lorem Curae
        </Link>
        <p className="lc-footer-tagline">
          Empowering indie beauty creators
        </p>
        <div className="lc-footer-links">
          <Link to="/privacy">Privacy</Link>
          <span>•</span>
          <Link to="/contact">Contact</Link>
          <span>•</span>
          <a 
            href="https://readdy.ai/?origin=logo" 
            target="_blank" 
            rel="noopener noreferrer"
          >
            Powered by Readdy
          </a>
        </div>
      </footer>
    </div>
  );
};

export default MarketplaceWaitlistPage;