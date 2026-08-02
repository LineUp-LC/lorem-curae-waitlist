
import { useEffect } from 'react';
import Navbar from '../../components/feature/Navbar';
import Footer from '../../components/feature/Footer';

const PrivacyPage = () => {
  useEffect(() => {
    document.title = 'Privacy Policy | Curae';

    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', 'Learn about Curae\'s privacy practices, data collection, and how we protect your personal information in our comprehensive privacy policy.');
    }

    const metaKeywords = document.querySelector('meta[name="keywords"]');
    if (metaKeywords) {
      metaKeywords.setAttribute('content', 'privacy policy, data protection, personal information, Curae, skincare data, user privacy');
    }
  }, []);

  return (
    <div className="min-h-screen bg-cream-50">
      <Navbar />

      <main className="pt-24 pb-16">
        <div className="max-w-4xl mx-auto px-6 lg:px-12">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 lg:p-12">
            <header className="mb-12 text-center">
              <h1 className="text-3xl lg:text-4xl font-light text-forest-900 mb-4">Privacy Policy</h1>
              <p className="text-gray-600 text-lg">Last Updated: August 2, 2026</p>
              <p className="text-gray-500 text-sm mt-1">Effective Date: August 2, 2026</p>
            </header>

            <div className="prose prose-lg max-w-none space-y-10">

              {/* Introduction */}
              <section>
                <p className="text-gray-700 leading-relaxed">
                  Welcome to Curae, a skincare intelligence platform operated by Lineup Labs LLC ("Curae," "we," "our," or "us"). This Privacy Policy explains how we collect, use, disclose, and protect your personal information when you use our mobile application and related services (collectively, the "Service").
                </p>
                <p className="text-gray-700 leading-relaxed mt-4">
                  By using the Service, you agree to the collection and use of information in accordance with this Privacy Policy. If you do not agree, please do not use the Service.
                </p>
              </section>

              <hr className="border-gray-200" />

              {/* Section 1 */}
              <section>
                <h2 className="text-2xl font-semibold text-forest-900 mb-4">1. Who We Are</h2>
                <div className="space-y-2 text-gray-700 leading-relaxed">
                  <ul className="list-disc pl-6 space-y-2">
                    <li><strong>Company:</strong> Lineup Labs LLC</li>
                    <li><strong>Founder:</strong> Ethan Jones</li>
                    <li><strong>Location:</strong> Chicago, Illinois, United States</li>
                    <li><strong>Contact:</strong> <a href="mailto:lineupdownbiz@gmail.com" className="text-forest-700 hover:underline">lineupdownbiz@gmail.com</a></li>
                    <li><strong>Website:</strong> <a href="https://loremcurae.com" target="_blank" rel="noopener noreferrer" className="text-forest-700 hover:underline">loremcurae.com</a></li>
                  </ul>
                </div>
              </section>

              <hr className="border-gray-200" />

              {/* Section 2 */}
              <section>
                <h2 className="text-2xl font-semibold text-forest-900 mb-6">2. Information We Collect</h2>
                <div className="space-y-8 text-gray-700">

                  <div>
                    <h3 className="text-xl font-medium text-forest-800 mb-3">2.1 Information You Provide Directly</h3>
                    <p className="leading-relaxed mb-3">When you create an account or use the Service, we collect:</p>

                    <p className="font-semibold mb-2">Account Information:</p>
                    <ul className="list-disc pl-6 space-y-2 leading-relaxed mb-4">
                      <li>Full name and display name</li>
                      <li>Email address</li>
                      <li>Password (stored as a hashed value — we never store plaintext passwords)</li>
                    </ul>

                    <p className="font-semibold mb-2">Skin Profile Data (collected during onboarding survey):</p>
                    <ul className="list-disc pl-6 space-y-2 leading-relaxed mb-4">
                      <li>Skin type (e.g., dry, oily, combination, normal, sensitive)</li>
                      <li>Skin concerns (e.g., acne, hyperpigmentation, dryness, redness)</li>
                      <li>Sensitivity level</li>
                      <li>Skin tone / complexion (Fitzpatrick scale)</li>
                      <li>Allergens and ingredient sensitivities</li>
                      <li>Product preferences (e.g., fragrance-free, vegan, cruelty-free)</li>
                      <li>Lifestyle factors</li>
                      <li>Skincare experience level</li>
                      <li>Monthly skincare budget</li>
                      <li>Shopping preferences</li>
                      <li>Primary skin goals and ranked goal priorities</li>
                      <li>Sex at birth (used to provide hormone-relevant product recommendations)</li>
                    </ul>
                    <div className="bg-amber-50 border-l-4 border-amber-400 p-4 rounded">
                      <p className="font-semibold text-amber-900">This data is health-adjacent and sensitive. We treat it with the highest level of care and never sell it.</p>
                    </div>

                    <p className="font-semibold mt-6 mb-2">Product Scan Data:</p>
                    <ul className="list-disc pl-6 space-y-2 leading-relaxed mb-4">
                      <li>Images captured using your device camera during product scans</li>
                      <li>Ingredient lists extracted from scanned products</li>
                      <li>Scan results and compatibility scores</li>
                      <li>Products added to your digital shelf</li>
                    </ul>

                    <p className="font-semibold mb-2">User-Generated Content:</p>
                    <ul className="list-disc pl-6 space-y-2 leading-relaxed">
                      <li>Custom allergens you manually enter</li>
                      <li>Routines and routine steps you create</li>
                      <li>Goals you set and modify</li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-xl font-medium text-forest-800 mb-3">2.2 Information Collected Automatically</h3>
                    <p className="leading-relaxed mb-3">When you use the Service, we automatically collect:</p>

                    <p className="font-semibold mb-2">Device and Technical Information:</p>
                    <ul className="list-disc pl-6 space-y-2 leading-relaxed mb-4">
                      <li>Device type, operating system, and version</li>
                      <li>App version</li>
                      <li>Unique device identifiers</li>
                      <li>IP address</li>
                      <li>Time zone and locale settings</li>
                    </ul>

                    <p className="font-semibold mb-2">Usage Data:</p>
                    <ul className="list-disc pl-6 space-y-2 leading-relaxed mb-4">
                      <li>Features you interact with and how often</li>
                      <li>Onboarding step completion and drop-off points</li>
                      <li>Scan frequency and patterns</li>
                      <li>Session duration and navigation patterns</li>
                      <li>Crash reports and error logs</li>
                    </ul>

                    <p className="font-semibold mb-2">Analytics Data:</p>
                    <p className="leading-relaxed mb-2">We use PostHog to collect analytics. PostHog captures:</p>
                    <ul className="list-disc pl-6 space-y-2 leading-relaxed mb-3">
                      <li>Events such as scan_started, scan_completed, onboarding_completed, paywall_viewed</li>
                      <li>User journey through the app</li>
                      <li>Feature engagement metrics</li>
                    </ul>
                    <p className="leading-relaxed">PostHog analytics are <strong>disabled in development mode</strong> and only active in production builds.</p>
                  </div>

                  <div>
                    <h3 className="text-xl font-medium text-forest-800 mb-3">2.3 Camera and Image Data</h3>
                    <p className="leading-relaxed mb-3">Curae requires camera access to scan skincare product labels. When you scan a product:</p>
                    <ul className="list-disc pl-6 space-y-2 leading-relaxed">
                      <li>Your camera captures an image of the product label</li>
                      <li>The image is processed to extract ingredient information</li>
                      <li>Images are transmitted securely to our servers for processing</li>
                      <li><strong>We do not store raw product scan images on our servers after processing is complete</strong></li>
                      <li>An account is required to use scan features</li>
                      <li>Camera access is only activated when you initiate a scan — we never access your camera in the background</li>
                    </ul>
                  </div>
                </div>
              </section>

              <hr className="border-gray-200" />

              {/* Section 3 */}
              <section>
                <h2 className="text-2xl font-semibold text-forest-900 mb-6">3. How We Use Your Information</h2>
                <p className="text-gray-700 leading-relaxed mb-4">We use the information we collect to:</p>
                <div className="space-y-5 text-gray-700">

                  <div>
                    <p className="font-semibold mb-2">Provide and Improve the Service:</p>
                    <ul className="list-disc pl-6 space-y-2 leading-relaxed">
                      <li>Analyze scanned products and provide personalized compatibility scores</li>
                      <li>Generate ingredient safety assessments based on your skin profile</li>
                      <li>Surface compatible product recommendations tailored to your skin type and concerns</li>
                      <li>Power your digital shelf and routine tracker</li>
                      <li>Provide AI-powered skincare intelligence and chat features</li>
                    </ul>
                  </div>

                  <div>
                    <p className="font-semibold mb-2">Personalization:</p>
                    <ul className="list-disc pl-6 space-y-2 leading-relaxed">
                      <li>Customize every scan result, recommendation, and insight to your unique skin profile</li>
                      <li>Apply allergen and sensitivity filters to all product recommendations</li>
                      <li>Match you with reviews from users with similar skin profiles</li>
                    </ul>
                  </div>

                  <div>
                    <p className="font-semibold mb-2">Communication:</p>
                    <ul className="list-disc pl-6 space-y-2 leading-relaxed">
                      <li>Send transactional emails (account verification, password reset)</li>
                      <li>Send service-related notifications (if you opt in to push notifications)</li>
                      <li>Respond to your support inquiries</li>
                    </ul>
                  </div>

                  <div>
                    <p className="font-semibold mb-2">Analytics and Product Development:</p>
                    <ul className="list-disc pl-6 space-y-2 leading-relaxed">
                      <li>Understand how users interact with the Service</li>
                      <li>Identify and fix bugs and performance issues</li>
                      <li>Develop new features and improve existing ones</li>
                    </ul>
                  </div>

                  <div>
                    <p className="font-semibold mb-2">Safety and Legal Compliance:</p>
                    <ul className="list-disc pl-6 space-y-2 leading-relaxed">
                      <li>Detect and prevent fraudulent or unauthorized use</li>
                      <li>Comply with applicable laws and regulations</li>
                      <li>Enforce our Terms of Service</li>
                    </ul>
                  </div>
                </div>
              </section>

              <hr className="border-gray-200" />

              {/* Section 4 */}
              <section>
                <h2 className="text-2xl font-semibold text-forest-900 mb-4">4. Legal Basis for Processing (GDPR)</h2>
                <p className="text-gray-700 leading-relaxed mb-4">If you are located in the European Economic Area (EEA), our legal bases for processing your personal data are:</p>
                <ul className="list-disc pl-6 space-y-2 text-gray-700 leading-relaxed">
                  <li><strong>Contract Performance:</strong> Processing necessary to provide the Service you signed up for</li>
                  <li><strong>Legitimate Interests:</strong> Analytics, security, fraud prevention, and product improvement</li>
                  <li><strong>Consent:</strong> Where we ask for your explicit consent (e.g., push notifications, marketing)</li>
                  <li><strong>Legal Obligation:</strong> Where processing is required to comply with applicable law</li>
                </ul>
                <p className="text-gray-700 leading-relaxed mt-4">For sensitive health-adjacent data (skin profile, allergens, sensitivities), we process this data <strong>only with your explicit consent</strong>, obtained during onboarding.</p>
              </section>

              <hr className="border-gray-200" />

              {/* Section 5 */}
              <section>
                <h2 className="text-2xl font-semibold text-forest-900 mb-4">5. How We Share Your Information</h2>
                <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded mb-6">
                  <p className="font-semibold text-green-900">We do not sell your personal information or your skin profile data to any third party. Ever.</p>
                </div>
                <div className="bg-gray-50 border border-gray-200 p-4 rounded-lg mb-6">
                  <p className="font-semibold text-forest-900 mb-2">Aggregated and Anonymized Insights (Future)</p>
                  <p className="text-gray-700 leading-relaxed mb-3">In the future, we may create and share aggregated, anonymized insights about skincare trends — for example, which kinds of products people with a particular skin type tend to scan, keep, or stop using — with skincare brands, researchers, or similar partners. This is not the same as selling your personal information, which we never do (as stated in Section 5, "How We Share Your Information"). By "aggregated and anonymized" we mean:</p>
                  <ul className="list-disc pl-6 space-y-2 text-gray-700 leading-relaxed mb-3">
                    <li><strong>No individual data.</strong> These insights never include your name, email, account, images, or skin profile, and never any information that could identify you.</li>
                    <li><strong>Combined across many users.</strong> Insights are calculated over large groups, so that neither we nor any recipient can single you out or trace an insight back to you.</li>
                    <li><strong>Trends, not people.</strong> They describe patterns across a population, never any individual's activity.</li>
                  </ul>
                  <p className="text-gray-700 leading-relaxed">This would be <strong>opt-in only.</strong> We are not doing this today, and we will not include your activity in any such insights unless you expressly choose to participate — and you could withdraw that choice at any time. Our commitment never to sell your personal information or skin profile data remains unchanged regardless of any aggregated-insights program.</p>
                </div>
                <p className="text-gray-700 leading-relaxed mb-4">We may share information with:</p>
                <div className="space-y-5 text-gray-700">
                  <div>
                    <p className="font-semibold mb-2">Service Providers:</p>
                    <ul className="list-disc pl-6 space-y-2 leading-relaxed">
                      <li><strong>Supabase</strong> — Database hosting, authentication, and backend infrastructure (servers located in the United States)</li>
                      <li><strong>Anthropic (Claude API)</strong> — AI-powered ingredient analysis and skincare insights (data processed per Anthropic's privacy policy)</li>
                      <li><strong>PostHog</strong> — Analytics and user behavior tracking</li>
                      <li><strong>Resend</strong> — Transactional email delivery</li>
                      <li><strong>Serper.dev</strong> — Web search for product, retailer, and ingredient research (we send product names and ingredient queries; we do not send your skin profile)</li>
                      <li><strong>Expo / Expo Application Services (EAS)</strong> — Mobile app distribution and build services</li>
                    </ul>
                    <p className="leading-relaxed mt-3">All service providers are contractually required to handle your data securely and only for the purposes we specify.</p>
                  </div>

                  <div>
                    <p className="font-semibold mb-2">Affiliate Partners:</p>
                    <p className="leading-relaxed">When you tap "Where to Buy" links, we may earn affiliate commissions from retailers. We share minimal data necessary to track these referrals (typically a product identifier and click event). We do not share your skin profile with retailers.</p>
                  </div>

                  <div>
                    <p className="font-semibold mb-2">Legal Requirements:</p>
                    <p className="leading-relaxed">We may disclose your information if required by law, court order, or government authority, or to protect the rights, property, or safety of Curae, our users, or the public.</p>
                  </div>

                  <div>
                    <p className="font-semibold mb-2">Business Transfers:</p>
                    <p className="leading-relaxed">In the event of a merger, acquisition, or sale of all or part of our assets, your information may be transferred as part of that transaction. We will notify you before your personal information is transferred and becomes subject to a different privacy policy.</p>
                  </div>
                </div>
              </section>

              <hr className="border-gray-200" />

              {/* Section 6 */}
              <section>
                <h2 className="text-2xl font-semibold text-forest-900 mb-4">6. Data Retention</h2>
                <ul className="list-disc pl-6 space-y-2 text-gray-700 leading-relaxed">
                  <li><strong>Account data:</strong> Retained for as long as your account is active. Deleted within 30 days of account deletion request.</li>
                  <li><strong>Skin profile data:</strong> Retained as long as your account is active. Deleted upon account deletion.</li>
                  <li><strong>Scan data and product interactions:</strong> Retained for as long as your account is active to power your scan history and recommendations.</li>
                  <li><strong>Analytics data:</strong> Aggregated analytics may be retained indefinitely in anonymized form.</li>
                </ul>
              </section>

              <hr className="border-gray-200" />

              {/* Section 7 */}
              <section>
                <h2 className="text-2xl font-semibold text-forest-900 mb-4">7. Data Security</h2>
                <p className="text-gray-700 leading-relaxed mb-4">We implement industry-standard security measures to protect your information:</p>
                <ul className="list-disc pl-6 space-y-2 text-gray-700 leading-relaxed">
                  <li>All data transmitted between the app and our servers is encrypted using TLS/HTTPS</li>
                  <li>Passwords are hashed and never stored in plaintext</li>
                  <li>Database access is protected by row-level security (RLS) policies in Supabase</li>
                  <li>Authentication tokens are stored securely using device SecureStore</li>
                  <li>We conduct regular security reviews</li>
                </ul>
                <p className="text-gray-700 leading-relaxed mt-4">However, no method of transmission over the internet or electronic storage is 100% secure. We cannot guarantee absolute security.</p>
              </section>

              <hr className="border-gray-200" />

              {/* Section 9 */}
              <section>
                <h2 className="text-2xl font-semibold text-forest-900 mb-6">9. Your Rights and Choices</h2>
                <p className="text-gray-700 leading-relaxed mb-4">Depending on your location, you may have the following rights:</p>
                <div className="space-y-6 text-gray-700">
                  <div>
                    <h3 className="text-xl font-medium text-forest-800 mb-3">All Users:</h3>
                    <ul className="list-disc pl-6 space-y-2 leading-relaxed">
                      <li><strong>Access:</strong> Request a copy of the personal data we hold about you</li>
                      <li><strong>Correction:</strong> Request correction of inaccurate personal data</li>
                      <li><strong>Deletion:</strong> Request deletion of your account and associated data</li>
                      <li><strong>Portability:</strong> Request your data in a portable format</li>
                      <li><strong>Opt-out:</strong> Opt out of push notifications at any time in device settings</li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-xl font-medium text-forest-800 mb-3">California Residents (CCPA):</h3>
                    <ul className="list-disc pl-6 space-y-2 leading-relaxed">
                      <li>Right to know what personal information we collect, use, and share</li>
                      <li>Right to delete personal information</li>
                      <li>Right to opt-out of the sale of personal information (we do not sell personal information)</li>
                      <li>Right to non-discrimination for exercising your rights</li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-xl font-medium text-forest-800 mb-3">EEA Residents (GDPR):</h3>
                    <ul className="list-disc pl-6 space-y-2 leading-relaxed">
                      <li>Right to access, rectification, erasure, restriction, and portability</li>
                      <li>Right to object to processing based on legitimate interests</li>
                      <li>Right to withdraw consent at any time</li>
                      <li>Right to lodge a complaint with your local data protection authority</li>
                    </ul>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="leading-relaxed"><strong>To exercise your rights,</strong> contact us at <a href="mailto:lineupdownbiz@gmail.com" className="text-forest-700 hover:underline">lineupdownbiz@gmail.com</a>. We will respond within 30 days.</p>
                  </div>
                </div>
              </section>

              <hr className="border-gray-200" />

              {/* Section 10 */}
              <section>
                <h2 className="text-2xl font-semibold text-forest-900 mb-4">10. Children's Privacy</h2>
                <div className="space-y-4 text-gray-700 leading-relaxed">
                  <p>The Service is not directed to children under the age of 13 in the United States, or under the applicable age of digital consent in your jurisdiction. We do not knowingly collect personal information from children under 13.</p>
                  <p>If you are between 13 and 17 years of age, you may use the Service only with the involvement and consent of a parent or legal guardian.</p>
                  <p>If we become aware that we have collected personal information from a child under 13 without parental consent, we will take steps to delete that information promptly. If you believe we may have inadvertently collected information from a child, please contact us at <a href="mailto:lineupdownbiz@gmail.com" className="text-forest-700 hover:underline">lineupdownbiz@gmail.com</a>.</p>
                </div>
              </section>

              <hr className="border-gray-200" />

              {/* Section 11 */}
              <section>
                <h2 className="text-2xl font-semibold text-forest-900 mb-4">11. International Data Transfers</h2>
                <div className="space-y-4 text-gray-700 leading-relaxed">
                  <p>Curae is based in the United States. If you are accessing the Service from outside the United States, your information may be transferred to and processed in the United States, where data protection laws may differ from those in your country.</p>
                  <p>For EEA users, we rely on Standard Contractual Clauses or other appropriate safeguards to ensure your data is protected when transferred internationally.</p>
                </div>
              </section>

              <hr className="border-gray-200" />

              {/* Section 12 */}
              <section>
                <h2 className="text-2xl font-semibold text-forest-900 mb-4">12. Third-Party Links and Services</h2>
                <p className="text-gray-700 leading-relaxed">The Service may contain links to third-party websites (such as retailer "Where to Buy" links). These third-party sites have their own privacy policies, and we have no control over their practices. We are not responsible for the content or privacy practices of any third-party sites.</p>
              </section>

              <hr className="border-gray-200" />

              {/* Section 13 */}
              <section>
                <h2 className="text-2xl font-semibold text-forest-900 mb-4">13. Camera and Microphone Permissions</h2>
                <div className="space-y-3 text-gray-700 leading-relaxed">
                  <p><strong>Camera:</strong> Required for product scanning. We access your camera only when you actively initiate a scan. We do not access your camera in the background or for any purpose other than scanning product labels.</p>
                  <p><strong>Microphone:</strong> We do not request or use microphone access.</p>
                  <p><strong>Photo Library:</strong> We do not access your photo library unless you explicitly choose to upload an image.</p>
                </div>
              </section>

              <hr className="border-gray-200" />

              {/* Section 14 */}
              <section>
                <h2 className="text-2xl font-semibold text-forest-900 mb-4">14. Changes to This Privacy Policy</h2>
                <p className="text-gray-700 leading-relaxed mb-4">We may update this Privacy Policy from time to time. When we make material changes, we will:</p>
                <ul className="list-disc pl-6 space-y-2 text-gray-700 leading-relaxed">
                  <li>Update the "Last Updated" date at the top of this policy</li>
                  <li>Notify you via in-app notification or email</li>
                  <li>For significant changes, we may require you to re-acknowledge the policy</li>
                </ul>
                <p className="text-gray-700 leading-relaxed mt-4">Your continued use of the Service after any changes constitutes your acceptance of the updated policy.</p>
                <div className="bg-gray-50 border border-gray-200 p-4 rounded-lg mt-6">
                  <p className="font-semibold text-forest-900 mb-2">Changelog</p>
                  <ul className="list-disc pl-6 space-y-1 text-gray-700 leading-relaxed">
                    <li><strong>August 2, 2026:</strong> Added a forward-looking disclosure that we may, on an opt-in basis, share aggregated, anonymized skincare-trend insights with third parties — never individual data, and never a sale of your personal information.</li>
                    <li><strong>July 30, 2026:</strong> Updated the operating entity name to Lineup Labs LLC. Service tier and free-trial terms were also updated (see our Terms of Service).</li>
                  </ul>
                </div>
              </section>

              <hr className="border-gray-200" />

              {/* Section 15 */}
              <section>
                <h2 className="text-2xl font-semibold text-forest-900 mb-4">15. Contact Us</h2>
                <p className="text-gray-700 leading-relaxed mb-4">If you have questions, concerns, or requests regarding this Privacy Policy, please contact us:</p>
                <div className="bg-gray-50 p-6 rounded-lg text-gray-700 space-y-2">
                  <p><strong>Email:</strong> <a href="mailto:lineupdownbiz@gmail.com" className="text-forest-700 hover:underline">lineupdownbiz@gmail.com</a></p>
                  <p><strong>Website:</strong> <a href="https://loremcurae.com" target="_blank" rel="noopener noreferrer" className="text-forest-700 hover:underline">loremcurae.com</a></p>
                  <p><strong>Mailing Address:</strong> Curae.App, Chicago, Illinois, United States</p>
                </div>
                <p className="text-gray-700 leading-relaxed mt-4">We aim to respond to all privacy-related inquiries within 30 days.</p>
              </section>

            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default PrivacyPage;
