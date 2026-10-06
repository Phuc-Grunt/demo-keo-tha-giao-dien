"use client";

import type { CSSProperties } from "react";
import { BlockRenderer } from "../renderer/BlockRenderer";
import type { BuilderDocument } from "../domain/model";

interface HtmlTemplateProps { document: BuilderDocument }

/** Tệp trao đổi chỉ chứa vùng block; khung cổng thông tin được ứng dụng ghép khi hiển thị. */
const HtmlTemplate = ({ document }: HtmlTemplateProps) => {
  const style: CSSProperties & Record<`--${string}`, string> = {
    ...(document.theme.primaryColor ? { "--theme-color": document.theme.primaryColor } : {}),
    ...(document.theme.fontFamily ? { "--theme-font": document.theme.fontFamily } : {}),
  };
  return <div className="portal-page" data-builder-page style={style}>
    <main className="portal-content" data-builder-page-blocks>
      {document.blocks.map((block) => <BlockRenderer key={block.id} block={block} isEditor={false} />)}
    </main>
  </div>;
};

export default HtmlTemplate;
