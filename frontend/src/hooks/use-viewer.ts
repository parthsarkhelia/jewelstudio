"use client";

import { create } from "zustand";
import type { MaterialConfig } from "@/lib/materials";

interface ViewerState {
  selectedMesh: string | null;
  autoRotate: boolean;
  environment: string;
  meshMaterials: Record<string, MaterialConfig>;

  setSelectedMesh: (name: string | null) => void;
  toggleAutoRotate: () => void;
  setEnvironment: (env: string) => void;
  setMeshMaterial: (meshName: string, material: MaterialConfig) => void;
  clearMaterials: () => void;
}

export const useViewerStore = create<ViewerState>((set) => ({
  selectedMesh: null,
  autoRotate: true,
  environment: "apartment",
  meshMaterials: {},

  setSelectedMesh: (name) => set({ selectedMesh: name }),
  toggleAutoRotate: () => set((s) => ({ autoRotate: !s.autoRotate })),
  setEnvironment: (env) => set({ environment: env }),
  setMeshMaterial: (meshName, material) =>
    set((s) => ({
      meshMaterials: { ...s.meshMaterials, [meshName]: material },
    })),
  clearMaterials: () => set({ meshMaterials: {} }),
}));
