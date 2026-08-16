
import { useEffect } from 'react';
import Navbar from '../../components/feature/Navbar';
import Footer from '../../components/feature/Footer';

const DeleteAccountPage = () => {
  useEffect(() => {
    document.title = 'Delete Your Account | Curae';

    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', 'How to request deletion of your Curae account and personal data, what is deleted, and what is retained.');
    }

    const metaKeywords = document.querySelector('meta[name="keywords"]');
    if (metaKeywords) {
      metaKeywords.setAttribute('content', 'delete account, account deletion, data deletion, Curae, remove my data');
    }
  }, []);

  return (
    <div className="min-h-screen bg-cream-50">
      <Navbar />

      <main className="pt-24 pb-16">
        <div className="max-w-4xl mx-auto px-6 lg:px-12">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 lg:p-12">
            <header className="mb-12 text-center">
              <h1 className="text-3xl lg:text-4xl font-light text-forest-900 mb-4">Delete Your Account</h1>
              <p className="text-gray-600 text-lg">Last Updated: August 16, 2026</p>
            </header>

            <div className="prose prose-lg max-w-none space-y-10">

              {/* Introduction */}
              <section>
                <p className="text-gray-700 leading-relaxed">
                  This page explains how to request deletion of your Curae account and personal data, what is removed when you do, and what is kept. Curae is operated by Lineup Labs LLC. You can request deletion whether or not you still have the app installed.
                </p>
              </section>

              <hr className="border-gray-200" />

              {/* Section 1 — How to request */}
              <section>
                <h2 className="text-2xl font-semibold text-forest-900 mb-4">1. How to Request Deletion</h2>
                <p className="text-gray-700 leading-relaxed mb-4">There are two ways to delete your account:</p>
                <div className="space-y-4 text-gray-700 leading-relaxed">
                  <div>
                    <p className="font-semibold text-forest-900">In the app</p>
                    <p>Open Curae, go to Settings, and tap Delete account. This deletes your account and data immediately and cannot be undone.</p>
                  </div>
                  <div>
                    <p className="font-semibold text-forest-900">Without the app, or if you cannot sign in</p>
                    <p>
                      Email <a href="mailto:ethanjones@loremcurae.com" className="text-forest-700 hover:underline">ethanjones@loremcurae.com</a> from the email address on your account, with the subject "Delete my account". We will verify that the request comes from the account owner and complete the deletion within 30 days.
                    </p>
                  </div>
                </div>
              </section>

              <hr className="border-gray-200" />

              {/* Section 2 — What is deleted */}
              <section>
                <h2 className="text-2xl font-semibold text-forest-900 mb-4">2. What Is Deleted</h2>
                <p className="text-gray-700 leading-relaxed mb-4">Deleting your account permanently removes the data tied to it, including:</p>
                <ul className="list-disc pl-6 space-y-2 text-gray-700 leading-relaxed">
                  <li>Your profile: name, email, date of birth, and your skin profile (skin type, concerns, sensitivity, allergens, and preferences).</li>
                  <li>Your routines, saved products (your shelf), and any reactions you flagged, including any notes you wrote.</li>
                  <li>Your points, badges, product reviews, scan history, and in-app activity.</li>
                  <li>Your profile photo.</li>
                  <li>Your login itself: your email and password, and any linked Google sign-in.</li>
                </ul>
                <p className="text-gray-700 leading-relaxed mt-4">In short, everything connected to your account is removed.</p>
              </section>

              <hr className="border-gray-200" />

              {/* Section 3 — What is retained */}
              <section>
                <h2 className="text-2xl font-semibold text-forest-900 mb-4">3. What Is Retained</h2>
                <p className="text-gray-700 leading-relaxed mb-4">A limited amount of data is kept, and none of it identifies you after deletion:</p>
                <ul className="list-disc pl-6 space-y-2 text-gray-700 leading-relaxed">
                  <li><strong>Anonymized records.</strong> A small set of records, such as anonymous product and ingredient data-quality measurements used to improve scan accuracy, are retained with your identity removed. These are separate from your personal scan history, which is deleted, and they can no longer be linked back to you.</li>
                  <li><strong>Aggregated analytics.</strong> Aggregated, anonymized usage statistics may be retained to understand how the product is used. If you want us to also purge your individual analytics records, say so in your email and we will do it.</li>
                  <li><strong>Age-verification records.</strong> If an attempt to use Curae was blocked for being under 18, we keep a minimal, one-way hashed record, described in our <a href="https://loremcurae.com/privacy" className="text-forest-700 hover:underline">Privacy Policy</a>. It is not tied to an account and self-expires once the person would turn 18.</li>
                </ul>
              </section>

              <hr className="border-gray-200" />

              {/* Section 4 — Timing + contact */}
              <section>
                <h2 className="text-2xl font-semibold text-forest-900 mb-4">4. Timing and Contact</h2>
                <p className="text-gray-700 leading-relaxed mb-4">In-app deletion takes effect immediately. Email requests are completed within 30 days of us verifying the request.</p>
                <div className="bg-gray-50 p-6 rounded-lg text-gray-700 space-y-2">
                  <p><strong>Email:</strong> <a href="mailto:ethanjones@loremcurae.com" className="text-forest-700 hover:underline">ethanjones@loremcurae.com</a></p>
                  <p><strong>Website:</strong> <a href="https://loremcurae.com" target="_blank" rel="noopener noreferrer" className="text-forest-700 hover:underline">loremcurae.com</a></p>
                  <p><strong>Operator:</strong> Lineup Labs LLC, Chicago, Illinois, United States</p>
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

export default DeleteAccountPage;
