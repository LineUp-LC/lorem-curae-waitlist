import{j as e,L as i}from"./index-_tKk-o8C.js";import{S as a}from"./SupabaseWaitlistForm-Do0hKs0u.js";const n=()=>e.jsxs("div",{className:"lc-marketplace-page",children:[e.jsx("style",{children:`
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
        
        /* Founding Members Section */
        .lc-founding-section {
          padding: 5rem 1.5rem;
          background: white;
        }

        .lc-founding-description-extended {
          font-family: var(--lc-font-sans, 'DM Sans', sans-serif);
          font-size: 1.0625rem;
          color: #6B635A;
          line-height: 1.7;
          text-align: center;
          max-width: 800px;
          margin: -2.5rem auto 3rem;
        }

        .lc-founding-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 1.5rem;
          max-width: 1100px;
          margin: 0 auto;
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
      `}),e.jsx("header",{className:"lc-header",children:e.jsxs("div",{className:"lc-header-inner",children:[e.jsx(i,{to:"/",className:"lc-logo",children:"Curae"}),e.jsx("a",{href:"#waitlist",className:"lc-header-cta",children:"Join Creator Waitlist"})]})}),e.jsx("div",{className:"lc-regular-banner",children:e.jsxs(i,{to:"/preview-of-waitlist-early-access-2025",className:"lc-regular-link",children:[e.jsx("span",{children:"Looking for personalized skincare instead? Visit the regular waitlist"}),e.jsx("i",{className:"ri-arrow-right-line"})]})}),e.jsxs("section",{className:"lc-hero",children:[e.jsx("div",{className:"lc-hero-bg"}),e.jsxs("div",{className:"lc-hero-content",children:[e.jsx("div",{className:"lc-badge",children:"Creator Marketplace: Coming Soon"}),e.jsxs("h1",{className:"lc-headline",children:["A new home for",e.jsx("br",{}),e.jsx("em",{children:"indie beauty creators"})]}),e.jsx("p",{className:"lc-subhead",children:"Sell with confidence. Grow with clarity. Build with support. A transparent, creator-first platform designed to help you reach customers who value authenticity and intention."}),e.jsxs("div",{className:"lc-problem-box",children:[e.jsx("strong",{children:"The beauty world is shifting:"})," Customers want transparency, authenticity, and products made with intention. Indie creators are leading that movement, but the platforms available today weren't built for you. We're changing that."]}),e.jsxs("div",{className:"lc-cta-group",children:[e.jsx("a",{href:"#waitlist",className:"lc-btn-primary",children:"Join the Creator Waitlist"}),e.jsx("a",{href:"#why",className:"lc-btn-secondary",children:"Why Curae"})]})]})]}),e.jsxs("section",{id:"why",className:"lc-why-section",children:[e.jsxs("div",{className:"lc-section-intro",children:[e.jsx("span",{className:"lc-section-label",children:"Why We Built This"}),e.jsx("h2",{className:"lc-section-title",children:"Indie creators deserve better"}),e.jsxs("p",{className:"lc-section-description",children:["Most marketplaces weren't designed with indie creators in mind. They prioritize mass-market brands and leave small creators behind. We believe your craft deserves a platform that ",e.jsx("em",{children:"respects it"}),"."]})]}),e.jsxs("div",{className:"lc-pain-grid",children:[e.jsxs("div",{className:"lc-pain-card",children:[e.jsx("div",{className:"lc-pain-icon",children:e.jsx("i",{className:"ri-eye-off-line"})}),e.jsxs("p",{className:"lc-pain-text",children:[e.jsx("strong",{children:"Hidden behind algorithms"}),": Indie creators get buried while big brands dominate the spotlight."]})]}),e.jsxs("div",{className:"lc-pain-card",children:[e.jsx("div",{className:"lc-pain-icon",children:e.jsx("i",{className:"ri-money-dollar-circle-line"})}),e.jsxs("p",{className:"lc-pain-text",children:[e.jsx("strong",{children:"High fees, low support"}),": Platforms take a cut without offering real tools or guidance for growth."]})]}),e.jsxs("div",{className:"lc-pain-card",children:[e.jsx("div",{className:"lc-pain-icon",children:e.jsx("i",{className:"ri-spam-2-line"})}),e.jsxs("p",{className:"lc-pain-text",children:[e.jsx("strong",{children:"Counterfeits and resellers"}),": Your reputation suffers when marketplaces don't verify sellers."]})]}),e.jsxs("div",{className:"lc-pain-card",children:[e.jsx("div",{className:"lc-pain-icon",children:e.jsx("i",{className:"ri-bar-chart-box-line"})}),e.jsxs("p",{className:"lc-pain-text",children:[e.jsx("strong",{children:"No customer insight"}),": You're selling blind without data on who's buying and why."]})]}),e.jsxs("div",{className:"lc-pain-card",children:[e.jsx("div",{className:"lc-pain-icon",children:e.jsx("i",{className:"ri-user-unfollow-line"})}),e.jsxs("p",{className:"lc-pain-text",children:[e.jsx("strong",{children:"No loyal audience"}),": Building a following is nearly impossible when platforms control the relationship."]})]}),e.jsxs("div",{className:"lc-pain-card",children:[e.jsx("div",{className:"lc-pain-icon",children:e.jsx("i",{className:"ri-store-line"})}),e.jsxs("p",{className:"lc-pain-text",children:[e.jsx("strong",{children:"One-size-fits-all"}),": Mass-market platforms weren't designed for creators who formulate with intention."]})]})]})]}),e.jsx("section",{className:"lc-differentiation",children:e.jsxs("div",{className:"lc-diff-grid",children:[e.jsxs("div",{children:[e.jsxs("h2",{className:"lc-diff-title",children:["What makes Curae ",e.jsx("em",{children:"different"})]}),e.jsx("p",{className:"lc-diff-text",children:"We built a marketplace that puts creators first, because when you succeed, our community thrives. Every feature exists to help you grow sustainably while staying true to your craft."}),e.jsxs("ul",{className:"lc-diff-list",children:[e.jsxs("li",{className:"lc-diff-item",children:[e.jsx("i",{className:"ri-check-line"}),e.jsxs("div",{children:[e.jsx("strong",{children:"Creator-First Economics"}),": Fair fees that decrease as you grow, not arbitrary cuts that punish success."]})]}),e.jsxs("li",{className:"lc-diff-item",children:[e.jsx("i",{className:"ri-check-line"}),e.jsxs("div",{children:[e.jsx("strong",{children:"Quality Over Quantity"}),": A curated marketplace where indie creators aren't drowned out by mass-market noise."]})]}),e.jsxs("li",{className:"lc-diff-item",children:[e.jsx("i",{className:"ri-check-line"}),e.jsxs("div",{children:[e.jsx("strong",{children:"Built-In Trust"}),": Verification badges and customer reviews that establish credibility from day one."]})]}),e.jsxs("li",{className:"lc-diff-item",children:[e.jsx("i",{className:"ri-check-line"}),e.jsxs("div",{children:[e.jsx("strong",{children:"Tools That Scale With You"}),": From your first sale to your thousandth, we grow with you."]})]})]})]}),e.jsx("div",{className:"lc-diff-visual",children:e.jsxs("p",{className:"lc-diff-quote",children:["Your craft deserves a platform",e.jsx("br",{}),"built to elevate it."]})})]})}),e.jsxs("section",{className:"lc-who-section",children:[e.jsxs("div",{className:"lc-section-intro",children:[e.jsx("span",{className:"lc-section-label",children:"Who This Marketplace Is For"}),e.jsx("h2",{className:"lc-section-title",children:"Whether you're just starting or ready to scale"}),e.jsx("p",{className:"lc-section-description",children:"Curae Marketplace welcomes creators at every stage of their journey, from testing your first formulation to building a recognized brand."})]}),e.jsxs("div",{className:"lc-who-grid",children:[e.jsxs("div",{className:"lc-who-card",children:[e.jsx("div",{className:"lc-who-icon",children:e.jsx("i",{className:"ri-seedling-line"})}),e.jsx("h3",{className:"lc-who-title",children:"Hobbyists"}),e.jsx("p",{className:"lc-who-text",children:"Testing the waters with your first products and exploring what's possible"})]}),e.jsxs("div",{className:"lc-who-card",children:[e.jsx("div",{className:"lc-who-icon",children:e.jsx("i",{className:"ri-flask-line"})}),e.jsx("h3",{className:"lc-who-title",children:"Testers & Formulators"}),e.jsx("p",{className:"lc-who-text",children:"Experimenting with early batches and gathering real customer feedback"})]}),e.jsxs("div",{className:"lc-who-card",children:[e.jsx("div",{className:"lc-who-icon",children:e.jsx("i",{className:"ri-lightbulb-line"})}),e.jsx("h3",{className:"lc-who-title",children:"Emerging Creators"}),e.jsx("p",{className:"lc-who-text",children:"Launching your first products and building your brand identity"})]}),e.jsxs("div",{className:"lc-who-card",children:[e.jsx("div",{className:"lc-who-icon",children:e.jsx("i",{className:"ri-store-2-line"})}),e.jsx("h3",{className:"lc-who-title",children:"Growing Indie Brands"}),e.jsx("p",{className:"lc-who-text",children:"Ready to reach new audiences and scale sustainably"})]}),e.jsxs("div",{className:"lc-who-card",children:[e.jsx("div",{className:"lc-who-icon",children:e.jsx("i",{className:"ri-vip-crown-line"})}),e.jsx("h3",{className:"lc-who-title",children:"Established Creators"}),e.jsx("p",{className:"lc-who-text",children:"Seeking a transparent, supportive platform that respects your craft"})]})]})]}),e.jsxs("section",{className:"lc-tools-section",children:[e.jsxs("div",{className:"lc-section-intro",children:[e.jsx("span",{className:"lc-section-label",children:"Your Growth Toolkit"}),e.jsx("h2",{className:"lc-section-title",children:"Tools that help you stand out"}),e.jsx("p",{className:"lc-section-description",children:"Everything you need to build visibility, tell your story, and grow a loyal customer base."})]}),e.jsxs("div",{className:"lc-tools-grid",children:[e.jsxs("div",{className:"lc-tool-card",children:[e.jsx("div",{className:"lc-tool-icon",children:e.jsx("i",{className:"ri-star-line"})}),e.jsxs("div",{className:"lc-tool-content",children:[e.jsx("h3",{children:"Premium Placement"}),e.jsx("p",{children:"Gain enhanced visibility within your compatible audience. Get featured in top search results and curated collections, filtered through skin-compatibility, safety, and creator integrity. Be highlighted for the people your products are genuinely right for"})]})]}),e.jsxs("div",{className:"lc-tool-card",children:[e.jsx("div",{className:"lc-tool-icon",children:e.jsx("i",{className:"ri-palette-line"})}),e.jsxs("div",{className:"lc-tool-content",children:[e.jsx("h3",{children:"Custom Storefronts"}),e.jsx("p",{children:"Design your storefront to match your brand identity and values"})]})]}),e.jsxs("div",{className:"lc-tool-card",children:[e.jsx("div",{className:"lc-tool-icon",children:e.jsx("i",{className:"ri-megaphone-line"})}),e.jsxs("div",{className:"lc-tool-content",children:[e.jsx("h3",{children:"Promotional Tools"}),e.jsx("p",{children:"Run compatibility-first campaigns that reach only users whose skin profiles match your products, transparent, ethical, and built to grow your brand responsibly"})]})]}),e.jsxs("div",{className:"lc-tool-card",children:[e.jsx("div",{className:"lc-tool-icon",children:e.jsx("i",{className:"ri-book-open-line"})}),e.jsxs("div",{className:"lc-tool-content",children:[e.jsx("h3",{children:"Brand Storytelling"}),e.jsx("p",{children:"Share your journey and values with rich content pages"})]})]}),e.jsxs("div",{className:"lc-tool-card",children:[e.jsx("div",{className:"lc-tool-icon",children:e.jsx("i",{className:"ri-team-line"})}),e.jsxs("div",{className:"lc-tool-content",children:[e.jsx("h3",{children:"Community Engagement"}),e.jsx("p",{children:"Build a following and engage with customers directly"})]})]}),e.jsxs("div",{className:"lc-tool-card",children:[e.jsx("div",{className:"lc-tool-icon",children:e.jsx("i",{className:"ri-medal-line"})}),e.jsxs("div",{className:"lc-tool-content",children:[e.jsx("h3",{children:"Verified Badge"}),e.jsx("p",{children:"Stand out with verification that builds customer trust"})]})]})]})]}),e.jsxs("section",{className:"lc-analytics-section",children:[e.jsxs("div",{className:"lc-section-intro",children:[e.jsx("span",{className:"lc-section-label",children:"Data That Drives Decisions"}),e.jsx("h2",{className:"lc-section-title",children:"Analytics & Insights"}),e.jsx("p",{className:"lc-section-description",children:"Track your performance with detailed analytics on views, engagement, and sales, so you can optimize your strategy with confidence."})]}),e.jsxs("div",{className:"lc-analytics-grid",children:[e.jsxs("div",{className:"lc-analytics-card",children:[e.jsx("div",{className:"lc-analytics-icon",children:e.jsx("i",{className:"ri-eye-line"})}),e.jsx("h3",{className:"lc-analytics-title",children:"Performance Dashboard"}),e.jsx("p",{className:"lc-analytics-text",children:"Monitor views, clicks, and conversions in real-time"})]}),e.jsxs("div",{className:"lc-analytics-card",children:[e.jsx("div",{className:"lc-analytics-icon",children:e.jsx("i",{className:"ri-user-heart-line"})}),e.jsx("h3",{className:"lc-analytics-title",children:"Customer Insights"}),e.jsx("p",{className:"lc-analytics-text",children:"Understand who's buying and what drives their decisions"})]}),e.jsxs("div",{className:"lc-analytics-card",children:[e.jsx("div",{className:"lc-analytics-icon",children:e.jsx("i",{className:"ri-line-chart-line"})}),e.jsx("h3",{className:"lc-analytics-title",children:"Trend Analysis"}),e.jsx("p",{className:"lc-analytics-text",children:"Identify patterns and optimize your offerings"})]})]})]}),e.jsxs("section",{className:"lc-pricing-section",children:[e.jsxs("div",{className:"lc-section-intro",children:[e.jsx("span",{className:"lc-section-label",children:"Transparent, Growth-Friendly"}),e.jsx("h2",{className:"lc-section-title",children:"Fees that reward your success"}),e.jsx("p",{className:"lc-section-description",children:"Transaction fees decrease as your monthly sales increase. The more you grow, the more you keep."})]}),e.jsxs("div",{className:"lc-pricing-grid",children:[e.jsxs("div",{className:"lc-pricing-card",children:[e.jsx("div",{className:"lc-pricing-rate",children:"12%"}),e.jsx("div",{className:"lc-pricing-label",children:"Transaction Fee"}),e.jsx("div",{className:"lc-pricing-tier",children:"Up to $10K Monthly GMV"}),e.jsx("p",{className:"lc-pricing-note",children:"Growing creators"})]}),e.jsxs("div",{className:"lc-pricing-card",children:[e.jsx("div",{className:"lc-pricing-rate",children:"10%"}),e.jsx("div",{className:"lc-pricing-label",children:"Transaction Fee"}),e.jsx("div",{className:"lc-pricing-tier",children:"$10K–$25K Monthly GMV"}),e.jsx("p",{className:"lc-pricing-note",children:"Scaling brands"})]}),e.jsxs("div",{className:"lc-pricing-card",children:[e.jsx("div",{className:"lc-pricing-rate",children:"8%"}),e.jsx("div",{className:"lc-pricing-label",children:"Transaction Fee"}),e.jsx("div",{className:"lc-pricing-tier",children:"$25K+ Monthly GMV"}),e.jsx("p",{className:"lc-pricing-note",children:"Established creators"})]})]})]}),e.jsxs("section",{className:"lc-founding-section",children:[e.jsxs("div",{className:"lc-section-intro",children:[e.jsx("span",{className:"lc-section-label",children:"Founding Members Get More"}),e.jsx("h2",{className:"lc-section-title",children:"A rare opportunity to unlock every creator benefit from day one"})]}),e.jsx("p",{className:"lc-founding-description-extended",children:"Founding Members aren't just early adopters. They're the creators shaping the future of Curae. As part of this limited group, you gain full access to the entire creator ecosystem the moment it launches, along with exclusive perks designed to support your growth from the very beginning."}),e.jsxs("div",{className:"lc-founding-grid",children:[e.jsxs("div",{className:"lc-tool-card",children:[e.jsx("div",{className:"lc-tool-icon",children:e.jsx("i",{className:"ri-lock-unlock-line"})}),e.jsxs("div",{className:"lc-tool-content",children:[e.jsx("h3",{children:"All Growth Tools, Unlocked"}),e.jsx("p",{children:"Enjoy full access to all tools. No waiting, no restrictions."})]})]}),e.jsxs("div",{className:"lc-tool-card",children:[e.jsx("div",{className:"lc-tool-icon",children:e.jsx("i",{className:"ri-rocket-line"})}),e.jsxs("div",{className:"lc-tool-content",children:[e.jsx("h3",{children:"Priority Access to New Features"}),e.jsx("p",{children:"Be the first to test new tools, creator workflows, and marketplace capabilities. Your feedback directly influences how the platform evolves."})]})]}),e.jsxs("div",{className:"lc-tool-card",children:[e.jsx("div",{className:"lc-tool-icon",children:e.jsx("i",{className:"ri-eye-line"})}),e.jsxs("div",{className:"lc-tool-content",children:[e.jsx("h3",{children:"Early Marketplace Visibility"}),e.jsx("p",{children:"Founding Members are introduced to customers before the broader creator community joins, giving you a head start in building your audience and establishing trust."})]})]}),e.jsxs("div",{className:"lc-tool-card",children:[e.jsx("div",{className:"lc-tool-icon",children:e.jsx("i",{className:"ri-award-line"})}),e.jsxs("div",{className:"lc-tool-content",children:[e.jsx("h3",{children:"Founding Member Badge"}),e.jsx("p",{children:"Stand out with a permanent badge that signals credibility, early support, and commitment to intentional, transparent creation."})]})]}),e.jsxs("div",{className:"lc-tool-card",children:[e.jsx("div",{className:"lc-tool-icon",children:e.jsx("i",{className:"ri-chat-voice-line"})}),e.jsxs("div",{className:"lc-tool-content",children:[e.jsx("h3",{children:"Direct Line to the Team"}),e.jsx("p",{children:"Founding Members receive priority support, early access to creator roundtables, and opportunities to share feedback directly with the team shaping the platform."})]})]}),e.jsxs("div",{className:"lc-tool-card",children:[e.jsx("div",{className:"lc-tool-icon",children:e.jsx("i",{className:"ri-vip-diamond-line"})}),e.jsxs("div",{className:"lc-tool-content",children:[e.jsx("h3",{children:"Limited Spots, Lasting Impact"}),e.jsx("p",{children:"This is a capped group. Once the Founding Member slots are filled, they're gone. Joining now means securing a place in the foundation of a marketplace built to elevate indie creators for years to come."})]})]})]})]}),e.jsx("section",{id:"waitlist",className:"lc-final-cta",children:e.jsxs("div",{className:"lc-cta-box",children:[e.jsx("div",{className:"lc-cta-icon",children:e.jsx("i",{className:"ri-hand-heart-line"})}),e.jsx("h2",{children:"Indie beauty is the future"}),e.jsx("p",{children:"Creators deserve a platform built to elevate their craft, not bury it. Join the waitlist and be among the first to sell on a marketplace designed with intention, transparency, and your success in mind."}),e.jsx("div",{className:"lc-form-wrapper",children:e.jsx(a,{segment:"creator"})}),e.jsx("p",{className:"lc-privacy-note",children:"We respect your privacy. No spam, ever."})]})}),e.jsxs("footer",{className:"lc-footer",children:[e.jsx(i,{to:"/",className:"lc-footer-logo",children:"Curae"}),e.jsx("p",{className:"lc-footer-tagline",children:"Empowering indie beauty creators"}),e.jsxs("div",{className:"lc-footer-links",children:[e.jsx(i,{to:"/privacy",children:"Privacy"}),e.jsx("span",{children:"•"}),e.jsx(i,{to:"/contact",children:"Contact"}),e.jsx("span",{children:"•"}),e.jsx("a",{href:"https://readdy.ai/?origin=logo",target:"_blank",rel:"noopener noreferrer",children:"Powered by Readdy"})]})]})]});export{n as default};
//# sourceMappingURL=page-CunRGjJ6.js.map
