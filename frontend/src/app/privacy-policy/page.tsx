export default function PrivacyPolicy() {
  return (
    <div className="max-w-4xl mx-auto py-12 space-y-8">
      <div className="space-y-4">
        <h1 className="text-5xl font-black text-white">Privacy Policy</h1>
        <p className="text-gray-400 text-lg">Last updated: April 22, 2026</p>
      </div>

      <div className="bg-[#0f0f18] border border-white/5 rounded-[2.5rem] p-8 space-y-6 text-gray-300">
        <section className="space-y-3">
          <h2 className="text-2xl font-bold text-white">1. Information We Collect</h2>
          <p>We collect information you provide directly to us when you use MazeBids, such as when you create an account, participate in auctions, or contact us for support. This includes:</p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li>Discord account information (username, avatar, Discord ID)</li>
            <li>Auction bidding history and transaction records</li>
            <li>Email address and communication preferences</li>
            <li>Usage data and analytics</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-2xl font-bold text-white">2. How We Use Your Information</h2>
          <p>We use the information we collect to:</p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li>Provide and improve our services</li>
            <li>Process transactions and send related information</li>
            <li>Send promotional communications</li>
            <li>Analyze usage patterns and trends</li>
            <li>Comply with legal obligations</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-2xl font-bold text-white">3. Data Security</h2>
          <p>We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. However, no method of transmission over the internet is 100% secure.</p>
        </section>

        <section className="space-y-3">
          <h2 className="text-2xl font-bold text-white">4. Cookies and Tracking</h2>
          <p>We use cookies and similar tracking technologies to track activity on our platform and hold certain information. You can instruct your browser to refuse cookies or alert you when cookies are being sent.</p>
        </section>

        <section className="space-y-3">
          <h2 className="text-2xl font-bold text-white">5. Third-Party Services</h2>
          <p>MazeBids may integrate with third-party services such as Discord. We recommend reviewing the privacy policies of these services before connecting your accounts.</p>
        </section>

        <section className="space-y-3">
          <h2 className="text-2xl font-bold text-white">6. Your Rights</h2>
          <p>Depending on your location, you may have rights regarding your personal information, including the right to access, correct, or delete your data. Please contact us to exercise these rights.</p>
        </section>

        <section className="space-y-3">
          <h2 className="text-2xl font-bold text-white">7. Changes to This Policy</h2>
          <p>We may update this privacy policy from time to time. We will notify you of any changes by posting the new policy on this page and updating the "Last updated" date above.</p>
        </section>

        <section className="space-y-3">
          <h2 className="text-2xl font-bold text-white">8. Contact Us</h2>
          <p>If you have any questions about this privacy policy, please contact us at support@mazebids.com</p>
        </section>
      </div>
    </div>
  );
}
