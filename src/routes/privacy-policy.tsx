import { createFileRoute } from "@tanstack/react-router";

import { LegalPage, type LegalSection } from "@/components/legal-page";

const title = "Privacy Policy | Mayor Beauty Place";
const description =
  "How Mayor Beauty Place collects, uses and protects your personal information when you book a treatment, buy products or contact our salon.";

export const Route = createFileRoute("/privacy-policy")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: PrivacyPage,
});

const sections: LegalSection[] = [
  {
    heading: "Who we are",
    body: (
      <p>
        We are a beauty salon offering treatments in person and products through our online shop.
        This policy explains what personal information we hold, why we hold it and what rights you
        have. You can contact us any time using the details at the end of this page.
      </p>
    ),
  },
  {
    heading: "Information we collect",
    body: (
      <>
        <p>We only collect what we need to serve you:</p>
        <ul className="list-disc space-y-2 pl-5">
          <li>Your name, email address and phone number when you book or order.</li>
          <li>Your delivery address for shop orders.</li>
          <li>Appointment details such as the service, date, time and any notes you add.</li>
          <li>Messages you send us through the contact form.</li>
          <li>Basic technical information such as your browser type and pages visited.</li>
        </ul>
        <p>
          Card details are entered on our payment provider's secure page and are never stored on our
          website.
        </p>
      </>
    ),
  },
  {
    heading: "Health and treatment information",
    body: (
      <p>
        For some treatments we ask about allergies, skin conditions or medication so we can treat you
        safely. This is sensitive information, we collect it only with your consent, keep it
        confidential and share it with no one outside the salon.
      </p>
    ),
  },
  {
    heading: "How we use your information",
    body: (
      <ul className="list-disc space-y-2 pl-5">
        <li>To confirm, manage and remind you about appointments.</li>
        <li>To process payments, orders and deliveries.</li>
        <li>To answer your questions and handle returns or complaints.</li>
        <li>To keep records we are legally required to keep.</li>
        <li>To send offers or news, only if you have asked to receive them.</li>
      </ul>
    ),
  },
  {
    heading: "Who we share it with",
    body: (
      <>
        <p>
          We never sell your information. We share it only with the service providers who help us run
          the salon and website — our payment provider, delivery couriers, email and hosting
          providers — and only what they need to do their job.
        </p>
        <p>We may also share information where the law requires it.</p>
      </>
    ),
  },
  {
    heading: "How long we keep it",
    body: (
      <p>
        Booking and order records are kept for as long as needed to run our business and meet
        accounting and legal obligations, then deleted. Marketing contacts are removed as soon as you
        unsubscribe.
      </p>
    ),
  },
  {
    heading: "Keeping your information safe",
    body: (
      <p>
        Our website uses encrypted connections, access to customer records is limited to staff who
        need it, and payment processing is handled by a certified provider.
      </p>
    ),
  },
  {
    heading: "Your rights",
    body: (
      <>
        <p>You can ask us to:</p>
        <ul className="list-disc space-y-2 pl-5">
          <li>Give you a copy of the information we hold about you.</li>
          <li>Correct anything that is wrong or out of date.</li>
          <li>Delete your information where we no longer need it.</li>
          <li>Stop sending you marketing messages.</li>
        </ul>
        <p>
          Just contact us and we will respond within one month. If you are not happy with our
          response you can complain to the Information Commissioner's Office.
        </p>
      </>
    ),
  },
  {
    heading: "Children",
    body: (
      <p>
        Our website is intended for adults. Treatments for under-18s are only carried out with a
        parent or guardian present and with their consent.
      </p>
    ),
  },
  {
    heading: "Changes to this policy",
    body: (
      <p>
        If we change how we handle personal information we will update this page, and the date at the
        top will show when it last changed.
      </p>
    ),
  },
];

function PrivacyPage() {
  return (
    <LegalPage
      eyebrow="Your privacy"
      title="Privacy Policy"
      intro="We only ask for the details we need to look after you — and we keep them safe. Here is exactly what we collect, why, and how you stay in control."
      lastUpdated="September 2026"
      sections={sections}
    />
  );
}
