"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useGLTF } from "@react-three/drei";
import { useViewerStore } from "@/hooks/use-viewer";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { ThreeEvent } from "@react-three/fiber";

interface JewelryModelProps {
  url: string;
  onMeshClick?: (name: string) => void;
}

function LoadedModel({ url, onMeshClick }: JewelryModelProps) {
  const { scene } = useGLTF(url);
  const groupRef = useRef<THREE.Group>(null);
  const meshMaterials = useViewerStore((s) => s.meshMaterials);
  const selectedMesh = useViewerStore((s) => s.selectedMesh);
  const originalMaterialsRef = useRef<Map<string, THREE.Material | THREE.Material[]>>(new Map());
  const appliedRef = useRef<Map<string, string>>(new Map());

  // Auto-center and normalize scale on first load
  useEffect(() => {
    if (!groupRef.current) return;
    const box = new THREE.Box3().setFromObject(groupRef.current);
    const size = box.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);
    if (maxDim === 0) return;
    const scale = 2 / maxDim;
    groupRef.current.scale.setScalar(scale);

    const center = box.getCenter(new THREE.Vector3());
    groupRef.current.position.set(
      -center.x * scale,
      -center.y * scale,
      -center.z * scale
    );
  }, [scene]);

  // Store original materials on mount
  useEffect(() => {
    const originals = new Map<string, THREE.Material | THREE.Material[]>();
    scene.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        const meshName = child.name || child.uuid;
        if (Array.isArray(child.material)) {
          originals.set(meshName, child.material.map((m) => m.clone()));
        } else {
          originals.set(meshName, child.material.clone());
        }
      }
    });
    originalMaterialsRef.current = originals;
    appliedRef.current = new Map();
  }, [scene]);

  // Apply/restore materials reactively
  useEffect(() => {
    scene.traverse((child) => {
      if (!(child instanceof THREE.Mesh)) return;
      const meshName = child.name || child.uuid;
      const customMat = meshMaterials[meshName];
      const prevKey = appliedRef.current.get(meshName);
      const newKey = customMat ? JSON.stringify(customMat) : null;

      if (customMat && prevKey !== newKey) {
        // Apply custom material
        const mat = new THREE.MeshPhysicalMaterial({
          color: new THREE.Color(customMat.color),
          metalness: customMat.metallic,
          roughness: customMat.roughness,
          ior: customMat.ior,
          transmission: customMat.transmission,
          clearcoat: customMat.clearcoat,
          opacity: customMat.opacity,
          transparent: customMat.opacity < 1 || customMat.transmission > 0,
          envMapIntensity: customMat.envMapIntensity,
          thickness: 0.5,
        });
        child.material = mat;
        appliedRef.current.set(meshName, newKey!);
      } else if (!customMat && prevKey) {
        // Restore original material
        const orig = originalMaterialsRef.current.get(meshName);
        if (orig) {
          if (Array.isArray(orig)) {
            child.material = orig.map((m) => m.clone());
          } else {
            child.material = orig.clone();
          }
        }
        appliedRef.current.delete(meshName);
      }
    });
  }, [scene, meshMaterials]);

  // Handle selection highlight via emissive
  useEffect(() => {
    scene.traverse((child) => {
      if (!(child instanceof THREE.Mesh)) return;
      const meshName = child.name || child.uuid;
      const mat = child.material as THREE.MeshStandardMaterial;
      if (!mat || !mat.emissive) return;

      if (selectedMesh === meshName) {
        mat.emissive = new THREE.Color(0x444444);
        mat.emissiveIntensity = 0.4;
      } else {
        mat.emissive = new THREE.Color(0x000000);
        mat.emissiveIntensity = 0;
      }
    });
  }, [scene, selectedMesh]);

  const handleClick = useCallback((e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    const mesh = e.object;
    if (mesh instanceof THREE.Mesh && onMeshClick) {
      onMeshClick(mesh.name || mesh.uuid);
    }
  }, [onMeshClick]);

  return (
    <group ref={groupRef}>
      <primitive object={scene} onClick={handleClick} />
    </group>
  );
}

// Fallback placeholder when model fails to load
function FallbackModel() {
  return (
    <group>
      <mesh>
        <torusGeometry args={[1, 0.15, 32, 64]} />
        <meshPhysicalMaterial
          color="#d4af37"
          metalness={0.9}
          roughness={0.1}
          envMapIntensity={1.5}
        />
      </mesh>
      <mesh position={[0, 1, 0]}>
        <octahedronGeometry args={[0.4, 0]} />
        <meshPhysicalMaterial
          color="#b9f2ff"
          metalness={0}
          roughness={0.05}
          ior={2.42}
          transmission={0.95}
          transparent
          thickness={0.5}
        />
      </mesh>
    </group>
  );
}

export function JewelryModel({ url, onMeshClick }: JewelryModelProps) {
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch(url, { method: "HEAD" })
      .then((res) => {
        if (!res.ok) setError(true);
      })
      .catch(() => setError(true));
  }, [url]);

  if (error) {
    return <FallbackModel />;
  }

  return <LoadedModel url={url} onMeshClick={onMeshClick} />;
}
