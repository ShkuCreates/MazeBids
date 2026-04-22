export default function ContentPolicy() {
  return (
    <div className="max-w-4xl mx-auto py-12 space-y-8">
      <div className="space-y-4">
        <h1 className="text-5xl font-black text-white">Content Policy</h1>
        <p className="text-gray-400 text-lg">Last updated: April 22, 2026</p>
      </div>

      <div className="bg-[#0f0f18] border border-white/5 rounded-[2.5rem] p-8 space-y-6 text-gray-300">
        <section className="space-y-3">
          <h2 className="text-2xl font-bold text-white">1. Content Standards</h2>
          <p>MazeBids is committed to maintaining a safe and respectful community. All users must comply with the following content standards:</p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li>No illegal or harmful content</li>
            <li>No harassment, hate speech, or discrimination</li>
            <li>No spam or misleading information</li>
            <li>No adult or explicit content</li>
            <li>No violation of intellectual property rights</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-2xl font-bold text-white">2. Prohibited Behaviors</h2>
          <p>The following behaviors are strictly prohibited on MazeBids:</p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li>Cheating or using unauthorized third-party tools</li>
            <li>Bid rigging or collusion with other users</li>
            <li>Account manipulation or fraud</li>
            <li>Harassment or threatening other users</li>
            <li>Attempting to gain unauthorized access to the platform</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-2xl font-bold text-white">3. Moderation and Enforcement</h2>
          <p>MazeBids reserves the right to:</p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li>Review and remove inappropriate content</li>
            <li>Suspend or permanently ban users who violate this policy</li>
            <li>Report illegal activity to authorities</li>
            <li>Forfeit coins or rewards from violating users</li>
            <li>Investigate suspicious activity</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-2xl font-bold text-white">4. User Responsibility</h2>
          <p>Users are responsible for their own conduct and the content they post or share on MazeBids. You agree to indemnify and hold harmless MazeBids from any claims arising from your violation of this policy.</p>
        </section>

        <section className="space-y-3">
          <h2 className="text-2xl font-bold text-white">5. Appeal Process</h2>
          <p>If you believe your account was suspended unfairly, you may submit an appeal to support@mazebids.com with detailed information about your case. We will review appeals within 7 business days.</p>
        </section>

        <section className="space-y-3">
          <h2 className="text-2xl font-bold text-white">6. Fair Play Guarantee</h2>
          <p>MazeBids is committed to fair and transparent auctions. All bids are validated server-side, and we employ anti-cheat mechanisms to ensure competitive integrity.</p>
        </section>

        <section className="space-y-3">
          <h2 className="text-2xl font-bold text-white">7. Reporting Violations</h2>
          <p>If you witness a violation of this policy, please report it to support@mazebids.com with screenshots or evidence. We take all reports seriously and will investigate promptly.</p>
        </section>

        <section className="space-y-3">
          <h2 className="text-2xl font-bold text-white">8. Policy Updates</h2>
          <p>MazeBids may update this content policy at any time. Continued use of the platform after updates constitutes acceptance of the new policy.</p>
        </section>
      </div>
    </div>
  );
}
