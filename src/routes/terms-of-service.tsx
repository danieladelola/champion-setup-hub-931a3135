import { createFileRoute } from "@tanstack/react-router";

import { LegalPage, type LegalSection } from "@/components/legal-page";

const title = "Terms of Service | Mayor Beauty Place";
const description =
  "The terms that apply when you book a treatment, buy products or use the Mayor Beauty Place website — appointments, cancellations, payments, delivery and returns.";

export const Route = createFileRoute("/terms-of-service")({
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
  component: TermsPage,
});

const sections: LegalSection[] = [
  {
    heading: "About these terms",
    body: (
      <>
        <p>
          These terms apply to everyone who uses our website, books a treatment or buys a product
          from us. By booking an appointment or placing an order you accept them.
        </p>
        <p>
          We may update these terms from time to time — for example when we add new services or
          change our booking process. The version published here is always the current one.
        </p>
      </>
    ),
  },
  {
    heading: "Booking an appointment",
    body: (
      <>
        <p>
          Appointments can be booked online or by phone. An online booking is confirmed once you
          receive a confirmation with your booking reference; until then the time slot is not held.
        </p>
        <p>
          Please arrive a few minutes before your appointment. If you arrive late we will do our best
          to treat you, but the treatment may be shortened so the following client is not delayed.
        </p>
      </>
    ),
  },
  {
    heading: "Changes, cancellations and no-shows",
    body: (
      <>
        <p>
          If you need to change or cancel, let us know as early as possible so the slot can be
          offered to someone else. Repeated missed appointments may mean we ask for payment up front
          for future bookings.
        </p>
        <p>
          If we ever need to move your appointment, we will contact you and offer the earliest
          suitable alternative.
        </p>
      </>
    ),
  },
  {
    heading: "Treatments, health and suitability",
    body: (
      <>
        <p>
          Some treatments are not suitable for everyone. Please tell your therapist about
          allergies, skin conditions, medication, pregnancy or recent procedures before we begin, and
          complete any consultation form we give you honestly.
        </p>
        <p>
          Our treatments are cosmetic and are not medical advice or treatment. If you have a health
          concern, please speak with your doctor.
        </p>
      </>
    ),
  },
  {
    heading: "Prices and payment",
    body: (
      <>
        <p>
          Prices shown on the website include applicable taxes and may change. The price confirmed at
          the time of your booking or order is the price that applies.
        </p>
        <p>
          Card payments are handled by our payment provider on a secure page — we never see or store
          your full card details.
        </p>
      </>
    ),
  },
  {
    heading: "Shop orders and delivery",
    body: (
      <>
        <p>
          We accept your order once payment is confirmed. If an item turns out to be unavailable we
          will contact you and refund that item.
        </p>
        <p>
          Delivery charges and any free-delivery threshold are shown at checkout before you pay.
          Delivery timescales are estimates and can be affected by the courier.
        </p>
      </>
    ),
  },
  {
    heading: "Returns and refunds",
    body: (
      <>
        <p>
          Unopened products in their original packaging can be returned within 14 days of delivery.
          For hygiene reasons, opened cosmetics, skincare and hair products cannot be returned unless
          they are faulty.
        </p>
        <p>
          If something arrives damaged or faulty, contact us with your order number and a photo and
          we will arrange a replacement or refund. This does not affect your legal rights.
        </p>
      </>
    ),
  },
  {
    heading: "Gift vouchers and promotions",
    body: (
      <p>
        Vouchers and promotional codes can be used once, cannot be exchanged for cash, and may
        exclude certain services or products. Any expiry date is shown on the voucher.
      </p>
    ),
  },
  {
    heading: "Using our website",
    body: (
      <p>
        Text, images, branding and other content on this site belong to us or our licensors and may
        not be copied for commercial use. Please do not attempt to disrupt the site, submit false
        bookings or upload harmful content.
      </p>
    ),
  },
  {
    heading: "Our responsibility",
    body: (
      <p>
        We take great care with every treatment and order. We are responsible for loss you suffer
        because we have failed to use reasonable care and skill, but we are not responsible for
        losses we could not reasonably have foreseen or for problems caused by information you did
        not share with us.
      </p>
    ),
  },
  {
    heading: "Governing law",
    body: (
      <p>
        These terms are governed by the laws of England and Wales, and disputes may be brought
        before the courts of England and Wales.
      </p>
    ),
  },
];

function TermsPage() {
  return (
    <LegalPage
      eyebrow="Legal"
      title="Terms of Service"
      intro="Clear, simple terms covering appointments, treatments, payments and online orders — so you always know what to expect from us and what we ask of you."
      lastUpdated="September 2026"
      sections={sections}
    />
  );
}
