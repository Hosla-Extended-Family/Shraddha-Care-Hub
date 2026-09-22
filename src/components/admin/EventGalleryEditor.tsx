import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useImageUpload } from "@/hooks/use-image-upload";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, Loader2, Upload, ArrowUp, ArrowDown, Image as ImageIcon, Youtube } from "lucide-react";
import { youtubeId, youtubeThumb, type EventMediaItem } from "@/lib/event-media";

interface EventGalleryEditorProps {
  value: EventMediaItem[];
  onChange: (items: EventMediaItem[]) => void;
}

export function EventGalleryEditor({ value, onChange }: EventGalleryEditorProps) {
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [ytUrl, setYtUrl] = useState("");
  const { upload, isUploading } = useImageUpload({
    bucket: "project-posters",
    folder: "event-gallery",
    maxSizeMB: 1.5,
    maxWidthOrHeight: 1920,
  });

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const added: EventMediaItem[] = [];
    for (const file of Array.from(files)) {
      const url = await upload(file);
      if (url) added.push({ type: "image", url });
    }
    if (added.length) onChange([...value, ...added]);
    if (fileRef.current) fileRef.current.value = "";
  };

  const addVideo = () => {
    const id = youtubeId(ytUrl.trim());
    if (!id) {
      toast({ title: "Invalid YouTube link", description: "Paste a full YouTube video URL.", variant: "destructive" });
      return;
    }
    onChange([...value, { type: "youtube", url: ytUrl.trim() }]);
    setYtUrl("");
  };

  const removeAt = (i: number) => onChange(value.filter((_, idx) => idx !== i));

  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= value.length) return;
    const next = [...value];
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  };

  const setCaption = (i: number, caption: string) =>
    onChange(value.map((item, idx) => (idx === i ? { ...item, caption } : item)));

  return (
    <div className="space-y-4 rounded-lg border border-border p-4">
      <div>
        <Label className="text-base">Event Gallery</Label>
        <p className="text-xs text-muted-foreground">
          Photos &amp; YouTube videos shown on the event page once the event is over (instead of the registration form).
        </p>
      </div>

      {/* Add controls */}
      <div className="space-y-3">
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
        <Button
          type="button"
          variant="outline"
          className="w-full gap-2"
          disabled={isUploading}
          onClick={() => fileRef.current?.click()}
        >
          {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
          {isUploading ? "Uploading…" : "Upload Photos"}
        </Button>

        <div className="flex gap-2">
          <Input
            value={ytUrl}
            onChange={(e) => setYtUrl(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addVideo();
              }
            }}
            placeholder="Paste YouTube video link…"
          />
          <Button type="button" variant="outline" className="gap-1 shrink-0" onClick={addVideo}>
            <Plus className="h-4 w-4" /> Add
          </Button>
        </div>
      </div>

      {/* List */}
      {value.length === 0 ? (
        <p className="text-center text-xs text-muted-foreground py-2">No gallery items yet.</p>
      ) : (
        <div className="space-y-2">
          {value.map((item, i) => {
            const thumb = item.type === "youtube" ? youtubeThumb(item.url) : item.url;
            return (
              <div key={i} className="flex items-start gap-3 rounded-lg border border-border p-2">
                <div className="relative h-14 w-20 shrink-0 overflow-hidden rounded bg-muted">
                  {thumb ? (
                    <img src={thumb} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <ImageIcon className="h-5 w-5 text-muted-foreground" />
                    </div>
                  )}
                  <span className="absolute bottom-0.5 left-0.5 rounded bg-black/60 p-0.5 text-white">
                    {item.type === "youtube" ? <Youtube className="h-3 w-3" /> : <ImageIcon className="h-3 w-3" />}
                  </span>
                </div>
                <div className="flex-1 space-y-1">
                  <Input
                    value={item.caption || ""}
                    onChange={(e) => setCaption(i, e.target.value)}
                    placeholder="Caption (optional)"
                    className="h-8 text-sm"
                  />
                  <p className="truncate text-[11px] text-muted-foreground">{item.url}</p>
                </div>
                <div className="flex flex-col gap-1">
                  <button type="button" onClick={() => move(i, -1)} disabled={i === 0} className="text-muted-foreground hover:text-foreground disabled:opacity-30">
                    <ArrowUp className="h-4 w-4" />
                  </button>
                  <button type="button" onClick={() => move(i, 1)} disabled={i === value.length - 1} className="text-muted-foreground hover:text-foreground disabled:opacity-30">
                    <ArrowDown className="h-4 w-4" />
                  </button>
                </div>
                <button type="button" onClick={() => removeAt(i)} className="text-destructive hover:opacity-70">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
