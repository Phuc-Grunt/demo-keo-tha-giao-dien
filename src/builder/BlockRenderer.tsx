import type { CSSProperties } from "react";
import type { BlockViewProps } from "./blocks/types";
import { sanitizeColor, type BuilderBlock, type TextStyleTarget } from "./model";
import { HeroBlock } from "./blocks/HeroBlock";
import { NewsBlock } from "./blocks/NewsBlock";
import { NoticeBlock } from "./blocks/NoticeBlock";
import { StatsBlock } from "./blocks/StatsBlock";
import { LinksBlock } from "./blocks/LinksBlock";
import { TextBlock } from "./blocks/TextBlock";
import { GalleryBlock } from "./blocks/GalleryBlock";
import { TickerBlock } from "./blocks/TickerBlock";
import { FeaturedBlock } from "./blocks/FeaturedBlock";
import { VideoBlock } from "./blocks/VideoBlock";
import { EventsBlock } from "./blocks/EventsBlock";
import { TabsBlock } from "./blocks/TabsBlock";
import { ColumnsBlock } from "./blocks/ColumnsBlock";

const textTargets: TextStyleTarget[] = ["eyebrow", "title", "description"];

/** Style cho phép gán biến CSS tùy chỉnh (bắt đầu bằng "--"). */
type CssVarStyle = CSSProperties & Record<`--${string}`, string>;

/**
 * Chuyển màu nhấn tùy ý và kiểu chữ của khối thành class + biến CSS.
 * portal.css dùng các class này để ghi đè giao diện mặc định của từng loại khối.
 */
function blockStyleHooks(block: BuilderBlock): { className: string; style: CSSProperties } {
  const classes = ["block-wrap"];
  const vars: CssVarStyle = {};
  const accent = sanitizeColor(block.accentColor);
  if (accent) {
    classes.push("has-accent-color");
    vars["--block-accent"] = accent;
  }
  for (const target of textTargets) {
    const textStyle = block.textStyles?.[target];
    if (textStyle?.size) {
      classes.push(`has-${target}-size`);
      vars[`--${target}-size`] = `${textStyle.size}px`;
    }
    const color = sanitizeColor(textStyle?.color);
    if (color) {
      classes.push(`has-${target}-color`);
      vars[`--${target}-color`] = color;
    }
  }
  return { className: classes.join(" "), style: vars };
}

/** Chọn component hiển thị theo loại khối, kèm lớp bọc áp dụng tùy chỉnh màu/chữ. */
export function BlockRenderer(props: BlockViewProps) {
  const hooks = blockStyleHooks(props.block);
  return <div className={hooks.className} style={hooks.style}>{renderBlock(props)}</div>;
}

function renderBlock(props: BlockViewProps) {
  switch (props.block.kind) {
    case "hero": return <HeroBlock {...props} />;
    case "news": return <NewsBlock {...props} />;
    case "notice": return <NoticeBlock {...props} />;
    case "stats": return <StatsBlock {...props} />;
    case "links": return <LinksBlock {...props} />;
    case "text": return <TextBlock {...props} />;
    case "gallery": return <GalleryBlock {...props} />;
    case "ticker": return <TickerBlock {...props} />;
    case "featured": return <FeaturedBlock {...props} />;
    case "video": return <VideoBlock {...props} />;
    case "events": return <EventsBlock {...props} />;
    case "tabs": return <TabsBlock {...props} />;
    case "columns": return <ColumnsBlock {...props} />;
    default: return null;
  }
}