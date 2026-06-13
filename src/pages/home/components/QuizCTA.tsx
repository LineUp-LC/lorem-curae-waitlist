import { Link } from 'react-router-dom';

const QuizCTA = () => {
  return (
    <section className="py-20 px-6 lg:px-12">
      <div className="max-w-6xl mx-auto">
        <div className="bg-gradient-to-r from-forest-50 to-cream-100 rounded-3xl p-12 flex flex-col md:flex-row items-center justify-between gap-8 shadow-lg border border-forest-100/50">
          <div className="flex items-center gap-6 flex-1">
            <div className="w-20 h-20 flex items-center justify-center bg-white rounded-full shadow-md flex-shrink-0 border border-forest-200/30">
              <i className="ri-questionnaire-line text-4xl text-forest-700"></i>
            </div>
            <div>
              <h2 className="text-3xl font-serif text-forest-900 mb-2">
                Start with your skin profile.
              </h2>
              <p className="text-forest-700 leading-relaxed">
                Before your first scan, tell us about your skin: type, concerns, sensitivities, allergens. That profile is what makes every result personal rather than generic. It takes about two minutes.
              </p>
            </div>
          </div>
          <Link
            to="/skin-survey-account"
            className="flex items-center space-x-2 px-8 py-4 bg-forest-800 text-cream-50 rounded-full font-semibold text-base hover:bg-forest-900 transition-all shadow-md hover:shadow-lg whitespace-nowrap cursor-pointer flex-shrink-0"
          >
            <span>Build my skin profile</span>
            <i className="ri-arrow-right-line text-xl"></i>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default QuizCTA;
