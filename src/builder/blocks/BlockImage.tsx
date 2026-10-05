/* eslint-disable @next/next/no-img-element */
import type { ReactNode } from "react";

//BlockImage là component dùng để hiển thị ảnh theo một cách thống nhất và an toàn trong các block.
interface BlockImageProps {
  src?: string | null; //Đường dẫn của ảnh cần hiển thị.
  alt: string; //Nội dung mô tả ảnh.
  fallback: ReactNode; // Nội dung dự phòng sẽ hiển thị khi không có ảnh hợp lệ.

  /**
   * Quyết định cách trình duyệt tải ảnh.
   * true  -> loading="eager": tải ảnh ngay lập tức.
   * false -> loading="lazy": chỉ tải khi ảnh gần xuất hiện trên màn hình.
   *
   * Mặc định là false.
   */
  eager?: boolean;
}

const BlockImage = ({
  src,
  alt,
  fallback,
  eager = false,
}: BlockImageProps) => {
  
  const safeSrc =
    src &&
    ((src.startsWith("/") && !src.startsWith("//")) ||
      src.startsWith("https://") || /^data:image\/(png|jpeg|gif|webp|avif);base64,[\da-z+/=\s]+$/i.test(src))
      ? src
      : null;

  return safeSrc ? (
    <img
      src={safeSrc}
      alt={alt}
      loading={eager ? "eager" : "lazy"}
      className="block-data-image"
    />
  ) : (
    <>{fallback}</>
  );
};

export default BlockImage;
