import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Check,
  Clock,
  CreditCard,
  Calendar,
  User,
  Sparkles,
  Loader2,
  Plus,
  Minus,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar as DateCalendar } from "@/components/ui/calendar";
import bookingHeroAsset from "@/assets/booking-hero-lashes.webp";
import { bookingPublicApi } from "@/lib/admin-api";
import { AdSlot } from "@/components/ad-slot";
import { buildTimeSlots } from "@/lib/availability";
import { UNAVAILABLE_MESSAGE } from "@/lib/blocked-dates";
import { closedWeekdays } from "@/lib/settings";
import { useSettings } from "@/lib/site-settings";

const title = "Book A Service — Mayor Beauty Place";
const description =
  "Book beauty treatments and consultations at Mayor Beauty Place in Peckham, London. Professional ethics, quality products, expert care.";

export const Route = createFileRoute("/book")({
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
  component: Book,
});

type CartLine = { service_id: string; quantity: number };

type BookingData = {
  categoryId: string;
  serviceId: string;
  items: CartLine[];
  date: string;
  time: string;
  name: string;
  email: string;
  phone: string;
  notes: string;
};

const initialData: BookingData = {
  categoryId: "",
  serviceId: "",
  items: [],
  date: "",
  time: "",
  name: "",
  email: "",
  phone: "",
  notes: "",
};

const steps = [
  { id: 1, label: "Service", icon: Sparkles },
  { id: 2, label: "Time", icon: Clock },
  { id: 3, label: "Details", icon: User },
  { id: 4, label: "Payment", icon: CreditCard },
  { id: 5, label: "Done", icon: Check },
];



const inputClass =
  "w-full rounded-xl border border-border bg-card px-4 py-3.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20 focus:outline-none transition";

function formatPrice(value: string | number) {
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) return "On request";
  return `£${n % 1 === 0 ? n.toFixed(0) : n.toFixed(2)}`;
}

function toLocalIso(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}



