import type { BlockViewProps } from "./types";
import { SectionHeading } from "./SectionHeading";

export function TextBlock({ block, entries }: BlockViewProps) {
  const entry = entries?.[0];
  return <section id={block.id} className={`render-block content-section text-section accent-${block.accent}`}>
    <SectionHeading block={block} title={entry?.title} description={entry?.description} />
  </section>;
}
