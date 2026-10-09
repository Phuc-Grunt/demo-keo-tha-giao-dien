"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Blocks, LayoutTemplate, Plus, Search, Trash2 } from "lucide-react";
import { TEMPLATE_DRAFT_STORAGE_KEY, useBuilderStore } from "./editor/store";
import * as builderApi from "./builderApi";
import type { PageTemplateSummary } from "@/lib/supabase";

/** Kho mẫu: mở trình soạn mẫu, tìm kiếm và áp dụng mẫu vào bản nháp cục bộ. */
const TemplateLibrary = () => {
  const router = useRouter();
  const load = useBuilderStore((state) => state.load);
  const [hydrated, setHydrated] = useState(false);
  const [templates, setTemplates] = useState<PageTemplateSummary[]>([]);
  const [hasTemplateDraft, setHasTemplateDraft] = useState(false);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [error, setError] = useState("");

  // Trang có thể được mở trực tiếp, nên khôi phục bản nháp trang chủ trước khi áp dụng mẫu.
  useEffect(() => {
    setHasTemplateDraft(Boolean(localStorage.getItem(TEMPLATE_DRAFT_STORAGE_KEY)));
    if (useBuilderStore.persist.hasHydrated()) { setHydrated(true); return; }
    void Promise.resolve(useBuilderStore.persist.rehydrate()).then(() => setHydrated(true)).catch(() => {
      setHydrated(true);
      setError("Không thể khôi phục bản nháp trong trình duyệt.");
    });
  }, []);

  useEffect(() => {
    void builderApi.getPageTemplates().then(setTemplates).catch((cause: Error) => {
      setError(cause.message);
    }).finally(() => setLoading(false));
  }, []);

  /** Mở builder trong phiên riêng; tạo mới xóa bản nháp mẫu trước đó. */
  function openTemplateEditor(fresh: boolean) {
    if (fresh) localStorage.removeItem(TEMPLATE_DRAFT_STORAGE_KEY);
    window.location.assign("/templates/new");
  }

  /** Nạp bản sao vào builder; thao tác xuất bản vẫn do người dùng quyết định. */
  async function useTemplate(template: PageTemplateSummary) {
    setPendingId(template.id); setError("");
    try {
      const saved = await builderApi.getPageTemplate(template.id);
      load({ ...structuredClone(saved), meta: { ...saved.meta, name: template.name } });
      router.push("/");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Không thể sử dụng mẫu.");
      setPendingId(null);
    }
  }

  /** Chỉ xóa bản mẫu được chọn khỏi kho. */
  async function removeTemplate(template: PageTemplateSummary) {
    if (!window.confirm(`Xóa mẫu “${template.name}” khỏi kho?`)) return;
    setPendingId(template.id); setError("");
    try {
      await builderApi.deletePageTemplate(template.id);
      setTemplates((current) => current.filter((item) => item.id !== template.id));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Không thể xóa mẫu.");
    } finally { setPendingId(null); }
  }

  const visibleTemplates = templates.filter((template) => template.name.toLocaleLowerCase("vi-VN").includes(search.trim().toLocaleLowerCase("vi-VN")));

  return <div className="template-library">
    <header className="template-library-header">
      <Link href="/" className="template-library-back"><ArrowLeft size={17} /> Trở lại trình dựng</Link>
      <div className="template-library-brand"><Blocks size={18} /> MOET Builder</div>
    </header>
    <main className="template-library-main">
      <div className="template-library-intro">
        <span className="template-library-kicker">THƯ VIỆN BỐ CỤC</span>
        <h1>Kho mẫu giao diện</h1>
        <p>Tạo và chỉnh sửa nhiều bố cục để sử dụng lại. Khi chọn một mẫu, bản nháp trang chủ được thay bằng bản sao của mẫu đó.</p>
      </div>

      <section className="template-save-panel" aria-labelledby="template-save-title">
        <div className="template-save-icon"><Plus size={22} /></div>
        <div className="template-save-copy">
          <h2 id="template-save-title">Tạo mẫu mới</h2>
          <p>Mở trình dựng với bố cục trống, chỉnh sửa rồi nhấn Lưu mẫu. Bản nháp trang chủ được giữ riêng.</p>
          <span>Mẫu chỉ xuất hiện trong kho sau khi bạn lưu từ trình dựng.</span>
        </div>
        <div className="template-start-actions">
          <button type="button" onClick={() => openTemplateEditor(true)}><Plus size={16} /> Tạo mẫu mới</button>
          {hasTemplateDraft && <button type="button" className="template-resume-button" onClick={() => openTemplateEditor(false)}>Tiếp tục bản nháp</button>}
        </div>
      </section>

      <div className="template-library-list-heading">
        <div><h2>Các mẫu đã lưu</h2><span>{templates.length} mẫu</span></div>
        <label className="template-search"><Search size={17} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Tìm theo tên mẫu" aria-label="Tìm theo tên mẫu" /></label>
      </div>
      {error && <div className="template-error" role="alert">{error}</div>}
      {loading ? <p className="template-empty">Đang tải kho mẫu...</p> : visibleTemplates.length === 0 ?
        <div className="template-empty"><LayoutTemplate size={28} /><strong>{search ? "Không tìm thấy mẫu phù hợp" : "Kho mẫu chưa có bố cục nào"}</strong><span>{search ? "Thử một tên khác." : "Tạo mẫu mới để bắt đầu."}</span></div> :
        <div className="template-grid">{visibleTemplates.map((template, index) =>
          <article className="template-card" key={template.id}>
            <div className="template-card-visual" aria-hidden="true">
              <div className="template-card-top"><span /><span /><span /></div>
              <div className="template-card-banner"><i /><i /></div>
              <div className="template-card-lines"><span /><span /><span /></div>
              <b>{String(index + 1).padStart(2, "0")}</b>
            </div>
            <div className="template-card-body">
              <h3>{template.name}</h3>
              <p>{template.block_count} khối cấp trang · Lưu ngày {new Date(template.created_at).toLocaleDateString("vi-VN")}</p>
              <div className="template-card-actions">
                <button type="button" className="template-use-button" onClick={() => void useTemplate(template)} disabled={pendingId !== null || !hydrated}>
                  {pendingId === template.id ? "Đang xử lý..." : "Sử dụng mẫu"} <ArrowRight size={15} />
                </button>
                <button type="button" className="template-delete-button" onClick={() => void removeTemplate(template)} disabled={pendingId !== null} title={`Xóa mẫu ${template.name}`} aria-label={`Xóa mẫu ${template.name}`}><Trash2 size={16} /></button>
              </div>
            </div>
          </article>
        )}</div>}
    </main>
  </div>;
};

export default TemplateLibrary;