function Book() {
  const settings = useSettings();
  const booking = settings.booking;
  const [step, setStep] = useState(1);
  const [data, setData] = useState<BookingData>(initialData);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { data: catalog, isLoading } = useQuery({
    queryKey: ["booking", "catalog"],
    queryFn: bookingPublicApi.catalog,
  });

  const categories = catalog?.categories ?? [];
  const allServices = catalog?.services ?? [];

  const services = useMemo(
    () => allServices.filter((s) => s.category_id === data.categoryId),
    [allServices, data.categoryId],
  );

  const slots = useMemo(
    () =>
      buildTimeSlots({
        open: booking.open_time,
        close: booking.close_time,
        interval: booking.slot_interval_minutes,
      }),
    [booking.open_time, booking.close_time, booking.slot_interval_minutes],
  );

  const selectedCategory = categories.find((c) => c.id === data.categoryId);
  const selectedService = allServices.find((s) => s.id === data.serviceId);

  // The booking basket: every service the customer wants in this one visit.
  const cart = useMemo(
    () =>
      data.items
        .map((line) => {
          const service = allServices.find((s) => s.id === line.service_id);
          return service ? { ...line, service } : null;
        })
        .filter((l): l is CartLine & { service: (typeof allServices)[number] } => !!l),
    [data.items, allServices],
  );

  const cartTotal = useMemo(
    () => cart.reduce((sum, l) => sum + Number(l.service.price ?? 0) * l.quantity, 0),
    [cart],
  );

  const cartDuration = useMemo(
    () => cart.reduce((sum, l) => sum + Number(l.service.duration_minutes ?? 0) * l.quantity, 0),
    [cart],
  );

  const addToCart = (serviceId: string) => {
    if (!serviceId) return;
    setData((prev) => {
      const existing = prev.items.find((i) => i.service_id === serviceId);
      return {
        ...prev,
        serviceId: "",
        items: existing
          ? prev.items.map((i) =>
              i.service_id === serviceId
                ? { ...i, quantity: Math.min(10, i.quantity + 1) }
                : i,
            )
          : [...prev.items, { service_id: serviceId, quantity: 1 }],
      };
    });
  };

  const setQuantity = (serviceId: string, quantity: number) => {
    setData((prev) => ({
      ...prev,
      items:
        quantity <= 0
          ? prev.items.filter((i) => i.service_id !== serviceId)
          : prev.items.map((i) =>
              i.service_id === serviceId ? { ...i, quantity: Math.min(10, quantity) } : i,
            ),
    }));
  };

  const removeFromCart = (serviceId: string) =>
    setData((prev) => ({
      ...prev,
      items: prev.items.filter((i) => i.service_id !== serviceId),
    }));

  const update = <K extends keyof BookingData>(key: K, value: BookingData[K]) => {
    setData((prev) => ({ ...prev, [key]: value }));
  };

  const canProceed = () => {
    switch (step) {
      case 1:
        return data.items.length > 0;
      case 2:
        return !!data.date && !!data.time;
      case 3:
        return !!data.name && /^\S+@\S+\.\S+$/.test(data.email);
      case 4:
        return data.items.length > 0 && !!data.date && !!data.time;
      default:
        return true;
    }
  };

  const handleNext = async () => {
    if (step === 4) {
      setProcessing(true);
      setError(null);
      try {
        // Nothing is confirmed here: the booking is stored as pending/unpaid and
        // Stripe hosts the payment. Confirmation happens after Stripe verifies it.
        const res = await bookingPublicApi.startCheckout({
          items: data.items,
          full_name: data.name,
          email: data.email,
          phone: data.phone,
          preferred_date: data.date,
          preferred_time: data.time,
          notes: data.notes,
        });
        window.location.href = res.url
          ? res.url
          : `/booking-success/${res.booking_reference}`;
        return;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not start the payment");
        setProcessing(false);
      }
      return;
    }
    setStep((s) => Math.min(s + 1, 5));
  };

  const handleBack = () => setStep((s) => Math.max(s - 1, 1));

  const selectedDate = data.date ? new Date(`${data.date}T00:00:00`) : undefined;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const [month, setMonth] = useState<Date>(selectedDate ?? today);

  const lastBookableDay = useMemo(() => {
    const d = new Date(today);
    d.setDate(d.getDate() + Math.max(1, booking.max_advance_days));
    return d;
  }, [booking.max_advance_days]);

  const monthKey = `${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, "0")}`;

  // Live from the database: which slots on the chosen day are taken, and which
  // days in the visible month have nothing left at all.
  const { data: dayAvailability, isFetching: loadingSlots } = useQuery({
    queryKey: ["booking", "availability", "day", data.date, cartDuration],
    queryFn: () => bookingPublicApi.dayAvailability(data.date, undefined, cartDuration),
    enabled: !!data.date,
    staleTime: 15_000,
    refetchOnWindowFocus: true,
  });

  const { data: monthAvailability } = useQuery({
    queryKey: ["booking", "availability", "month", monthKey, cartDuration],
    queryFn: () => bookingPublicApi.monthAvailability(monthKey, undefined, cartDuration),
    staleTime: 15_000,
    refetchOnWindowFocus: true,
  });

  const takenSlots = useMemo(
    () => new Set(dayAvailability?.unavailable ?? []),
    [dayAvailability],
  );

  // Weekdays the salon has switched off in admin Settings.
  const closedDays = useMemo(
    () => monthAvailability?.closed_weekdays ?? closedWeekdays(booking.open_days),
    [monthAvailability, booking.open_days],
  );

  // Dates the admin has blocked (holidays, breaks, private events).
  const blockedDates = useMemo(
    () => (monthAvailability?.blocked_dates ?? []).map((d) => new Date(`${d}T00:00:00`)),
    [monthAvailability],
  );

  const blockedIsoDates = useMemo(
    () => new Set(monthAvailability?.blocked_dates ?? []),
    [monthAvailability],
  );

  const fullyBookedDates = useMemo(
    () =>
      (monthAvailability?.fully_booked ?? []).map((d) => new Date(`${d}T00:00:00`)),
    [monthAvailability],
  );

  const dateBlocked = Boolean(
    data.date && (blockedIsoDates.has(data.date) || dayAvailability?.blocked),
  );

  // A ticking UK clock, so slots for today expire while the page is open.
  const [ukClock, setUkClock] = useState(() => ukNow());
  useEffect(() => {
    const id = setInterval(() => setUkClock(ukNow()), 30_000);
    return () => clearInterval(id);
  }, []);

  const isToday = data.date === ukClock.date;

  const slotIsPast = (slot: string) => {
    if (!data.date) return false;
    const [h, m] = slot.split(":").map(Number);
    return isPastUkSlot(
      data.date,
      (h ?? 0) * 60 + (m ?? 0),
      Math.max(0, booking.min_notice_hours),
    );
  };

  const isSlotDisabled = (slot: string) => takenSlots.has(slot) || slotIsPast(slot);

  // Only future times are offered; taken times stay visible but crossed out.
  const visibleSlots = useMemo(
    () => (isToday ? slots.filter((slot) => !slotIsPast(slot)) : slots),
    [slots, isToday, ukClock, data.date, booking.min_notice_hours],
  );

  // Drop a date that sits on a day the salon has switched off or blocked.
  useEffect(() => {
    if (!data.date) return;
    const isClosed = closedDays.includes(new Date(`${data.date}T00:00:00`).getDay());
    if (isClosed || blockedIsoDates.has(data.date)) {
      update("date", "");
      update("time", "");
      if (blockedIsoDates.has(data.date)) setError(UNAVAILABLE_MESSAGE);
    }
  }, [closedDays, blockedIsoDates, data.date]);

  // If the chosen time gets booked by someone else, drop it.
  useEffect(() => {
    if (data.time && takenSlots.has(data.time)) {
      update("time", "");
      setError("That time was just booked by someone else. Please pick another.");
    }
  }, [takenSlots, data.time]);


  if (!booking.enabled) {
    return (
      <main className="flex min-h-[70vh] items-center justify-center px-6 py-32">
        <div className="mx-auto max-w-xl rounded-3xl border border-border bg-card p-10 text-center shadow-soft">
          <h1 className="font-display text-3xl">Booking unavailable</h1>
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
            {booking.disabled_message}
          </p>
        </div>
      </main>
    );
  }

  return (
    <main>
      <section className="relative px-6 pt-32 pb-16 text-on-dark md:px-12 md:pt-40 md:pb-20">
        <img
          src={bookingHeroAsset}
          alt="Lash extension treatment at Mayor Beauty Place"
          className="absolute inset-0 h-full w-full object-cover"
          loading="eager"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-ink/85 via-ink/70 to-ink/85" />
        <div className="relative z-10 mx-auto flex max-w-6xl flex-col items-center text-center">
          <span className="mb-6 inline-flex items-center gap-3 rounded-full border border-on-dark/25 bg-on-dark/10 px-5 py-2 text-xs font-medium tracking-widest text-on-dark/90 uppercase backdrop-blur-sm">
            <span className="h-1.5 w-1.5 rounded-full bg-brand-red" />
            Book A Service
          </span>
          <h1 className="animate-reveal max-w-3xl font-display text-5xl leading-[1.02] md:text-7xl">
            Reserve Your
            <em className="italic text-brand-red"> Session</em>
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed font-light text-on-dark/90">
            Follow the steps below to choose your treatment, time, and details.
          </p>
        </div>
      </section>
      {booking.note ? (
        <div className="bg-secondary/50 px-6 py-4 text-center text-sm text-muted-foreground md:px-12">
          {booking.note}
        </div>
      ) : null}
      <AdSlot placement="booking_top" />

      <section className="px-6 py-16 md:px-12 md:py-24">
        <div className="mx-auto max-w-5xl">
          <div className="mb-12">
            <div className="relative flex items-center justify-between">
              <div className="absolute left-0 top-1/2 h-0.5 w-full -translate-y-1/2 bg-border" />
              <div
                className="absolute left-0 top-1/2 h-0.5 -translate-y-1/2 bg-brand-blue transition-all duration-500"
                style={{ width: `${((step - 1) / (steps.length - 1)) * 100}%` }}
              />
              {steps.map((s) => {
                const Icon = s.icon;
                const isActive = step >= s.id;
                const isCurrent = step === s.id;
                return (
                  <div
                    key={s.id}
                    className="relative z-10 flex flex-col items-center gap-3"
                  >
                    <span
                      className={`flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all ${
                        isActive
                          ? "border-brand-blue bg-brand-blue text-on-brand"
                          : "border-border bg-card text-muted-foreground"
                      } ${isCurrent ? "ring-4 ring-brand-blue/20" : ""}`}
                    >
                      <Icon className="h-4 w-4" />
                    </span>
                    <span
                      className={`hidden text-[11px] font-medium uppercase tracking-widest sm:block ${
                        isActive ? "text-foreground" : "text-muted-foreground"
                      }`}
                    >
                      {s.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="rounded-3xl bg-card p-8 shadow-soft md:p-12">
            {step === 1 && (
              <div className="animate-reveal">
                <h2 className="mb-2 font-display text-3xl md:text-4xl">
                  Choose A <em className="italic text-brand-red">Service</em>
                </h2>
                <p className="mb-8 text-muted-foreground">
                  Please select the category and service you would like to book.
                </p>

                {isLoading ? (
                  <div className="flex justify-center py-12">
                    <Loader2 className="h-6 w-6 animate-spin text-brand-blue" />
                  </div>
                ) : categories.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No categories are available right now. Please check back soon.
                  </p>
                ) : (
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="category" className="text-base text-brand-blue">
                        Category
                      </Label>
                      <Select
                        value={data.categoryId}
                        onValueChange={(value) => {
                          update("categoryId", value);
                          update("serviceId", "");
                        }}
                      >
                        <SelectTrigger
                          id="category"
                          className="h-12 w-full rounded-xl border-border bg-card px-4 text-sm focus:ring-brand-blue/20"
                        >
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent className="border-border bg-card text-foreground shadow-xl">
                          {categories.map((c) => (
                            <SelectItem key={c.id} value={c.id}>
                              {c.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="service" className="text-base text-brand-blue">
                        Service
                      </Label>
                      <Select
                        value={data.serviceId}
                        onValueChange={(value) => update("serviceId", value)}
                        disabled={!data.categoryId || services.length === 0}
                      >
                        <SelectTrigger
                          id="service"
                          className="h-12 w-full rounded-xl border-border bg-card px-4 text-sm focus:ring-brand-blue/20"
                        >
                          <SelectValue
                            placeholder={
                              !data.categoryId
                                ? "Select category first"
                                : services.length === 0
                                  ? "No services available"
                                  : "Select service"
                            }
                          />
                        </SelectTrigger>
                        <SelectContent className="border-border bg-card text-foreground shadow-xl">
                          {services.map((s) => (
                            <SelectItem key={s.id} value={s.id}>
                              {s.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}

                {selectedService && (
                  <div className="mt-6 rounded-2xl border border-border bg-secondary/50 p-5">
                    <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <div className="font-display text-lg">{selectedService.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {selectedCategory?.name} • {selectedService.duration_minutes} min
                        </div>
                      </div>
                      <div className="mt-1 font-display text-xl text-brand-red sm:mt-0">
                        {formatPrice(selectedService.price)}
                      </div>
                    </div>
                    {selectedService.description && (
                      <p className="mt-3 text-sm text-muted-foreground">
                        {selectedService.description}
                      </p>
                    )}
                    <Button
                      type="button"
                      onClick={() => addToCart(selectedService.id)}
                      className="mt-5 rounded-full bg-brand-blue px-6 py-5 text-xs font-semibold text-on-brand hover:bg-brand-red"
                    >
                      <Plus className="mr-2 h-4 w-4" /> Add to booking
                    </Button>
                  </div>
                )}

                <div className="mt-8 rounded-2xl border border-border bg-card p-5">
                  <h3 className="font-display text-xl">Your booking</h3>
                  {cart.length === 0 ? (
                    <p className="mt-3 text-sm text-muted-foreground">
                      Nothing added yet. Choose a category and service above, then tap
                      “Add to booking”. You can add as many services as you like and pay
                      for them all together.
                    </p>
                  ) : (
                    <>
                      <ul className="mt-4 space-y-3">
                        {cart.map((line) => (
                          <li
                            key={line.service_id}
                            className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-secondary/40 px-4 py-3"
                          >
                            <div className="min-w-[140px]">
                              <div className="font-medium">{line.service.name}</div>
                              <div className="text-xs text-muted-foreground">
                                {formatPrice(line.service.price)} • {line.service.duration_minutes} min
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                aria-label={`Reduce ${line.service.name}`}
                                onClick={() => setQuantity(line.service_id, line.quantity - 1)}
                                className="flex h-8 w-8 items-center justify-center rounded-full border border-border hover:bg-secondary"
                              >
                                <Minus className="h-3.5 w-3.5" />
                              </button>
                              <span className="w-6 text-center text-sm font-semibold">
                                {line.quantity}
                              </span>
                              <button
                                type="button"
                                aria-label={`Add another ${line.service.name}`}
                                onClick={() => setQuantity(line.service_id, line.quantity + 1)}
                                className="flex h-8 w-8 items-center justify-center rounded-full border border-border hover:bg-secondary"
                              >
                                <Plus className="h-3.5 w-3.5" />
                              </button>
                              <span className="ml-3 w-20 text-right font-medium">
                                {formatPrice(Number(line.service.price) * line.quantity)}
                              </span>
                              <button
                                type="button"
                                aria-label={`Remove ${line.service.name}`}
                                onClick={() => removeFromCart(line.service_id)}
                                className="ml-1 text-muted-foreground hover:text-brand-red"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </div>
                          </li>
                        ))}
                      </ul>
                      <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
                        <span className="text-sm text-muted-foreground">
                          Total • about {cartDuration} min
                        </span>
                        <span className="font-display text-2xl text-brand-red">
                          {formatPrice(cartTotal)}
                        </span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="animate-reveal">
                <h2 className="mb-2 font-display text-3xl md:text-4xl">
                  Pick A <em className="italic text-brand-red">Time</em>
                </h2>
                <p className="mb-8 text-muted-foreground">
                  Choose your preferred appointment date and time slot.
                </p>
                <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
                  <div className="space-y-3">
                    <Label className="text-base text-brand-blue">Date</Label>
                    <div className="rounded-2xl border border-border bg-card p-3">
                      <DateCalendar
                        mode="single"
                        required
                        selected={selectedDate}
                        onDayClick={(date, mods) => {
                          if (mods["disabled"]) return;
                          update("date", toLocalIso(date));
                        }}
                        disabled={[
                          { before: today },
                          { after: lastBookableDay },
                          ...(closedDays.length ? [{ dayOfWeek: closedDays }] : []),
                          ...fullyBookedDates,
                          ...blockedDates,
                        ]}
                        defaultMonth={selectedDate ?? today}
                        month={month}
                        onMonthChange={setMonth}
                        className="pointer-events-auto w-full"
                        modifiersClassNames={{
                          selected:
                            "!bg-brand-blue !text-white [&_button]:!bg-brand-blue [&_button]:!text-white [&_button]:rounded-md",
                        }}
                      />

                    </div>
                    {dateBlocked && (
                      <p className="rounded-xl border border-brand-red/40 bg-brand-red/5 p-3 text-sm text-brand-red">
                        {dayAvailability?.unavailable_message ?? UNAVAILABLE_MESSAGE}
                      </p>
                    )}
                    {data.date && !dateBlocked && (
                      <p className="text-sm text-muted-foreground">
                        Selected: {new Date(`${data.date}T00:00:00`).toLocaleDateString("en-GB", {
                          weekday: "long",
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </p>
                    )}
                  </div>

                  <div className="space-y-3">
                    <Label className="text-base text-brand-blue">Time</Label>
                    <p className="text-xs text-muted-foreground">
                      {!data.date
                        ? "Pick a date first to see the free times."
                        : dateBlocked
                        ? UNAVAILABLE_MESSAGE
                        : loadingSlots
                          ? "Checking which times are still free…"
                          : "Crossed-out times are already booked."}
                    </p>
                    <div className="grid max-h-[420px] grid-cols-3 gap-2 overflow-y-auto pr-1 sm:grid-cols-4">

                      {(dateBlocked ? [] : slots).map((slot) => {
                        const disabled = isSlotDisabled(slot);
                        return (
                          <button
                            key={slot}
                            type="button"
                            disabled={disabled}
                            aria-disabled={disabled}
                            title={disabled ? "Already booked" : undefined}
                            onClick={() => !disabled && update("time", slot)}
                            className={`rounded-xl border px-3 py-3 text-sm transition-all ${
                              disabled
                                ? "cursor-not-allowed border-border/60 bg-secondary/40 text-muted-foreground/60 line-through"
                                : data.time === slot
                                  ? "border-brand-blue bg-brand-blue text-on-brand"
                                  : "border-border bg-card hover:border-brand-blue/40 hover:bg-secondary/50"
                            }`}
                          >
                            {slot}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="animate-reveal">
                <h2 className="mb-2 font-display text-3xl md:text-4xl">
                  Your <em className="italic text-brand-red">Details</em>
                </h2>
                <p className="mb-8 text-muted-foreground">
                  Tell us a little about yourself.
                </p>
                <div className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full name</Label>
                    <Input
                      id="name"
                      value={data.name}
                      onChange={(e) => update("name", e.target.value)}
                      placeholder="Jane Doe"
                      className={inputClass}
                    />
                  </div>
                  <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="email">Email address</Label>
                      <Input
                        id="email"
                        type="email"
                        value={data.email}
                        onChange={(e) => update("email", e.target.value)}
                        placeholder="jane@example.com"
                        className={inputClass}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone number</Label>
                      <Input
                        id="phone"
                        type="tel"
                        value={data.phone}
                        onChange={(e) => update("phone", e.target.value)}
                        placeholder="+44 7123 456789"
                        className={inputClass}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="notes">Notes</Label>
                    <Textarea
                      id="notes"
                      value={data.notes}
                      onChange={(e) => update("notes", e.target.value)}
                      placeholder="Anything we should know?"
                      rows={4}
                      className={`${inputClass} resize-none`}
                    />
                  </div>
                </div>
              </div>
            )}

            {step === 4 && (
              <div className="animate-reveal">
                <h2 className="mb-2 font-display text-3xl md:text-4xl">
                  Secure <em className="italic text-brand-red">Checkout</em>
                </h2>
                <p className="mb-8 text-muted-foreground">
                  Review your booking, then pay securely with Stripe.
                </p>
                <div className="mb-8 rounded-2xl border border-border bg-secondary/50 p-6">
                  <p className="mb-3 text-xs uppercase tracking-widest text-muted-foreground">
                    Services
                  </p>
                  <ul className="mb-4 space-y-2">
                    {cart.map((line) => (
                      <li key={line.service_id} className="flex items-center justify-between gap-4">
                        <span className="text-sm">
                          {line.service.name}
                          {line.quantity > 1 ? ` × ${line.quantity}` : ""}
                        </span>
                        <span className="font-medium">
                          {formatPrice(Number(line.service.price) * line.quantity)}
                        </span>
                      </li>
                    ))}
                  </ul>
                  <div className="mb-4 flex items-center justify-between border-t border-border pt-4">
                    <span className="text-sm text-muted-foreground">Date & time</span>
                    <span className="font-medium">
                      {data.date} at {data.time}
                    </span>
                  </div>
                  <div className="mb-4 flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Total time</span>
                    <span className="font-medium">about {cartDuration} min</span>
                  </div>
                  <div className="flex items-center justify-between border-t border-border pt-4">
                    <span className="font-medium">Total to pay</span>
                    <span className="font-display text-2xl text-brand-red">
                      {formatPrice(cartTotal)}
                    </span>
                  </div>
                </div>

                <div className="rounded-2xl border border-border bg-card p-6 text-sm">
                  <p className="font-medium">Pay securely with Stripe</p>
                  <p className="mt-2 text-muted-foreground">
                    Paid treatments go to Stripe's secure checkout — card, Klarna or Clearpay —
                    and are only confirmed once the payment succeeds. Treatments priced on
                    request are sent to the team to confirm.
                  </p>
                </div>

                {error && <p className="mt-6 text-sm text-brand-red">{error}</p>}

                <p className="mt-6 flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-brand-blue/10 text-brand-blue">
                    <Check className="h-2.5 w-2.5" />
                  </span>
                  Card details are handled entirely by Stripe and never touch our servers.
                </p>
              </div>
            )}

            {step === 5 && (
              <div className="animate-reveal flex flex-col items-center py-8 text-center">
                <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-brand-blue/10 text-brand-blue">
                  <Check className="h-8 w-8" />
                </div>
                <h2 className="mb-4 font-display text-3xl md:text-4xl">
                  Booking <em className="italic text-brand-red">Confirmed</em>
                </h2>
                <p className="mb-8 max-w-md text-muted-foreground">
                  Thank you, {data.name || "guest"}. We have received your request for{" "}
                  {cart.length} service{cart.length === 1 ? "" : "s"} on {data.date} at{" "}
                  {data.time}. Our team will confirm within 24 hours.
                </p>
                <div className="w-full max-w-md rounded-2xl border border-border bg-secondary/50 p-6 text-left">
                  {cart.map((line) => (
                    <div
                      key={line.service_id}
                      className="mb-3 flex items-center justify-between gap-4"
                    >
                      <span className="text-sm text-muted-foreground">
                        {line.service.name}
                        {line.quantity > 1 ? ` × ${line.quantity}` : ""}
                      </span>
                      <span className="font-medium">
                        {formatPrice(Number(line.service.price) * line.quantity)}
                      </span>
                    </div>
                  ))}
                  <div className="mb-3 flex items-center justify-between border-t border-border pt-3">
                    <span className="text-sm text-muted-foreground">Date</span>
                    <span className="font-medium">{data.date}</span>
                  </div>
                  <div className="mb-3 flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Time</span>
                    <span className="font-medium">{data.time}</span>
                  </div>
                  <div className="flex items-center justify-between border-t border-border pt-4">
                    <span className="font-medium">Total</span>
                    <span className="font-display text-2xl text-brand-red">
                      {formatPrice(cartTotal)}
                    </span>
                  </div>
                </div>
                <Button
                  onClick={() => {
                    setData(initialData);
                    setStep(1);
                  }}
                  className="mt-10 rounded-full bg-brand-red px-10 py-6 text-sm font-semibold text-on-brand shadow-soft transition-colors hover:bg-brand-blue"
                >
                  Book Another Appointment
                </Button>
              </div>
            )}

            {step < 5 && (
              <div className="mt-10 flex items-center justify-between border-t border-border pt-8">
                <Button
                  variant="outline"
                  onClick={handleBack}
                  disabled={step === 1}
                  className="rounded-full px-8 py-5 disabled:opacity-30"
                >
                  Back
                </Button>
                <Button
                  onClick={handleNext}
                  disabled={!canProceed() || processing}
                  className="rounded-full bg-brand-red px-10 py-5 text-sm font-semibold text-on-brand shadow-soft transition-colors hover:bg-brand-blue disabled:opacity-50"
                >
                  {processing ? "Redirecting…" : step === 4 ? "Pay securely" : "Continue"}
                </Button>
              </div>
            )}
          </div>
        </div>
      </section>
      <AdSlot placement="booking_bottom" />
    </main>
  );
}
