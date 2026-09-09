import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Check, Loader2, MapPin, Send } from "lucide-react";
import { toast } from "sonner";

import { contactApi } from "@/lib/admin-api";

import contactHeroAsset from "../assets/contact-hero.png";
import { AdSlot } from "@/components/ad-slot";
import { useSettings } from "@/lib/site-settings";
import { addressLines, telHref } from "@/lib/settings";

const title = "Contact Us — Mayor Beauty Place";
const description =
  "Get in touch with Mayor Beauty Place at 110/112 Rye Lane, London. Call (+44) 7454804251 or email mayowaani58@gmail.com — we reply within 24 hours.";
const keywords =
  "contact beauty salon London, Rye Lane salon phone, beauty salon opening hours, Mayor Beauty Place contact";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { name: "keywords", content: keywords },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:url", content: "/contact" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "/contact" }],
  }),
  component: Contact,
});

const inputClass =
  "w-full rounded-xl border border-border bg-card px-4 py-3.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20 focus:outline-none transition";

function Contact() {
  const settings = useSettings();
  const { contact } = settings;
  const address = addressLines(contact.address);
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", phone: "", message: "" });

  const send = useMutation({
    mutationFn: () =>
      contactApi.send({
        full_name: form.name.trim(),
        email: form.email.trim(),
        ...(form.phone.trim() ? { phone: form.phone.trim() } : {}),
        message: form.message.trim(),
      }),
    onSuccess: () => setSubmitted(true),
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <main>
      {/* Hero */}
      <section className="relative flex h-[45vh] min-h-[360px] w-full items-start justify-center overflow-hidden bg-ink pt-32 md:pt-40">
        <img
          src={contactHeroAsset}
          alt="Elegant beauty portrait with red lipstick and luxury makeup products in a deep red salon setting"
          width={1920}
          height={1080}
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-ink/90 via-ink/70 to-ink/40" />

        <div className="relative z-10 w-full px-6 text-center md:px-12">
          <div className="mx-auto max-w-2xl">
            <span className="mb-6 inline-flex items-center gap-3 rounded-full border border-on-dark/25 bg-on-dark/10 px-5 py-2 text-xs font-medium tracking-widest text-on-dark/90 uppercase backdrop-blur-md">
              <span className="h-1.5 w-1.5 rounded-full bg-brand-red" />
              Contact Us
            </span>
            <h1 className="animate-reveal font-display text-4xl leading-[1.02] text-on-dark sm:whitespace-nowrap sm:text-5xl md:text-6xl lg:text-7xl drop-shadow-lg">
              We'd Love to{" "}
              <em className="italic text-brand-red drop-shadow-lg">Hear From You</em>
            </h1>
          </div>
        </div>
      </section>

      {/* Form */}
      <section className="bg-secondary px-6 pt-24 pb-10 md:px-12 md:pt-32 md:pb-14">
        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-16 lg:grid-cols-2">
          <div>
            <span className="mb-4 block font-sans font-medium text-[11px] uppercase tracking-[0.3em] text-brand-red">
              Send a Message
            </span>
            <h2 className="font-display text-4xl leading-tight sm:whitespace-nowrap sm:text-5xl md:text-6xl">
              Tell Us What <em className="italic text-brand-blue">You Need</em>
            </h2>
            {contact.response_time_note ? (
              <p className="mt-8 max-w-md leading-relaxed text-muted-foreground">
                {contact.response_time_note}
              </p>
            ) : null}
            <div className="mt-12 space-y-3 rounded-3xl bg-card p-8 shadow-soft">
              {[contact.phone, contact.phone_alt].filter(Boolean).map((phone) => (
                <p key={phone} className="text-sm font-medium">
                  <a href={telHref(phone)} className="hover:text-brand-blue">
                    {phone}
                  </a>
                </p>
              ))}
              {contact.email ? (
                <p className="text-sm font-medium break-all">
                  <a href={`mailto:${contact.email}`} className="hover:text-brand-blue">
                    {contact.email}
                  </a>
                </p>
              ) : null}
              {address.length > 0 ? (
                <p className="text-sm font-medium">{address.join(" ")}</p>
              ) : null}
              {contact.opening_hours ? (
                <p className="text-sm text-muted-foreground">{contact.opening_hours}</p>
              ) : null}
            </div>
          </div>

          <div>
            {submitted ? (
              <div className="flex h-full flex-col items-start justify-center rounded-3xl bg-card p-12 shadow-soft">
                <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-blue/10 text-brand-blue">
                  <Check className="h-6 w-6" />
                </div>
                <h3 className="mb-4 font-display text-4xl">
                  Thank <em className="italic text-brand-red">You</em>
                </h3>
                <p className="leading-relaxed text-muted-foreground">
                  We've received your message and will reply within 24 hours.
                </p>
              </div>
            ) : (
              <form
                className="rounded-3xl bg-card p-8 shadow-soft md:p-10"
                onSubmit={(e) => {
                  e.preventDefault();
                  send.mutate();
                }}
              >
                <div className="space-y-5">
                  <input
                    required
                    name="name"
                    maxLength={120}
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="Full name"
                    className={inputClass}
                  />
                  <input
                    required
                    type="email"
                    name="email"
                    maxLength={255}
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="Email address"
                    className={inputClass}
                  />
                  <input
                    name="phone"
                    maxLength={40}
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    placeholder="Phone number (optional)"
                    className={inputClass}
                  />
                  <textarea
                    required
                    name="message"
                    rows={5}
                    maxLength={4000}
                    value={form.message}
                    onChange={(e) => setForm({ ...form, message: e.target.value })}
                    placeholder="Your message"
                    className={`${inputClass} resize-none`}
                  />
                  <button
                    type="submit"
                    disabled={send.isPending}
                    className="group flex w-full items-center justify-center gap-2 rounded-full bg-brand-red px-10 py-4 text-sm font-semibold text-on-brand shadow-soft transition-colors hover:bg-brand-blue disabled:opacity-60"
                  >
                    {send.isPending ? "Sending..." : "Send Message"}
                    {send.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </section>

      {/* Map */}
      {contact.show_map && contact.map_embed_url ? (
        <section className="bg-background">
          <div className="relative h-[420px] w-full md:h-[520px]">
            <iframe
              title={`${settings.general.site_name} location map`}
              src={contact.map_embed_url}
              width="100%"
              height="100%"
              loading="lazy"
              className="block h-full w-full border-0"
            />
            {address.length > 0 ? (
              <div className="absolute bottom-6 left-6 max-w-xs rounded-2xl bg-ink/85 p-5 text-on-dark shadow-lift backdrop-blur-md md:bottom-10 md:left-10 md:p-6">
                <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-full bg-brand-blue/20 text-brand-blue">
                  <MapPin className="h-5 w-5" strokeWidth={1.5} />
                </div>
                <h3 className="font-display text-lg">{settings.general.site_name}</h3>
                <p className="mt-2 text-sm leading-relaxed text-on-dark/80">
                  {address.map((line, i) => (
                    <span key={line + i}>
                      {line}
                      {i < address.length - 1 ? <br /> : null}
                    </span>
                  ))}
                </p>
              </div>
            ) : null}
          </div>
        </section>
      ) : null}
      <AdSlot placement="contact" />
    </main>
  );
}
