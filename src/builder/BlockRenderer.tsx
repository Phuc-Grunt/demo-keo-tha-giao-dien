import type { BlockViewProps } from "./blocks/types";
import HeroBlock from "./blocks/HeroBlock";
import NewsBlock from "./blocks/NewsBlock";
import NoticeBlock from "./blocks/NoticeBlock";
import StatsBlock from "./blocks/StatsBlock";
import LinksBlock from "./blocks/LinksBlock";
import TextBlock from "./blocks/TextBlock";
import GalleryBlock from "./blocks/GalleryBlock";
import TickerBlock from "./blocks/TickerBlock";
import FeaturedBlock from "./blocks/FeaturedBlock";
import EventsBlock from "./blocks/EventsBlock";
import VideoBlock from "./blocks/VideoBlock";
import ColumnsBlock from "./blocks/ColumnsBlock/ColumnsBlock";
import TabsBlock from "./blocks/TabsBlock";

/** Chọn component hiển thị tương ứng với loại khối. */
export const BlockRenderer = (props: BlockViewProps) => {
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
};
