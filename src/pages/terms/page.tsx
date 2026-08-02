
import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../../components/feature/Navbar';
import Footer from '../../components/feature/Footer';

const TermsPage = () => {
  useEffect(() => {
    document.title = 'Terms of Service | Curae';

    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', 'Read Curae\'s Terms of Service — your rights, responsibilities, subscription details, and dispute resolution when using the Curae skincare intelligence platform.');
    }

    const metaKeywords = document.querySelector('meta[name="keywords"]');
    if (metaKeywords) {
      metaKeywords.setAttribute('content', 'terms of service, terms and conditions, user agreement, Curae, skincare app, legal');
    }
  }, []);

  return (
    <div className="min-h-screen bg-cream-50">
      <Navbar />

      <main className="pt-24 pb-16">
        <div className="max-w-4xl mx-auto px-6 lg:px-12">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 lg:p-12">
            <header className="mb-12 text-center">
              <h1 className="text-3xl lg:text-4xl font-light text-forest-900 mb-4">Terms of Service</h1>
              <p className="text-gray-600 text-lg">Last Updated: August 2, 2026</p>
              <p className="text-gray-500 text-sm mt-1">Effective Date: August 2, 2026</p>
            </header>

            <div className="prose prose-lg max-w-none space-y-10">

              {/* Introduction */}
              <section>
                <p className="text-gray-700 leading-relaxed mb-4">
                  These Terms of Service ("Terms") govern your access to and use of the Curae mobile application and related services (collectively, the "Service") operated by Lineup Labs LLC ("Curae," "we," "our," or "us").
                </p>
                <p className="text-gray-700 leading-relaxed mb-4">
                  By downloading, installing, or using the Service, you agree to be bound by these Terms. If you do not agree to these Terms, do not use the Service.
                </p>
                <div className="bg-amber-50 border-l-4 border-amber-400 p-4 rounded">
                  <p className="font-semibold text-amber-900">Please read these Terms carefully before using the Service. They contain important information about your rights, limitations, and dispute resolution.</p>
                </div>
              </section>

              <hr className="border-gray-200" />

              {/* Section 1 */}
              <section>
                <h2 className="text-2xl font-semibold text-forest-900 mb-4">1. Who We Are</h2>
                <ul className="list-disc pl-6 space-y-2 text-gray-700 leading-relaxed">
                  <li><strong>Company:</strong> Lineup Labs LLC</li>
                  <li><strong>Founder:</strong> Ethan Jones</li>
                  <li><strong>Location:</strong> Chicago, Illinois, United States</li>
                  <li><strong>Contact:</strong> <a href="mailto:lineupdownbiz@gmail.com" className="text-forest-700 hover:underline">lineupdownbiz@gmail.com</a></li>
                  <li><strong>Website:</strong> <a href="https://loremcurae.com" target="_blank" rel="noopener noreferrer" className="text-forest-700 hover:underline">loremcurae.com</a></li>
                </ul>
              </section>

              <hr className="border-gray-200" />

              {/* Section 2 */}
              <section>
                <h2 className="text-2xl font-semibold text-forest-900 mb-6">2. Eligibility</h2>
                <div className="space-y-5 text-gray-700">
                  <div>
                    <h3 className="text-xl font-medium text-forest-800 mb-3">2.1 Age Requirements</h3>
                    <p className="leading-relaxed mb-2">You must be at least 13 years of age to use the Service. If you are between 13 and 17 years of age, you may only use the Service with the consent and involvement of a parent or legal guardian.</p>
                    <p className="leading-relaxed">By using the Service, you represent and warrant that you meet the applicable age requirements.</p>
                  </div>
                  <div>
                    <h3 className="text-xl font-medium text-forest-800 mb-3">2.2 Account Requirements</h3>
                    <p className="leading-relaxed">To access the Service, you must create an account.</p>
                  </div>
                </div>
              </section>

              <hr className="border-gray-200" />

              {/* Section 3 */}
              <section>
                <h2 className="text-2xl font-semibold text-forest-900 mb-6">3. Accounts</h2>
                <div className="space-y-5 text-gray-700">
                  <div>
                    <h3 className="text-xl font-medium text-forest-800 mb-3">3.1 Account Creation</h3>
                    <p className="leading-relaxed">To create an account, you must provide accurate, current, and complete information. You are responsible for maintaining the accuracy of your account information.</p>
                  </div>
                  <div>
                    <h3 className="text-xl font-medium text-forest-800 mb-3">3.2 Account Security</h3>
                    <p className="leading-relaxed mb-3">You are responsible for:</p>
                    <ul className="list-disc pl-6 space-y-2 leading-relaxed">
                      <li>Maintaining the confidentiality of your account credentials</li>
                      <li>All activity that occurs under your account</li>
                      <li>Notifying us immediately of any unauthorized use of your account at <a href="mailto:lineupdownbiz@gmail.com" className="text-forest-700 hover:underline">lineupdownbiz@gmail.com</a></li>
                    </ul>
                    <p className="leading-relaxed mt-3">We are not liable for any loss or damage arising from unauthorized use of your account.</p>
                  </div>
                  <div>
                    <h3 className="text-xl font-medium text-forest-800 mb-3">3.3 One Account Per Person</h3>
                    <p className="leading-relaxed">Each person may only maintain one account. You may not create multiple accounts to circumvent restrictions, bans, or subscription limitations.</p>
                  </div>
                </div>
              </section>

              <hr className="border-gray-200" />

              {/* Section 4 */}
              <section>
                <h2 className="text-2xl font-semibold text-forest-900 mb-6">4. The Service</h2>
                <div className="space-y-6 text-gray-700">
                  <div>
                    <h3 className="text-xl font-medium text-forest-800 mb-3">4.1 What Curae Does</h3>
                    <p className="leading-relaxed mb-3">Curae is an AI-powered skincare intelligence platform that:</p>
                    <ul className="list-disc pl-6 space-y-2 leading-relaxed">
                      <li>Analyzes skincare product ingredients via camera scan</li>
                      <li>Provides personalized compatibility scores based on your skin profile</li>
                      <li>Surfaces compatible product recommendations</li>
                      <li>Helps you build and manage a skincare routine</li>
                      <li>Provides AI-powered skincare insights and chat features</li>
                      <li>Aggregates product pricing and retailer information</li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-xl font-medium text-forest-800 mb-3">4.2 Important Limitations — Not Medical Advice</h3>
                    <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded mb-4">
                      <p className="font-bold text-red-900 uppercase tracking-wide text-sm mb-2">THE SERVICE DOES NOT PROVIDE MEDICAL ADVICE, DIAGNOSIS, OR TREATMENT.</p>
                      <p className="text-red-800 leading-relaxed">The information provided by Curae, including ingredient safety assessments, compatibility scores, and product recommendations, is for <strong>informational and educational purposes only</strong>. It is not a substitute for professional medical advice, diagnosis, or treatment from a licensed dermatologist, allergist, physician, or other qualified healthcare provider.</p>
                    </div>
                    <p className="font-semibold mb-2">You should:</p>
                    <ul className="list-disc pl-6 space-y-2 leading-relaxed">
                      <li>Always consult a qualified healthcare provider before making decisions about your skin health</li>
                      <li>Never disregard professional medical advice based on information provided by the Service</li>
                      <li>Seek emergency medical attention if you experience a severe skin reaction, allergic reaction, or other medical emergency</li>
                    </ul>
                    <p className="leading-relaxed mt-3"><strong>If you have known allergies, skin conditions, or sensitivities, you should verify product safety with a qualified healthcare provider before use, even if Curae rates a product as compatible for you.</strong></p>
                  </div>

                  <div>
                    <h3 className="text-xl font-medium text-forest-800 mb-3">4.3 Ingredient Analysis Accuracy</h3>
                    <p className="leading-relaxed mb-3">Curae uses AI technology and established cosmetic ingredient databases (including EU Cosmetics Regulation safety tiers) to analyze ingredients. While we strive for accuracy:</p>
                    <ul className="list-disc pl-6 space-y-2 leading-relaxed">
                      <li>Ingredient lists on product labels may be incomplete, illegible, or outdated</li>
                      <li>AI analysis may contain errors or omissions</li>
                      <li>Our database may not reflect recent formula changes by manufacturers</li>
                      <li>Individual reactions to ingredients vary and cannot be fully predicted</li>
                    </ul>
                    <p className="leading-relaxed mt-3">We make no warranty that ingredient analysis results are error-free, complete, or suitable for your specific medical needs.</p>
                  </div>

                  <div>
                    <h3 className="text-xl font-medium text-forest-800 mb-3">4.4 Product Recommendations</h3>
                    <p className="leading-relaxed mb-3">Curae may recommend products and provide "Where to Buy" links to third-party retailers. These recommendations are based on your skin profile and are provided for informational purposes. We do not:</p>
                    <ul className="list-disc pl-6 space-y-2 leading-relaxed">
                      <li>Endorse any specific product or brand</li>
                      <li>Guarantee the availability, pricing, or quality of any recommended product</li>
                      <li>Warrant that recommended products will be suitable or effective for you personally</li>
                    </ul>
                  </div>
                </div>
              </section>

              <hr className="border-gray-200" />

              {/* Section 5 */}
              <section>
                <h2 className="text-2xl font-semibold text-forest-900 mb-6">5. Subscriptions and Payments</h2>
                <div className="space-y-5 text-gray-700">
                  <div>
                    <h3 className="text-xl font-medium text-forest-800 mb-3">5.1 Subscription Plans</h3>
                    <p className="leading-relaxed mb-3">Curae offers a subscription-based premium tier:</p>
                    <ul className="list-disc pl-6 space-y-2 leading-relaxed">
                      <li><strong>Monthly:</strong> $4.99 per month</li>
                      <li><strong>Annual:</strong> $34.99 per year (approximately 42% savings vs. monthly)</li>
                    </ul>
                    <p className="leading-relaxed mt-3">Subscription pricing may change. We will provide advance notice before increasing prices for existing subscribers.</p>
                  </div>

                  <div>
                    <h3 className="text-xl font-medium text-forest-800 mb-3">5.2 Free Trial</h3>
                    <p className="leading-relaxed">We may offer a one-week free trial of Premium, once per user, opt-in only. Free trial terms will be disclosed at the time of offer. After the free trial ends, you will be charged the applicable subscription fee unless you cancel before the trial period ends.</p>
                  </div>

                  <div>
                    <h3 className="text-xl font-medium text-forest-800 mb-3">5.3 Billing</h3>
                    <ul className="list-disc pl-6 space-y-2 leading-relaxed">
                      <li><strong>iOS:</strong> Subscriptions are processed through Apple In-App Purchase. Apple's payment terms apply.</li>
                      <li><strong>Android:</strong> Subscriptions are processed through Google Play Billing. Google's payment terms apply.</li>
                      <li>Subscription fees are billed in advance on a recurring basis (monthly or annually)</li>
                      <li>Subscriptions automatically renew unless cancelled</li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-xl font-medium text-forest-800 mb-3">5.4 Cancellation</h3>
                    <p className="leading-relaxed mb-3">You may cancel your subscription at any time through:</p>
                    <ul className="list-disc pl-6 space-y-2 leading-relaxed">
                      <li><strong>iOS:</strong> Apple App Store subscription settings</li>
                      <li><strong>Android:</strong> Google Play subscription settings</li>
                    </ul>
                    <p className="leading-relaxed mt-3">Cancellation takes effect at the end of the current billing period. You will retain access to premium features until the end of the paid period.</p>
                  </div>

                  <div>
                    <h3 className="text-xl font-medium text-forest-800 mb-3">5.5 Refunds</h3>
                    <p className="leading-relaxed">Refund requests are subject to the refund policies of Apple App Store (for iOS) or Google Play Store (for Android). We do not process refunds directly. Contact Apple or Google support for refund requests.</p>
                  </div>

                  <div>
                    <h3 className="text-xl font-medium text-forest-800 mb-3">5.6 Free Tier</h3>
                    <p className="leading-relaxed">Curae offers a free tier (up to 15 scans per month, ingredient analysis, allergen warnings, and routine tools). Compatibility, conflict detection, and unlimited scanning are Premium features. We reserve the right to modify the features available in the free tier at any time.</p>
                  </div>
                </div>
              </section>

              <hr className="border-gray-200" />

              {/* Section 6 */}
              <section>
                <h2 className="text-2xl font-semibold text-forest-900 mb-6">6. Acceptable Use</h2>
                <div className="space-y-5 text-gray-700">
                  <div>
                    <h3 className="text-xl font-medium text-forest-800 mb-3">6.1 You May Use the Service To:</h3>
                    <ul className="list-disc pl-6 space-y-2 leading-relaxed">
                      <li>Scan skincare products and view personalized analysis</li>
                      <li>Build and manage your skincare profile and routine</li>
                      <li>Access product recommendations and where-to-buy information</li>
                      <li>Use AI-powered skincare chat features</li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-xl font-medium text-forest-800 mb-3">6.2 You May Not:</h3>
                    <ul className="list-disc pl-6 space-y-2 leading-relaxed">
                      <li>Use the Service for any unlawful purpose</li>
                      <li>Attempt to reverse engineer, decompile, or disassemble the Service</li>
                      <li>Scrape, crawl, or extract data from the Service without written permission</li>
                      <li>Use automated tools to access the Service (bots, scripts, crawlers)</li>
                      <li>Attempt to gain unauthorized access to any part of the Service or its infrastructure</li>
                      <li>Upload or transmit malware, viruses, or any harmful code</li>
                      <li>Impersonate any person or entity or misrepresent your affiliation</li>
                      <li>Use the Service to harm, harass, or deceive other users</li>
                      <li>Circumvent or attempt to circumvent any subscription or access restrictions</li>
                      <li>Use the Service for commercial purposes without our written consent</li>
                    </ul>
                  </div>
                </div>
              </section>

              <hr className="border-gray-200" />

              {/* Section 7 */}
              <section>
                <h2 className="text-2xl font-semibold text-forest-900 mb-6">7. User Content</h2>
                <div className="space-y-5 text-gray-700">
                  <div>
                    <h3 className="text-xl font-medium text-forest-800 mb-3">7.1 Your Content</h3>
                    <p className="leading-relaxed">You retain ownership of any content you submit to the Service, including your skin profile data, custom allergens, routines, and goals ("User Content").</p>
                  </div>
                  <div>
                    <h3 className="text-xl font-medium text-forest-800 mb-3">7.2 License to Curae</h3>
                    <p className="leading-relaxed">By submitting User Content, you grant Curae a limited, non-exclusive, royalty-free license to use, process, and store your User Content solely to provide and improve the Service. We will never sell your User Content or use it for advertising purposes.</p>
                  </div>
                  <div>
                    <h3 className="text-xl font-medium text-forest-800 mb-3">7.3 Your Responsibility</h3>
                    <p className="leading-relaxed mb-3">You are responsible for all User Content you submit. You represent that:</p>
                    <ul className="list-disc pl-6 space-y-2 leading-relaxed">
                      <li>You have the right to submit the content</li>
                      <li>The content does not violate any third-party rights</li>
                      <li>The content is accurate to the best of your knowledge</li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="text-xl font-medium text-forest-800 mb-3">7.4 Aggregated and Anonymized Data</h3>
                    <p className="leading-relaxed">Nothing in Section 7.2 prevents us from creating aggregated, anonymized insights that are derived from User Content but no longer identify you or constitute your User Content or personal information. We may, in the future and on an opt-in basis, share such aggregated, anonymized insights with third parties such as skincare brands or researchers. This does not change our commitment never to sell your User Content or personal information. See the "Aggregated and Anonymized Insights" section of our Privacy Policy for what this means and how opt-in works.</p>
                  </div>
                </div>
              </section>

              <hr className="border-gray-200" />

              {/* Section 8 */}
              <section>
                <h2 className="text-2xl font-semibold text-forest-900 mb-6">8. Intellectual Property</h2>
                <div className="space-y-5 text-gray-700">
                  <div>
                    <h3 className="text-xl font-medium text-forest-800 mb-3">8.1 Curae's Intellectual Property</h3>
                    <p className="leading-relaxed">The Service, including its design, code, features, content, branding, and AI models, is owned by Lineup Labs LLC and protected by intellectual property laws. You may not copy, modify, distribute, or create derivative works based on the Service without our written permission.</p>
                  </div>
                  <div>
                    <h3 className="text-xl font-medium text-forest-800 mb-3">8.2 Trademarks</h3>
                    <p className="leading-relaxed">Curae and associated logos are trademarks of Lineup Labs LLC. You may not use our trademarks without prior written permission.</p>
                  </div>
                  <div>
                    <h3 className="text-xl font-medium text-forest-800 mb-3">8.3 Feedback</h3>
                    <p className="leading-relaxed">If you provide feedback, suggestions, or ideas about the Service, you grant us the right to use that feedback without compensation or attribution to you.</p>
                  </div>
                </div>
              </section>

              <hr className="border-gray-200" />

              {/* Section 9 */}
              <section>
                <h2 className="text-2xl font-semibold text-forest-900 mb-4">9. Privacy</h2>
                <p className="text-gray-700 leading-relaxed">
                  Your use of the Service is also governed by our Privacy Policy, which is incorporated into these Terms by reference. Please review our{' '}
                  <Link to="/privacy" className="text-forest-700 hover:underline">Privacy Policy</Link>.
                </p>
              </section>

              <hr className="border-gray-200" />

              {/* Section 10 */}
              <section>
                <h2 className="text-2xl font-semibold text-forest-900 mb-4">10. Third-Party Services</h2>
                <div className="space-y-3 text-gray-700 leading-relaxed">
                  <p>The Service integrates with and links to third-party services (retailers, affiliate partners, AI providers). These third parties have their own terms of service and privacy policies. We are not responsible for the practices of third-party services.</p>
                  <p>When you click "Where to Buy" links, you are leaving the Curae Service and accessing a third-party website. Your interactions with those sites are governed by their terms, not ours.</p>
                </div>
              </section>

              <hr className="border-gray-200" />

              {/* Section 11 */}
              <section>
                <h2 className="text-2xl font-semibold text-forest-900 mb-4">11. Disclaimers</h2>
                <div className="bg-gray-100 border border-gray-300 p-5 rounded-lg mb-4">
                  <p className="font-bold text-gray-900 uppercase tracking-wide text-sm">THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED.</p>
                </div>
                <p className="text-gray-700 leading-relaxed mb-4">To the fullest extent permitted by applicable law, Curae disclaims all warranties, including:</p>
                <ul className="list-disc pl-6 space-y-2 text-gray-700 leading-relaxed">
                  <li>Warranties of merchantability, fitness for a particular purpose, and non-infringement</li>
                  <li>Warranties that the Service will be uninterrupted, error-free, or secure</li>
                  <li>Warranties regarding the accuracy, completeness, or reliability of any content, ingredient analysis, or product recommendation</li>
                  <li>Warranties that the Service will meet your requirements or expectations</li>
                </ul>
                <p className="text-gray-700 leading-relaxed mt-4 font-semibold">You use the Service at your own risk.</p>
              </section>

              <hr className="border-gray-200" />

              {/* Section 12 */}
              <section>
                <h2 className="text-2xl font-semibold text-forest-900 mb-4">12. Limitation of Liability</h2>
                <p className="text-gray-700 leading-relaxed mb-4">To the fullest extent permitted by applicable law, Lineup Labs LLC, its founder, employees, agents, and affiliates shall not be liable for:</p>
                <ul className="list-disc pl-6 space-y-2 text-gray-700 leading-relaxed mb-4">
                  <li>Any indirect, incidental, special, consequential, or punitive damages</li>
                  <li>Loss of profits, data, use, goodwill, or other intangible losses</li>
                  <li>Damages resulting from your use or inability to use the Service</li>
                  <li>Damages resulting from reliance on ingredient analysis, product recommendations, or any content in the Service</li>
                  <li>Damages resulting from skin reactions, allergic responses, or adverse effects from products you purchase based on Service recommendations</li>
                  <li>Unauthorized access to or alteration of your data</li>
                </ul>
                <div className="bg-gray-100 border border-gray-300 p-4 rounded-lg space-y-3 text-gray-700">
                  <p><strong>In jurisdictions where limitation of liability for negligence or personal injury is not permitted, our liability is limited to the maximum extent permitted by law.</strong></p>
                  <p><strong>Our total cumulative liability to you for all claims arising from or related to these Terms or the Service shall not exceed the greater of: (a) the amount you paid to Curae in the 12 months preceding the claim, or (b) $100 USD.</strong></p>
                </div>
              </section>

              <hr className="border-gray-200" />

              {/* Section 13 */}
              <section>
                <h2 className="text-2xl font-semibold text-forest-900 mb-4">13. Indemnification</h2>
                <p className="text-gray-700 leading-relaxed mb-3">You agree to indemnify, defend, and hold harmless Lineup Labs LLC, its founder, officers, employees, and agents from and against any claims, damages, losses, liabilities, costs, and expenses (including reasonable attorneys' fees) arising from:</p>
                <ul className="list-disc pl-6 space-y-2 text-gray-700 leading-relaxed">
                  <li>Your use of the Service</li>
                  <li>Your violation of these Terms</li>
                  <li>Your violation of any third-party rights</li>
                  <li>Any content you submit to the Service</li>
                </ul>
              </section>

              <hr className="border-gray-200" />

              {/* Section 14 */}
              <section>
                <h2 className="text-2xl font-semibold text-forest-900 mb-6">14. Termination</h2>
                <div className="space-y-5 text-gray-700">
                  <div>
                    <h3 className="text-xl font-medium text-forest-800 mb-3">14.1 By You</h3>
                    <p className="leading-relaxed">You may stop using the Service at any time. You may delete your account through the app settings or by contacting us at <a href="mailto:lineupdownbiz@gmail.com" className="text-forest-700 hover:underline">lineupdownbiz@gmail.com</a>.</p>
                  </div>
                  <div>
                    <h3 className="text-xl font-medium text-forest-800 mb-3">14.2 By Curae</h3>
                    <p className="leading-relaxed mb-3">We reserve the right to suspend or terminate your access to the Service at any time, with or without notice, if:</p>
                    <ul className="list-disc pl-6 space-y-2 leading-relaxed">
                      <li>You violate these Terms</li>
                      <li>We determine your use poses a risk to other users or the Service</li>
                      <li>Required by law or legal process</li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="text-xl font-medium text-forest-800 mb-3">14.3 Effect of Termination</h3>
                    <p className="leading-relaxed mb-3">Upon termination:</p>
                    <ul className="list-disc pl-6 space-y-2 leading-relaxed">
                      <li>Your right to use the Service ends immediately</li>
                      <li>We will delete your account and associated data per our Privacy Policy</li>
                      <li>Provisions of these Terms that by their nature should survive termination will survive</li>
                    </ul>
                  </div>
                </div>
              </section>

              <hr className="border-gray-200" />

              {/* Section 15 */}
              <section>
                <h2 className="text-2xl font-semibold text-forest-900 mb-6">15. Governing Law and Dispute Resolution</h2>
                <div className="space-y-5 text-gray-700">
                  <div>
                    <h3 className="text-xl font-medium text-forest-800 mb-3">15.1 Governing Law</h3>
                    <p className="leading-relaxed">These Terms are governed by the laws of the State of Illinois, United States, without regard to its conflict of law provisions.</p>
                  </div>
                  <div>
                    <h3 className="text-xl font-medium text-forest-800 mb-3">15.2 Informal Resolution</h3>
                    <p className="leading-relaxed">Before filing any formal dispute, you agree to contact us at <a href="mailto:lineupdownbiz@gmail.com" className="text-forest-700 hover:underline">lineupdownbiz@gmail.com</a> and attempt to resolve the dispute informally. We will attempt to respond within 30 days.</p>
                  </div>
                  <div>
                    <h3 className="text-xl font-medium text-forest-800 mb-3">15.3 Arbitration</h3>
                    <p className="leading-relaxed mb-3">For users in the United States: Any dispute not resolved informally will be resolved by binding arbitration under the rules of the American Arbitration Association (AAA). Arbitration will take place in Chicago, Illinois. Each party will bear its own arbitration costs.</p>
                    <div className="bg-gray-100 border border-gray-300 p-4 rounded-lg">
                      <p className="font-semibold text-gray-900">Class Action Waiver: You and Curae agree that each may only bring claims against the other in your individual capacity, and not as a plaintiff or class member in any class or representative proceeding.</p>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-xl font-medium text-forest-800 mb-3">15.4 Exception for Small Claims</h3>
                    <p className="leading-relaxed">Either party may bring an individual action in small claims court as an alternative to arbitration.</p>
                  </div>
                  <div>
                    <h3 className="text-xl font-medium text-forest-800 mb-3">15.5 For EEA Users</h3>
                    <p className="leading-relaxed">If you are located in the European Economic Area, you may also submit a complaint to your local consumer protection authority or data protection authority.</p>
                  </div>
                </div>
              </section>

              <hr className="border-gray-200" />

              {/* Section 16 */}
              <section>
                <h2 className="text-2xl font-semibold text-forest-900 mb-6">16. App Store Terms</h2>
                <div className="space-y-5 text-gray-700">
                  <div>
                    <h3 className="text-xl font-medium text-forest-800 mb-3">16.1 Apple App Store</h3>
                    <p className="leading-relaxed mb-3">If you download the Service from the Apple App Store:</p>
                    <ul className="list-disc pl-6 space-y-2 leading-relaxed">
                      <li>These Terms are between you and Lineup Labs LLC only, not Apple</li>
                      <li>Apple has no obligation to provide maintenance or support for the Service</li>
                      <li>Apple is not responsible for any product liability claims or third-party legal claims relating to the Service</li>
                      <li>Apple and its subsidiaries are third-party beneficiaries of these Terms</li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="text-xl font-medium text-forest-800 mb-3">16.2 Google Play Store</h3>
                    <p className="leading-relaxed mb-3">If you download the Service from Google Play:</p>
                    <ul className="list-disc pl-6 space-y-2 leading-relaxed">
                      <li>These Terms are between you and Lineup Labs LLC only, not Google</li>
                      <li>Google has no obligation to provide maintenance or support for the Service</li>
                    </ul>
                  </div>
                </div>
              </section>

              <hr className="border-gray-200" />

              {/* Section 17 */}
              <section>
                <h2 className="text-2xl font-semibold text-forest-900 mb-4">17. Changes to Terms</h2>
                <p className="text-gray-700 leading-relaxed mb-4">We may modify these Terms at any time. When we make material changes, we will:</p>
                <ul className="list-disc pl-6 space-y-2 text-gray-700 leading-relaxed">
                  <li>Update the "Last Updated" date at the top of these Terms</li>
                  <li>Notify you via in-app notification or email</li>
                  <li>For significant changes, we may require your re-acceptance</li>
                </ul>
                <p className="text-gray-700 leading-relaxed mt-4">Your continued use of the Service after any changes constitutes your acceptance of the updated Terms. If you do not agree to the updated Terms, you must stop using the Service.</p>
                <div className="bg-gray-50 border border-gray-200 p-4 rounded-lg mt-6">
                  <p className="font-semibold text-forest-900 mb-2">Changelog</p>
                  <ul className="list-disc pl-6 space-y-1 text-gray-700 leading-relaxed">
                    <li><strong>August 2, 2026:</strong> Clarified (Section 7.4) that aggregated, anonymized data derived from User Content — which no longer identifies you — may be shared on an opt-in basis, consistent with our Privacy Policy and our commitment never to sell your User Content.</li>
                    <li><strong>July 30, 2026:</strong> Free tier updated to 15 scans per month; compatibility and conflict detection moved to Premium; added a one-week Premium free trial (once per user, opt-in).</li>
                  </ul>
                </div>
              </section>

              <hr className="border-gray-200" />

              {/* Section 18 */}
              <section>
                <h2 className="text-2xl font-semibold text-forest-900 mb-4">18. Miscellaneous</h2>
                <div className="space-y-3 text-gray-700 leading-relaxed">
                  <p><strong>Entire Agreement:</strong> These Terms, together with our Privacy Policy, constitute the entire agreement between you and Lineup Labs LLC regarding the Service.</p>
                  <p><strong>Severability:</strong> If any provision of these Terms is found to be unenforceable, the remaining provisions will remain in full force and effect.</p>
                  <p><strong>Waiver:</strong> Our failure to enforce any provision of these Terms does not constitute a waiver of that provision.</p>
                  <p><strong>Assignment:</strong> You may not assign your rights under these Terms without our written consent. We may assign our rights without restriction.</p>
                  <p><strong>Force Majeure:</strong> We are not liable for any failure or delay in performance due to circumstances beyond our reasonable control.</p>
                </div>
              </section>

              <hr className="border-gray-200" />

              {/* Section 19 */}
              <section>
                <h2 className="text-2xl font-semibold text-forest-900 mb-4">19. Contact Us</h2>
                <p className="text-gray-700 leading-relaxed mb-4">If you have questions about these Terms, please contact us:</p>
                <div className="bg-gray-50 p-6 rounded-lg text-gray-700 space-y-2">
                  <p><strong>Email:</strong> <a href="mailto:lineupdownbiz@gmail.com" className="text-forest-700 hover:underline">lineupdownbiz@gmail.com</a></p>
                  <p><strong>Website:</strong> <a href="https://loremcurae.com" target="_blank" rel="noopener noreferrer" className="text-forest-700 hover:underline">loremcurae.com</a></p>
                  <p><strong>Mailing Address:</strong> Curae.App, Chicago, Illinois, United States</p>
                </div>
              </section>

            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default TermsPage;
