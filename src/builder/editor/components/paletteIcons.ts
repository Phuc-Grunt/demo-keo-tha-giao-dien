import { Blocks, CalendarDays, Clapperboard, Columns2, Image as ImageIcon, LayoutGrid, LayoutTemplate, Link2, Megaphone, PanelTop, Rss, Type } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { BlockKind } from "../../domain/model";

const paletteIcons = {
  hero: ImageIcon,
  news: LayoutGrid,
  notice: Megaphone,
  stats: Blocks,
  links: Link2,
  text: Type,
  gallery: ImageIcon,
  ticker: Rss,
  featured: LayoutTemplate,
  video: Clapperboard,
  events: CalendarDays,
  tabs: PanelTop,
  columns: Columns2,
} satisfies Record<BlockKind, LucideIcon>;

export default paletteIcons;
