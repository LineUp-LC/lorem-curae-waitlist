// src/pages/preview-of-waitlist-early-access-2025/page.tsx
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import SupabaseWaitlistForm from '../../components/SupabaseWaitlistForm';
import WaitlistStatus from '../../components/WaitlistStatus';
import MagicLinkLogin from '../../components/MagicLinkLogin';
import AuthCallback from '../../components/AuthCallback';
import { competitors } from '../../data/competitors';
import { supabase } from '../../lib/supabase';

/**
 * WaitlistLandingPage
 *
 * Product: camera-powered skincare intelligence app.
 * One-liner: Scan any skincare product. Know instantly if it works for YOUR skin.
 *
 * Narrative arc:
 *   Hero (dark, grain) → Problem → How it works → Safety tiers → Features
 *   → Differentiation (dark, grain) → Early access → Perks → Final CTA → Footer
 *
 * Motion: staggered entrance on hero load, IntersectionObserver-triggered
 * reveals on feature cards and safety tier bars (left-to-right scaleX).
 */
const scrollTo = (id: string) => (e: React.MouseEvent) => {
  e.preventDefault();
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
};

interface FoundingSlots {
  slots_used: number;
  slots_remaining: number;
  slots_available: boolean;
}

const WaitlistLandingPage = () => {
  const [slotData, setSlotData] = useState<FoundingSlots | null>(null);
  const [slotLoading, setSlotLoading] = useState(true);

  useEffect(() => {
    supabase
      .from('founding_member_slots')
      .select('*')
      .single()
      .then(({ data }) => {
        if (data) setSlotData(data as FoundingSlots);
        setSlotLoading(false);
      });
  }, []);

  // Scroll reveal: adds .is-visible to .lc-reveal elements when they enter
  // the viewport. Uses IntersectionObserver (no scroll listeners).
  // transform/opacity only — hardware accelerated.
  useEffect(() => {
    const targets = document.querySelectorAll<HTMLElement>('.lc-reveal');
    if (targets.length === 0) return;

    // Respect prefers-reduced-motion: mark everything visible immediately.
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) {
      targets.forEach((el) => el.classList.add('is-visible'));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: '0px 0px -40px 0px' }
    );

    targets.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, []);

  return (
    <div className="lc-waitlist-page">
      {/* Handles auth callback redirect after magic link */}
      <AuthCallback />

      <style>{`
        .lc-waitlist-page {
          min-height: 100vh;
          background: #FAF8F5;
          font-family: 'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif;
          color: #1a1a1a;
          -webkit-font-smoothing: antialiased;
        }

        /* ============================================================
           HEADER (floating over dark hero, translucent dark)
           ============================================================ */
        .lc-header {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          background: rgba(15, 15, 15, 0.85);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border-bottom: 1px solid rgba(255, 255, 255, 0.06);
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
          font-family: 'Cormorant Garamond', Georgia, serif;
          font-size: 1.5rem;
          font-weight: 600;
          color: #FAF8F5;
          text-decoration: none;
          letter-spacing: -0.01em;
        }

        .lc-header-cta {
          font-family: 'DM Sans', sans-serif;
          font-size: 0.875rem;
          font-weight: 600;
          padding: 0.625rem 1.25rem;
          background: #C4704D;
          color: #FFFFFF;
          border-radius: 100px;
          text-decoration: none;
          transition: background 0.2s ease, transform 0.2s ease;
        }

        .lc-header-cta:hover {
          background: #A85C3C;
          transform: translateY(-1px);
        }



        /* ============================================================
           HERO (dark, left-aligned, grain overlay, staggered entrance)
           ============================================================ */
        .lc-hero {
          padding: 6rem 1.5rem 5.5rem;
          margin-top: 132px;
          background: #0f0f0f;
          position: relative;
          overflow: hidden;
        }

        /* Terracotta ambient light, top-right */
        .lc-hero::before {
          content: '';
          position: absolute;
          top: -25%;
          right: -15%;
          width: 620px;
          height: 620px;
          background: radial-gradient(circle, rgba(196, 112, 77, 0.14) 0%, transparent 68%);
          pointer-events: none;
          z-index: 0;
        }

        /* Cool counter-light, bottom-left */
        .lc-hero::after {
          content: '';
          position: absolute;
          bottom: -35%;
          left: -20%;
          width: 700px;
          height: 700px;
          background: radial-gradient(circle, rgba(93, 202, 165, 0.06) 0%, transparent 70%);
          pointer-events: none;
          z-index: 0;
        }

        /* Static grain noise overlay (pre-rendered SVG, no filter computations) */
        .lc-grain {
          position: absolute;
          inset: 0;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='220' height='220'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.92' numOctaves='2' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
          opacity: 0.045;
          mix-blend-mode: overlay;
          pointer-events: none;
          z-index: 1;
        }

        .lc-hero-content {
          position: relative;
          z-index: 2;
          max-width: 940px;
          margin: 0 auto;
          text-align: left;
        }

        .lc-hero-headline-wrap {
          max-width: 820px;
        }

        .lc-hero-sub-wrap {
          max-width: 620px;
        }

        .lc-eyebrow {
          font-family: 'DM Sans', sans-serif;
          font-size: 0.6875rem;
          font-weight: 600;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: #C4704D;
          background: rgba(196, 112, 77, 0.1);
          padding: 0.5rem 1rem;
          border-radius: 100px;
          margin-bottom: 2rem;
          display: inline-block;
          border: 1px solid rgba(196, 112, 77, 0.2);
        }

        .lc-headline {
          font-family: 'Cormorant Garamond', Georgia, serif;
          font-size: clamp(2.25rem, 5.8vw, 4.5rem);
          font-weight: 500;
          line-height: 1.08;
          margin: 0 0 1.5rem;
          letter-spacing: -0.015em;
          color: #FAF8F5;
        }

        .lc-headline em {
          font-style: italic;
          color: #E8A888;
        }

        .lc-subhead {
          font-family: 'DM Sans', sans-serif;
          font-size: clamp(1rem, 1.6vw, 1.125rem);
          color: rgba(250, 248, 245, 0.72);
          margin: 0 0 2.5rem;
          line-height: 1.65;
        }

        .lc-cta-group {
          display: flex;
          flex-direction: column;
          align-items: stretch;
          gap: 0.75rem;
        }

        @media (min-width: 640px) {
          .lc-cta-group {
            flex-direction: row;
            justify-content: flex-start;
            align-items: center;
          }
        }

        /* Hero staggered entrance — auto-plays on mount.
           Each child waits on --i (index) * 120ms. */
        .lc-hero-stagger > * {
          opacity: 0;
          transform: translateY(12px);
          animation: lcFadeUp 700ms cubic-bezier(0.16, 1, 0.3, 1) forwards;
          animation-delay: calc(var(--i, 0) * 120ms + 80ms);
        }

        @keyframes lcFadeUp {
          to { opacity: 1; transform: translateY(0); }
        }

        @media (prefers-reduced-motion: reduce) {
          .lc-hero-stagger > * {
            opacity: 1;
            transform: none;
            animation: none;
          }
        }

        /* Legacy .lc-cta-group (non-hero) keeps centered layout */
        .lc-cta-group-center {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.75rem;
        }

        .lc-btn-primary {
          font-family: 'DM Sans', sans-serif;
          font-size: 0.9375rem;
          font-weight: 600;
          padding: 0.95rem 1.75rem;
          background: #C4704D;
          color: #FFFFFF;
          border: none;
          border-radius: 100px;
          cursor: pointer;
          text-decoration: none;
          display: inline-block;
          transition: background 0.2s ease, transform 0.2s ease, box-shadow 0.2s ease;
          width: 100%;
          text-align: center;
        }

        @media (min-width: 640px) {
          .lc-btn-primary {
            width: auto;
          }
        }

        .lc-btn-primary:hover {
          background: #A85C3C;
          transform: translateY(-2px);
          box-shadow: 0 12px 32px rgba(196, 112, 77, 0.25);
        }

        /* Tactile push — overrides hover translate on click */
        .lc-btn-primary:active {
          transform: scale(0.98) translateY(0);
          transition: transform 100ms ease-out;
          box-shadow: 0 4px 12px rgba(196, 112, 77, 0.2);
        }

        .lc-btn-ghost-dark {
          font-family: 'DM Sans', sans-serif;
          font-size: 0.9375rem;
          font-weight: 600;
          padding: 0.95rem 1.75rem;
          background: transparent;
          color: #FAF8F5;
          border: 1px solid rgba(250, 248, 245, 0.25);
          border-radius: 100px;
          cursor: pointer;
          text-decoration: none;
          display: inline-block;
          transition: all 0.2s ease;
          width: 100%;
          text-align: center;
        }

        @media (min-width: 640px) {
          .lc-btn-ghost-dark {
            width: auto;
          }
        }

        .lc-btn-ghost-dark:hover {
          border-color: #E8A888;
          color: #E8A888;
        }

        .lc-btn-ghost-dark:active {
          transform: scale(0.98);
          transition: transform 100ms ease-out;
        }

        /* ============================================================
           SCROLL REVEAL (IntersectionObserver adds .is-visible)
           Transform + opacity only. Stagger via --i CSS variable.
           ============================================================ */
        .lc-reveal {
          opacity: 0;
          transform: translateY(16px);
          transition: opacity 700ms cubic-bezier(0.16, 1, 0.3, 1),
                      transform 700ms cubic-bezier(0.16, 1, 0.3, 1);
          transition-delay: calc(var(--i, 0) * 80ms);
          will-change: transform, opacity;
        }

        .lc-reveal.is-visible {
          opacity: 1;
          transform: translateY(0);
        }

        @media (prefers-reduced-motion: reduce) {
          .lc-reveal { opacity: 1; transform: none; transition: none; }
        }

        /* ============================================================
           SHARED SECTION PRIMITIVES
           ============================================================ */
        .lc-section {
          padding: 5rem 1.5rem;
        }

        @media (min-width: 768px) {
          .lc-section {
            padding: 6rem 2rem;
          }
        }

        .lc-section-cream { background: #FAF8F5; }
        .lc-section-white { background: #FFFFFF; }
        .lc-section-dark  { background: #0f0f0f; color: #FAF8F5; }

        .lc-container {
          max-width: 1100px;
          margin: 0 auto;
        }

        .lc-container-narrow {
          max-width: 780px;
          margin: 0 auto;
        }

        .lc-section-label {
          font-family: 'DM Sans', sans-serif;
          font-size: 0.6875rem;
          font-weight: 600;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: #C4704D;
          margin: 0 0 1rem;
          display: block;
        }

        .lc-section-label-dark { color: #E8A888; }

        .lc-section-title {
          font-family: 'Cormorant Garamond', Georgia, serif;
          font-size: clamp(1.875rem, 4vw, 2.75rem);
          font-weight: 500;
          line-height: 1.15;
          letter-spacing: -0.01em;
          margin: 0 0 1.25rem;
          color: #1a1a1a;
        }

        .lc-section-title-dark { color: #FAF8F5; }

        .lc-section-title em {
          font-style: italic;
          color: #C4704D;
        }

        .lc-section-title-dark em {
          color: #E8A888;
        }

        .lc-section-lead {
          font-family: 'DM Sans', sans-serif;
          font-size: 1.0625rem;
          color: #5a5149;
          line-height: 1.7;
          margin: 0 0 2rem;
        }

        .lc-section-lead-dark { color: rgba(250, 248, 245, 0.68); }

        .lc-section-intro {
          text-align: center;
          max-width: 720px;
          margin: 0 auto 3.5rem;
        }

        /* ============================================================
           PROBLEM SECTION
           ============================================================ */
        .lc-problem-title {
          font-family: 'Cormorant Garamond', Georgia, serif;
          font-size: clamp(1.75rem, 3.5vw, 2.5rem);
          font-weight: 500;
          line-height: 1.2;
          color: #1a1a1a;
          margin: 0 0 1.5rem;
          letter-spacing: -0.01em;
        }

        .lc-problem-body {
          font-family: 'DM Sans', sans-serif;
          font-size: 1.0625rem;
          color: #5a5149;
          line-height: 1.75;
          margin: 0;
        }

        .lc-problem-body strong {
          color: #1a1a1a;
          font-weight: 600;
        }

        .lc-problem-body em {
          font-style: italic;
          color: #C4704D;
          font-weight: 500;
        }

        /* ============================================================
           HOW IT WORKS — 3 steps (Scan → Analyze → Know)
           ============================================================ */
        .lc-steps-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 1rem;
        }

        @media (min-width: 768px) {
          .lc-steps-grid {
            grid-template-columns: repeat(3, 1fr);
            gap: 1.5rem;
          }
        }

        .lc-step-card {
          background: #FFFFFF;
          padding: 2rem 1.75rem;
          border-radius: 18px;
          border: 1px solid rgba(26, 26, 26, 0.06);
          position: relative;
          transition: transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease;
        }

        .lc-step-card:hover {
          transform: translateY(-3px);
          box-shadow: 0 20px 50px rgba(26, 26, 26, 0.06);
          border-color: rgba(196, 112, 77, 0.2);
        }

        .lc-step-num {
          font-family: 'Cormorant Garamond', Georgia, serif;
          font-size: 0.75rem;
          font-weight: 600;
          letter-spacing: 0.2em;
          color: #C4704D;
          margin-bottom: 1rem;
          display: block;
        }

        .lc-step-icon {
          width: 48px;
          height: 48px;
          background: rgba(196, 112, 77, 0.08);
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #C4704D;
          font-size: 1.5rem;
          margin-bottom: 1.25rem;
        }

        .lc-step-title {
          font-family: 'Cormorant Garamond', Georgia, serif;
          font-size: 1.5rem;
          font-weight: 600;
          margin: 0 0 0.5rem;
          color: #1a1a1a;
          letter-spacing: -0.005em;
        }

        .lc-step-body {
          font-family: 'DM Sans', sans-serif;
          font-size: 0.9375rem;
          color: #5a5149;
          line-height: 1.6;
          margin: 0;
        }

        /* ============================================================
           SAFETY TIER VISUALIZATION (the core differentiator)
           ============================================================ */
        .lc-tiers {
          display: flex;
          flex-direction: column;
          gap: 0.875rem;
          max-width: 720px;
          margin: 0 auto;
        }

        .lc-tier-row {
          background: #FFFFFF;
          border-radius: 14px;
          border: 1px solid rgba(26, 26, 26, 0.06);
          padding: 1.25rem 1.5rem 1.25rem 1.25rem;
          display: flex;
          align-items: flex-start;
          gap: 1rem;
          position: relative;
          overflow: hidden;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }

        .lc-tier-row:hover {
          transform: translateX(2px);
          box-shadow: 0 10px 30px rgba(26, 26, 26, 0.05);
        }

        .lc-tier-row::before {
          content: '';
          position: absolute;
          left: 0;
          top: 0;
          bottom: 0;
          width: 4px;
          transform: scaleX(1);
          transform-origin: left center;
          will-change: transform;
        }

        .lc-tier-row.safe::before    { background: #5DCAA5; }
        .lc-tier-row.caution::before { background: #EF9F27; }
        .lc-tier-row.avoid::before   { background: #E24B4A; }

        .lc-tier-dot {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          margin-top: 0.5rem;
          flex-shrink: 0;
        }

        .lc-tier-dot.safe    { background: #5DCAA5; box-shadow: 0 0 0 4px rgba(93, 202, 165, 0.15); }
        .lc-tier-dot.caution { background: #EF9F27; box-shadow: 0 0 0 4px rgba(239, 159, 39, 0.15); }
        .lc-tier-dot.avoid   { background: #E24B4A; box-shadow: 0 0 0 4px rgba(226, 75, 74, 0.15); }

        .lc-tier-body { flex: 1; min-width: 0; }

        .lc-tier-heading {
          display: flex;
          align-items: baseline;
          gap: 0.75rem;
          flex-wrap: wrap;
          margin-bottom: 0.375rem;
        }

        .lc-tier-label {
          font-family: 'DM Sans', sans-serif;
          font-size: 0.75rem;
          font-weight: 700;
          letter-spacing: 0.15em;
          text-transform: uppercase;
        }

        .lc-tier-label.safe    { color: #3B8F73; }
        .lc-tier-label.caution { color: #B87615; }
        .lc-tier-label.avoid   { color: #B43836; }

        .lc-tier-verdict {
          font-family: 'Cormorant Garamond', Georgia, serif;
          font-size: 1.125rem;
          font-weight: 600;
          color: #1a1a1a;
          letter-spacing: -0.005em;
        }

        .lc-tier-text {
          font-family: 'DM Sans', sans-serif;
          font-size: 0.875rem;
          color: #5a5149;
          line-height: 1.55;
          margin: 0;
        }

        /* ============================================================
           FEATURES GRID
           ============================================================ */
        .lc-features-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 1rem;
        }

        @media (min-width: 768px) {
          .lc-features-grid {
            grid-template-columns: 1fr 1fr;
            gap: 1.25rem;
          }
        }

        .lc-feature-card {
          background: #FFFFFF;
          padding: 1.75rem;
          border-radius: 16px;
          border: 1px solid rgba(26, 26, 26, 0.06);
          transition: transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease;
        }

        .lc-feature-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 18px 45px rgba(26, 26, 26, 0.06);
          border-color: rgba(196, 112, 77, 0.18);
        }

        /* Asymmetric offset on desktop to break the 2-col grid grid.
           Combines with .lc-reveal's transition transform — uses a
           container translateY via margin-top so it doesn't conflict. */
        @media (min-width: 768px) {
          .lc-feature-offset { margin-top: 2rem; }
        }

        .lc-feature-icon {
          width: 40px;
          height: 40px;
          background: rgba(196, 112, 77, 0.08);
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #C4704D;
          font-size: 1.25rem;
          margin-bottom: 1rem;
        }

        .lc-feature-title {
          font-family: 'Cormorant Garamond', Georgia, serif;
          font-size: 1.375rem;
          font-weight: 600;
          margin: 0 0 0.5rem;
          color: #1a1a1a;
          letter-spacing: -0.005em;
        }

        .lc-feature-text {
          font-family: 'DM Sans', sans-serif;
          font-size: 0.9375rem;
          color: #5a5149;
          line-height: 1.6;
          margin: 0;
        }

        /* ============================================================
           DIFFERENTIATION (dark)
           ============================================================ */
        .lc-diff-section {
          position: relative;
          overflow: hidden;
        }

        .lc-diff-intro {
          position: relative;
          padding-top: 0.5rem;
        }

        .lc-diff-numeral {
          position: absolute;
          top: -2.5rem;
          left: -0.25rem;
          font-family: 'Cormorant Garamond', Georgia, serif;
          font-style: italic;
          font-weight: 500;
          font-size: 7rem;
          line-height: 1;
          color: rgba(232, 168, 136, 0.14);
          letter-spacing: -0.03em;
          pointer-events: none;
          user-select: none;
        }

        @media (min-width: 900px) {
          .lc-diff-numeral {
            font-size: 9rem;
            top: -3.25rem;
          }
        }

        .lc-diff-headline {
          font-size: clamp(2rem, 4.2vw, 3.25rem) !important;
          line-height: 1.08 !important;
        }

        .lc-diff-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 2.5rem;
          align-items: start;
        }

        @media (min-width: 900px) {
          .lc-diff-grid {
            grid-template-columns: 1fr 1fr;
            gap: 4rem;
          }
        }

        .lc-comparison-list {
          list-style: none;
          padding: 0;
          margin: 0;
        }

        .lc-comparison-item {
          font-family: 'DM Sans', sans-serif;
          font-size: 0.9375rem;
          padding: 1.125rem 0;
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
          display: flex;
          align-items: flex-start;
          gap: 0.875rem;
        }

        .lc-comparison-item:last-child { border-bottom: none; }

        .lc-comparison-item strong {
          color: #FAF8F5;
          font-weight: 600;
          display: block;
          margin-bottom: 0.25rem;
        }

        .lc-comparison-item .bullets {
          color: rgba(250, 248, 245, 0.55);
          font-size: 0.875rem;
          line-height: 1.55;
        }

        .lc-comparison-item.lc-us .bullets {
          color: rgba(250, 248, 245, 0.82);
        }

        .lc-comparison-item .bullets > div {
          margin-bottom: 0.25rem;
        }

        .lc-icon-x {
          color: rgba(250, 248, 245, 0.28);
          font-size: 1.125rem;
          line-height: 1.4;
          flex-shrink: 0;
          width: 20px;
          text-align: center;
        }

        .lc-icon-check {
          color: #E8A888;
          font-size: 1.125rem;
          line-height: 1.4;
          flex-shrink: 0;
          width: 20px;
          text-align: center;
        }

        /* ============================================================
           FOUNDING MEMBER / WAVES
           ============================================================ */
        .lc-founding-head {
          text-align: center;
          max-width: 720px;
          margin: 0 auto 2.5rem;
        }

        .lc-price-row {
          display: grid;
          grid-template-columns: 1fr;
          gap: 1rem;
          max-width: 720px;
          margin: 0 auto;
        }

        @media (min-width: 640px) {
          .lc-price-row {
            grid-template-columns: 1fr 1fr;
            gap: 1.25rem;
          }
        }

        .lc-price-card {
          background: #FFFFFF;
          border: 1px solid rgba(26, 26, 26, 0.06);
          border-radius: 16px;
          padding: 1.75rem 1.5rem;
          text-align: left;
          position: relative;
        }

        .lc-price-card-accent {
          border-color: rgba(196, 112, 77, 0.28);
          box-shadow: 0 14px 40px rgba(196, 112, 77, 0.08);
        }

        .lc-price-label {
          font-family: 'DM Sans', sans-serif;
          font-size: 0.6875rem;
          font-weight: 600;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: #8b7f74;
          margin-bottom: 0.875rem;
        }

        .lc-price-amount {
          display: flex;
          align-items: baseline;
          gap: 0.25rem;
          color: #1a1a1a;
          margin-bottom: 0.5rem;
        }

        .lc-price-currency {
          font-family: 'Cormorant Garamond', Georgia, serif;
          font-size: 1.5rem;
          font-weight: 500;
          color: #C4704D;
        }

        .lc-price-num {
          font-family: 'Cormorant Garamond', Georgia, serif;
          font-size: 2.875rem;
          font-weight: 600;
          line-height: 1;
          letter-spacing: -0.02em;
        }

        .lc-price-period {
          font-family: 'DM Sans', sans-serif;
          font-size: 0.875rem;
          font-weight: 500;
          color: #5a5149;
          margin-left: 0.25rem;
        }

        .lc-price-note {
          font-family: 'DM Sans', sans-serif;
          font-size: 0.8125rem;
          color: #5a5149;
        }

        .lc-slot-badge {
          display: inline-block;
          padding: 0.375rem 1rem;
          border-radius: 9999px;
          font-family: 'DM Sans', sans-serif;
          font-size: 0.875rem;
          font-weight: 600;
          text-align: center;
          margin-bottom: 1.5rem;
        }
        .lc-slot-badge-active {
          background: rgba(122, 111, 94, 0.1);
          color: #7a6f5e;
        }
        .lc-slot-badge-closed {
          background: #f0ece8;
          color: #9a9490;
        }
        .lc-slot-badge-skeleton {
          background: #f0ece8;
          color: transparent;
          min-width: 260px;
          animation: lc-pulse 1.5s ease-in-out infinite;
        }
        @keyframes lc-pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        .lc-price-row-muted {
          opacity: 0.45;
          pointer-events: none;
          filter: grayscale(0.4);
        }

        /* ============================================================
           PERKS
           ============================================================ */
        .lc-perks-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 0.875rem;
        }

        @media (min-width: 640px) {
          .lc-perks-grid {
            grid-template-columns: 1fr 1fr;
          }
        }

        @media (min-width: 900px) {
          .lc-perks-grid {
            grid-template-columns: repeat(4, 1fr);
          }
        }

        .lc-perk {
          background: #FFFFFF;
          border: 1px solid rgba(26, 26, 26, 0.06);
          border-radius: 14px;
          padding: 1.5rem 1.25rem;
        }

        .lc-perk-icon {
          width: 36px;
          height: 36px;
          background: rgba(196, 112, 77, 0.08);
          border-radius: 9px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #C4704D;
          font-size: 1.125rem;
          margin-bottom: 0.875rem;
        }

        .lc-perk-title {
          font-family: 'Cormorant Garamond', Georgia, serif;
          font-size: 1.1875rem;
          font-weight: 600;
          color: #1a1a1a;
          margin: 0 0 0.375rem;
          letter-spacing: -0.005em;
        }

        .lc-perk-text {
          font-family: 'DM Sans', sans-serif;
          font-size: 0.8125rem;
          color: #5a5149;
          line-height: 1.55;
          margin: 0;
        }

        /* ============================================================
           FINAL CTA + FORM
           ============================================================ */
        .lc-final-cta {
          padding: 5rem 1.5rem 6rem;
          background: #FAF8F5;
        }

        .lc-cta-card {
          max-width: 640px;
          margin: 0 auto;
          padding: 2.5rem 1.75rem;
          background: #FFFFFF;
          border-radius: 22px;
          border: 1px solid rgba(26, 26, 26, 0.06);
          box-shadow: 0 25px 70px rgba(26, 26, 26, 0.06);
          text-align: center;
          position: relative;
          overflow: hidden;
        }

        @media (min-width: 640px) {
          .lc-cta-card { padding: 3.25rem 3rem; }
        }

        .lc-cta-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 3px;
          background: linear-gradient(90deg, #5DCAA5 0%, #EF9F27 50%, #E24B4A 100%);
        }

        .lc-cta-title {
          font-family: 'Cormorant Garamond', Georgia, serif;
          font-size: clamp(1.75rem, 3vw, 2.25rem);
          font-weight: 500;
          margin: 0 0 0.75rem;
          color: #1a1a1a;
          line-height: 1.2;
          letter-spacing: -0.01em;
        }

        .lc-cta-sub {
          font-family: 'DM Sans', sans-serif;
          font-size: 1rem;
          color: #5a5149;
          line-height: 1.65;
          margin: 0 0 2rem;
        }

        .lc-form-wrapper { max-width: 460px; margin: 0 auto; }

        .lc-status-wrapper {
          margin-top: 1.5rem;
          font-family: 'DM Sans', sans-serif;
          font-size: 0.875rem;
          color: #8b7f74;
          text-align: center;
        }

        .lc-magic-link-section {
          margin-top: 2.5rem;
          padding-top: 2rem;
          border-top: 1px solid rgba(26, 26, 26, 0.08);
        }

        .lc-magic-link-section h3 {
          font-family: 'Cormorant Garamond', Georgia, serif;
          font-size: 1.375rem;
          font-weight: 600;
          margin: 0 0 0.75rem;
          color: #1a1a1a;
          letter-spacing: -0.005em;
        }

        /* ----------- Scoped brand overrides on embedded forms -----------
           SupabaseWaitlistForm & MagicLinkLogin use hardcoded sage/slate
           Tailwind colors internally. Override primary buttons + input
           focus to match terracotta brand. Limited to .lc-form-wrapper
           and .lc-magic-link-section scope, so no global side effects. */
        .lc-form-wrapper button[type="submit"],
        .lc-magic-link-section button[type="submit"] {
          background: #C4704D !important;
          color: #FFFFFF !important;
          font-family: 'DM Sans', sans-serif !important;
          font-weight: 600 !important;
        }

        .lc-form-wrapper button[type="submit"]:hover:not(:disabled),
        .lc-magic-link-section button[type="submit"]:hover:not(:disabled) {
          background: #A85C3C !important;
          box-shadow: 0 10px 30px rgba(196, 112, 77, 0.22) !important;
        }

        .lc-form-wrapper input[type="email"]:focus,
        .lc-magic-link-section input[type="email"]:focus {
          border-color: #C4704D !important;
          box-shadow: 0 0 0 3px rgba(196, 112, 77, 0.15) !important;
        }

        .lc-form-wrapper input[type="checkbox"] {
          accent-color: #C4704D !important;
        }

        /* Hide the heading SupabaseWaitlistForm renders internally — the
           CTA card already provides a heading and duplicating it reads
           as bloat. */
        .lc-form-wrapper form > div.text-center:first-child {
          display: none;
        }

        /* ============================================================
           FOOTER
           ============================================================ */
        .lc-footer {
          padding: 3rem 1.5rem 2.5rem;
          background: #0f0f0f;
          color: #FAF8F5;
          text-align: center;
        }

        .lc-footer-logo {
          font-family: 'Cormorant Garamond', Georgia, serif;
          font-size: 1.625rem;
          font-weight: 600;
          color: #FAF8F5;
          text-decoration: none;
          display: inline-block;
          margin-bottom: 0.375rem;
          letter-spacing: -0.01em;
        }

        .lc-footer-tagline {
          font-family: 'DM Sans', sans-serif;
          font-size: 0.875rem;
          color: rgba(250, 248, 245, 0.55);
          margin: 0 0 1.5rem;
        }

        .lc-footer-links {
          font-family: 'DM Sans', sans-serif;
          font-size: 0.8125rem;
          color: rgba(250, 248, 245, 0.45);
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 1.25rem;
          flex-wrap: wrap;
        }

        .lc-footer-links a {
          color: rgba(250, 248, 245, 0.55);
          text-decoration: none;
          transition: color 0.2s ease;
        }

        .lc-footer-links a:hover { color: #E8A888; }

        .lc-footer-sep {
          color: rgba(250, 248, 245, 0.2);
        }

        .lc-footer-copy {
          font-family: 'DM Sans', sans-serif;
          font-size: 0.75rem;
          color: rgba(250, 248, 245, 0.3);
          margin: 1.5rem 0 0;
        }

        /* ============================================================
           MOBILE FINE-TUNING (375px target)
           ============================================================ */
        @media (max-width: 480px) {
          .lc-hero { padding: 4.5rem 1.25rem 4.5rem; margin-top: 128px; }
          .lc-section { padding: 4rem 1.25rem; }
          .lc-cta-card { padding: 2.25rem 1.5rem; }
          .lc-header-inner { padding: 0.875rem 1.25rem; }
          .lc-creator-link { font-size: 0.75rem; }
          .lc-creator-banner { padding: 0.625rem 1rem; }
        }
      `}</style>

      {/* ================= HEADER ================= */}
      <header className="lc-header">
        <div className="lc-header-inner">
          <Link to="/" className="lc-logo"><img src="/curae-logo.png" alt="Curae" style={{ height: '100px', width: 'auto' }} /></Link>
          <a href="#waitlist" onClick={scrollTo('waitlist')} className="lc-header-cta">Join waitlist</a>
        </div>
      </header>

      {/* ================= HERO ================= */}
      <section className="lc-hero">
        <div className="lc-grain" aria-hidden="true"></div>
        <div className="lc-hero-content lc-hero-stagger">
          <div className="lc-eyebrow" style={{ '--i': 0 } as React.CSSProperties}>Now accepting founding members</div>

          <div className="lc-hero-headline-wrap" style={{ '--i': 1 } as React.CSSProperties}>
            <h1 className="lc-headline">
              The layer of intelligence between you and every skincare product you'll ever buy.
            </h1>
          </div>

          <div className="lc-hero-sub-wrap" style={{ '--i': 2 } as React.CSSProperties}>
            <p className="lc-subhead">
              Point your camera at any product. Curae breaks down every ingredient, flags your allergens, checks it against your routine, and tells you honestly whether it belongs on your shelf.
            </p>
          </div>

          <div className="lc-cta-group" style={{ '--i': 3 } as React.CSSProperties}>
            <a href="#waitlist" onClick={scrollTo('waitlist')} className="lc-btn-primary">Join the waitlist</a>
            <a href="#how" onClick={scrollTo('how')} className="lc-btn-ghost-dark">See how it works</a>
          </div>
        </div>
      </section>

      {/* ================= PROBLEM ================= */}
      <section className="lc-section lc-section-cream">
        <div className="lc-container-narrow" style={{ textAlign: 'center' }}>
          <span className="lc-section-label">The problem</span>
          <h2 className="lc-problem-title">
            Skincare research shouldn't take 30 minutes per product.
          </h2>
          <p className="lc-problem-body">
            You're on <strong>Reddit</strong> comparing ingredient lists. You're scrolling
            <strong> Sephora</strong> reviews from people with different skin than yours.
            You're watching <strong>TikToks</strong> where one person calls a product holy
            grail and the next says it ruined them. The information is everywhere.
            None of it is about <em>your</em> skin. One scan changes that.
          </p>
        </div>
      </section>

      {/* ================= HOW IT WORKS ================= */}
      <section id="how" className="lc-section lc-section-white">
        <div className="lc-container">
          <div className="lc-section-intro">
            <span className="lc-section-label">How it works</span>
            <h2 className="lc-section-title">Scan. Analyze. Know.</h2>
            <p className="lc-section-lead">
              Three steps, under ten seconds, no manual product lookup.
            </p>
          </div>

          <div className="lc-steps-grid">
            <article className="lc-step-card">
              <span className="lc-step-num">STEP 01</span>
              <div className="lc-step-icon">
                <i className="ri-camera-lens-line" aria-hidden="true"></i>
              </div>
              <h3 className="lc-step-title">Scan</h3>
              <p className="lc-step-body">
                Point your camera at any skincare product. Curae identifies it in
                seconds. No barcode required. Products not yet in the database get
                added automatically for the next person who scans them.
              </p>
            </article>

            <article className="lc-step-card">
              <span className="lc-step-num">STEP 02</span>
              <div className="lc-step-icon">
                <i className="ri-flask-line" aria-hidden="true"></i>
              </div>
              <h3 className="lc-step-title">Analyze</h3>
              <p className="lc-step-body">
                Every ingredient is scored against your skin profile. Not a universal
                rating. Yours. Based on your skin type, concerns, sensitivities, and
                what's already in your routine.
              </p>
            </article>

            <article className="lc-step-card">
              <span className="lc-step-num">STEP 03</span>
              <div className="lc-step-icon">
                <i className="ri-shield-check-line" aria-hidden="true"></i>
              </div>
              <h3 className="lc-step-title">Know</h3>
              <p className="lc-step-body">
                Safe, Caution, or Avoid. Every ingredient. With the specific reason
                it landed there for your skin, not a generic hazard score.
              </p>
            </article>
          </div>
        </div>
      </section>

      {/* ================= SAFETY TIERS ================= */}
      <section className="lc-section lc-section-cream">
        <div className="lc-container-narrow">
          <div className="lc-section-intro">
            <span className="lc-section-label">The tier system</span>
            <h2 className="lc-section-title">Three verdicts. No guessing.</h2>
            <p className="lc-section-lead">
              Every ingredient gets one of three tiers. Deterministic rules, not a
              black-box score. And the verdict changes based on <em>your</em> skin.
            </p>
          </div>

          <div className="lc-tiers">
            <div className="lc-tier-row safe">
              <div className="lc-tier-dot safe" aria-hidden="true"></div>
              <div className="lc-tier-body">
                <div className="lc-tier-heading">
                  <span className="lc-tier-label safe">Safe</span>
                  <span className="lc-tier-verdict">Use freely.</span>
                </div>
                <p className="lc-tier-text">
                  Matches your profile. No flags against EU Annex II, no known sensitizers
                  for your concerns, no conflicts with the rest of your routine.
                </p>
              </div>
            </div>

            <div className="lc-tier-row caution">
              <div className="lc-tier-dot caution" aria-hidden="true"></div>
              <div className="lc-tier-body">
                <div className="lc-tier-heading">
                  <span className="lc-tier-label caution">Caution</span>
                  <span className="lc-tier-verdict">Watch how your skin responds.</span>
                </div>
                <p className="lc-tier-text">
                  Known sensitizers, AHAs/BHAs, retinol, sulfates, comedogenics. Usable
                  for many, but patch test first and introduce slowly if your skin is
                  reactive.
                </p>
              </div>
            </div>

            <div className="lc-tier-row avoid">
              <div className="lc-tier-dot avoid" aria-hidden="true"></div>
              <div className="lc-tier-body">
                <div className="lc-tier-heading">
                  <span className="lc-tier-label avoid">Avoid</span>
                  <span className="lc-tier-verdict">Don't put this on your skin.</span>
                </div>
                <p className="lc-tier-text">
                  EU-banned substances, formaldehyde releasers, MI/MCI, heavy metals.
                  These don't clear the bar for safe topical use.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================= CORE FEATURES — WHAT A SCAN UNLOCKS ================= */}
      <section className="lc-section lc-section-white">
        <div className="lc-container">
          <div className="lc-section-intro">
            <span className="lc-section-label">Core features</span>
            <h2 className="lc-section-title">What a scan unlocks</h2>
            <p className="lc-section-lead">
              Every scan opens a complete intelligence layer, not just an ingredient list.
            </p>
          </div>

          <div className="lc-features-grid">
            <article className="lc-feature-card">
              <div className="lc-feature-icon">
                <i className="ri-store-2-line" aria-hidden="true"></i>
              </div>
              <h3 className="lc-feature-title">Where to buy</h3>
              <p className="lc-feature-text">
                Every scan surfaces where to buy, filtered by price, retailer trust
                score, and shipping speed. Ranked using your scan history, budget, and
                onboarding data. Not a generic search result.
              </p>
            </article>

            <article className="lc-feature-card lc-feature-offset">
              <div className="lc-feature-icon">
                <i className="ri-exchange-line" aria-hidden="true"></i>
              </div>
              <h3 className="lc-feature-title">Compatible and similar products</h3>
              <p className="lc-feature-text">
                Scan anything and instantly see what works alongside it in your routine
                and what alternatives exist at different price points. Matched to your
                skin profile, not a universal compatibility list.
              </p>
            </article>

            <article className="lc-feature-card">
              <div className="lc-feature-icon">
                <i className="ri-stack-line" aria-hidden="true"></i>
              </div>
              <h3 className="lc-feature-title">Your shelf</h3>
              <p className="lc-feature-text">
                Every product you scan gets added to your digital shelf, a live view
                of your full routine. Ask Curae AI about anything on it, build routines
                from products you actually own, and get automatic check-ins once a
                product has been in your routine long enough to show results.
              </p>
            </article>

            <article className="lc-feature-card lc-feature-offset">
              <div className="lc-feature-icon">
                <i className="ri-sparkling-2-line" aria-hidden="true"></i>
              </div>
              <h3 className="lc-feature-title">Curae AI</h3>
              <p className="lc-feature-text">
                Not a chatbot. A skincare companion that already knows your skin. Curae
                AI comes in already knowing your skin type, concerns, current routine,
                and scan history. Ask it anything: 'I'm going to Miami this weekend, is
                my SPF enough for that humidity?' or 'My skin has been breaking out since
                I added this serum, what's the likely culprit?' It pulls from your scan
                results, your profile, real-time environment data, and ingredient
                research. An answer that's actually about your skin.
              </p>
            </article>
          </div>
        </div>
      </section>

      {/* ================= FEATURES ================= */}
      <section className="lc-section lc-section-white">
        <div className="lc-container">
          <div className="lc-section-intro">
            <span className="lc-section-label">What's shipping</span>
            <h2 className="lc-section-title">Built for people who read ingredient lists.</h2>
            <p className="lc-section-lead">
              No wellness platitudes. Just the tools we wished existed.
            </p>
          </div>

          <div className="lc-features-grid">
            <article className="lc-feature-card">
              <div className="lc-feature-icon">
                <i className="ri-scan-2-line" aria-hidden="true"></i>
              </div>
              <h3 className="lc-feature-title">Camera-first identification</h3>
              <p className="lc-feature-text">
                Point at any product. Curae identifies it in seconds. Unknown products
                auto-catalog for the next person.
              </p>
            </article>

            <article className="lc-feature-card lc-feature-offset">
              <div className="lc-feature-icon">
                <i className="ri-user-heart-line" aria-hidden="true"></i>
              </div>
              <h3 className="lc-feature-title">Skin-profile-aware ratings</h3>
              <p className="lc-feature-text">
                Same ingredient, different verdict depending on your skin. Not a
                universal score. Yours.
              </p>
            </article>

            <article className="lc-feature-card">
              <div className="lc-feature-icon">
                <i className="ri-book-2-line" aria-hidden="true"></i>
              </div>
              <h3 className="lc-feature-title">Deterministic safety rules</h3>
              <p className="lc-feature-text">
                No opaque AI verdicts. Every call traces back to a specific rule: EU
                Annex II, formaldehyde releasers, MI/MCI, heavy metals, documented
                sensitizers. Auditable.
              </p>
            </article>

            <article className="lc-feature-card lc-feature-offset">
              <div className="lc-feature-icon">
                <i className="ri-pulse-line" aria-hidden="true"></i>
              </div>
              <h3 className="lc-feature-title">Behavioral personalization</h3>
              <p className="lc-feature-text">
                Curae learns from every scan, tap, and save. Gets sharper about what
                you care about without asking you to fill in a survey.
              </p>
            </article>
          </div>
        </div>
      </section>

      {/* ================= DIFFERENTIATION (DARK) ================= */}
      <section className="lc-section lc-section-dark lc-diff-section">
        <div className="lc-grain" aria-hidden="true"></div>
        <div className="lc-container" style={{ position: 'relative', zIndex: 2 }}>
          <div className="lc-diff-grid">
            <div className="lc-diff-intro">
              <span className="lc-diff-numeral" aria-hidden="true">01</span>
              <span className="lc-section-label lc-section-label-dark">Why we exist</span>
              <h2 className="lc-section-title lc-section-title-dark lc-diff-headline">
                Scanning ingredients isn't new. Scanning them <em>for your skin</em> is.
              </h2>
              <p className="lc-section-lead lc-section-lead-dark">
                Every other tool hands everyone the same verdict. Yuka, Think Dirty,
                INCI Decoder, EWG: same score, every user. We don't. Your skin type,
                concerns, and sensitivities change the answer. Every scan.
              </p>
            </div>

            <ul className="lc-comparison-list">
              {competitors.map((c) => (
                <li
                  key={c.name}
                  className={`lc-comparison-item ${c.isUs ? 'lc-us' : ''}`}
                >
                  <span
                    className={c.isUs ? 'lc-icon-check' : 'lc-icon-x'}
                    aria-hidden="true"
                  >
                    {c.isUs ? '✓' : '✕'}
                  </span>
                  <div>
                    <strong>{c.name}</strong>
                    <div className="bullets">
                      {c.bullets.map((b, i) => (
                        <div key={i}>{b}</div>
                      ))}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ================= EARLY ACCESS PRICING =================
          TODO pre-launch: remove cap logic from /api/signup if founding
          member cap is fully dropped (currently 50 users + 25 creators). */}
      <section className="lc-section lc-section-cream">
        <div className="lc-container">
          <div className="lc-founding-head">
            <span className="lc-section-label">Early access</span>
            <h2 className="lc-section-title">Lock your rate before launch. Keep it forever.</h2>
            <p className="lc-section-lead" style={{ maxWidth: '620px', margin: '0 auto' }}>
              Waitlist members get the founding rate locked to their account
              for life. Public pricing goes up after launch. Yours never does.
            </p>
          </div>

          <div style={{ textAlign: 'center' }}>
            {slotLoading ? (
              <span className="lc-slot-badge lc-slot-badge-skeleton">&nbsp;</span>
            ) : slotData?.slots_available ? (
              <span className="lc-slot-badge lc-slot-badge-active">
                {slotData.slots_remaining} founding member spots remaining
              </span>
            ) : (
              <span className="lc-slot-badge lc-slot-badge-closed">
                Founding member pricing is now closed. Standard pricing applies at launch.
              </span>
            )}
          </div>

          <div className={`lc-price-row${slotData && !slotData.slots_available ? ' lc-price-row-muted' : ''}`}>
            <div className="lc-price-card">
              <div className="lc-price-label">Founding rate</div>
              <div className="lc-price-amount">
                <span className="lc-price-currency">$</span>
                <span className="lc-price-num">4.99</span>
                <span className="lc-price-period">/ month</span>
              </div>
              <div className="lc-price-note">Your price. Locked forever.</div>
            </div>
            <div className="lc-price-card lc-price-card-accent">
              <div className="lc-price-label">Founding rate, annual</div>
              <div className="lc-price-amount">
                <span className="lc-price-currency">$</span>
                <span className="lc-price-num">34.99</span>
                <span className="lc-price-period">/ year</span>
              </div>
              <div className="lc-price-note">Save ~42% vs monthly</div>
            </div>
          </div>
        </div>
      </section>

      {/* ================= PERKS ================= */}
      <section className="lc-section lc-section-white">
        <div className="lc-container">
          <div className="lc-section-intro">
            <span className="lc-section-label">What you get</span>
            <h2 className="lc-section-title">Founding member perks.</h2>
          </div>

          <div className="lc-perks-grid">
            <article className="lc-perk">
              <div className="lc-perk-icon">
                <i className="ri-price-tag-3-line" aria-hidden="true"></i>
              </div>
              <h3 className="lc-perk-title">Founding rate for life</h3>
              <p className="lc-perk-text">
                Your subscription price never increases. Public pricing changes don't touch your account.
              </p>
            </article>
            <article className="lc-perk">
              <div className="lc-perk-icon">
                <i className="ri-smartphone-line" aria-hidden="true"></i>
              </div>
              <h3 className="lc-perk-title">First access at launch</h3>
              <p className="lc-perk-text">
                In the door the day the app ships on iOS and Android, ahead of the public.
              </p>
            </article>
            <article className="lc-perk">
              <div className="lc-perk-icon">
                <i className="ri-flask-line" aria-hidden="true"></i>
              </div>
              <h3 className="lc-perk-title">Beta tester access</h3>
              <p className="lc-perk-text">
                New features land in your app before they go public. Opt-in, any time.
              </p>
            </article>
            <article className="lc-perk">
              <div className="lc-perk-icon">
                <i className="ri-chat-voice-line" aria-hidden="true"></i>
              </div>
              <h3 className="lc-perk-title">Direct line to founders</h3>
              <p className="lc-perk-text">
                Your feedback shapes what we build next. Email us, and a founder replies.
              </p>
            </article>
          </div>
        </div>
      </section>

      {/* ================= FINAL CTA + FORM ================= */}
      <section id="waitlist" className="lc-final-cta">
        <div className="lc-cta-card">
          <h2 className="lc-cta-title">Join before launch.</h2>
          <p className="lc-cta-sub">
            One email. Your founding rate locked the moment you sign up, if spots remain.
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

      {/* ================= FOOTER ================= */}
      <footer className="lc-footer">
        <Link to="/" className="lc-footer-logo"><img src="/curae-logo.png" alt="Curae" style={{ height: '100px', width: 'auto' }} /></Link>
        <p className="lc-footer-tagline">Camera-powered skincare intelligence.</p>
        <div className="lc-footer-links">
          <Link to="/privacy">Privacy</Link>
          <span className="lc-footer-sep">·</span>
          <Link to="/contact">Contact</Link>
        </div>
        <p className="lc-footer-copy">© {new Date().getFullYear()} Curae</p>
      </footer>
    </div>
  );
};

export default WaitlistLandingPage;
