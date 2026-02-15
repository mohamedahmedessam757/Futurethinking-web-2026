import { create } from 'zustand';
import { EnhancedLesson } from '../types/store';

export interface CanvasElement extends EnhancedLesson {
    localId: string; // For drag keys
    unitNumber: number;
    lessonNumber: number;
    isEditing?: boolean;
    isNew?: boolean;
}

interface CanvasState {
    // Session
    generationId: string | null;
    currentSession: any | null; // Full generation object
    courseStructure: any | null; // Parsed course structure with unit titles

    // Canvas Content
    elements: CanvasElement[];
    selectedElementId: string | null;

    // State
    isLoading: boolean;
    isSaving: boolean;
    lastSaved: Date | null;
    canUndo: boolean;
    canRedo: boolean;

    // Actions
    setGenerationId: (id: string) => void;
    setSession: (session: any) => void;
    setElements: (elementsOrFn: CanvasElement[] | ((prev: CanvasElement[]) => CanvasElement[])) => void;
    selectElement: (id: string | null) => void;
    updateElement: (id: string, updates: Partial<CanvasElement>) => void;
    addElement: (element: CanvasElement, index?: number) => void;
    removeElement: (id: string) => void;
    reorderElements: (newOrder: CanvasElement[]) => void;

    isDirty: boolean;
    setDirty: (dirty: boolean) => void;

    // Sync
    setLoading: (loading: boolean) => void;
    setSaving: (saving: boolean) => void;
    setCourseStructure: (structure: any) => void;
}

export const useCanvasStore = create<CanvasState>((set, get) => ({
    generationId: null,
    currentSession: null,
    courseStructure: null,
    elements: [],
    selectedElementId: null,
    isLoading: false,
    isSaving: false,
    lastSaved: null,
    canUndo: false,
    canRedo: false,

    isDirty: false,
    setDirty: (dirty) => set({ isDirty: dirty }),

    setGenerationId: (id) => set({ generationId: id }),

    setSession: (session) => set({ currentSession: session }),
    setCourseStructure: (structure) => set({ courseStructure: structure }),


    setElements: (elementsOrFn) => set((state) => ({
        elements: typeof elementsOrFn === 'function' ? elementsOrFn(state.elements) : elementsOrFn
        // Note: setElements does NOT set isDirty to true, allowing external syncs
    })),

    selectElement: (id) => set({ selectedElementId: id }),

    updateElement: (id, updates) => set((state) => ({
        elements: state.elements.map(el =>
            el.id === id ? { ...el, ...updates } : el
        ),
        isDirty: true // User action
    })),

    addElement: (element, index) => set((state) => {
        const newElements = [...state.elements];
        if (index !== undefined) {
            newElements.splice(index, 0, element);
        } else {
            newElements.push(element);
        }
        return { elements: newElements, isDirty: true };
    }),

    removeElement: (id) => set((state) => ({
        elements: state.elements.filter(el => el.id !== id),
        selectedElementId: state.selectedElementId === id ? null : state.selectedElementId,
        isDirty: true
    })),

    reorderElements: (newOrder) => set({ elements: newOrder, isDirty: true }),

    setLoading: (loading) => set({ isLoading: loading }),
    setSaving: (saving) => set({ isSaving: saving, lastSaved: saving ? null : new Date() }),
}));
