import type { BlockViewProps } from "./types";
import BlockImage from "./BlockImage";

/** Hiển thị hình ảnh toàn khung hoặc có giới hạn tỷ lệ. */
const ImageBlock = ({ block, entries }: BlockViewProps) => {
  const image = entries?.[0];
  const variant = block.variant || "landscape"; // square, banner, landscape
  const imageUrl = block.content.imageUrl || image?.image_url;

  return (
    <div 
      id={block.id} 
      className={`render-block image-block-wrapper has-accent-color`} 
      data-variant={variant}
    >
      <BlockImage 
        src={imageUrl} 
        alt={block.content.title || "Image"} 
        eager={false}
        fallback={
          <div className="tab-thumb-fallback flex items-center justify-center w-full h-full text-sm font-semibold opacity-60">
            [ No Image ]
          </div>
        }
      />
    </div>
  );
};

export default ImageBlock;
