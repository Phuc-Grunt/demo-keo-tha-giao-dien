import type { CSSProperties } from "react";
import type { BuilderBlock } from "../model";
import { getBlockSource } from "../model";
import type { Article, ContentEntry } from "@/lib/supabase";

export type BlockViewProps = {
  block: BuilderBlock;
  articles?: Article[];
  entries?: ContentEntry[];
};

export function gridColumnsStyle(block: BuilderBlock): CSSProperties {
  return { "--block-columns": getBlockSource(block).columns ?? 3 } as CSSProperties;
}

export function fallbackItems(block: BuilderBlock): string[] {
  return block.items.slice(0, getBlockSource(block).limit);
}

export function safeHref(value: string | null | undefined): string | undefined {
  if (!value) return undefined;
  if ((value.startsWith("/") && !value.startsWith("//")) || value.startsWith("#")) return value;
  try { return new URL(value).protocol === "https:" ? value : undefined; }
  catch { return undefined; }
}
