import { useEffect, useState, useCallback } from "react";
import { Accessibility } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useI18n } from "@/i18n";

const LARGE_KEY = "a11y_large_text";
const CONTRAST_KEY = "a11y_high_contrast";

function applyClasses(large: boolean, contrast: boolean) {
  const root = document.documentElement;
  root.classList.toggle("a11y-large", large);
  root.classList.toggle("a11y-contrast", contrast);
}

export function useA11y() {
  const [largeText, setLargeText] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem(LARGE_KEY) === "1";
  });
  const [highContrast, setHighContrast] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem(CONTRAST_KEY) === "1";
  });

  useEffect(() => {
    localStorage.setItem(LARGE_KEY, largeText ? "1" : "0");
    localStorage.setItem(CONTRAST_KEY, highContrast ? "1" : "0");
    applyClasses(largeText, highContrast);
  }, [largeText, highContrast]);

  const toggleLarge = useCallback(() => setLargeText((v) => !v), []);
  const toggleContrast = useCallback(() => setHighContrast((v) => !v), []);

  return { largeText, highContrast, toggleLarge, toggleContrast };
}

/** Applies stored a11y prefs on very first paint (called from App). */
export function useA11yBootstrap() {
  useEffect(() => {
    const large = localStorage.getItem(LARGE_KEY) === "1";
    const contrast = localStorage.getItem(CONTRAST_KEY) === "1";
    applyClasses(large, contrast);
  }, []);
}

export function AccessibilityMenu({ className }: { className?: string }) {
  const { largeText, highContrast, toggleLarge, toggleContrast } = useA11y();
  const { lang, setLang } = useI18n();
  const activeCount = (largeText ? 1 : 0) + (highContrast ? 1 : 0) + (lang === "bn" ? 1 : 0);
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label="Accessibility and language settings"
          className={
            "relative inline-flex items-center justify-center h-11 w-11 rounded-full border border-border bg-background hover:bg-accent transition-colors touch-manipulation " +
            (className || "")
          }
        >
          <Accessibility className="h-5 w-5" />
          {activeCount > 0 && (
            <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-primary text-[10px] leading-4 text-primary-foreground text-center font-semibold">
              {activeCount}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-72 p-4">
        <div className="mb-3">
          <div className="font-semibold text-sm">Accessibility</div>
          <div className="text-xs text-muted-foreground">Applies across the whole site</div>
        </div>
        <div className="space-y-4">
          <div>
            <Label className="font-medium">Language / ভাষা</Label>
            <p className="text-xs text-muted-foreground mb-2">Interface language (blog content stays original)</p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setLang("en")}
                className={
                  "h-10 rounded-md border text-sm font-medium transition-colors " +
                  (lang === "en" ? "bg-primary text-primary-foreground border-primary" : "border-border hover:bg-accent")
                }
                aria-pressed={lang === "en"}
              >
                English
              </button>
              <button
                type="button"
                onClick={() => setLang("bn")}
                className={
                  "h-10 rounded-md border text-sm font-medium transition-colors " +
                  (lang === "bn" ? "bg-primary text-primary-foreground border-primary" : "border-border hover:bg-accent")
                }
                aria-pressed={lang === "bn"}
              >
                বাংলা
              </button>
            </div>
          </div>
          <div className="flex items-center justify-between gap-3">
            <div>
              <Label htmlFor="a11y-large" className="font-medium">Large text</Label>
              <p className="text-xs text-muted-foreground">Bigger, easier-to-read type</p>
            </div>
            <Switch id="a11y-large" checked={largeText} onCheckedChange={toggleLarge} />
          </div>
          <div className="flex items-center justify-between gap-3">
            <div>
              <Label htmlFor="a11y-contrast" className="font-medium">High contrast</Label>
              <p className="text-xs text-muted-foreground">Stronger colors, bolder text</p>
            </div>
            <Switch id="a11y-contrast" checked={highContrast} onCheckedChange={toggleContrast} />
          </div>
        </div>
        <div className="mt-4 pt-3 border-t border-border text-xs text-muted-foreground">
          Tip: press <kbd className="px-1.5 py-0.5 rounded border border-border bg-muted">Tab</kbd> to move between links.
        </div>
      </PopoverContent>
    </Popover>
  );
}
