import { createFileRoute } from "@tanstack/react-router";

import { LegalPage, type LegalSection } from "@/components/legal-page";

const title = "Cookie Policy | Mayor Beauty Place";
const description =
  "What cookies and similar storage the Mayor Beauty Place website uses, what each one does, and how you can control them in your browser.";

export const Route = createFileRoute("/cookie-policy")({
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
  component: CookiePage,
});

const sections: LegalSection[] = [
  {
    heading: "What cookies are",
    body: (
      <p>
        Cookies are small files a website saves in your browser. Similar technologies, such as local
        storage, work the same way. They let a site remember things between pages and visits — like
        what is in your basket.
      </p>
    ),
  },
  {
    heading: "Cookies we use",
    body: (
      <>
        <p>We keep this to a minimum:</p>
        <ul className="list-disc space-y-2 pl-5">
          <li>
            <strong className="text-foreground">Essential</strong> — remember your shopping basket
            and wishlist, keep your checkout secure, and keep staff signed in to the salon admin
            area. The site cannot work properly without these.
          </li>
          <li>
            <strong className="text-foreground">Payment</strong> — set by our payment provider on the
            secure payment page to complete your transaction and prevent fraud.
          </li>
          <li>
            <strong className="text-foreground">Preferences</strong> — remember small choices, such
            as a notice you have dismissed.
          </li>
        </ul>
      </>
    ),
  },
  {
    heading: "Analytics and advertising",
    body: (
      <p>
        We do not use advertising cookies to track you across other websites. If we ever add
        analytics to understand which pages are most useful, we will list it here first and ask for
        your consent where required.
      </p>
    ),
  },
  {
    heading: "Third-party content",
    body: (
      <p>
        Some pages include content from other services, such as an embedded map or video. Those
        providers may set their own cookies when the content loads, under their own policies.
      </p>
    ),
  },
  {
    heading: "How long cookies last",
    body: (
      <p>
        Session cookies disappear when you close your browser. Others, such as your basket, last a
        short period so you can come back and finish your order.
      </p>
    ),
  },
  {
    heading: "Managing cookies",
    body: (
      <>
        <p>
          Every browser lets you view, block and delete cookies in its privacy or settings menu, and
          you can browse in a private window to clear everything when you close it.
        </p>
        <p>
          Blocking essential cookies will stop the basket, checkout and login from working, so parts
          of the site may not behave as expected.
        </p>
      </>
    ),
  },
  {
    heading: "Changes to this policy",
    body: (
      <p>
        If the cookies we use change, we will update this page so you can always see what is in use.
      </p>
    ),
  },
];

function CookiePage() {
  return (
    <LegalPage
      eyebrow="Cookies"
      title="Cookie Policy"
      intro="A short, honest explanation of the small files our website stores in your browser — what each one is for and how to control them."
      lastUpdated="September 2026"
      sections={sections}
    />
  );
}
