export default function DriverAgreement() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12 text-gray-200">
      <h1 className="text-3xl font-bold mb-2">Driver Agreement</h1>
      <p className="text-sm text-gray-400 mb-8">Last updated: July 29, 2026</p>

      <p className="mb-6">
        This Driver Agreement ("Agreement") supplements our general Terms of Service and
        applies specifically to individuals who register as Drivers on the Encompass
        Rideshare platform ("Encompass," "we," "us," or "our"). By completing Driver
        registration and document submission, you agree to the terms below.
      </p>

      <h2 className="text-xl font-semibold mt-8 mb-3">1. Independent Contractor Status</h2>
      <p className="mb-4">
        You acknowledge and agree that you are an independent contractor, not an employee,
        partner, joint venturer, or agent of Encompass. Nothing in this Agreement creates an
        employment relationship. You are solely responsible for determining when, where, and
        whether to accept ride requests, subject only to the platform's matching and route
        logic.
      </p>

      <h2 className="text-xl font-semibold mt-8 mb-3">2. Vehicle &amp; Licensing Requirements</h2>
      <p className="mb-4">
        You represent and warrant that you hold a valid driver's license appropriate to the
        vehicle class you operate, that your vehicle is registered, and that your vehicle
        meets any applicable state safety inspection requirements. You are solely responsible
        for the maintenance, roadworthiness, and legal operation of your vehicle at all times
        while using the Platform.
      </p>

      <h2 className="text-xl font-semibold mt-8 mb-3">3. Insurance</h2>
      <p className="mb-4">
        You are required to maintain, at minimum, the automobile insurance coverage required
        by the state in which you operate, including any coverage required specifically for
        transportation network company (rideshare) drivers under applicable state law. You
        agree to provide proof of insurance upon request and to notify Encompass promptly if
        your coverage lapses or is cancelled. Encompass does not provide primary insurance
        coverage for your vehicle.
      </p>

      <h2 className="text-xl font-semibold mt-8 mb-3">4. Background Check &amp; Documentation</h2>
      <p className="mb-4">
        Your account will remain in "pending approval" status until Encompass has reviewed
        your submitted documents and background check status. Encompass reserves sole
        discretion to approve, reject, suspend, or deactivate any Driver account based on
        documentation, background check results, safety concerns, or violations of this
        Agreement or our Terms of Service.
      </p>

      <h2 className="text-xl font-semibold mt-8 mb-3">5. Payouts</h2>
      <p className="mb-4">
        Driver earnings are calculated based on completed rides, minus any applicable
        Encompass service fee disclosed to you prior to activation. Payouts are processed
        through Stripe Connect to the bank account or debit card you connect during
        onboarding. You are responsible for completing Stripe's onboarding requirements
        (identity verification, bank details) in order to receive payouts. Encompass is not
        responsible for delays caused by incomplete Stripe onboarding, incorrect banking
        details, or issues on Stripe's platform.
      </p>

      <h2 className="text-xl font-semibold mt-8 mb-3">6. Taxes</h2>
      <p className="mb-4">
        As an independent contractor, you are solely responsible for reporting and paying all
        applicable federal, state, and local taxes on income earned through the Platform,
        including self-employment tax. Encompass will issue applicable tax forms (e.g., Form
        1099) as required by law based on your earnings and Stripe's reporting.
      </p>

      <h2 className="text-xl font-semibold mt-8 mb-3">7. Job Board Postings</h2>
      <p className="mb-4">
        If you post or claim a job through the Job Board, you are entering into a direct
        arrangement with the other Driver or party involved. Encompass is not a party to, and
        assumes no responsibility for, the performance, safety, or payment terms of any Job
        Board arrangement.
      </p>

      <h2 className="text-xl font-semibold mt-8 mb-3">8. Conduct Standards</h2>
      <p className="mb-4">
        You agree to treat all Riders with courtesy and respect, to operate your vehicle
        safely and lawfully at all times, and to refrain from any conduct that endangers a
        Rider or another road user. Violation of these standards may result in immediate
        suspension or termination of your Driver account.
      </p>

      <h2 className="text-xl font-semibold mt-8 mb-3">9. Termination</h2>
      <p className="mb-4">
        Either party may terminate this Agreement at any time. Encompass may immediately
        suspend or deactivate your account for safety violations, fraud, expired documentation,
        or breach of this Agreement or our Terms of Service.
      </p>

      <h2 className="text-xl font-semibold mt-8 mb-3">10. Contact</h2>
      <p className="mb-4">
        Questions about this Agreement can be directed to{" "}
        <a href="mailto:support@encompassrs.com" className="text-blue-400 underline">
          support@encompassrs.com
        </a>.
      </p>
    </div>
  );
}
