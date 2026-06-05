import React, { useRef, useMemo, useEffect, forwardRef, useImperativeHandle } from 'react';
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import { useTexture, PerspectiveCamera, OrbitControls } from '@react-three/drei';
import * as THREE from 'three';

export interface LightParams {
  x: number;
  y: number;
  z: number;
  intensity: number;
  color: string;
  softness: number;
  radius: number;
  visible: boolean;
}

interface RelightingSceneProps {
  imageUrl: string;
  depthMapUrl: string;
  normalMapUrl: string;
  imageSize: { width: number; height: number };
  lights: LightParams[];
  ambientIntensity: number;
  ambientColor: string;
}

export interface RelightingSceneRef {
  recenter: () => void;
  exportImage: () => string;
}

const ImagePlane: React.FC<{
  imageUrl: string;
  depthMapUrl: string;
  normalMapUrl: string;
  imageSize: { width: number; height: number };
}> = ({ imageUrl, depthMapUrl, normalMapUrl, imageSize }) => {
  const [colorMap, normalMap, displacementMap] = useTexture([imageUrl, normalMapUrl, depthMapUrl]);

  // Adjust aspect ratio so the plane isn't distorted
  const aspect = imageSize.width / imageSize.height;
  const width = aspect > 1 ? 10 : 10 * aspect;
  const height = aspect > 1 ? 10 / aspect : 10;

  return (
    <mesh position={[0, 0, 0]}>
      <planeGeometry args={[width, height, 256, 256]} />
      <meshStandardMaterial
        map={colorMap}
        normalMap={normalMap}
        displacementMap={displacementMap}
        displacementScale={0.8}
        roughness={0.7}
        metalness={0.1}
        normalScale={new THREE.Vector2(1, 1)}
      />
    </mesh>
  );
};

const SceneController = forwardRef<RelightingSceneRef, { imageSize: { width: number; height: number }, orbitEnabled: boolean }>(({ imageSize, orbitEnabled }, ref) => {
  const { gl, scene, camera } = useThree();
  const controlsRef = useRef<any>(null);

  useImperativeHandle(ref, () => ({
    recenter: () => {
      if (controlsRef.current) {
        controlsRef.current.reset();
      }
    },
    exportImage: () => {
      const origPos = camera.position.clone();
      const origQuat = camera.quaternion.clone();
      const pCam = camera as THREE.PerspectiveCamera;
      const origAspect = pCam.aspect;
      const origBg = scene.background;
      
      scene.background = new THREE.Color(0x000000); // Ensure thumbnail black background 

      const targetWidth = 1280;
      const targetHeight = 720;
      const exportAspect = targetWidth / targetHeight;

      pCam.aspect = exportAspect;

      const aspect = imageSize.width / imageSize.height;
      const planeWidth = aspect > 1 ? 10 : 10 * aspect;
      const planeHeight = aspect > 1 ? 10 / aspect : 10;
      
      // Contain logic to never crop the image
      let fitHeight = planeHeight;
      if (exportAspect < aspect) {
         fitHeight = planeWidth / exportAspect;
      }
      
      const distance = fitHeight / (2 * Math.tan((Math.PI * pCam.fov) / 360));

      pCam.position.set(0, 0, distance);
      pCam.lookAt(0, 0, 0);
      pCam.updateProjectionMatrix();

      // Flatten the displacement safely and hide lights
      let meshMat: any = null;
      let origDisp = 0;
      scene.traverse((child) => {
        if (child.name === 'light-indicator' || child.name === 'drag-plane') child.visible = false;
        if (child instanceof THREE.Mesh && child.material && child.material.displacementScale !== undefined) {
          meshMat = child.material;
          origDisp = child.material.displacementScale;
          child.material.displacementScale = 0; // perfectly flat for export
        }
      });

      const renderTarget = new THREE.WebGLRenderTarget(targetWidth, targetHeight, {
        format: THREE.RGBAFormat,
        colorSpace: gl.outputColorSpace,
      });

      gl.setRenderTarget(renderTarget);
      gl.render(scene, pCam);
      gl.setRenderTarget(null);

      const buffer = new Uint8Array(targetWidth * targetHeight * 4);
      gl.readRenderTargetPixels(renderTarget, 0, 0, targetWidth, targetHeight, buffer);

      const canvas = document.createElement('canvas');
      canvas.width = targetWidth;
      canvas.height = targetHeight;
      const ctx = canvas.getContext('2d')!;
      const imgData = ctx.createImageData(targetWidth, targetHeight);
      
      // Flip WebGL Y-axis
      for (let y = 0; y < targetHeight; y++) {
        for (let x = 0; x < targetWidth; x++) {
          const srcIdx = ((targetHeight - 1 - y) * targetWidth + x) * 4;
          const dstIdx = (y * targetWidth + x) * 4;
          imgData.data[dstIdx] = buffer[srcIdx];
          imgData.data[dstIdx + 1] = buffer[srcIdx + 1];
          imgData.data[dstIdx + 2] = buffer[srcIdx + 2];
          imgData.data[dstIdx + 3] = buffer[srcIdx + 3];
        }
      }
      ctx.putImageData(imgData, 0, 0);
      const dataUrl = canvas.toDataURL('image/png', 1.0);

      renderTarget.dispose();

      // Restore state
      if (meshMat) meshMat.displacementScale = origDisp;
      scene.traverse((child) => {
        if (child.name === 'light-indicator') child.visible = true;
      });
      scene.background = origBg;
      pCam.aspect = origAspect;
      pCam.position.copy(origPos);
      pCam.quaternion.copy(origQuat);
      pCam.updateProjectionMatrix();
      gl.render(scene, camera);

      return dataUrl;
    }
  }));

  return <OrbitControls ref={controlsRef} makeDefault enabled={orbitEnabled} enableDamping dampingFactor={0.05} minDistance={2} maxDistance={20} maxPolarAngle={Math.PI / 1.5} />;
});

