import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import SupabaseWaitlistForm from '../../components/SupabaseWaitlistForm';
import WaitlistStatus from '../../components/WaitlistStatus';
import MagicLinkLogin from '../../components/MagicLinkLogin';

const WaitlistLandingPage = () => {
  return (
    <div className="min-h-screen bg-white">
      {/* Minimal Header */}
      <header className="fixed top-0 left-0 right-0 bg-white/95 backdrop-blur-sm border-b border-slate-200 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="text-2xl font-serif text-slate-900">
            Lorem Curae
          </Link>
          <a 
            href="#waitlist" 
            className="px-6 py-2.5 bg-sage-600 text-white rounded-full hover:bg-sage-700 transition-colors text-sm font-medium whitespace-nowrap"
          >
            Join Waitlist
          </a>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6 bg-gradient-to-br from-sage-50 via-white to-cream-50">
        <div className="max-w-4xl mx-auto text-center">
          {/* Creator Waitlist Link */}
          <div className="mb-8">
            <Link
              to="/preview-of-waitlist-early-access-2025-marketplace"
              className="inline-flex items-center space-x-2 text-sage-600 hover:text-sage-700 font-medium transition-colors"
            >
              <span>Are you a creator? Join the Marketplace waitlist</span>
              <i className="ri-arrow-right-line"></i>
            </Link>
          </div>

          <div className="inline-flex items-center justify-center w-16 h-16 bg-sage-100 rounded-full mb-8">
            <i className="ri-sparkling-2-line text-3xl text-sage-600"></i>
          </div>
          <h1 className="text-5xl lg:text-6xl font-serif text-slate-900 mb-6 leading-tight">
            Skincare clarity, powered by science and personalization
          </h1>
          <p className="text-xl text-slate-600 mb-10 leading-relaxed max-w-2xl mx-auto">
            Discover products with confidence, understand ingredients, and get guidance tailored to your skin.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a 
              href="#waitlist" 
              className="px-8 py-4 bg-sage-600 text-white rounded-full hover:bg-sage-700 transition-colors text-lg font-medium whitespace-nowrap w-full sm:w-auto"
            >
              Join the waitlist
            </a>
            <a 
              href="#how-it-works" 
              className="px-8 py-4 bg-white text-sage-600 border-2 border-sage-600 rounded-full hover:bg-sage-50 transition-colors text-lg font-medium whitespace-nowrap w-full sm:w-auto"
            >
              See how it works
            </a>
          </div>
        </div>
      </section>

      {/* Core Value Proposition */}
      <section id="how-it-works" className="py-20 px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-serif text-slate-900 mb-6">
              Finally, skincare that makes sense
            </h2>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed">
              Lorem Curae helps you cut through confusion with science-backed clarity and personalized guidance. Built for real people, not perfection.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 mb-12">
            <div className="bg-sage-50 rounded-2xl p-8">
              <div className="w-14 h-14 bg-sage-100 rounded-full flex items-center justify-center mb-6">
                <i className="ri-search-line text-2xl text-sage-600"></i>
              </div>
              <h3 className="text-2xl font-serif text-slate-900 mb-4">
                Trusted product discovery
              </h3>
              <p className="text-slate-600 leading-relaxed">
                Find verified products from trusted retailers with transparent pricing and availability.
              </p>
            </div>

            <div className="bg-cream-50 rounded-2xl p-8">
              <div className="w-14 h-14 bg-cream-100 rounded-full flex items-center justify-center mb-6">
                <i className="ri-flask-line text-2xl text-sage-600"></i>
              </div>
              <h3 className="text-2xl font-serif text-slate-900 mb-4">
                Ingredient transparency
              </h3>
              <p className="text-slate-600 leading-relaxed">
                Understand what's inside your products with science-backed explanations.
              </p>
            </div>

            <div className="bg-cream-50 rounded-2xl p-8">
              <div className="w-14 h-14 bg-cream-100 rounded-full flex items-center justify-center mb-6">
                <i className="ri-robot-2-line text-2xl text-sage-600"></i>
              </div>
              <h3 className="text-2xl font-serif text-slate-900 mb-4">
                Personalized AI guidance
              </h3>
              <p className="text-slate-600 leading-relaxed">
                Get tailored recommendations that adapt to your unique skin concerns and goals.
              </p>
            </div>

            <div className="bg-sage-50 rounded-2xl p-8">
              <div className="w-14 h-14 bg-sage-100 rounded-full flex items-center justify-center mb-6">
                <i className="ri-scales-3-line text-2xl text-sage-600"></i>
              </div>
              <h3 className="text-2xl font-serif text-slate-900 mb-4">
                Product Comparison
              </h3>
              <p className="text-slate-600 leading-relaxed">
                Make informed decisions by comparing products side-by-side to see ingredients, pricing, reviews, and compatibility with your skin type.
              </p>
            </div>
          </div>

          <div className="text-center">
            <a 
              href="#waitlist" 
              className="inline-block px-8 py-4 bg-sage-600 text-white rounded-full hover:bg-sage-700 transition-colors text-lg font-medium whitespace-nowrap"
            >
              Join the waitlist
            </a>
          </div>
        </div>
      </section>

      {/* Smart Product Search */}
      <section className="py-20 px-6 bg-gradient-to-br from-sage-50 to-cream-50">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center justify-center w-14 h-14 bg-sage-100 rounded-full mb-6">
                <i className="ri-shopping-bag-3-line text-2xl text-sage-600"></i>
              </div>
              <h2 className="text-4xl lg:text-5xl font-serif text-slate-900 mb-6">
                Find the right product — and the best place to buy it
              </h2>
              <p className="text-lg text-slate-600 mb-6 leading-relaxed">
                Our Smart Product Finder searches across multiple retailers to find the exact configuration you need—size, formulation, packaging, and more.
              </p>
              <p className="text-lg text-slate-600 mb-8 leading-relaxed">
                When you purchase through our link, you earn rewards that can be redeemed for perks like early access, beta features, and future discounts — bringing transparency, convenience, and trust together in one place.
              </p>
              <a 
                href="#waitlist" 
                className="inline-block px-8 py-4 bg-sage-600 text-white rounded-full hover:bg-sage-700 transition-colors text-lg font-medium whitespace-nowrap"
              >
                Join the waitlist
              </a>
            </div>
            <div className="bg-white rounded-2xl p-8 shadow-lg">
              <div className="space-y-4">
                <div className="flex items-center space-x-3 p-4 bg-sage-50 rounded-xl">
                  <i className="ri-search-line text-sage-600"></i>
                  <span className="text-slate-600">Search any product...</span>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 border border-slate-200 rounded-xl">
                    <div className="text-sm text-slate-500 mb-1">Retailer A</div>
                    <div className="font-semibold text-slate-900">$24.99</div>
                    <div className="text-xs text-green-600">In Stock</div>
                  </div>
                  <div className="p-4 border border-slate-200 rounded-xl">
                    <div className="text-sm text-slate-500 mb-1">Retailer B</div>
                    <div className="font-semibold text-slate-900">$22.50</div>
                    <div className="text-xs text-green-600">In Stock</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Rewards Section */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="order-2 lg:order-1 bg-gradient-to-br from-sage-50 to-cream-50 rounded-2xl p-8">
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-white rounded-xl shadow-sm">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-sage-100 rounded-full flex items-center justify-center">
                      <i className="ri-gift-line text-sage-600"></i>
                    </div>
                    <span className="font-medium text-slate-900">Points Earned</span>
                  </div>
                  <span className="text-xl font-bold text-sage-600">+250</span>
                </div>
                <div className="flex items-center justify-between p-4 bg-white rounded-xl shadow-sm">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-cream-100 rounded-full flex items-center justify-center">
                      <i className="ri-star-line text-sage-600"></i>
                    </div>
                    <span className="font-medium text-slate-900">Early Access</span>
                  </div>
                  <span className="text-sm text-green-600 font-medium">Unlocked</span>
                </div>
              </div>
            </div>
            <div className="order-1 lg:order-2">
              <div className="inline-flex items-center justify-center w-14 h-14 bg-cream-100 rounded-full mb-6">
                <i className="ri-gift-2-line text-2xl text-sage-600"></i>
              </div>
              <h2 className="text-4xl lg:text-5xl font-serif text-slate-900 mb-6">
                Earn rewards for making informed choices
              </h2>
              <p className="text-lg text-slate-600 mb-6 leading-relaxed">
                Find the exact product you need across verified retailers — and earn rewards when you buy through us.
              </p>
              <p className="text-lg text-slate-600 mb-8 leading-relaxed">
                Shop through our Smart Product Finder and we'll share a portion of what we earn from our retail partners as rewards — and with cashback coming soon, you'll get even more value for your informed choices.
              </p>
              <a 
                href="#waitlist" 
                className="inline-block px-8 py-4 bg-sage-600 text-white rounded-full hover:bg-sage-700 transition-colors text-lg font-medium whitespace-nowrap"
              >
                Join the waitlist
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof / Credibility */}
      <section className="py-20 px-6 bg-gradient-to-br from-sage-50 to-cream-50">
        <div className="max-w-5xl mx-auto text-center">
          <h2 className="text-4xl lg:text-5xl font-serif text-slate-900 mb-6">
            Built with science. Designed for real skin.
          </h2>
          <p className="text-xl text-slate-600 mb-12 leading-relaxed max-w-3xl mx-auto">
            Lorem Curae is founded on evidence-based skincare principles, transparent ingredient explanations, and user-centric design. We're here to help you make confident decisions—not sell you perfection.
          </p>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white rounded-2xl p-8 shadow-sm">
              <div className="w-14 h-14 bg-sage-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="ri-test-tube-line text-2xl text-sage-600"></i>
              </div>
              <h3 className="text-xl font-serif text-slate-900 mb-3">
                Science-backed approach
              </h3>
              <p className="text-slate-600">
                Every recommendation is grounded in dermatological research and evidence-based practices.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-8 shadow-sm">
              <div className="w-14 h-14 bg-cream-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="ri-eye-line text-2xl text-sage-600"></i>
              </div>
              <h3 className="text-xl font-serif text-slate-900 mb-3">
                Transparent ingredients
              </h3>
              <p className="text-slate-600">
                No hidden formulas, no marketing fluff—just honest, clear explanations of what's in your products.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-8 shadow-sm">
              <div className="w-14 h-14 bg-sage-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="ri-heart-3-line text-2xl text-sage-600"></i>
              </div>
              <h3 className="text-xl font-serif text-slate-900 mb-3">
                User-centric design
              </h3>
              <p className="text-slate-600">
                Built for real people with real skin concerns—not influencers or perfection seekers.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Final Waitlist CTA */}
      <section id="waitlist" className="py-24 px-6 bg-white">
        <div className="max-w-3xl mx-auto">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-sage-100 rounded-full mb-8">
              <i className="ri-seedling-line text-4xl text-sage-600"></i>
            </div>
            <h2 className="text-4xl lg:text-5xl font-serif text-slate-900 mb-6">
              Be part of the future of skincare
            </h2>
            <p className="text-xl text-slate-600 mb-10 leading-relaxed">
              Join early and help shape Lorem Curae. Be part of a community that values transparency, science, and individual care. Your journey starts here.
            </p>

 {/* Supabase Waitlist Form */}
<div className="max-w-xl mx-auto">
  <SupabaseWaitlistForm segment="regular" />

  <div className="mt-10">
    <WaitlistStatus />
  </div>
</div>

{/* Check My Wave (Magic Link Login) */}
<div className="max-w-xl mx-auto mt-16">
  <h3 className="text-2xl font-serif text-slate-900 mb-4">
    Already joined the waitlist?
  </h3>
  <MagicLinkLogin />
</div>

          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 bg-slate-900 text-white">
        <div className="max-w-7xl mx-auto text-center">
          <Link to="/" className="text-3xl font-serif mb-4 inline-block">
            Lorem Curae
          </Link>
          <p className="text-slate-400 mb-6">
            Skincare clarity, powered by science and personalization
          </p>
          <div className="flex items-center justify-center gap-6 text-sm text-slate-400">
            <Link to="/privacy" className="hover:text-white transition-colors">
              Privacy
            </Link>
            <span>•</span>
            <Link to="/contact" className="hover:text-white transition-colors">
              Contact
            </Link>
            <span>•</span>
            <a 
              href="https://readdy.ai/?origin=logo" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="hover:text-white transition-colors"
            >
              Powered by Readdy
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default WaitlistLandingPage;