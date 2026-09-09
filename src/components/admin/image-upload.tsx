import { useRef, useState } from "react";
import { Loader2, Upload, X } from "lucide-react";
import { toast } from "sonner";

import { adminApi } from "@/lib/admin-api";

export function ImageUpload({
  value,
  onChange,
  label = "Upload image",
}: {
  value: string;
  onChange: (url: string) => void;
  label?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  async function handleFile(file: File | undefined) {
    if (!file) return;
    setBusy(true);
    try {
      const { url } = await adminApi.upload(file);
      onChange(url);
      toast.success("Image uploaded");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="flex items-center gap-3">
      {value ? (
        <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-border bg-secondary">
          <img src={value} alt="" className="h-full w-full object-cover" />
          <button
            type="button"
            aria-label="Remove image"
            onClick={() => onChange("")}
            className="absolute top-0.5 right-0.5 rounded-full bg-ink/80 p-1 text-on-dark"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      ) : null}
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif,image/avif"
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />
      <button
        type="button"
        disabled={busy}
        onClick={() => inputRef.current?.click()}
        className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-xs font-semibold transition-colors hover:bg-secondary disabled:opacity-60"
      >
        {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
        {busy ? "Uploading…" : label}
      </button>
      <span className="text-xs text-muted-foreground">PNG, JPG, WebP · max 5MB</span>
    </div>
  );
}
