export default function RoutineTracker() {
  return (
    <section className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-6">
            Routine Tracking
          </h2>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Build and track your perfect routine. Create personalized morning and evening skincare routines with our guided builder. Get smart conflict detection to avoid ingredient interactions and optimize product order for maximum effectiveness.
          </p>
        </div>

        <div className="relative max-w-5xl mx-auto mb-12">
          <div className="w-full h-96 rounded-2xl overflow-hidden shadow-xl">
            <img 
              src="https://readdy.ai/api/search-image?query=modern%20clean%20skincare%20routine%20tracking%20interface%20showing%20morning%20and%20evening%20schedule%20with%20product%20organization%20cards%20progress%20monitoring%20minimalist%20design%20white%20background%20sage%20green%20accents%20professional%20UI%20screenshot%20style&width=1200&height=600&seq=routine-tracking-interface-realistic&orientation=landscape"
              alt="Routine Tracking interface showing morning and evening skincare schedule with product organization and progress monitoring"
              className="w-full h-full object-cover object-top"
            />
          </div>
        </div>

        <div className="text-center">
          <a
            href="/routines"
            className="inline-block px-8 py-4 bg-teal-600 text-white rounded-xl font-semibold hover:bg-teal-700 transition-colors whitespace-nowrap cursor-pointer"
          >
            Build Your Routine
          </a>
        </div>
      </div>
    </section>
  );
}
