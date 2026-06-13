const MarketplaceSection = () => {
  return (
    <section className="py-24 bg-cream-50">
      <div className="max-w-7xl mx-auto px-6 lg:px-12">
        <div className="text-center mb-16">
          <h2 className="text-4xl lg:text-5xl font-serif text-slate-900 mb-4">
            What's Next
          </h2>
          <p className="text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed">
            Curae is expanding beyond skincare.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          <div className="bg-white rounded-3xl p-10 shadow-sm border border-slate-100">
            <div className="w-14 h-14 flex items-center justify-center bg-sage-100 rounded-2xl mb-6">
              <i className="ri-store-2-line text-2xl text-sage-600" aria-hidden="true"></i>
            </div>
            <h3 className="text-2xl font-serif text-slate-900 mb-4">Creator Space</h3>
            <p className="text-slate-600 leading-relaxed">
              Indie brands and creators will have their own space inside Curae — not just listed, but integrated. Discover formulations from small-batch founders, with full ingredient transparency built in.
            </p>
          </div>

          <div className="bg-white rounded-3xl p-10 shadow-sm border border-slate-100">
            <div className="w-14 h-14 flex items-center justify-center bg-sage-100 rounded-2xl mb-6">
              <i className="ri-heart-pulse-line text-2xl text-sage-600" aria-hidden="true"></i>
            </div>
            <h3 className="text-2xl font-serif text-slate-900 mb-4">Food &amp; Whole-Body Health</h3>
            <p className="text-slate-600 leading-relaxed">
              The same ingredient intelligence, applied to what you eat. We're expanding Curae's profile-matching logic to food, nutrition, and whole-body wellness.
            </p>
          </div>
        </div>

        <p className="text-center text-slate-500 mt-12 text-sm">
          Join the waitlist to get early access as these roll out.
        </p>
      </div>
    </section>
  );
};

export default MarketplaceSection;
