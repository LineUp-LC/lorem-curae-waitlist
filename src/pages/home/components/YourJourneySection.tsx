
import { Link } from 'react-router-dom';

const YourJourneySection = () => {
  return (
    <section className="py-24 bg-gradient-to-br from-sage-50 to-cream-100">
      <div className="max-w-5xl mx-auto px-6 lg:px-12 text-center">
        <div className="mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-sage-100 rounded-full mb-6">
            <i className="ri-seedling-line text-4xl text-sage-600"></i>
          </div>
          <h2 className="text-4xl lg:text-5xl font-serif text-slate-900 mb-6">
            Early access. Real influence.
          </h2>
          <p className="text-lg text-slate-700 mb-10 leading-relaxed max-w-3xl mx-auto">
            Curae releases access in waves. Join now to be in the first cohort, and help shape what comes next. Early members get priority access to new features as they ship.
          </p>
        </div>

        <Link
          to="/waitlist"
          className="inline-flex items-center space-x-3 bg-sage-600 hover:bg-sage-700 text-white px-10 py-5 rounded-full font-semibold text-lg transition-all hover:shadow-lg cursor-pointer whitespace-nowrap"
        >
          <span>Join the waitlist</span>
          <i className="ri-arrow-right-line text-xl"></i>
        </Link>
      </div>
    </section>
  );
};

export default YourJourneySection;
