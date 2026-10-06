import type { CSSProperties, ReactNode } from "react";
import type { BlockViewProps } from "./blocks/types";
import { blockAppearanceCss } from "./appearance";
import type { BuilderBlock } from "../domain/model";
import HeroBlock from "./blocks/HeroBlock";
import NewsBlock from "./blocks/NewsBlock";
import NoticeBlock from "./blocks/NoticeBlock";
import StatsBlock from "./blocks/StatsBlock";
import LinksBlock from "./blocks/LinksBlock";
import TextBlock from "./blocks/TextBlock";
import GalleryBlock from "./blocks/GalleryBlock";
import TickerBlock from "./blocks/TickerBlock";
import FeaturedBlock from "./blocks/FeaturedBlock";
import VideoBlock from "./blocks/VideoBlock";
import EventsBlock from "./blocks/EventsBlock";
import TabsBlock from "./blocks/TabsBlock";
import ColumnsBlock from "./blocks/ColumnsBlock/ColumnsBlock";

/** Style cho phép gán biến CSS tùy chỉnh (bắt đầu bằng "--"). */
type CssVarStyle = CSSProperties & Record<`--${string}`, string>;

interface BlockStyleHooks {
  className: string;
  style: CSSProperties;
}

/**
 * Chuyển màu nhấn tùy ý và kiểu chữ của khối thành class + biến CSS.
 * portal.css dùng các class này để ghi đè giao diện mặc định của từng loại khối.
 */
function blockStyleHooks(block: BuilderBlock): BlockStyleHooks {
  const classes = ["block-wrap"];
  const vars: CssVarStyle = {};
  const accent = block.theme.accentColor;
  if (accent) {
    classes.push("has-accent-color");
    vars["--block-accent"] = accent;
  }
  if (block.theme.fontFamily) {
    classes.push("has-custom-font");
    vars["--theme-font"] = block.theme.fontFamily;
  }
  // Kiểu chữ của field được sinh cùng responsive trong blockAppearanceCss.
  return { className: classes.join(" "), style: vars };
}

/** Chọn component hiển thị theo loại khối, kèm lớp bọc áp dụng tùy chỉnh màu/chữ. */
export const BlockRenderer = (props: BlockViewProps) => {
  const hooks = blockStyleHooks(props.block);
  let content: ReactNode = null;
  switch (props.block.kind) {
    case "hero": content = <HeroBlock {...props} />; break;
    case "news": content = <NewsBlock {...props} />; break;
    case "notice": content = <NoticeBlock {...props} />; break;
    case "stats": content = <StatsBlock {...props} />; break;
    case "links": content = <LinksBlock {...props} />; break;
    case "text": content = <TextBlock {...props} />; break;
    case "gallery": content = <GalleryBlock {...props} />; break;
    case "ticker": content = <TickerBlock {...props} />; break;
    case "featured": content = <FeaturedBlock {...props} />; break;
    case "video": content = <VideoBlock {...props} />; break;
    case "events": content = <EventsBlock {...props} />; break;
    case "tabs": content = <TabsBlock {...props} />; break;
    case "columns": content = <ColumnsBlock {...props} />; break;
  }
  return <div className={hooks.className} style={hooks.style} data-builder-block-id={props.block.id} data-builder-block-kind={props.block.kind}>
    <style data-builder-managed-style>{blockAppearanceCss(props.block)}</style>
    {content}
  </div>;
};
