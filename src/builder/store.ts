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
  add: (kind: BlockKind, beforeId?: string) => void;
  move: (id: string, overId?: string) => void;
  update: (id: string, patch: Partial<BuilderBlock>) => void;
  remove: (id: string) => void;
  duplicate: (id: string) => void;
  undo: () => void;
  redo: () => void;
  load: (document: BuilderDocument) => void;
  reset: () => void;
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
      update: (id, patch) =>
        set((state) => {
          const blocks = state.document.blocks.map((block) =>
            block.id === id
              ? { ...block, ...patch, id: block.id, kind: block.kind }
              : block,
          );
          if (!state.document.blocks.some((block) => block.id === id))
            return state;
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
    }),
    {
      name: "moet-visual-builder-demo-v1",
      storage: createJSONStorage(() => localStorage),
      skipHydration: true,
      partialize: (state) => ({ document: state.document }),
    },
  ),
);
