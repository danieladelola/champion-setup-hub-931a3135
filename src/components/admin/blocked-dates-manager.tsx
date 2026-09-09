/**
 * Admin panel section for blocked / unavailable dates.
 * Supports a single day, a date range, several days at once, a reason,
 * editing and removing — plus a warning when bookings already exist.
 */
import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, CalendarOff, Loader2, Pencil, Plus, Trash2, X } from "lucide-react";
import { toast } from "sonner";

import { adminApi } from "@/lib/admin-api";
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
import {
  BLOCK_REASONS,
  expandRange,
  formatRange,
  toIso,
  type BlockedDate,
} from "@/lib/blocked-dates";

type Mode = "single" | "range" | "multiple";

const todayIso = () => toIso(new Date());

export function BlockedDatesManager() {
  const queryClient = useQueryClient();
  const [mode, setMode] = useState<Mode>("single");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [days, setDays] = useState<string[]>([]);
  const [extraDay, setExtraDay] = useState("");
  const [reason, setReason] = useState<string>("Public Holiday");
  const [note, setNote] = useState("");
  const [editing, setEditing] = useState<BlockedDate | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "blocked-dates"],
    queryFn: () => adminApi.blockedDates(),
  });

  const blocks = data?.blocked_dates ?? [];
  const upcoming = useMemo(
    () => blocks.filter((b) => b.end_date >= todayIso()),
    [blocks],
  );
  const past = useMemo(() => blocks.filter((b) => b.end_date < todayIso()), [blocks]);

  // Live warning: how many bookings already sit on the days about to be blocked.
  const checkRange = useMemo(() => {
    if (mode === "range" && start && end && end >= start) return { start, end };
    if (mode === "single" && start) return { start, end: start };
    if (mode === "multiple" && days.length) {
      const sorted = [...days].sort();
      return { start: sorted[0]!, end: sorted[sorted.length - 1]! };
    }
    return null;
  }, [mode, start, end, days]);

  const { data: affected } = useQuery({
    queryKey: ["admin", "blocked-dates", "affected", checkRange?.start, checkRange?.end],
    queryFn: () => adminApi.countBookingsInRange(checkRange!.start, checkRange!.end),
    enabled: !!checkRange,
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["admin", "blocked-dates"] });
  };

  const resetForm = () => {
    setStart("");
    setEnd("");
    setDays([]);
    setExtraDay("");
    setNote("");
    setEditing(null);
  };

  useEffect(() => {
    if (editing) {
      setMode(editing.start_date === editing.end_date ? "single" : "range");
      setStart(editing.start_date);
      setEnd(editing.end_date);
      setReason(editing.reason);
      setNote(editing.note ?? "");
    }
  }, [editing]);

  const save = useMutation({
    mutationFn: async () => {
      const payload = { reason, note };
      if (editing) {
        await adminApi.updateBlockedDate(editing.id, {
          ...payload,
          start_date: start,
          end_date: mode === "range" && end ? end : start,
        });
        return 1;
      }
      if (mode === "multiple") {
        for (const day of [...days].sort()) {
          await adminApi.createBlockedDate({ ...payload, start_date: day, end_date: day });
        }
        return days.length;
      }
      await adminApi.createBlockedDate({
        ...payload,
        start_date: start,
        end_date: mode === "range" && end ? end : start,
      });
      return 1;
    },
    onSuccess: (count) => {
      toast.success(editing ? "Blocked date updated" : `${count} blocked date(s) saved`);
      resetForm();
      invalidate();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const remove = useMutation({
    mutationFn: (id: string) => adminApi.deleteBlockedDate(id),
    onSuccess: () => {
      toast.success("Blocked date removed");
      invalidate();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const canSave =
    mode === "multiple" ? days.length > 0 : !!start && (mode !== "range" || (!!end && end >= start));

  const totalDays =
    mode === "multiple"
      ? days.length
      : mode === "range" && start && end
        ? expandRange(start, end).length
        : start
          ? 1
          : 0;

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-border bg-background p-5">
        <div className="mb-4 flex items-center gap-2">
          <CalendarOff className="h-4 w-4 text-muted-foreground" />
          <p className="text-sm font-medium">
            {editing ? "Edit blocked date" : "Block dates"}
          </p>
          {editing ? (
            <Button variant="ghost" size="sm" className="ml-auto" onClick={resetForm}>
              <X className="mr-1 h-3.5 w-3.5" /> Cancel
            </Button>
          ) : null}
        </div>

        {!editing ? (
          <div className="mb-4 flex flex-wrap gap-2">
            {(
              [
                ["single", "One date"],
                ["range", "Date range"],
                ["multiple", "Several dates"],
              ] as Array<[Mode, string]>
            ).map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => setMode(value)}
                className={`rounded-full border px-4 py-1.5 text-xs transition-colors ${
                  mode === value
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-card hover:bg-secondary"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        ) : null}

        <div className="grid gap-4 sm:grid-cols-2">
          {mode !== "multiple" ? (
            <>
              <div className="space-y-2">
                <Label className="text-xs tracking-wide text-muted-foreground uppercase">
                  {mode === "range" ? "First closed day" : "Date"}
                </Label>
                <Input type="date" value={start} onChange={(e) => setStart(e.target.value)} />
              </div>
              {mode === "range" ? (
                <div className="space-y-2">
                  <Label className="text-xs tracking-wide text-muted-foreground uppercase">
                    Last closed day
                  </Label>
                  <Input
                    type="date"
                    value={end}
                    min={start || undefined}
                    onChange={(e) => setEnd(e.target.value)}
                  />
                </div>
              ) : null}
            </>
          ) : (
            <div className="space-y-2 sm:col-span-2">
              <Label className="text-xs tracking-wide text-muted-foreground uppercase">
                Add dates one by one
              </Label>
              <div className="flex gap-2">
                <Input
                  type="date"
                  value={extraDay}
                  onChange={(e) => setExtraDay(e.target.value)}
                />
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    if (!extraDay) return;
                    setDays((d) => (d.includes(extraDay) ? d : [...d, extraDay]));
                    setExtraDay("");
                  }}
                >
                  <Plus className="mr-1 h-3.5 w-3.5" /> Add
                </Button>
              </div>
              {days.length ? (
                <div className="flex flex-wrap gap-2 pt-1">
                  {[...days].sort().map((d) => (
                    <span
                      key={d}
                      className="inline-flex items-center gap-1 rounded-full border border-border bg-card px-3 py-1 text-xs"
                    >
                      {new Date(`${d}T00:00:00`).toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                      <button
                        type="button"
                        onClick={() => setDays((list) => list.filter((x) => x !== d))}
                        aria-label={`Remove ${d}`}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              ) : null}
            </div>
          )}

          <div className="space-y-2">
            <Label className="text-xs tracking-wide text-muted-foreground uppercase">Reason</Label>
            <Select value={reason} onValueChange={setReason}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a reason" />
              </SelectTrigger>
              <SelectContent>
                {BLOCK_REASONS.map((r) => (
                  <SelectItem key={r} value={r}>
                    {r}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2 sm:col-span-2">
            <Label className="text-xs tracking-wide text-muted-foreground uppercase">
              Extra note (optional)
            </Label>
            <Textarea
              rows={2}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Shown to your team only, e.g. Boxing Day closure"
            />
          </div>
        </div>

        {affected && affected.affected_bookings > 0 ? (
          <div className="mt-4 flex items-start gap-3 rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <p>
              {affected.affected_bookings} existing booking
              {affected.affected_bookings === 1 ? "" : "s"} already fall on these days. Blocking
              will not delete them — contact those customers to rearrange.
            </p>
          </div>
        ) : null}

        <div className="mt-4 flex items-center gap-3">
          <Button disabled={!canSave || save.isPending} onClick={() => save.mutate()}>
            {save.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {editing ? "Save changes" : `Block ${totalDays || ""} date${totalDays === 1 ? "" : "s"}`}
          </Button>
          <p className="text-xs text-muted-foreground">
            Blocked dates override your opening days — customers cannot pick them.
          </p>
        </div>
      </div>

      <div className="space-y-3">
        <p className="text-sm font-medium">Upcoming closures</p>
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : upcoming.length === 0 ? (
          <p className="text-sm text-muted-foreground">No upcoming blocked dates.</p>
        ) : (
          <ul className="space-y-2">
            {upcoming.map((block) => (
              <li
                key={block.id}
                className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-background p-3"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">{formatRange(block)}</p>
                  <p className="text-xs text-muted-foreground">
                    {block.reason}
                    {block.note ? ` — ${block.note}` : ""}
                  </p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setEditing(block)}>
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => remove.mutate(block.id)}
                  disabled={remove.isPending}
                >
                  <Trash2 className="h-3.5 w-3.5 text-destructive" />
                </Button>
              </li>
            ))}
          </ul>
        )}

        {past.length ? (
          <details className="rounded-xl border border-border bg-background p-3">
            <summary className="cursor-pointer text-xs text-muted-foreground">
              Past closures ({past.length})
            </summary>
            <ul className="mt-3 space-y-2">
              {past.map((block) => (
                <li key={block.id} className="flex items-center gap-3 text-sm">
                  <span className="flex-1 text-muted-foreground">
                    {formatRange(block)} — {block.reason}
                  </span>
                  <Button variant="ghost" size="sm" onClick={() => remove.mutate(block.id)}>
                    <Trash2 className="h-3.5 w-3.5 text-destructive" />
                  </Button>
                </li>
              ))}
            </ul>
          </details>
        ) : null}
      </div>
    </div>
  );
}
