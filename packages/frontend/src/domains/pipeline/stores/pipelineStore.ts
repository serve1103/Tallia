import { create } from 'zustand';
import type { PipelineBlock, ValidationResult } from '@tallia/shared';

interface PipelineState {
  blocks: PipelineBlock[];
  selectedBlockIndex: number | null;
  validationResult: ValidationResult | null;
  isDirty: boolean;

  setBlocks: (blocks: PipelineBlock[]) => void;
  addBlock: (block: PipelineBlock, index?: number) => void;
  removeBlock: (index: number) => void;
  moveBlock: (fromIndex: number, toIndex: number) => void;
  updateBlockParams: (index: number, params: Record<string, unknown>) => void;
  selectBlock: (index: number | null) => void;
  setValidationResult: (result: ValidationResult | null) => void;
  resetDirty: () => void;
}

export const usePipelineStore = create<PipelineState>((set) => ({
  blocks: [],
  selectedBlockIndex: null,
  validationResult: null,
  isDirty: false,

  setBlocks: (blocks) => set({ blocks, isDirty: false }),

  addBlock: (block, index) =>
    set((state) => {
      const blocks = [...state.blocks];
      if (index != null) {
        blocks.splice(index, 0, block);
      } else {
        blocks.push(block);
      }
      return { blocks, isDirty: true };
    }),

  removeBlock: (index) =>
    set((state) => {
      const blocks = state.blocks.filter((_, i) => i !== index);
      const selectedBlockIndex =
        state.selectedBlockIndex === index ? null : state.selectedBlockIndex;
      return { blocks, selectedBlockIndex, isDirty: true };
    }),

  moveBlock: (fromIndex, toIndex) =>
    set((state) => {
      const blocks = [...state.blocks];
      const [moved] = blocks.splice(fromIndex, 1);
      blocks.splice(toIndex, 0, moved);
      return { blocks, isDirty: true };
    }),

  updateBlockParams: (index, params) =>
    set((state) => {
      const blocks = [...state.blocks];
      blocks[index] = { ...blocks[index], params: { ...blocks[index].params, ...params } };
      return { blocks, isDirty: true };
    }),

  selectBlock: (index) => set({ selectedBlockIndex: index }),

  setValidationResult: (result) => set({ validationResult: result }),

  resetDirty: () => set({ isDirty: false }),
}));
