import { useRef } from "react";
import { Camera, SkipForward } from "lucide-react";

import { Button } from "@/components/ui/button";

interface PhotoStepProps {
  onCaptured: (file: File) => void;
  onSkip: () => void;
}

// "Camera opens via capture='environment'" — the native camera app,
// not a getUserMedia video preview (session-pack.md, Session 5a/5b).
// A programmatic .click() on mount would be blocked by browsers as not
// being a genuine user gesture, so "opens immediately" means the
// shutter is the first and only thing on screen, one tap away, not a
// truly automatic launch.
export function PhotoStep({ onCaptured, onSkip }: PhotoStepProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="flex min-h-[70vh] w-full flex-col items-center justify-center gap-6 p-4">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onCaptured(file);
          e.target.value = "";
        }}
      />
      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        className="flex size-40 items-center justify-center rounded-full border-4 border-primary bg-primary/10 text-primary transition-colors hover:bg-primary/20 active:scale-95"
        aria-label="Take photo"
      >
        <Camera className="size-14" aria-hidden />
      </button>
      <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground" onClick={onSkip}>
        <SkipForward className="size-3.5" aria-hidden />
        Skip photo
      </Button>
    </div>
  );
}
