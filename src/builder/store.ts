import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import {
  BuilderBlock,
  BuilderDocument,
  BlockKind,
  makeBlock,
  starterDocument,
} from "./model";

type BuilderState = {
  document: BuilderDocument;
  selectedId: string | null;
  past: BuilderDocument[];
  future: BuilderDocument[];
  select: (id: string | null) => void;
  rename: (name: string) => void;
  /** Đổi độ rộng (px) của trang trong trình dựng và trang đã xuất bản. */
  setPageWidth: (width: number) => void;
  add: (kind: BlockKind, beforeId?: string) => void;
  move: (id: string, overId?: string) => void;
  moveNode: (activeId: string, overId: string | null) => void;
  update: (id: string, patch: Partial<BuilderBlock>) => void;
  remove: (id: string) => void;
  duplicate: (id: string) => void;
  undo: () => void;
  redo: () => void;
  load: (document: BuilderDocument) => void;
  reset: () => void;
  // ── Slot operations (dành cho block kind="columns") ──
  addToSlot:      (parentId: string, colIdx: number, kind: BlockKind) => void;
  removeFromSlot: (parentId: string, colIdx: number, blockId: string) => void;
  moveInSlot:     (parentId: string, colIdx: number, activeId: string, overId: string) => void;
  moveBetweenSlots:(parentId: string, fromCol: number, toCol: number, blockId: string, overBlockId?: string) => void;
  updateSlotBlock: (parentId: string, colIdx: number, blockId: string, patch: Partial<BuilderBlock>) => void;
  setSlotCount:   (parentId: string, numCols: number) => void;
};

function commit(
  state: BuilderState,
  blocks: BuilderBlock[],
  selectedId = state.selectedId,
): Partial<BuilderState> {
  if (blocks === state.document.blocks) return {};
  return {
    document: { ...state.document, blocks },
    selectedId,
    past: [...state.past.slice(-29), state.document],
    future: [],
  };
}

/** Thay thế block con trong slots của một parent block. */
function updateParent(
  blocks: BuilderBlock[],
  parentId: string,
  updater: (parent: BuilderBlock) => BuilderBlock,
): BuilderBlock[] {
  return blocks.map((b) => (b.id === parentId ? updater(b) : b));
}

