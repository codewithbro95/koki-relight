import React, { useState, useCallback, useRef, useEffect } from 'react';
import { UploadArea } from './components/UploadArea';
import { RelightingScene, LightParams, RelightingSceneRef } from './components/RelightingScene';
import { ControlPanel } from './components/ControlPanel';
import { DepthPredictor } from './utils/depth';
import { Loader2, Focus } from 'lucide-react';

export const PRESETS = [
  {
    name: 'Default Studio',
    ambientIntensity: 0.2,
    ambientColor: '#ffffff',
    lights: [
      { x: -3, y: 3, z: 4, intensity: 3, color: '#ffffff', softness: 50, radius: 20, visible: true },
      { x: 4, y: -2, z: 2, intensity: 1.5, color: '#4a90e2', softness: 70, radius: 20, visible: true },
    ]
  },
  {
    name: 'Neon Cyberpunk',
    ambientIntensity: 0.05,
    ambientColor: '#111122',
    lights: [
      { x: -4, y: 0, z: 3, intensity: 4, color: '#ff0055', softness: 50, radius: 25, visible: true },
      { x: 4, y: 0, z: 3, intensity: 4, color: '#00ccff', softness: 50, radius: 25, visible: true },
    ]
  },
  {
    name: 'Warm Sunset',
    ambientIntensity: 0.3,
    ambientColor: '#ffbb88',
    lights: [
      { x: 0, y: 5, z: 1, intensity: 5, color: '#ff5500', softness: 80, radius: 20, visible: true },
      { x: 0, y: -4, z: 2, intensity: 1, color: '#4444ff', softness: 30, radius: 30, visible: true },
    ]
  },
  {
    name: 'Dramatic Spotlight',
    ambientIntensity: 0.02,
    ambientColor: '#ffffff',
    lights: [
      { x: 0, y: 2, z: 2, intensity: 6, color: '#ffffff', softness: 10, radius: 10, visible: true },
    ]
  },
  {
    name: 'Moonlight',
    ambientIntensity: 0.1,
    ambientColor: '#202545',
    lights: [
      { x: -5, y: 5, z: 2, intensity: 2, color: '#aaeeff', softness: 30, radius: 25, visible: true },
      { x: 5, y: 5, z: 4, intensity: 0.5, color: '#ffffff', softness: 80, radius: 40, visible: true },
    ]
  },
  {
    name: 'Firelight',
    ambientIntensity: 0.1,
    ambientColor: '#1a0500',
    lights: [
      { x: 0, y: -2, z: 1.5, intensity: 4, color: '#ff5a00', softness: 60, radius: 15, visible: true },
      { x: 2, y: -2, z: 2, intensity: 2, color: '#ffaa00', softness: 80, radius: 20, visible: true }
    ]
  },
  {
    name: 'Studio Gel Pink & Blue',
    ambientIntensity: 0.2,
    ambientColor: '#111111',
    lights: [
      { x: -4, y: 0, z: 2, intensity: 4, color: '#ff00aa', softness: 50, radius: 30, visible: true },
      { x: 4, y: 0, z: 2, intensity: 4, color: '#00aaff', softness: 50, radius: 30, visible: true }
    ]
  }
];

