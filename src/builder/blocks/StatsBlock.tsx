import type { BlockViewProps } from "./types";
import { fallbackItems, gridColumnsStyle } from "./types";
import { SectionHeading } from "./SectionHeading";

export function StatsBlock({ block, entries }: BlockViewProps) {
  const stats = entries?.map((entry) => ({ id: entry.id, value: entry.metric_value || "—", label: entry.title }))
    ?? fallbackItems(block).map((item, index) => { const [value, label] = item.split("|"); return { id: String(index), value: value || "—", label: label || "Chỉ số" }; });
  return <section id={block.id} className={`render-block stats-section accent-${block.accent}`}>
    <SectionHeading block={block} />
    <div className="stats-grid" style={gridColumnsStyle(block)}>
      {stats.map((stat) => <div className="stat-card" key={stat.id}><strong>{stat.value}</strong><span>{stat.label}</span></div>)}
      {entries?.length === 0 && <p className="news-empty">Chưa có số liệu.</p>}
    </div>
  </section>;
}
