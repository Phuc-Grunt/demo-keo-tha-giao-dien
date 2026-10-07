import type { BlockViewProps } from "./types";
import { gridColumnsStyle } from "./types";
import { getBlockSource } from "../../domain/model";
import SectionHeading from "./SectionHeading";

/** Hiển thị các chỉ số thống kê của khối. */
const StatsBlock = ({ block, entries }: BlockViewProps) => {
  const stats =
    entries?.map((entry) => ({
      id: entry.id,
      value: entry.metric_value || "—",
      label: entry.title,
    })) ??
    block.content.items.slice(0, getBlockSource(block).limit).map((item) => {
      return {
        id: item.id,
        value: item.value || "—",
        label: item.label || "Chỉ số",
      };
    });
  return (
    <section
      id={block.id}
      className={`render-block stats-section accent-${block.theme.accent}`}
    >
      <SectionHeading block={block} />
      <div className="stats-grid" style={gridColumnsStyle(block)}>
        {stats.map((stat) => (
          <div className="stat-card" key={stat.id}>
            <strong>{stat.value}</strong>
            <span>{stat.label}</span>
          </div>
        ))}
        {entries?.length === 0 && (
          <p className="news-empty">Chưa có số liệu.</p>
        )}
      </div>
    </section>
  );
};

export default StatsBlock;