export const useBuilderStore = create<BuilderState>()(
  persist(
    (set) => ({
      document: starterDocument,
      selectedId: "demo-hero",
      past: [],
      future: [],
      select: (selectedId) => set({ selectedId }),
      rename: (name) =>
        set((state) => ({
          document: { ...state.document, name },
          past: [...state.past.slice(-29), state.document],
          future: [],
        })),
      setPageWidth: (pageWidth) =>
        set((state) => {
          if (state.document.pageWidth === pageWidth) return state;
          return {
            document: { ...state.document, pageWidth },
            past: [...state.past.slice(-29), state.document],
            future: [],
          };
        }),
      add: (kind, beforeId) =>
        set((state) => {
          const block = makeBlock(kind);
          const index = beforeId
            ? state.document.blocks.findIndex((item) => item.id === beforeId)
            : -1;
          const blocks = [...state.document.blocks];
          blocks.splice(index < 0 ? blocks.length : index, 0, block);
          return commit(state, blocks, block.id);
        }),
      move: (id, overId) =>
        set((state) => {
          const blocks = [...state.document.blocks];
          const from = blocks.findIndex((block) => block.id === id);
          if (from < 0 || id === overId) return state;
          const [block] = blocks.splice(from, 1);
          const to = overId
            ? blocks.findIndex((item) => item.id === overId)
            : -1;
          blocks.splice(to < 0 ? blocks.length : to, 0, block);
          if (
            blocks.every(
              (item, index) => item.id === state.document.blocks[index]?.id,
            )
          )
            return state;
          return commit(state, blocks, id);
        }),
      moveNode: (activeId, overId) =>
        set((state) => {
          if (activeId === overId) return state;
          const blocks = structuredClone(state.document.blocks);
          
          type NodeLocation = { arr: BuilderBlock[]; index: number; block: BuilderBlock };
          function findLocation(arr: BuilderBlock[], id: string): NodeLocation | null {
            for (let i = 0; i < arr.length; i++) {
              if (arr[i].id === id) return { arr, index: i, block: arr[i] };
              if (arr[i].slots) {
                for (let c = 0; c < arr[i].slots.length; c++) {
                  const f = findLocation(arr[i].slots[c], id);
                  if (f) return f;
                }
              }
            }
            return null;
          }

          const activeLoc = findLocation(blocks, activeId);
          const overLoc = overId && !overId.startsWith("slot:") ? findLocation(blocks, overId) : null;
          
          // Same array move
          if (activeLoc && overLoc && activeLoc.arr === overLoc.arr) {
            const [block] = activeLoc.arr.splice(activeLoc.index, 1);
            activeLoc.arr.splice(overLoc.index, 0, block);
            return commit(state, blocks, activeId);
          }

          let blockToMove: BuilderBlock;
          if (activeLoc) {
            blockToMove = activeLoc.block;
            activeLoc.arr.splice(activeLoc.index, 1);
          } else if (activeId.startsWith("palette:")) {
            blockToMove = makeBlock(activeId.slice(8) as BlockKind);
          } else {
            return state;
          }

          if (!overId || overId === "canvas") {
            blocks.push(blockToMove);
          } else if (overId.startsWith("slot:")) {
            const [, parentId, colIdxStr] = overId.split(":");
            const colIdx = parseInt(colIdxStr, 10);
            const parentLoc = findLocation(blocks, parentId);
            if (parentLoc && parentLoc.block.slots && parentLoc.block.slots[colIdx]) {
              parentLoc.block.slots[colIdx].push(blockToMove);
            } else {
              blocks.push(blockToMove);
            }
          } else {
            const updatedOverLoc = findLocation(blocks, overId);
            if (updatedOverLoc) {
              updatedOverLoc.arr.splice(updatedOverLoc.index, 0, blockToMove);
            } else {
              blocks.push(blockToMove);
            }
          }

          return commit(state, blocks, blockToMove.id);
        }),
      update: (id, patch) =>
        set((state) => {
          // Tìm trong top-level blocks
          const topIdx = state.document.blocks.findIndex((b) => b.id === id);
          if (topIdx >= 0) {
            const blocks = state.document.blocks.map((block) =>
              block.id === id
                ? { ...block, ...patch, id: block.id, kind: block.kind }
                : block,
            );
            return commit(state, blocks);
          }
          // Tìm trong slots của columns block
          const blocks = state.document.blocks.map((b) => {
            if (!b.slots) return b;
            const slots = b.slots.map((col) =>
              col.map((child) =>
                child.id === id
                  ? { ...child, ...patch, id: child.id, kind: child.kind }
                  : child,
              ),
            );
            return { ...b, slots };
          });
          return commit(state, blocks);
        }),
      remove: (id) =>
        set((state) =>
          commit(
            state,
            state.document.blocks.filter((block) => block.id !== id),
            state.selectedId === id ? null : state.selectedId,
          ),
        ),
      duplicate: (id) =>
        set((state) => {
          const index = state.document.blocks.findIndex(
            (block) => block.id === id,
          );
          if (index < 0) return state;
          const clone = {
            ...structuredClone(state.document.blocks[index]),
            id: crypto.randomUUID(),
          };
          const blocks = [...state.document.blocks];
          blocks.splice(index + 1, 0, clone);
          return commit(state, blocks, clone.id);
        }),
      undo: () =>
        set((state) => {
          if (!state.past.length) return state;
          const document = state.past[state.past.length - 1];
          return {
            document,
            past: state.past.slice(0, -1),
            future: [state.document, ...state.future],
            selectedId: null,
          };
        }),
      redo: () =>
        set((state) => {
          if (!state.future.length) return state;
          const [document, ...future] = state.future;
          return {
            document,
            future,
            past: [...state.past, state.document],
            selectedId: null,
          };
        }),
      load: (document) =>
        set((state) => ({
          document,
          selectedId: null,
          past: [...state.past.slice(-29), state.document],
          future: [],
        })),
      reset: () =>
        set((state) => ({
          document: structuredClone(starterDocument),
          selectedId: "demo-hero",
          past: [...state.past.slice(-29), state.document],
          future: [],
        })),

      // ── Slot operations ──────────────────────────────────────────
      addToSlot: (parentId, colIdx, kind) =>
        set((state) => {
          const newBlock = makeBlock(kind);
          const blocks = updateParent(state.document.blocks, parentId, (p) => {
            const slots = (p.slots ?? []).map((col, i) =>
              i === colIdx ? [...col, newBlock] : col,
            );
            return { ...p, slots };
          });
          return commit(state, blocks, newBlock.id);
        }),

      removeFromSlot: (parentId, colIdx, blockId) =>
        set((state) => {
          const blocks = updateParent(state.document.blocks, parentId, (p) => {
            const slots = (p.slots ?? []).map((col, i) =>
              i === colIdx ? col.filter((b) => b.id !== blockId) : col,
            );
            return { ...p, slots };
          });
          return commit(
            state,
            blocks,
            state.selectedId === blockId ? null : state.selectedId,
          );
        }),

      moveInSlot: (parentId, colIdx, activeId, overId) =>
        set((state) => {
          const blocks = updateParent(state.document.blocks, parentId, (p) => {
            const slots = (p.slots ?? []).map((col, i) => {
              if (i !== colIdx) return col;
              const from = col.findIndex((b) => b.id === activeId);
              const to   = col.findIndex((b) => b.id === overId);
              if (from < 0 || to < 0 || from === to) return col;
              const next = [...col];
              const [item] = next.splice(from, 1);
              next.splice(to, 0, item);
              return next;
            });
            return { ...p, slots };
          });
          return commit(state, blocks, activeId);
        }),

      moveBetweenSlots: (parentId, fromCol, toCol, blockId, overBlockId) =>
        set((state) => {
          const blocks = updateParent(state.document.blocks, parentId, (p) => {
            let movedBlock: BuilderBlock | undefined;
            let slots = (p.slots ?? []).map((col, i) => {
              if (i !== fromCol) return col;
              const idx = col.findIndex((b) => b.id === blockId);
              if (idx < 0) return col;
              movedBlock = col[idx];
              return col.filter((_, j) => j !== idx);
            });
            if (!movedBlock) return p;
            slots = slots.map((col, i) => {
              if (i !== toCol) return col;
              if (overBlockId) {
                const overIdx = col.findIndex((b) => b.id === overBlockId);
                if (overIdx >= 0) {
                  const next = [...col];
                  next.splice(overIdx, 0, movedBlock!);
                  return next;
                }
              }
              return [...col, movedBlock!];
            });
            return { ...p, slots };
          });
          return commit(state, blocks, blockId);
        }),

      updateSlotBlock: (parentId, colIdx, blockId, patch) =>
        set((state) => {
          const blocks = updateParent(state.document.blocks, parentId, (p) => {
            const slots = (p.slots ?? []).map((col, i) =>
              i === colIdx
                ? col.map((b) =>
                    b.id === blockId
                      ? { ...b, ...patch, id: b.id, kind: b.kind }
                      : b,
                  )
                : col,
            );
            return { ...p, slots };
          });
          return commit(state, blocks);
        }),

      setSlotCount: (parentId, numCols) =>
        set((state) => {
          const blocks = updateParent(state.document.blocks, parentId, (p) => {
            const existing = p.slots ?? [];
            let slots: BuilderBlock[][];
            if (numCols > existing.length) {
              slots = [...existing, ...Array.from({ length: numCols - existing.length }, () => [])];
            } else {
              slots = existing.slice(0, numCols);
            }
            return { ...p, slots, dataSource: { ...p.dataSource, categorySlug: p.dataSource?.categorySlug ?? "", mode: p.dataSource?.mode ?? "latest", limit: 1, columns: numCols } };
          });
          return commit(state, blocks);
        }),
    }),
    {
      name: "moet-visual-builder-demo-v1",
      storage: createJSONStorage(() => localStorage),
      skipHydration: true,
      partialize: (state) => ({ document: state.document }),
    },
  ),
);