export const RelightingScene = forwardRef<RelightingSceneRef, RelightingSceneProps>(({
  imageUrl,
  depthMapUrl,
  normalMapUrl,
  imageSize,
  lights,
  setLights,
  ambientIntensity,
  ambientColor,
  activeLightIndex,
  onSelectLight,
  interactionKeyActive
}, ref) => {
  const [draggedLightIndex, setDraggedLightIndex] = React.useState<number | null>(null);

  // If dragging a light but user releases key, stop dragging
  useEffect(() => {
    if (!interactionKeyActive) {
      setDraggedLightIndex(null);
    }
  }, [interactionKeyActive]);

  return (
    <Canvas
      gl={{ preserveDrawingBuffer: true, antialias: true }}
      className="w-full h-full"
    >
      <PerspectiveCamera makeDefault position={[0, 0, 11]} fov={60} />
      <SceneController ref={ref} imageSize={imageSize} orbitEnabled={!interactionKeyActive && draggedLightIndex === null} />
      
      <ambientLight intensity={ambientIntensity} color={ambientColor} />
      
      {lights.map((light, index) => {
        const distanceLimit = light.softness > 0 ? (light.softness / 100) * 40 : 0; 
        const decay = 2; // Keep physically correct decay
        const isSelected = activeLightIndex === index;
        
        return (
          <group key={index}>
             {light.visible && (
               <>
                 <pointLight
                   position={[light.x, light.y, light.z]}
                   intensity={light.intensity * (1 + light.radius * 0.1)} 
                   color={light.color}
                   decay={decay}
                   distance={distanceLimit}
                 />
                 {/* Small visual indicator of the light source */}
                 <mesh 
                   name="light-indicator" 
                   position={[light.x, light.y, light.z]}
                   onPointerDown={(e) => {
                     e.stopPropagation();
                     if (activeLightIndex !== index) {
                       onSelectLight?.(index);
                     }
                     if (interactionKeyActive) {
                       setDraggedLightIndex(index);
                     }
                   }}
                   onPointerOver={() => {
                     document.body.style.cursor = interactionKeyActive ? 'move' : 'pointer';
                   }}
                   onPointerOut={() => {
                     document.body.style.cursor = 'auto';
                   }}
                 >
                    <sphereGeometry args={[Math.max(0.1, light.radius * 0.02), 16, 16]} />
                    <meshBasicMaterial color={light.color} wireframe={isSelected} transparent opacity={isSelected ? 1 : 0.7} />
                 </mesh>
               </>
             )}
          </group>
        );
      })}

      {draggedLightIndex !== null && interactionKeyActive && lights[draggedLightIndex] && (
         <mesh
           name="drag-plane"
           position={[0, 0, lights[draggedLightIndex].z]}
           onPointerMove={(e) => {
              e.stopPropagation();
              if (setLights) {
                 setLights((prev) => {
                    const newArr = [...prev];
                    newArr[draggedLightIndex] = { ...newArr[draggedLightIndex], x: e.point.x, y: e.point.y };
                    return newArr;
                 });
              }
           }}
           onPointerUp={(e) => {
              e.stopPropagation();
              setDraggedLightIndex(null);
           }}
           onPointerOut={(e) => {
              e.stopPropagation();
              setDraggedLightIndex(null);
           }}
         >
           <planeGeometry args={[1000, 1000]} />
           <meshBasicMaterial transparent opacity={0} />
         </mesh>
      )}

      {imageUrl && depthMapUrl && normalMapUrl && (
        <ImagePlane
          imageUrl={imageUrl}
          depthMapUrl={depthMapUrl}
          normalMapUrl={normalMapUrl}
          imageSize={imageSize}
        />
      )}
    </Canvas>
  );
});
