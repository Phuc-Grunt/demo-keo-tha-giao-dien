import type { CSSProperties } from "react";
import type { BuilderBlock } from "../model";
import { getBlockSource } from "../model";
import type { Article, ContentEntry } from "@/lib/supabase";
import type { BlockData } from "../builderApi";

export type BlockViewProps = {
  block: BuilderBlock;
  articles?: Article[];
  entries?: ContentEntry[];
  isEditor?: boolean;
  dataByBlock?: Record<string, BlockData>;
};

export function gridColumnsStyle(block: BuilderBlock): CSSProperties {
  return { "--block-columns": getBlockSource(block).columns ?? 3 } as CSSProperties;
}

export function fallbackItems(block: BuilderBlock): string[] {
  return itemStrings(block).slice(0, getBlockSource(block).limit);
}

/** View dạng chuỗi cho các component cũ; tài liệu lưu các mục có ID và field rõ ràng. */
export function itemStrings(block: BuilderBlock): string[] {
  return block.content.items.map((item) => block.kind === "stats" ? `${item.value ?? ""}|${item.label ?? ""}` : item.title ?? "");
}

export function safeHref(value: string | null | undefined): string | undefined {
  if (!value) return undefined;
  if ((value.startsWith("/") && !value.startsWith("//")) || value.startsWith("#")) return value;
  try { return new URL(value).protocol === "https:" ? value : undefined; }
  catch { return undefined; }
}
