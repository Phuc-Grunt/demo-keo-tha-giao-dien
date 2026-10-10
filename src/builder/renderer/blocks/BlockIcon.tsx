import type { BuilderBlock } from "../../domain/model";

interface BlockIconProps {
  block: BuilderBlock;
  iconKey: string;
  defaultName: string;
}

/** Hiển thị Bootstrap Icon và giữ khóa để HTML nhập lại ánh xạ đúng vào block. */
const BlockIcon = ({ block, iconKey, defaultName }: BlockIconProps) => {
  const icon = iconKey === "hero" ? block.content.icon ?? block.content.icons?.[iconKey] : block.content.icons?.[iconKey];
  return <i className={`bi bi-${icon?.name ?? defaultName}`} style={{ fontSize: icon?.fontSize, color: icon?.color }} data-builder-icon={iconKey} aria-hidden="true" />;
};

export default BlockIcon;
