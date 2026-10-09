import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { z } from "zod";
import { templateSelectors } from "../renderer/appearance";
import { blockKinds, documentSchema, findBlock, getBlockSource, makeBlock, starterDocument, type BuilderBlock, type BuilderContent, type BuilderDocument, type BlockKind, type BlockSourceConfig, type BlockTheme } from "../domain/model";

interface BuilderState {
  document: BuilderDocument; selectedId: string | null; past: BuilderDocument[]; future: BuilderDocument[];
  select: (id: string | null) => void;
  rename: (name: string) => void; setPageWidth: (width: number) => void; setThemeColor: (color: string) => void; setThemeFont: (font: string) => void;
  add: (kind: BlockKind, beforeId?: string) => void; move: (id: string, overId?: string) => void; moveNode: (activeId: string, overId: string | null) => void;
  update: (id: string, patch: Partial<BuilderBlock>) => void;
  updateContent: (id: string, patch: Partial<BuilderContent>) => void;
  updateTheme: (id: string, patch: Partial<BlockTheme>) => void;
  updateSource: (id: string, source: BlockSourceConfig) => void;
  remove: (id: string) => void; duplicate: (id: string) => void;
  undo: () => void; redo: () => void; load: (document: BuilderDocument) => void; reset: () => void;
  addToSlot: (parentId: string, colIdx: number, kind: BlockKind) => void;
  removeFromSlot: (parentId: string, colIdx: number, blockId: string) => void;
  moveInSlot: (parentId: string, colIdx: number, activeId: string, overId: string) => void;
  moveBetweenSlots: (parentId: string, fromCol: number, toCol: number, blockId: string, overBlockId?: string) => void;
  updateSlotBlock: (parentId: string, colIdx: number, blockId: string, patch: Partial<BuilderBlock>) => void;
  setSlotCount: (parentId: string, numCols: number) => void;
}
interface NodeLocation { blocks: BuilderBlock[]; index: number; block: BuilderBlock }
const savedStateSchema = z.object({ document: documentSchema });
export const TEMPLATE_DRAFT_STORAGE_KEY = "moet-template-builder-draft-v1";
const PAGE_DRAFT_STORAGE_KEY = "moet-visual-builder-demo-v1";
const editingTemplate = typeof window !== "undefined" && window.location.pathname === "/templates/new";
const initialDocument: BuilderDocument = editingTemplate
  ? { ...structuredClone(starterDocument), meta: { name: "Mẫu mới" }, blocks: [] }
  : structuredClone(starterDocument);

/** Áp dụng cập nhật vào một khối ở bất kỳ slot nào. */
function mapBlock(blocks: BuilderBlock[], id: string, transform: (block: BuilderBlock) => BuilderBlock): BuilderBlock[] {
  return blocks.map((block) => block.id === id ? transform(block) : block.slots
    ? { ...block, slots: block.slots.map((slot) => ({ ...slot, blocks: mapBlock(slot.blocks, id, transform) })) } : block);
}
/** Tìm mảng sở hữu khối để di chuyển cùng một quy tắc cho mọi tầng. */
function locate(blocks: BuilderBlock[], id: string): NodeLocation | undefined {
  for (let index = 0; index < blocks.length; index++) {
    const block = blocks[index];
    if (block.id === id) return { blocks, index, block };
    for (const slot of block.slots ?? []) { const found = locate(slot.blocks, id); if (found) return found; }
  }
  return undefined;
}
/** Giữ tài liệu chuẩn và lịch sử hoàn tác trong cùng một giao dịch. */
function commit(state: BuilderState, document: BuilderDocument, selectedId = state.selectedId): Partial<BuilderState> {
  return { document, selectedId: selectedId && findBlock(document.blocks, selectedId) ? selectedId : null, past: [...state.past.slice(-29), state.document], future: [] };
}
/** Nhân bản cây với ID mới cho cả khối con, mục và slot. */
function cloneBlock(block: BuilderBlock): BuilderBlock {
  const clone = structuredClone(block); clone.id = crypto.randomUUID();
  clone.content.items = clone.content.items.map((item) => ({ ...item, id: crypto.randomUUID() }));
  clone.slots = clone.slots?.map((slot) => ({ ...slot, id: crypto.randomUUID(), blocks: slot.blocks.map(cloneBlock) }));
  return clone;
}
/** Chuyển cấu hình control thành các nhóm JSON, bảo toàn style đã sửa trong HTML. */
function withSource(block: BuilderBlock, source: BlockSourceConfig): BuilderBlock {
  if (block.kind === "columns") {
    const previous = getBlockSource(block);
    return { ...block,
      layout: { ...block.layout, gap: source.gap, gridTemplateColumns: source.gridTemplate || undefined },
      style: { ...block.style, backgroundColor: source.backgroundColor || undefined,
        padding: source.padding === previous.padding ? block.style?.padding : source.padding === undefined ? undefined : { top: source.padding, right: source.padding, bottom: source.padding, left: source.padding } },
    };
  }
  const data = block.data;
  return { ...block,
    data: data ? { ...data, source: data.source.type === "articles" ? { ...data.source, categorySlug: source.categorySlug } : data.source,
      query: { ...data.query, limit: source.limit, ...(data.source.type === "articles" ? { mode: source.mode } : {}) } } : undefined,
    parts: templateSelectors[block.kind].parts.items
      ? { ...block.parts, items: { ...block.parts?.items, layout: { ...block.parts?.items?.layout, columns: source.columns } } }
      : block.parts,
  };
}

