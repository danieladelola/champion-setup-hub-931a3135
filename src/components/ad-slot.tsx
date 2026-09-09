import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { X } from "lucide-react";

export type PublicAd = {
  id: string;
  title: string;
  image_url: string;
  link_url: string | null;
  placement: string;
  sort_order: number;
  display_type: "embed" | "popup";
  starts_at: string | null;
  ends_at: string | null;
  popup_delay_seconds: number;
};

async function fetchAds(placement: string): Promise<PublicAd[]> {
  const res = await fetch(`/api/ads?placement=${encodeURIComponent(placement)}`);
  if (!res.ok) return [];
  const data = (await res.json().catch(() => ({}))) as { ads?: PublicAd[] };
  return data.ads ?? [];
}

function isExternal(url: string) {
  return /^https?:\/\//i.test(url);
}

function AdImage({ ad }: { ad: PublicAd }) {
  const [failed, setFailed] = useState(false);
  if (failed) return null;
  return (
    <img
      src={ad.image_url}
      alt={ad.title || "Advertisement"}
      decoding="async"
      onError={() => setFailed(true)}
      className="block h-auto w-full max-w-full rounded-2xl object-contain"
    />
  );
}

function AdLink({ ad, className = "" }: { ad: PublicAd; className?: string }) {
  const image = <AdImage ad={ad} />;
  if (!ad.link_url) {
    return <div className={`w-full overflow-hidden ${className}`}>{image}</div>;
  }
  const external = isExternal(ad.link_url);
  return (
    <a
      href={ad.link_url}
      {...(external ? { target: "_blank", rel: "noopener noreferrer nofollow" } : {})}
      className={`block w-full overflow-hidden transition-opacity hover:opacity-90 ${className}`}
    >
      {image}
    </a>
  );
}

function AdPopup({ ad }: { ad: PublicAd }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const key = `ad-popup-dismissed:${ad.id}`;
    try {
      if (sessionStorage.getItem(key)) return;
    } catch {
      // sessionStorage unavailable — still show the popup
    }
    const delay = Math.max(0, (ad.popup_delay_seconds ?? 3) * 1000);
    const timer = setTimeout(() => setOpen(true), delay);
    return () => clearTimeout(timer);
  }, [ad.id, ad.popup_delay_seconds]);

  function dismiss() {
    setOpen(false);
    try {
      sessionStorage.setItem(`ad-popup-dismissed:${ad.id}`, "1");
    } catch {
      // ignore
    }
  }

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={ad.title || "Advertisement"}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4"
      onClick={dismiss}
    >
      <div className="relative w-full max-w-xl" onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          onClick={dismiss}
          aria-label="Close advert"
          className="absolute -top-3 -right-3 z-10 rounded-full bg-background p-2 shadow-lg"
        >
          <X className="h-4 w-4" />
        </button>
        <AdLink ad={ad} className="rounded-2xl bg-background shadow-2xl" />
      </div>
    </div>
  );
}

export function AdSlot({ placement, className = "" }: { placement: string; className?: string }) {
  const { data } = useQuery({
    queryKey: ["ads", placement],
    queryFn: () => fetchAds(placement),
    staleTime: 60_000,
  });

  const ads = data ?? [];
  const embeds = ads.filter((a) => a.display_type !== "popup");
  const popups = ads.filter((a) => a.display_type === "popup");
  if (ads.length === 0) return null;

  return (
    <>
      {embeds.length > 0 ? (
        <div className={`w-full px-6 py-8 md:px-12 ${className}`}>
          <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
            {embeds.map((ad) => (
              <AdLink key={ad.id} ad={ad} />
            ))}
          </div>
        </div>
      ) : null}
      {popups.map((ad) => (
        <AdPopup key={ad.id} ad={ad} />
      ))}
    </>
  );
}
