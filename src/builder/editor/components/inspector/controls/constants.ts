import type { BlockTheme } from "../../../../domain/model";
interface FontOption { value: string; label: string }
/** Màu preset dùng chung cho các control của Inspector. */
export const defaultAccentColors: Record<BlockTheme["accent"], string> = { blue: "#1663b2", red: "#bb454b", green: "#218e73" };
export const COLOR_SWATCHES: string[] = ["#1663b2", "#bb454b", "#218e73", "#0f4079", "#2563eb", "#0ea5e9", "#06b6d4", "#14b8a6", "#16a34a", "#84cc16", "#eab308", "#f59e0b", "#f97316", "#ef4444", "#db2777", "#a855f7", "#7c3aed", "#4f46e5", "#64748b", "#334155", "#0f172a", "#78350f", "#6b7280", "#000000"];
export const PAGE_WIDTH_PRESETS: number[] = [960, 1140, 1280, 1440, 1600];
export const FONT_OPTIONS: FontOption[] = [
  { value: "", label: "Mặc định (Arial)" }, { value: "Inter, sans-serif", label: "Inter" }, { value: "Roboto, sans-serif", label: "Roboto" },
  { value: "'Open Sans', sans-serif", label: "Open Sans" }, { value: "'Montserrat', sans-serif", label: "Montserrat" }, { value: "'Lora', serif", label: "Lora" }, { value: "'Merriweather', serif", label: "Merriweather" },
];
