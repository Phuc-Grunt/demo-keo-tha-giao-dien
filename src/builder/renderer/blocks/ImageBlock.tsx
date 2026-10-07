import type { BlockViewProps } from "./types";
import SectionHeading from "./SectionHeading";

const ImageBlock = ({ block }: BlockViewProps) => {
  const { imageUrl, title } = block.content;

  return (
    <div className={`render-block portal-image-block`}>
      <div className="portal-image-wrapper" style={{ display: 'flex', justifyContent: 'center', width: '100%', height: '100%' }}>
        {imageUrl ? (
          <img 
            src={imageUrl} 
            alt={title || "Image"} 
            style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "inherit", display: "block" }} 
          />
        ) : (
          <div style={{ padding: '40px', background: '#f1f5f9', textAlign: 'center', width: '100%', borderRadius: 'inherit' }}>
            Chưa có hình ảnh. Vui lòng tải ảnh lên hoặc dán link ở bảng thuộc tính.
          </div>
        )}
      </div>
    </div>
  );
};

export default ImageBlock;
