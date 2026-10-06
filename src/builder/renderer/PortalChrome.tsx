import { BookOpen } from "lucide-react";
import type { CSSProperties, ReactNode } from "react";
import type { BuilderDocument } from "../domain/model";
import { pageAppearanceCss } from "./appearance";

interface PortalChromeProps { children: ReactNode; document: BuilderDocument }
/** Ghép khung cổng thông tin và áp dụng theme/page từ cùng tài liệu chuẩn. */
export const PortalChrome = ({ children, document }: PortalChromeProps) => {
  const style: CSSProperties & Record<`--${string}`, string> = {
    ...(document.theme.primaryColor ? { "--theme-color": document.theme.primaryColor } : {}),
    ...(document.theme.fontFamily ? { "--theme-font": document.theme.fontFamily } : {}),
  };
  return <div className="portal-page" data-builder-page style={style}>
    <style data-builder-managed-style>{pageAppearanceCss(document)}</style>
    <div className="portal-topline"><span>Thứ Ba, ngày 29 tháng 9 năm 2026</span><span>English <span className="topline-divider">|</span> Liên hệ</span></div>
    <div className="portal-header">
      <div className="portal-seal"><BookOpen size={25} strokeWidth={1.6} /></div>
      <div className="portal-brand"><small>BỘ GIÁO DỤC VÀ ĐÀO TẠO</small><strong>CỔNG THÔNG TIN ĐIỆN TỬ</strong><span>Ministry of Education and Training</span></div>
      <div className="portal-header-right">Thông tin chính thống<br /><strong>Kết nối tri thức Việt</strong></div>
    </div>
    <nav className="portal-nav"><span className="active">Trang chủ</span><span>Giới thiệu</span><span>Tin tức</span><span>Văn bản</span><span>Dịch vụ công</span><span>Liên hệ</span></nav>
    <main className="portal-content" data-builder-page-blocks>{children}</main>
    <footer className="portal-footer"><div><strong>CỔNG THÔNG TIN ĐIỆN TỬ</strong><span>Bộ Giáo dục và Đào tạo · Bản xem trước giao diện</span></div><span>© 2026 MOET</span></footer>
  </div>;
};
