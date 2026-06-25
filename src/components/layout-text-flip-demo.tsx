"use client";
import { LayoutTextFlip } from "@/components/ui/layout-text-flip";

export default function LayoutTextFlipDemo() {
  return (
    <div className="flex flex-col items-start gap-4">
      <LayoutTextFlip
        text="Build Amazing"
        words={["Landing Pages", "Component Blocks", "Page Sections", "3D Shaders"]}
      />
      <p className="text-sm text-muted-foreground">
        Experience the power of modern UI components that bring your ideas to
        life.
      </p>
    </div>
  );
}
