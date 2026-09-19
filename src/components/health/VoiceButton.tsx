import { useEffect, useRef, useState } from "react";
import { Mic, MicOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { parseSpokenNumbers } from "@/lib/health/voice";

// Voice dictation is capability-gated: the button only renders where the
// browser supports Chinese speech recognition. No audio ever leaves the device.
type SR = typeof window extends never ? never : any;

export function supportsSpeechRecognition(): boolean {
  if (typeof window === "undefined") return false;
  const w = window as unknown as Record<string, unknown>;
  return Boolean(w["SpeechRecognition"] || w["webkitSpeechRecognition"]);
}

export function VoiceButton({
  onNumbers,
}: {
  onNumbers: (numbers: number[], transcript: string) => void;
}) {
  const [supported, setSupported] = useState(false);
  const [listening, setListening] = useState(false);
  const recRef = useRef<SR>(null);

  useEffect(() => setSupported(supportsSpeechRecognition()), []);
  if (!supported) return null;

  const start = () => {
    const w = window as unknown as Record<string, any>;
    const Ctor = w["SpeechRecognition"] || w["webkitSpeechRecognition"];
    const rec = new Ctor();
    rec.lang = "zh-HK";
    rec.interimResults = false;
    rec.maxAlternatives = 1;
    rec.onresult = (e: any) => {
      const transcript: string = e.results[0][0].transcript ?? "";
      const nums = parseSpokenNumbers(transcript);
      onNumbers(nums, transcript);
    };
    rec.onend = () => setListening(false);
    rec.onerror = () => setListening(false);
    recRef.current = rec;
    setListening(true);
    rec.start();
  };

  const stop = () => {
    recRef.current?.stop();
    setListening(false);
  };

  return (
    <Button
      type="button"
      onClick={listening ? stop : start}
      variant={listening ? "destructive" : "outline"}
      size="lg"
      className={`inline-flex min-h-14 min-w-14 items-center justify-center gap-2 rounded-full border px-5 text-base font-medium transition-colors ${
        listening
          ? "border-destructive"
          : "border-border bg-card text-foreground hover:bg-secondary"
      }`}
      aria-pressed={listening}
    >
      {listening ? <MicOff className="size-6" /> : <Mic className="size-6" />}
      {listening ? "停止" : "語音輸入"}
    </Button>
  );
}
