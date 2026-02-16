"use client";

import { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Environment, ContactShadows, Center } from "@react-three/drei";
import { EffectComposer, Bloom, SMAA } from "@react-three/postprocessing";
import { useViewerStore } from "@/hooks/use-viewer";
import { JewelryModel } from "./jewelry-model";
import { useTheme } from "next-themes";
import * as THREE from "three";

interface SceneProps {
  glbUrl: string;
  onMeshClick?: (name: string) => void;
}

export function Scene({ glbUrl, onMeshClick }: SceneProps) {
  const autoRotate = useViewerStore((s) => s.autoRotate);
  const environment = useViewerStore((s) => s.environment);
  const { resolvedTheme } = useTheme();

  const bgColor = resolvedTheme === "dark" ? "#1a1a1a" : "#f0ede8";

  return (
    <div className="w-full h-full relative">
      <Canvas
        gl={{ preserveDrawingBuffer: true, antialias: true }}
        camera={{ position: [0, 0, 4], fov: 45 }}
        shadows
        onCreated={({ gl }) => {
          gl.toneMapping = THREE.ACESFilmicToneMapping;
          gl.toneMappingExposure = 0.85;
        }}
      >
        <color attach="background" args={[bgColor]} />

        <ambientLight intensity={0.3} />
        <directionalLight position={[5, 8, 5]} intensity={0.5} castShadow />
        <directionalLight position={[-3, 4, -4]} intensity={0.2} />

        <Suspense fallback={null}>
          <Environment preset={environment as any} background={false} environmentIntensity={0.8} />

          <Center>
            <JewelryModel url={glbUrl} onMeshClick={onMeshClick} />
          </Center>

          <ContactShadows
            position={[0, -1.5, 0]}
            opacity={0.35}
            scale={10}
            blur={2.5}
            far={4}
          />
        </Suspense>

        <OrbitControls
          autoRotate={autoRotate}
          autoRotateSpeed={1.5}
          enableDamping
          dampingFactor={0.05}
          minDistance={1}
          maxDistance={20}
        />

        <EffectComposer>
          <Bloom
            luminanceThreshold={0.95}
            luminanceSmoothing={0.3}
            intensity={0.3}
          />
          <SMAA />
        </EffectComposer>
      </Canvas>
    </div>
  );
}
