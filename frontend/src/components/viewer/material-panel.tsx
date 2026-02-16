"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useViewerStore } from "@/hooks/use-viewer";
import { METAL_PRESETS, GEMSTONE_PRESETS, type MaterialConfig } from "@/lib/materials";
import { cn } from "@/lib/utils";

export function MaterialPanel() {
  const selectedMesh = useViewerStore((s) => s.selectedMesh);
  const setMeshMaterial = useViewerStore((s) => s.setMeshMaterial);
  const meshMaterials = useViewerStore((s) => s.meshMaterials);
  const [activePreset, setActivePreset] = useState<string | null>(null);

  // Fine-tune values
  const currentMaterial = selectedMesh ? meshMaterials[selectedMesh] : null;
  const [roughness, setRoughness] = useState(currentMaterial?.roughness ?? 0.5);
  const [metallic, setMetallic] = useState(currentMaterial?.metallic ?? 0);
  const [envIntensity, setEnvIntensity] = useState(currentMaterial?.envMapIntensity ?? 1.5);

  const applyPreset = (preset: MaterialConfig) => {
    if (!selectedMesh) return;
    setMeshMaterial(selectedMesh, preset);
    setActivePreset(preset.name);
    setRoughness(preset.roughness);
    setMetallic(preset.metallic);
    setEnvIntensity(preset.envMapIntensity);
  };

  const applyFineTune = () => {
    if (!selectedMesh || !currentMaterial) return;
    setMeshMaterial(selectedMesh, {
      ...currentMaterial,
      roughness,
      metallic,
      envMapIntensity: envIntensity,
    });
  };

  if (!selectedMesh) {
    return (
      <div className="p-4 text-center text-muted-foreground">
        <p className="text-sm">Click on a mesh part to select it and apply materials.</p>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      <div>
        <h3 className="font-medium text-sm mb-1">Selected Part</h3>
        <p className="text-sm text-muted-foreground truncate">{selectedMesh}</p>
      </div>

      <Tabs defaultValue="metals">
        <TabsList className="w-full">
          <TabsTrigger value="metals" className="flex-1">Metals</TabsTrigger>
          <TabsTrigger value="gemstones" className="flex-1">Gemstones</TabsTrigger>
          <TabsTrigger value="tune" className="flex-1">Fine-tune</TabsTrigger>
        </TabsList>

        <TabsContent value="metals" className="mt-3">
          <div className="grid grid-cols-2 gap-2">
            {METAL_PRESETS.map((preset) => (
              <Button
                key={preset.name}
                variant="outline"
                size="sm"
                className={cn(
                  "justify-start gap-2 h-auto py-2",
                  activePreset === preset.name && "ring-2 ring-primary"
                )}
                onClick={() => applyPreset(preset)}
              >
                <div
                  className="w-4 h-4 rounded-full border"
                  style={{ backgroundColor: preset.color }}
                />
                <span className="text-xs">{preset.name}</span>
              </Button>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="gemstones" className="mt-3">
          <div className="grid grid-cols-2 gap-2">
            {GEMSTONE_PRESETS.map((preset) => (
              <Button
                key={preset.name}
                variant="outline"
                size="sm"
                className={cn(
                  "justify-start gap-2 h-auto py-2",
                  activePreset === preset.name && "ring-2 ring-primary"
                )}
                onClick={() => applyPreset(preset)}
              >
                <div
                  className="w-4 h-4 rounded-full border"
                  style={{ backgroundColor: preset.color }}
                />
                <span className="text-xs">{preset.name}</span>
              </Button>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="tune" className="mt-3 space-y-3">
          <div className="space-y-1">
            <Label className="text-xs">Roughness: {roughness.toFixed(2)}</Label>
            <Input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={roughness}
              onChange={(e) => setRoughness(parseFloat(e.target.value))}
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Metallic: {metallic.toFixed(2)}</Label>
            <Input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={metallic}
              onChange={(e) => setMetallic(parseFloat(e.target.value))}
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Env Intensity: {envIntensity.toFixed(1)}</Label>
            <Input
              type="range"
              min="0"
              max="5"
              step="0.1"
              value={envIntensity}
              onChange={(e) => setEnvIntensity(parseFloat(e.target.value))}
            />
          </div>
          <Button size="sm" onClick={applyFineTune} disabled={!currentMaterial}>
            Apply
          </Button>
        </TabsContent>
      </Tabs>
    </div>
  );
}
