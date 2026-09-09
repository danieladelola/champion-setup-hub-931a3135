import { ArrowRight, ChevronLeft, ChevronRight, Star } from "lucide-react";
import { useRef } from "react";

const PLACE_URL =
  "https://www.google.com/maps/place/Mayor+Beauty+Place/@51.4692109,-0.0677467,17z/data=!3m1!4b1!4m6!3m5!1s0x48760383a2abc637:0x4346eea133a3459b!8m2!3d51.4692109!4d-0.0677467!16s%2Fg%2F11fd4wp_8v!18m1!1e1";

const WRITE_REVIEW_URL =
  "https://search.google.com/local/writereview?placeid=ChIJN8arooMDdkgRm0WjM6HuRkM";

const REVIEWS = [
  {
    name: "Abigail Obikoya",
    detail: "a year ago",
    initial: "A",
    color: "bg-brand-blue",
    text: "My nails look so beautiful, I asked for french tips and they provided. The lady in the front was so nice. They offered me drinks as well with the service. I would definitely go there again.",
  },
  {
    name: "Lola Ekundayo",
    detail: "a year ago",
    initial: "L",
    color: "bg-brand-red",
    text: "The owner mayor was absolutely accommodating and so lovely and overall just a lovely person, her story was quite inspiring and a special thanks to our nail tech (mr soft) amazing service and made us laugh the whole appointment — will definitely be coming back and recommending!",
  },
  {
    name: "Aishat Olanrewaju",
    detail: "11 months ago · Acrylic nails",
    initial: "A",
    color: "bg-brand-blue",
    text: "I had such an amazing experience! My nails look absolutely perfect, the attention to detail and creativity are top-notch. The service was professional, friendly, and relaxing from start to finish. The nail tech really listened to what I wanted and delivered beyond my expectations. Highly recommend!",
  },
  {
    name: "Onezou-Larissa Gnapi",
    detail: "5 months ago",
    initial: "O",
    color: "bg-brand-red",
    text: "What an awesome time, I was pampered until the last minute. Thanks to our beautiful Mayor. Thank you so very much my skin is so beautiful and already glowing. Friendly staffs and also a beautiful atmosphere and good attitude towards customers.",
  },
  {
    name: "Nicole Smart",
    detail: "A month ago · Nails",
    initial: "N",
    color: "bg-brand-blue",
    text: "Outstanding service the Nail technician at table 2 has been doing my nails for sometime and to say that she is exceptionally good is an understatement — my nails last for weeks.",
  },
  {
    name: "Sophia",
    detail: "A year ago · Manicure",
    initial: "S",
    color: "bg-brand-red",
    text: "Absolutely loved it, got a complementary drink on entry and the decor was beautiful, staff were polite. Talked to my nail tech the whole time. I really recommend Renny, she's the best — I showed her an inspo pic and she ate.",
  },
];

function Stars() {
  return (
    <div className="flex gap-0.5" aria-label="5 out of 5 stars">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
      ))}
    </div>
  );
}

export function Testimonials() {
  const trackRef = useRef<HTMLDivElement>(null);

  const scroll = (dir: 1 | -1) => {
    trackRef.current?.scrollBy({ left: dir * 360, behavior: "smooth" });
  };

  return (
    <section className="bg-background px-6 py-14 text-foreground md:px-12 md:py-16">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex flex-col gap-6 md:mb-10 md:flex-row md:items-end md:justify-between">
          <div>
            <span className="mb-2 block font-sans font-medium text-[11px] uppercase tracking-[0.3em] text-brand-red">
              Testimonials
            </span>
            <h2 className="font-display text-4xl leading-tight md:text-5xl">
              What Our Clients <em className="italic text-brand-blue">Say</em>
            </h2>
            <div className="mt-3 flex items-center gap-2">
              <Stars />
              <span className="ml-2 text-sm text-muted-foreground">
                Verified reviews from Google
              </span>
            </div>
          </div>

          <div className="flex flex-wrap gap-3 md:justify-end">
            <a
              href={PLACE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="group inline-flex items-center gap-2 rounded-full bg-brand-red px-5 py-3 text-sm font-semibold text-on-brand shadow-lift transition-colors hover:bg-brand-blue"
            >
              Read all Google reviews
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </a>
            <a
              href={WRITE_REVIEW_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full border border-foreground/20 px-5 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-foreground hover:text-background"
            >
              Write a review
            </a>
          </div>
        </div>

        <div className="relative">
          <button
            type="button"
            onClick={() => scroll(-1)}
            aria-label="Previous reviews"
            className="absolute -left-3 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-foreground/15 bg-background text-foreground shadow-md transition-colors hover:bg-foreground hover:text-background md:-left-5"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>

          <div
            ref={trackRef}
            className="flex snap-x snap-mandatory gap-4 overflow-x-auto px-1 py-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {REVIEWS.map((r) => (
              <article
                key={r.name}
                className="flex w-[300px] shrink-0 snap-start flex-col rounded-3xl border border-border bg-card p-6 text-card-foreground shadow-sm"
              >
                <div className="mb-4 flex items-center gap-3">
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold text-on-brand ${r.color}`}
                  >
                    {r.initial}
                  </div>
                  <div>
                    <div className="text-sm font-semibold">{r.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {r.detail}
                    </div>
                  </div>
                </div>
                <Stars />
                <p className="mt-4 flex-1 text-sm leading-relaxed text-muted-foreground">
                  {r.text}
                </p>
              </article>
            ))}
          </div>

          <button
            type="button"
            onClick={() => scroll(1)}
            aria-label="Next reviews"
            className="absolute -right-3 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-foreground/15 bg-background text-foreground shadow-md transition-colors hover:bg-foreground hover:text-background md:-right-5"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>
    </section>
  );
}