export default function App() {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [depthMapUrl, setDepthMapUrl] = useState<string | null>(null);
  const [normalMapUrl, setNormalMapUrl] = useState<string | null>(null);
  const [imageSize, setImageSize] = useState({ width: 1, height: 1 });
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [progressMsg, setProgressMsg] = useState('Initializing WebGPU Models...');
  const [progressValue, setProgressValue] = useState(0);

  const [lights, setLights] = useState<LightParams[]>(PRESETS[0].lights);
  const [ambientIntensity, setAmbientIntensity] = useState(PRESETS[0].ambientIntensity);
  const [ambientColor, setAmbientColor] = useState(PRESETS[0].ambientColor);
  
  const [activeLightIndex, setActiveLightIndex] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<'presets' | 'lighting' | 'environment' | 'settings'>('presets');

  // Settings state
  const [interactionKey, setInteractionKey] = useState<'Control' | 'Shift' | 'Alt' | 'Meta'>('Control');
  const [interactionKeyActive, setInteractionKeyActive] = useState(false);
  const [defaultAmbientIntensity, setDefaultAmbientIntensity] = useState(1.5);
  const [defaultAmbientColor, setDefaultAmbientColor] = useState('#ffffff');
  const [autoPickColor, setAutoPickColor] = useState(true);

  // Load from local storage
  useEffect(() => {
    const saved = localStorage.getItem('koki_settings');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.interactionKey) setInteractionKey(parsed.interactionKey);
        if (parsed.defaultAmbientIntensity !== undefined) setDefaultAmbientIntensity(parsed.defaultAmbientIntensity);
        if (parsed.defaultAmbientColor) setDefaultAmbientColor(parsed.defaultAmbientColor);
        if (parsed.autoPickColor !== undefined) setAutoPickColor(parsed.autoPickColor);
      } catch(e) {}
    }
  }, []);

  const saveSettings = useCallback(() => {
    localStorage.setItem('koki_settings', JSON.stringify({
      interactionKey,
      defaultAmbientIntensity,
      defaultAmbientColor,
      autoPickColor
    }));
  }, [interactionKey, defaultAmbientIntensity, defaultAmbientColor, autoPickColor]);

  const resetSettings = useCallback(() => {
    localStorage.removeItem('koki_settings');
    setInteractionKey('Control');
    setDefaultAmbientIntensity(1.5);
    setDefaultAmbientColor('#ffffff');
    setAutoPickColor(true);
  }, []);

  useEffect(() => {
    const updateMods = (e: KeyboardEvent | MouseEvent) => {
      let active = false;
      if (interactionKey === 'Control' && e.ctrlKey) active = true;
      if (interactionKey === 'Meta' && e.metaKey) active = true;
      if (interactionKey === 'Shift' && e.shiftKey) active = true;
      if (interactionKey === 'Alt' && e.altKey) active = true;
      setInteractionKeyActive(active);
    };

    window.addEventListener('keydown', updateMods);
    window.addEventListener('keyup', updateMods);
    window.addEventListener('mousemove', updateMods);
    return () => {
      window.removeEventListener('keydown', updateMods);
      window.removeEventListener('keyup', updateMods);
      window.removeEventListener('mousemove', updateMods);
    };
  }, [interactionKey]);

  const applyPreset = useCallback((preset: typeof PRESETS[0]) => {
    setAmbientIntensity(preset.ambientIntensity);
    setAmbientColor(preset.ambientColor);
    setLights(JSON.parse(JSON.stringify(preset.lights)));
    setActiveLightIndex(null);
  }, []);

  const handleImageSelected = useCallback(async (file: File) => {
    const url = URL.createObjectURL(file);
    setImageUrl(url);

    // Get image size
    const img = new Image();
    img.src = url;
    await new Promise((resolve) => {
      img.onload = () => {
        setImageSize({ width: img.width, height: img.height });
        
        // Settings defaults
        setAmbientIntensity(defaultAmbientIntensity);
        
        if (autoPickColor) {
          // Pick average color
          const canvas = document.createElement('canvas');
          canvas.width = 64;
          canvas.height = 64;
          const ctx = canvas.getContext('2d');
          if (ctx) {
             ctx.drawImage(img, 0, 0, 64, 64);
             const data = ctx.getImageData(0, 0, 64, 64).data;
             let r = 0, g = 0, b = 0;
             for(let i=0; i<data.length; i+=4) {
               r += data[i]; g += data[i+1]; b += data[i+2];
             }
             const count = data.length / 4;
             r = Math.floor(r / count);
             g = Math.floor(g / count);
             b = Math.floor(b / count);
             const hex = '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('');
             setAmbientColor(hex);
          }
        } else {
          setAmbientColor(defaultAmbientColor);
        }
        resolve(null);
      };
    });

    setIsProcessing(true);
    setProgressMsg('Loading AI Models...');
    setProgressValue(0);

    try {
      const predictor = DepthPredictor.getInstance();
      
      await predictor.initialize((info) => {
        if (info.status === 'downloaddate') {
          // Note: status is download progress
        } else if (info.status === 'init') {
          setProgressMsg('Initializing WebGPU Engine...');
        } else if (info.status === 'ready') {
          setProgressMsg('Model ready. Computing depth map...');
        } else if (info.status === 'progress') {
           setProgressValue(info.progress);
           setProgressMsg(`Downloading models... ${Math.round(info.progress)}%`);
        }
      });

      setProgressMsg('Running Depth Prediction...');
      setProgressValue(100);

      // Add slight delay to let UI update
      await new Promise(r => setTimeout(r, 100));

      const { depthMapUrl, normalMapUrl } = await predictor.predict(url);

      setDepthMapUrl(depthMapUrl);
      setNormalMapUrl(normalMapUrl);
    } catch (err) {
      console.error('Error predicting depth:', err);
      alert('Error extracting depth map. Please check console for details.');
    } finally {
      setIsProcessing(false);
    }
  }, [defaultAmbientIntensity, defaultAmbientColor, autoPickColor]);

  const sceneRef = useRef<RelightingSceneRef | null>(null);

  const handleExport = useCallback(() => {
     if (sceneRef.current) {
       const dataURL = sceneRef.current.exportImage();
       const a = document.createElement('a');
       a.href = dataURL;
       a.download = 'relit-image.png';
       a.click();
     }
  }, []);

  const handleRecenter = useCallback(() => {
    if (sceneRef.current) {
      sceneRef.current.recenter();
    }
  }, []);

  return (
    <div className="w-screen h-screen bg-[#050505] text-[#d4d4d8] font-sans flex flex-col overflow-hidden select-none">
      <header className="h-14 border-b border-white/10 flex items-center justify-between px-6 bg-[#0a0a0a]">
        <div className="flex items-center gap-4">
          <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center">
            <div className="w-4 h-4 border-2 border-white rotate-45"></div>
          </div>
          <h1 className="text-sm font-semibold tracking-widest uppercase text-white">
            Koki <span className="text-blue-500 underline underline-offset-4">Relight</span> v0.0.1
          </h1>
          <div className="hidden sm:flex items-center gap-2 ml-4">
            <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 text-[10px] font-bold border border-emerald-500/20 uppercase tracking-tighter">
              WebGPU Active
            </span>
            <span className="px-2 py-0.5 rounded-full bg-white/5 text-white/40 text-[10px] font-medium border border-white/10 uppercase tracking-tighter">
              ONNX Local
            </span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => {
              setImageUrl(null);
              setDepthMapUrl(null);
              setNormalMapUrl(null);
            }} 
            className="text-xs font-medium px-4 py-1.5 rounded bg-white/5 hover:bg-white/10 border border-white/10 transition-colors"
          >
            Import Asset
          </button>
          {imageUrl && depthMapUrl && normalMapUrl && (
            <button 
              onClick={handleExport}
              className="text-xs font-bold px-4 py-1.5 rounded bg-blue-600 text-white hover:bg-blue-500 transition-colors"
            >
              Export PNG
            </button>
          )}
        </div>
      </header>

      <main className="flex-1 flex overflow-hidden">
        {(!imageUrl || !depthMapUrl || !normalMapUrl) ? (
          <div className="flex-1 flex items-center justify-center p-6 relative group bg-[#000]">
            <div className="absolute inset-0 opacity-20 pointer-events-none" style={{ backgroundImage: "radial-gradient(circle at center, #1e293b 0%, transparent 80%), repeating-linear-gradient(0deg, transparent, transparent 39px, rgba(255,255,255,0.03) 40px), repeating-linear-gradient(90deg, transparent, transparent 39px, rgba(255,255,255,0.03) 40px)" }}></div>
            <div className="max-w-2xl w-full z-10">
              <div className="text-center mb-10">
                <h1 className="text-3xl font-light tracking-wide mb-3 text-white">Koki: Relight</h1>
                <p className="text-white/40 text-sm tracking-wide">Generate realistic 3D lighting for 2D images using local WebGPU Depth Estimation.</p>
              </div>
              
              {isProcessing ? (
                <div className="flex flex-col items-center justify-center p-12 bg-[#0a0a0a] border border-white/10 rounded-lg">
                  <div className="relative w-12 h-12 mb-6">
                    <Loader2 className="w-12 h-12 animate-spin text-blue-500 absolute inset-0" />
                    <div className="absolute inset-0 border-4 border-blue-500/20 rounded-full"></div>
                  </div>
                  <h3 className="text-[11px] font-bold text-white uppercase tracking-widest mb-4">{progressMsg}</h3>
                  <div className="w-full max-w-sm bg-white/5 rounded-full h-1 mb-3 overflow-hidden">
                    <div 
                      className="bg-blue-500 h-1 rounded-full transition-all duration-300 shadow-[0_0_10px_rgba(59,130,246,0.5)]"
                      style={{ width: `${progressValue}%` }}
                    ></div>
                  </div>
                  <p className="text-[10px] text-white/40 uppercase tracking-widest">Processing locally in browser. No data uploaded.</p>
                </div>
              ) : (
                <UploadArea onImageSelected={handleImageSelected} />
              )}
            </div>
          </div>
        ) : (
          <>
            {/* Viewport */}
            <div 
              className="flex-1 relative bg-[#000] border-r border-white/10 group"
              onContextMenu={(e) => e.preventDefault()}
            >
               {/* Decorative background lines */}
               <div className="absolute inset-0 opacity-20 pointer-events-none" style={{ backgroundImage: "radial-gradient(circle at center, #1e293b 0%, transparent 80%), repeating-linear-gradient(0deg, transparent, transparent 39px, rgba(255,255,255,0.03) 40px), repeating-linear-gradient(90deg, transparent, transparent 39px, rgba(255,255,255,0.03) 40px)" }}></div>
               
               <div className="absolute inset-0">
                 <RelightingScene
                    ref={sceneRef}
                    imageUrl={imageUrl}
                    depthMapUrl={depthMapUrl}
                    normalMapUrl={normalMapUrl}
                    imageSize={imageSize}
                    lights={lights}
                    setLights={setLights}
                    ambientIntensity={ambientIntensity}
                    ambientColor={ambientColor}
                    activeLightIndex={activeLightIndex}
                    onSelectLight={(idx) => {
                      setActiveLightIndex(idx);
                      setActiveTab('lighting');
                    }}
                    interactionKeyActive={interactionKeyActive}
                 />
               </div>

               <button
                 onClick={handleRecenter}
                 className="absolute bottom-6 right-6 p-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full text-white shadow-[0_0_20px_rgba(0,0,0,0.5)] backdrop-blur-md transition-all z-20 group flex items-center justify-center cursor-pointer"
                 title="Recenter Camera"
               >
                 <Focus className="w-5 h-5 text-white/70 group-hover:text-white" />
               </button>

               {/* Metrics Overlay */}
               <div className="absolute bottom-6 left-6 flex gap-4 pointer-events-none">
                 <div className="flex flex-col gap-1">
                   <span className="text-[9px] text-white/30 uppercase tracking-widest">Resolution</span>
                   <span className="text-lg font-mono leading-none text-white">{imageSize.width}x{imageSize.height}</span>
                 </div>
                 <div className="flex flex-col gap-1">
                   <span className="text-[9px] text-white/30 uppercase tracking-widest">Renderer</span>
                   <span className="text-lg font-mono leading-none text-white">Three.js</span>
                 </div>
               </div>
            </div>

            {/* Controls */}
            <ControlPanel
              lights={lights}
              setLights={setLights}
              ambientIntensity={ambientIntensity}
              setAmbientIntensity={setAmbientIntensity}
              ambientColor={ambientColor}
              setAmbientColor={setAmbientColor}
              applyPreset={applyPreset}
              onExport={handleExport}
              activeLightIndex={activeLightIndex}
              setActiveLightIndex={setActiveLightIndex}
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              interactionKey={interactionKey}
              setInteractionKey={setInteractionKey}
              defaultAmbientIntensity={defaultAmbientIntensity}
              setDefaultAmbientIntensity={setDefaultAmbientIntensity}
              defaultAmbientColor={defaultAmbientColor}
              setDefaultAmbientColor={setDefaultAmbientColor}
              autoPickColor={autoPickColor}
              setAutoPickColor={setAutoPickColor}
              saveSettings={saveSettings}
              resetSettings={resetSettings}
            />
          </>
        )}
      </main>

      <footer className="h-8 border-t border-white/10 bg-[#0a0a0a] flex items-center px-4 justify-between pointer-events-none">
        <div className="flex gap-4">
          <span className="text-[9px] font-mono text-white/40 uppercase">Mode: Real-time Relighting</span>
        </div>
        <div className="flex gap-4">
          {imageUrl ? (
            <span className="text-[9px] font-mono text-white/40 uppercase">Local Inference Complete</span>
          ) : (
            <span className="text-[9px] font-mono text-white/40 uppercase">Awaiting Asset</span>
          )}
        </div>
      </footer>
    </div>
  );
}