/** Store lưu duy nhất JSON v2; dữ liệu cũ được chuyển khi khôi phục localStorage. */
export const useBuilderStore = create<BuilderState>()(persist((set, get) => ({
  document: initialDocument, selectedId: editingTemplate ? null : "demo-hero", past: [], future: [],
  select: (selectedId) => set({ selectedId }),
  rename: (name) => set((state) => commit(state, { ...state.document, meta: { ...state.document.meta, name } })),
  setPageWidth: (maxWidth) => set((state) => commit(state, { ...state.document, page: { ...state.document.page, layout: { ...state.document.page.layout, maxWidth } } })),
  setThemeColor: (primaryColor) => set((state) => commit(state, { ...state.document, theme: { ...state.document.theme, primaryColor: primaryColor || undefined } })),
  setThemeFont: (fontFamily) => set((state) => commit(state, { ...state.document, theme: { ...state.document.theme, fontFamily: fontFamily || undefined } })),
  add: (kind, beforeId) => set((state) => {
    const block = makeBlock(kind); const blocks = [...state.document.blocks]; const index = blocks.findIndex((item) => item.id === beforeId);
    blocks.splice(index < 0 ? blocks.length : index, 0, block);
    return commit(state, { ...state.document, blocks }, block.id);
  }),
  move: (id, overId) => set((state) => {
    const blocks = structuredClone(state.document.blocks); const active = locate(blocks, id);
    if (!active || id === overId) return state;
    const moved = active.block; active.blocks.splice(active.index, 1);
    const target = overId ? locate(blocks, overId) : undefined;
    if (target) target.blocks.splice(target.index, 0, moved); else blocks.push(moved);
    return commit(state, { ...state.document, blocks }, id);
  }),
  moveNode: (activeId, overId) => set((state) => {
    if (activeId === overId) return state;
    const blocks = structuredClone(state.document.blocks); const active = locate(blocks, activeId);
    const slotMatch = overId?.match(/^slot:(.*):(\d+)$/);
    const targetId = slotMatch?.[1] ?? overId;
    if (active && targetId && findBlock([active.block], targetId)) return state;
    const originalTarget = overId && !slotMatch ? locate(blocks, overId) : undefined;
    if (active && originalTarget && active.blocks === originalTarget.blocks) {
      active.blocks.splice(active.index, 1); active.blocks.splice(originalTarget.index, 0, active.block);
      return commit(state, { ...state.document, blocks }, activeId);
    }
    let moved: BuilderBlock;
    if (active) { moved = active.block; active.blocks.splice(active.index, 1); }
    else {
      const kind = blockKinds.find((candidate) => `palette:${candidate}` === activeId);
      if (!kind) return state; moved = makeBlock(kind);
    }
    if (slotMatch) {
      const parent = findBlock(blocks, slotMatch[1]); const slot = parent?.slots?.[Number(slotMatch[2])];
      if (!slot) return state; slot.blocks.push(moved);
    } else {
      const target = overId ? locate(blocks, overId) : undefined;
      if (target) target.blocks.splice(target.index, 0, moved); else blocks.push(moved);
    }
    return commit(state, { ...state.document, blocks }, moved.id);
  }),
  update: (id, patch) => set((state) => commit(state, { ...state.document, blocks: mapBlock(state.document.blocks, id, (block) => ({ ...block, ...patch, id: block.id, kind: block.kind })) })),
  updateContent: (id, patch) => set((state) => commit(state, { ...state.document, blocks: mapBlock(state.document.blocks, id, (block) => ({ ...block, content: { ...block.content, ...patch } })) })),
  updateTheme: (id, patch) => set((state) => commit(state, { ...state.document, blocks: mapBlock(state.document.blocks, id, (block) => ({ ...block, theme: { ...block.theme, ...patch } })) })),
  updateSource: (id, source) => set((state) => commit(state, { ...state.document, blocks: mapBlock(state.document.blocks, id, (block) => withSource(block, source)) })),
  remove: (id) => set((state) => {
    const blocks = structuredClone(state.document.blocks); const location = locate(blocks, id);
    if (!location) return state; location.blocks.splice(location.index, 1);
    return commit(state, { ...state.document, blocks });
  }),
  duplicate: (id) => set((state) => {
    const blocks = structuredClone(state.document.blocks); const location = locate(blocks, id);
    if (!location) return state; const clone = cloneBlock(location.block); location.blocks.splice(location.index + 1, 0, clone);
    return commit(state, { ...state.document, blocks }, clone.id);
  }),
  undo: () => set((state) => state.past.length ? { document: state.past[state.past.length - 1], past: state.past.slice(0, -1), future: [state.document, ...state.future], selectedId: null } : state),
  redo: () => set((state) => state.future.length ? { document: state.future[0], past: [...state.past.slice(-29), state.document], future: state.future.slice(1), selectedId: null } : state),
  load: (document) => set((state) => commit(state, documentSchema.parse(document), null)),
  reset: () => set((state) => commit(state, structuredClone(initialDocument), editingTemplate ? null : "demo-hero")),
  addToSlot: (parentId, colIdx, kind) => set((state) => {
    const block = makeBlock(kind);
    const blocks = mapBlock(state.document.blocks, parentId, (parent) => ({ ...parent, slots: parent.slots?.map((slot, index) => index === colIdx ? { ...slot, blocks: [...slot.blocks, block] } : slot) }));
    return commit(state, { ...state.document, blocks }, block.id);
  }),
  removeFromSlot: (_parentId, _colIdx, blockId) => get().remove(blockId),
  moveInSlot: (_parentId, _colIdx, activeId, overId) => get().moveNode(activeId, overId),
  moveBetweenSlots: (parentId, _fromCol, toCol, blockId, overBlockId) => get().moveNode(blockId, overBlockId ?? `slot:${parentId}:${toCol}`),
  updateSlotBlock: (_parentId, _colIdx, blockId, patch) => get().update(blockId, patch),
  setSlotCount: (parentId, numCols) => set((state) => {
    if (!Number.isInteger(numCols) || numCols < 1 || numCols > 6) return state;
    const blocks = mapBlock(state.document.blocks, parentId, (parent) => {
      const existing = parent.slots ?? []; const slots = existing.slice(0, numCols).map((slot) => ({ ...slot, blocks: [...slot.blocks] }));
      while (slots.length < numCols) slots.push({ id: crypto.randomUUID(), blocks: [] });
      // Khi giảm số cột, giữ các khối cũ ở cột cuối thay vì xóa nội dung.
      slots[numCols - 1].blocks.push(...existing.slice(numCols).flatMap((slot) => slot.blocks));
      return { ...parent, slots, layout: { ...parent.layout, gridTemplateColumns: undefined } };
    });
    return commit(state, { ...state.document, blocks });
  }),
}), {
  name: editingTemplate ? TEMPLATE_DRAFT_STORAGE_KEY : PAGE_DRAFT_STORAGE_KEY,
  version: 2, storage: createJSONStorage(() => localStorage), skipHydration: true,
  partialize: (state) => ({ document: state.document }),
  migrate: (saved) => savedStateSchema.parse(saved),
  merge: (saved, current) => { const parsed = savedStateSchema.safeParse(saved); return parsed.success ? { ...current, document: parsed.data.document } : current; },
}));
