import { useRef, useState } from "react";
import { Upload, X, Loader2, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface ImageUploadProps {
  value?: string;
  onChange: (url: string) => void;
  onUpload: (file: File) => Promise<string | null>;
  isUploading?: boolean;
  className?: string;
  disabled?: boolean;
}

export function ImageUpload({
  value,
  onChange,
  onUpload,
  isUploading = false,
  className,
  disabled = false,
}: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [urlInputMode, setUrlInputMode] = useState(false);
  const [urlInput, setUrlInput] = useState(value || "");

  const handleFileSelect = async (file: File) => {
    const url = await onUpload(file);
    if (url) {
      onChange(url);
      setUrlInput(url);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files[0]) {
      handleFileSelect(files[0]);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    if (files && files[0]) {
      handleFileSelect(files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleUrlSubmit = () => {
    if (urlInput.trim()) {
      onChange(urlInput.trim());
      setUrlInputMode(false);
    }
  };

  const handleClear = () => {
    onChange("");
    setUrlInput("");
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  return (
    <div className={cn("space-y-2", className)}>
      {/* Preview */}
      {value && (
        <div className="relative w-24 h-24 rounded-lg overflow-hidden border border-border bg-muted">
          <img
            src={value}
            alt="Preview"
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).src = "/placeholder.svg";
            }}
          />
          <button
            type="button"
            onClick={handleClear}
            disabled={disabled || isUploading}
            className="absolute top-1 right-1 p-1 bg-destructive text-destructive-foreground rounded-full hover:bg-destructive/90 transition-colors"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      )}

      {/* Upload Area */}
      {!urlInputMode ? (
        <div
          className={cn(
            "border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors",
            isDragging
              ? "border-primary bg-primary/5"
              : "border-border hover:border-primary/50",
            disabled && "opacity-50 cursor-not-allowed"
          )}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => !disabled && !isUploading && inputRef.current?.click()}
        >
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            onChange={handleInputChange}
            className="hidden"
            disabled={disabled || isUploading}
          />
          
          {isUploading ? (
            <div className="flex flex-col items-center gap-2 py-2">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <span className="text-sm text-muted-foreground">Uploading...</span>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2 py-2">
              <Upload className="h-6 w-6 text-muted-foreground" />
              <div className="text-sm">
                <span className="text-primary font-medium">Click to upload</span>
                <span className="text-muted-foreground"> or drag and drop</span>
              </div>
              <span className="text-xs text-muted-foreground">
                PNG, JPG, WEBP, GIF (max 5MB)
              </span>
            </div>
          )}
        </div>
      ) : (
        <div className="flex gap-2">
          <Input
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            placeholder="Paste image URL..."
            disabled={disabled}
          />
          <Button
            type="button"
            size="sm"
            onClick={handleUrlSubmit}
            disabled={!urlInput.trim() || disabled}
          >
            Save
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => setUrlInputMode(false)}
          >
            Cancel
          </Button>
        </div>
      )}

      {/* Toggle URL mode */}
      {!urlInputMode && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setUrlInputMode(true)}
          disabled={disabled || isUploading}
          className="text-xs text-muted-foreground"
        >
          <ImageIcon className="h-3 w-3 mr-1" />
          Or enter URL manually
        </Button>
      )}
    </div>
  );
}
