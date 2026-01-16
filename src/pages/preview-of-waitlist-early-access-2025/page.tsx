import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import SupabaseWaitlistForm from '../../components/SupabaseWaitlistForm';
import WaitlistStatus from '../../components/WaitlistStatus';
import MagicLinkLogin from '../../components/MagicLinkLogin';

/**
 * WaitlistLandingPage Component
 * 
 * Brand Voice: Calm, confident, science-backed, human
 * Color Mood: Warm cream, soft coral accents, grounded earth tones
 * Narrative Arc: Problem → Ecosystem → Transformation → Community → Action
 */

const WaitlistLandingPage = () => {
  return (
    <div className="lc-waitlist-page">
      <style>{`
        .lc-waitlist-page {
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
        
        /* Creator Banner */
        .lc-creator-banner {
          background: rgba(196, 112, 77, 0.06);
          border-bottom: 1px solid rgba(196, 112, 77, 0.1);
          padding: 0.75rem 1.5rem;
          text-align: center;
          margin-top: 60px;
        }
        
        .lc-creator-link {
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
        
        .lc-creator-link:hover {
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
        
        /* Ecosystem Section */
        .lc-ecosystem {
          padding: 5rem 1.5rem;
          background: linear-gradient(180deg, #FFFBF8 0%, #F8F4F0 100%);
          position: relative;
        }
        
        .lc-ecosystem::before {
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
        
        .lc-tools-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 1.5rem;
          max-width: 1100px;
          margin: 0 auto;
        }
        
        .lc-tool-card {
          background: white;
          padding: 2rem;
          border-radius: 20px;
          border: 1px solid rgba(196, 112, 77, 0.08);
          transition: all 0.3s ease;
          display: flex;
          flex-direction: column;
          height: 100%;
        }
        
        .lc-tool-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 15px 40px rgba(196, 112, 77, 0.08);
          border-color: rgba(196, 112, 77, 0.15);
        }
        
        .lc-tool-icon {
          width: 48px;
          height: 48px;
          background: rgba(196, 112, 77, 0.08);
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 1.25rem;
          color: #C4704D;
          font-size: 1.5rem;
        }
        
        .lc-tool-title {
          font-family: var(--lc-font-serif, 'Cormorant Garamond', Georgia, serif);
          font-size: 1.375rem;
          font-weight: 600;
          margin-bottom: 0.5rem;
          color: #2D2A26;
        }
        
        .lc-tool-pain {
          font-family: var(--lc-font-sans, 'DM Sans', sans-serif);
          font-size: 0.8125rem;
          color: #8B4D35;
          font-weight: 500;
          margin-bottom: 0.75rem;
          padding-bottom: 0.75rem;
          border-bottom: 1px solid rgba(196, 112, 77, 0.1);
        }
        
        .lc-tool-description {
          font-family: var(--lc-font-sans, 'DM Sans', sans-serif);
          font-size: 0.9375rem;
          color: #6B635A;
          line-height: 1.6;
          margin-bottom: 1rem;
          flex-grow: 1;
        }
        
        .lc-tool-outcome {
          font-family: var(--lc-font-sans, 'DM Sans', sans-serif);
          font-size: 0.8125rem;
          color: #7A8B7A;
          font-weight: 500;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-top: auto;
        }
        
        .lc-tool-outcome i {
          color: #C4704D;
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
        
        .lc-comparison-list {
          list-style: none;
          padding: 0;
          margin: 0;
        }
        
        .lc-comparison-item {
          font-family: var(--lc-font-sans, 'DM Sans', sans-serif);
          font-size: 0.9375rem;
          padding: 1rem 0;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
          display: flex;
          align-items: flex-start;
          gap: 1rem;
        }
        
        .lc-comparison-item:last-child {
          border-bottom: none;
        }
        
        .lc-comparison-item strong {
          color: white;
          font-weight: 600;
        }
        
        .lc-comparison-item span {
          color: rgba(255, 255, 255, 0.6);
        }
        
        .lc-comparison-item.lc-us span {
          color: rgba(255, 255, 255, 0.85);
        }
        
        .lc-icon-x {
          color: rgba(255, 255, 255, 0.3);
          font-size: 1.25rem;
          flex-shrink: 0;
        }
        
        .lc-icon-check {
          color: #E8A888;
          font-size: 1.25rem;
          flex-shrink: 0;
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
        
        /* Rewards Section */
        .lc-rewards {
          padding: 5rem 1.5rem;
          background: linear-gradient(180deg, #F8F4F0 0%, #FFFBF8 100%);
        }
        
        .lc-rewards-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 3rem;
          max-width: 1000px;
          margin: 0 auto;
          align-items: center;
        }
        
        @media (min-width: 768px) {
          .lc-rewards-grid {
            grid-template-columns: 1fr 1fr;
          }
        }
        
        .lc-rewards-content h2 {
          font-family: var(--lc-font-serif, 'Cormorant Garamond', Georgia, serif);
          font-size: clamp(1.75rem, 3.5vw, 2.25rem);
          font-weight: 500;
          margin-bottom: 1.5rem;
          color: #2D2A26;
        }
        
        .lc-rewards-content p {
          font-family: var(--lc-font-sans, 'DM Sans', sans-serif);
          font-size: 1rem;
          color: #6B635A;
          line-height: 1.7;
          margin-bottom: 1.5rem;
        }
        
        .lc-rewards-list {
          list-style: none;
          padding: 0;
          margin: 0 0 2rem 0;
        }
        
        .lc-rewards-list li {
          font-family: var(--lc-font-sans, 'DM Sans', sans-serif);
          font-size: 0.9375rem;
          color: #6B635A;
          padding: 0.5rem 0;
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }
        
        .lc-rewards-list li i {
          color: #C4704D;
        }
        
        .lc-rewards-visual {
          background: white;
          border-radius: 20px;
          padding: 2rem;
          box-shadow: 0 20px 60px rgba(45, 42, 38, 0.06);
          border: 1px solid rgba(196, 112, 77, 0.08);
        }
        
        .lc-reward-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 1rem;
          background: rgba(196, 112, 77, 0.04);
          border-radius: 12px;
          margin-bottom: 1rem;
        }
        
        .lc-reward-item:last-child {
          margin-bottom: 0;
        }
        
        .lc-reward-left {
          display: flex;
          align-items: center;
          gap: 1rem;
        }
        
        .lc-reward-icon {
          width: 40px;
          height: 40px;
          background: rgba(196, 112, 77, 0.1);
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #C4704D;
        }
        
        .lc-reward-label {
          font-family: var(--lc-font-sans, 'DM Sans', sans-serif);
          font-size: 0.9375rem;
          font-weight: 500;
          color: #2D2A26;
        }
        
        .lc-reward-value {
          font-family: var(--lc-font-serif, 'Cormorant Garamond', Georgia, serif);
          font-size: 1.25rem;
          font-weight: 600;
          color: #C4704D;
        }
        
        .lc-reward-badge {
          font-family: var(--lc-font-sans, 'DM Sans', sans-serif);
          font-size: 0.75rem;
          font-weight: 600;
          color: #7A8B7A;
          background: rgba(122, 139, 122, 0.1);
          padding: 0.25rem 0.75rem;
          border-radius: 100px;
        }
        
        /* Early Access Section */
        .lc-early-access {
          padding: 5rem 1.5rem;
          background: white;
        }
        
        .lc-early-access-inner {
          max-width: 800px;
          margin: 0 auto;
          text-align: center;
        }
        
        .lc-early-access h2 {
          font-family: var(--lc-font-serif, 'Cormorant Garamond', Georgia, serif);
          font-size: clamp(1.75rem, 3.5vw, 2.25rem);
          font-weight: 500;
          margin-bottom: 1.5rem;
          color: #2D2A26;
        }
        
        .lc-early-access > p {
          font-family: var(--lc-font-sans, 'DM Sans', sans-serif);
          font-size: 1.0625rem;
          color: #6B635A;
          line-height: 1.7;
          margin-bottom: 3rem;
        }
        
        .lc-benefits-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1.5rem;
          margin-bottom: 3rem;
        }
        
        .lc-benefit-card {
          background: rgba(196, 112, 77, 0.04);
          padding: 1.5rem;
          border-radius: 16px;
          text-align: center;
        }
        
        .lc-benefit-icon {
          width: 48px;
          height: 48px;
          background: white;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 1rem;
          color: #C4704D;
          font-size: 1.5rem;
          box-shadow: 0 4px 12px rgba(196, 112, 77, 0.1);
        }
        
        .lc-benefit-title {
          font-family: var(--lc-font-serif, 'Cormorant Garamond', Georgia, serif);
          font-size: 1.125rem;
          font-weight: 600;
          margin-bottom: 0.5rem;
          color: #2D2A26;
        }
        
        .lc-benefit-text {
          font-family: var(--lc-font-sans, 'DM Sans', sans-serif);
          font-size: 0.8125rem;
          color: #6B635A;
          line-height: 1.5;
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
        
        .lc-status-wrapper {
          margin-top: 2rem;
        }
        
        .lc-magic-link-section {
          margin-top: 3rem;
          padding-top: 2rem;
          border-top: 1px solid rgba(196, 112, 77, 0.1);
        }
        
        .lc-magic-link-section h3 {
          font-family: var(--lc-font-serif, 'Cormorant Garamond', Georgia, serif);
          font-size: 1.5rem;
          font-weight: 500;
          margin-bottom: 1rem;
          color: #2D2A26;
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
            Join Waitlist
          </a>
        </div>
      </header>

      {/* Creator Banner - REQUIRED: Must appear exactly as specified */}
      <div className="lc-creator-banner">
        <Link 
          to="/preview-of-waitlist-early-access-2025-marketplace"
          className="lc-creator-link"
        >
          <span>Are you a creator? Join the Marketplace waitlist</span>
          <i className="ri-arrow-right-line"></i>
        </Link>
      </div>

      {/* Hero Section */}
      <section className="lc-hero">
        <div className="lc-hero-bg" />
        <div className="lc-hero-content">
          <div className="lc-badge">
            Founding Member Waitlist Now Open
          </div>
          
          <h1 className="lc-headline">
            Your skin deserves more than guesswork.<br />
            It deserves <em>understanding</em>.
          </h1>

          <p className="lc-subhead">
            Lorem Curae is one of the only platforms built to connect your unique skin profile with personalized guidance, trusted retailers, ingredient clarity, and community support into one connected experience. Everything works together so you never have to navigate skincare alone — and finally see clarity where there used to be confusion.
          </p>

          <div className="lc-problem-box">
            <strong>Here's what no one tells you:</strong> skincare confusion isn't your fault. You've been handed influencer picks, algorithm-driven ads, and ingredient lists that read like chemistry exams. You've tried the "holy grail" products that worked for everyone except you. The problem isn't that you haven't tried hard enough—it's that you've never had tools designed around <strong>your</strong> skin.
          </div>
          
          <div className="lc-cta-group">
            <a href="#waitlist" className="lc-btn-primary">
              Join the Founding Member Waitlist
            </a>
            <a href="#ecosystem" className="lc-btn-secondary">
              See How It Works
            </a>
          </div>
        </div>
      </section>

      {/* Ecosystem Section */}
      <section id="ecosystem" className="lc-ecosystem">
        <div className="lc-section-intro">
          <span className="lc-section-label">One Ecosystem, Built Around You</span>
          <h2 className="lc-section-title">
            Six tools that finally work together—so you don't have to figure it out alone
          </h2>
          <p className="lc-section-description">
            Each feature strengthens the next. Your skin survey shapes your recommendations. Your ingredient knowledge deepens your comparisons. Your routine tracking refines your results over time. This isn't a collection of disconnected tools—it's a guided system built around <em>your</em> skin, designed to grow with you.
          </p>
        </div>
        
        <div className="lc-tools-grid">
          {/* Smart Product Finder */}
          <div className="lc-tool-card">
            <div className="lc-tool-icon">
              <i className="ri-search-line"></i>
            </div>
            <h3 className="lc-tool-title">Smart Product Finder</h3>
            <p className="lc-tool-pain">
              You've scrolled through endless products that weren't made for your skin—without knowing which retailers you can actually trust.
            </p>
            <p className="lc-tool-description">
              Search the way you actually think about skincare—by concern, ingredient, price, or skin type. Find products from reputable retailers with community-verified reviews.
            </p>
            <span className="lc-tool-outcome">
              <i className="ri-check-line"></i>
              Discover products that fit your skin from sources you can trust
            </span>
          </div>
          
          {/* Curae AI */}
          <div className="lc-tool-card">
            <div className="lc-tool-icon">
              <i className="ri-robot-2-line"></i>
            </div>
            <h3 className="lc-tool-title">Curae AI</h3>
            <p className="lc-tool-pain">
              You've gotten conflicting advice from influencers, the internet, and even dermatologists—and you're more confused than when you started.
            </p>
            <p className="lc-tool-description">
              Ask anything and receive answers grounded in peer-reviewed research, not sponsored content. Curae learns from your journey and tailors its guidance to your unique profile.
            </p>
            <span className="lc-tool-outcome">
              <i className="ri-check-line"></i>
              Trusted answers, tailored to you
            </span>
          </div>
          
          {/* Product Comparison */}
          <div className="lc-tool-card">
            <div className="lc-tool-icon">
              <i className="ri-scales-3-line"></i>
            </div>
            <h3 className="lc-tool-title">Product Comparison</h3>
            <p className="lc-tool-pain">
              You've wondered whether the $68 serum is truly better than the $19 one—or just better at marketing.
            </p>
            <p className="lc-tool-description">
              Compare up to three products side-by-side: ingredients, concentrations, price-per-ml, and how each one fits your skin profile.
            </p>
            <span className="lc-tool-outcome">
              <i className="ri-check-line"></i>
              Make confident decisions, spend smarter
            </span>
          </div>
          
          {/* Ingredient Library */}
          <div className="lc-tool-card">
            <div className="lc-tool-icon">
              <i className="ri-flask-line"></i>
            </div>
            <h3 className="lc-tool-title">Ingredient Library</h3>
            <p className="lc-tool-pain">
              You've stared at ingredient lists that feel like another language—with no way to know what any of it means for you.
            </p>
            <p className="lc-tool-description">
              Every ingredient decoded: what it does, who it's for, what to pair it with, and what to avoid. Science-backed explanations written for real people—not chemists.
            </p>
            <span className="lc-tool-outcome">
              <i className="ri-check-line"></i>
              Finally understand what you're putting on your skin
            </span>
          </div>
          
          {/* Routine Tracking */}
          <div className="lc-tool-card">
            <div className="lc-tool-icon">
              <i className="ri-calendar-check-line"></i>
            </div>
            <h3 className="lc-tool-title">Routine Tracking</h3>
            <p className="lc-tool-pain">
              You've lost track of what you used and when—never quite knowing what's working, with no one guiding you through the process.
            </p>
            <p className="lc-tool-description">
              Build AM/PM routines with smart conflict detection. Track your progress over time, and let your journey strengthen your personalization.
            </p>
            <span className="lc-tool-outcome">
              <i className="ri-check-line"></i>
              Build consistency, see what actually works
            </span>
          </div>
          
          {/* Progress Assessment */}
          <div className="lc-tool-card">
            <div className="lc-tool-icon">
              <i className="ri-line-chart-line"></i>
            </div>
            <h3 className="lc-tool-title">Progress Assessment</h3>
            <p className="lc-tool-pain">
              You've tried new routines without any way to measure results—or know when something needs to change.
            </p>
            <p className="lc-tool-description">
              Curae analyzes your tracked routines and skin progress over time, giving you personalized feedback and clear, actionable next steps.
            </p>
            <span className="lc-tool-outcome">
              <i className="ri-check-line"></i>
              Data-driven insights that evolve with your skin
            </span>
          </div>
        </div>
      </section>

      {/* Differentiation Section */}
      <section className="lc-differentiation">
        <div className="lc-diff-grid">
          <div>
            <h2 className="lc-diff-title">
              We're not Sephora. We're not Amazon.<br />
              We're <em>on your side.</em>
            </h2>
            <p className="lc-diff-text">
              Big retailers want you to buy. Search engines want you to click. Ingredient databases give you data without direction. We built Lorem Curae because we were tired of navigating a system that was designed to sell—not to support. You deserve tools that actually work for you.
            </p>
            
            <ul className="lc-comparison-list">
              <li className="lc-comparison-item">
                <span className="lc-icon-x">✕</span>
                <div>
                  <strong>Sephora & Ulta:</strong>{' '}
                  <span>Sell inventory first, fit second. Reviews aren't filtered by skin type.</span>
                </div>
              </li>
              <li className="lc-comparison-item">
                <span className="lc-icon-x">✕</span>
                <div>
                  <strong>Amazon:</strong>{' '}
                  <span>Counterfeit risk. Zero personalization. Review manipulation.</span>
                </div>
              </li>
              <li className="lc-comparison-item">
                <span className="lc-icon-x">✕</span>
                <div>
                  <strong>Google:</strong>{' '}
                  <span>SEO-gamed results. Sponsored content disguised as advice.</span>
                </div>
              </li>
              <li className="lc-comparison-item">
                <span className="lc-icon-x">✕</span>
                <div>
                  <strong>INCIdecoder:</strong>{' '}
                  <span>Great for data, but no personalization or guidance.</span>
                </div>
              </li>
              <li className="lc-comparison-item lc-us">
                <span className="lc-icon-check">✓</span>
                <div>
                  <strong>Lorem Curae:</strong>{' '}
                  <span>Personalized recommendations, community-reviewed retailers, verified marketplace products, science-backed guidance, and a supportive community where you're never figuring it out alone.</span>
                </div>
              </li>
            </ul>
          </div>
          
          <div className="lc-diff-visual">
            <p className="lc-diff-quote">
              Your skin is unique.<br />
              Your tools should be too.
            </p>
          </div>
        </div>
      </section>

      {/* Rewards Section */}
      <section className="lc-rewards">
        <div className="lc-rewards-grid">
          <div className="lc-rewards-content">
            <h2>Earn rewards for making informed choices</h2>
            <p>
              When you discover a product through Lorem Curae and purchase from one of our verified retail partners, we share a portion of what we earn back with you. Your trust matters—and we believe in rewarding it.
            </p>
            <ul className="lc-rewards-list">
              <li>
                <i className="ri-check-line"></i>
                Early access to new features
              </li>
              <li>
                <i className="ri-check-line"></i>
                Beta testing invitations
              </li>
              <li>
                <i className="ri-check-line"></i>
                Future discounts and perks
              </li>
              <li>
                <i className="ri-check-line"></i>
                Exclusive community benefits
              </li>
            </ul>
            <a href="#waitlist" className="lc-btn-primary">
              Join the Waitlist
            </a>
          </div>
          
          <div className="lc-rewards-visual">
            <div className="lc-reward-item">
              <div className="lc-reward-left">
                <div className="lc-reward-icon">
                  <i className="ri-gift-line"></i>
                </div>
                <span className="lc-reward-label">Points Earned</span>
              </div>
              <span className="lc-reward-value">+250</span>
            </div>
            <div className="lc-reward-item">
              <div className="lc-reward-left">
                <div className="lc-reward-icon">
                  <i className="ri-star-line"></i>
                </div>
                <span className="lc-reward-label">Early Access</span>
              </div>
              <span className="lc-reward-badge">Unlocked</span>
            </div>
            <div className="lc-reward-item">
              <div className="lc-reward-left">
                <div className="lc-reward-icon">
                  <i className="ri-vip-crown-line"></i>
                </div>
                <span className="lc-reward-label">Founding Member</span>
              </div>
              <span className="lc-reward-badge">Permanent</span>
            </div>
          </div>
        </div>
      </section>

      {/* Early Access Benefits Section */}
      <section className="lc-early-access">
        <div className="lc-early-access-inner">
          <span className="lc-section-label">Founding Members</span>
          <h2>Why join early?</h2>
          <p className="lc-section-description">
            Great tools aren't built in isolation—they're shaped by the people who need them most. As a founding member, you're not just getting early access. You're helping us build what Lorem Curae becomes. Your feedback, your frustrations, your wins—they matter here. This is your platform too.
          </p>
          
          <div className="lc-benefits-grid">
            <div className="lc-benefit-card">
              <div className="lc-benefit-icon">
                <i className="ri-rocket-line"></i>
              </div>
              <h3 className="lc-benefit-title">First Access</h3>
              <p className="lc-benefit-text">Be among the first to experience Lorem Curae before public launch</p>
            </div>
            <div className="lc-benefit-card">
              <div className="lc-benefit-icon">
                <i className="ri-voice-recognition-line"></i>
              </div>
              <h3 className="lc-benefit-title">Shape the Platform</h3>
              <p className="lc-benefit-text">Your feedback directly influences features, design, and priorities</p>
            </div>
            <div className="lc-benefit-card">
              <div className="lc-benefit-icon">
                <i className="ri-group-line"></i>
              </div>
              <h3 className="lc-benefit-title">Join the Community</h3>
              <p className="lc-benefit-text">Connect with others who value transparency, science, and real results</p>
            </div>
            <div className="lc-benefit-card">
              <div className="lc-benefit-icon">
                <i className="ri-medal-line"></i>
              </div>
              <h3 className="lc-benefit-title">Permanent Status</h3>
              <p className="lc-benefit-text">Founding member recognition and exclusive perks for life</p>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section id="waitlist" className="lc-final-cta">
        <div className="lc-cta-box">
          <div className="lc-cta-icon">
            <i className="ri-seedling-line"></i>
          </div>
          <h2>Your skin journey starts here</h2>
          <p>
            No more guessing. No more wasted money on products that weren't made for you. Join early and help shape the future of skincare—built on science, personalization, and a community where you finally feel understood.
          </p>
          
          <div className="lc-form-wrapper">
            <SupabaseWaitlistForm segment="regular" />
            
            <div className="lc-status-wrapper">
              <WaitlistStatus />
            </div>
          </div>
          
          <div className="lc-magic-link-section">
            <h3>Already on the waitlist?</h3>
            <MagicLinkLogin />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="lc-footer">
        <Link to="/" className="lc-footer-logo">
          Lorem Curae
        </Link>
        <p className="lc-footer-tagline">
          Skincare, finally decoded.
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

export default WaitlistLandingPage;