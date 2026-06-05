import React, { useRef } from 'react';
import { LightParams } from './RelightingScene';
import { Plus, Trash2, Sun, Eye, EyeOff, LayoutTemplate, Lightbulb, Globe, Download, Settings, Upload } from 'lucide-react';
import { PRESETS } from '../App';

interface ControlPanelProps {
  lights: LightParams[];
  setLights: React.Dispatch<React.SetStateAction<LightParams[]>>;
  ambientIntensity: number;
  setAmbientIntensity: (v: number) => void;
  ambientColor: string;
  setAmbientColor: (v: string) => void;
  applyPreset: (preset: typeof PRESETS[0]) => void;
  activeLightIndex: number | null;
  setActiveLightIndex: (idx: number | null) => void;
  activeTab: 'presets' | 'lighting' | 'environment' | 'settings';
  setActiveTab: (tab: 'presets' | 'lighting' | 'environment' | 'settings') => void;
  onExport: () => void;
  interactionKey: 'Control' | 'Shift' | 'Alt' | 'Meta';
  setInteractionKey: (k: 'Control' | 'Shift' | 'Alt' | 'Meta') => void;
  defaultAmbientIntensity: number;
  setDefaultAmbientIntensity: (v: number) => void;
  defaultAmbientColor: string;
  setDefaultAmbientColor: (v: string) => void;
  autoPickColor: boolean;
  setAutoPickColor: (v: boolean) => void;
  saveSettings: () => void;
  resetSettings: () => void;
}

export const ControlPanel: React.FC<ControlPanelProps> = ({
  lights,
  setLights,
  ambientIntensity,
  setAmbientIntensity,
  ambientColor,
  setAmbientColor,
  applyPreset,
  activeLightIndex,
  setActiveLightIndex,
  activeTab,
  setActiveTab,
  onExport,
  interactionKey,
  setInteractionKey,
  defaultAmbientIntensity,
  setDefaultAmbientIntensity,
  defaultAmbientColor,
  setDefaultAmbientColor,
  autoPickColor,
  setAutoPickColor,
  saveSettings,
  resetSettings
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const updateLight = (index: number, updates: Partial<LightParams>) => {
    setLights((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], ...updates };
      return next;
    });
  };

  const addLight = () => {
    setLights((prev) => [
      ...prev,
      { x: 0, y: 0, z: 2, intensity: 2, color: '#ffffff', softness: 50, radius: 20, visible: true },
    ]);
    setActiveLightIndex(lights.length); // Activate new light
    setActiveTab('lighting');
  };

  const removeLight = (index: number) => {
    setLights((prev) => prev.filter((_, i) => i !== index));
    if (activeLightIndex === index) {
      setActiveLightIndex(null);
    } else if (activeLightIndex !== null && activeLightIndex > index) {
      setActiveLightIndex(activeLightIndex - 1);
    }
  };

  const handleDownloadPreset = () => {
    const presetData = {
      name: 'Custom Preset',
      ambientIntensity,
      ambientColor,
      lights
    };
    const blob = new Blob([JSON.stringify(presetData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'lumina-preset.json';
    a.click();
  };

  const handleLoadPreset = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        if (data && Array.isArray(data.lights)) {
          applyPreset({
            name: data.name || 'Imported Preset',
            ambientIntensity: typeof data.ambientIntensity === 'number' ? data.ambientIntensity : defaultAmbientIntensity,
            ambientColor: data.ambientColor || defaultAmbientColor,
            lights: data.lights.map((l: any) => ({
              ...l,
              intensity: typeof l.intensity === 'number' ? l.intensity : 2,
              radius: typeof l.radius === 'number' ? l.radius : 20,
              x: typeof l.x === 'number' ? l.x : 0,
              y: typeof l.y === 'number' ? l.y : 0,
              z: typeof l.z === 'number' ? l.z : 2,
              softness: typeof l.softness === 'number' ? l.softness : 50,
              color: l.color || '#ffffff',
              visible: l.visible !== undefined ? l.visible : true,
            }))
          });
        }
      } catch (err) {
        console.error("Invalid preset file", err);
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <aside className="w-80 bg-[#0a0a0a] flex flex-col border-l border-white/10 text-white/80">
      
      <div className="flex bg-[#050505] border-b border-white/10 shrink-0">
        <button onClick={() => setActiveTab('presets')} className={`flex-1 py-3.5 border-b-2 flex justify-center items-center transition-colors ${activeTab === 'presets' ? 'border-blue-500 text-blue-500 bg-white/5' : 'border-transparent text-white/40 hover:text-white hover:bg-white/[0.02]'}`} title="Presets">
           <LayoutTemplate className="w-4 h-4" />
        </button>
        <button onClick={() => setActiveTab('lighting')} className={`flex-1 py-3.5 border-b-2 flex justify-center items-center transition-colors ${activeTab === 'lighting' ? 'border-blue-500 text-blue-500 bg-white/5' : 'border-transparent text-white/40 hover:text-white hover:bg-white/[0.02]'}`} title="Lighting">
           <Lightbulb className="w-4 h-4" />
        </button>
        <button onClick={() => setActiveTab('environment')} className={`flex-1 py-3.5 border-b-2 flex justify-center items-center transition-colors ${activeTab === 'environment' ? 'border-blue-500 text-blue-500 bg-white/5' : 'border-transparent text-white/40 hover:text-white hover:bg-white/[0.02]'}`} title="Environment">
           <Globe className="w-4 h-4" />
        </button>
        <button onClick={() => setActiveTab('settings')} className={`flex-1 py-3.5 border-b-2 flex justify-center items-center transition-colors ${activeTab === 'settings' ? 'border-blue-500 text-blue-500 bg-white/5' : 'border-transparent text-white/40 hover:text-white hover:bg-white/[0.02]'}`} title="Settings">
           <Settings className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        
        {activeTab === 'presets' && (
          <section className="animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-[11px] font-bold text-blue-500 uppercase tracking-widest">Library</h2>
              <div className="flex items-center gap-2">
                <button onClick={() => fileInputRef.current?.click()} className="text-white/40 hover:text-white transition-colors" title="Load Preset JSON">
                  <Upload className="w-3.5 h-3.5" />
                </button>
                <button onClick={handleDownloadPreset} className="text-white/40 hover:text-white transition-colors" title="Save Preset JSON">
                  <Download className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
            
            <input type="file" accept=".json" ref={fileInputRef} onChange={handleLoadPreset} className="hidden" />

            <div className="grid grid-cols-2 gap-2">
              {PRESETS.map((preset, index) => (
                <button
                  key={index}
                  onClick={() => applyPreset(preset)}
                  className="text-[10px] font-medium uppercase tracking-widest p-3 rounded bg-white/5 hover:bg-blue-500/20 hover:text-blue-400 border border-white/10 hover:border-blue-500/30 text-white/60 transition-all text-left truncate"
                >
                  {preset.name}
                </button>
              ))}
            </div>
          </section>
        )}

        {activeTab === 'environment' && (
          <section className="animate-in fade-in slide-in-from-right-4 duration-300">
            <h2 className="text-[11px] font-bold text-blue-500 uppercase tracking-widest mb-4">Global Ambient</h2>
            <div className="space-y-6">
              <div className="space-y-2">
                <div className="flex justify-between text-[11px]">
                  <label className="text-white/60 flex items-center gap-1.5"><Sun className="w-3 h-3" /> Base Intensity</label>
                  <span className="text-white/40 font-mono">{ambientIntensity?.toFixed(2) ?? '0.00'}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="3"
                  step="0.1"
                  value={ambientIntensity}
                  onChange={(e) => setAmbientIntensity(parseFloat(e.target.value))}
                  className="w-full accent-blue-500 bg-white/5 rounded-full h-1 appearance-none cursor-pointer"
                />
              </div>
              <div className="space-y-2">
                 <label className="text-[11px] text-white/60 block mb-2">Ambient Color (Tint)</label>
                 <div className="flex gap-2">
                   <input
                     type="color"
                     value={ambientColor}
                     onChange={(e) => setAmbientColor(e.target.value)}
                     className="w-full h-10 bg-transparent rounded border border-white/20 p-0 cursor-pointer"
                   />
                 </div>
              </div>
            </div>
          </section>
        )}

        {activeTab === 'lighting' && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-300">
            {lights.length === 0 && (
              <div className="text-center py-10 opacity-50">
                <Lightbulb className="w-8 h-8 mx-auto mb-3 text-white/30" />
                <p className="text-xs uppercase tracking-widest font-medium">No active lights</p>
              </div>
            )}
            
            {lights.map((light, index) => (
              <div key={index} className={`mb-6 transition-all ${activeLightIndex !== null && activeLightIndex !== index ? 'opacity-30 hover:opacity-100' : 'opacity-100'}`}>
                <div 
                  className={`flex justify-between items-center mb-4 cursor-pointer p-2 -mx-2 rounded transition-colors ${activeLightIndex === index ? 'bg-white/5 ring-1 ring-white/10' : 'hover:bg-white/[0.02]'}`}
                  onClick={() => setActiveLightIndex(activeLightIndex === index ? null : index)}
                >
                  <div className="flex items-center gap-3">
                    <h2 className="text-[11px] font-bold text-blue-500 uppercase tracking-widest">Light 0{index + 1}</h2>
                    <button
                      onClick={(e) => { e.stopPropagation(); updateLight(index, { visible: !light.visible }); }}
                      className={`text-white/40 hover:text-white transition-colors`}
                      title={light.visible ? "Hide Light" : "Show Light"}
                    >
                      {light.visible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); removeLight(index); }}
                    className="text-white/30 hover:text-red-400 transition-colors bg-black/50 p-1.5 rounded"
                    title="Remove Light"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                
                {activeLightIndex === index && (
                  <div className="space-y-6 pt-2 animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="space-y-2">
                      <div className="flex justify-between text-[11px]">
                        <label className="text-white/60">Power (Intensity)</label>
                        <span className="text-white/40 font-mono">{light.intensity?.toFixed(2) ?? '0.00'}</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="10"
                        step="0.1"
                        value={light.intensity}
                        onChange={(e) => updateLight(index, { intensity: parseFloat(e.target.value) })}
                        className="w-full accent-blue-500 bg-white/5 rounded-full h-1 appearance-none cursor-pointer"
                      />
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-[11px]">
                        <label className="text-white/60">Bulb Size (Radius)</label>
                        <span className="text-white/40 font-mono">{light.radius?.toFixed(1) ?? '0.0'}</span>
                      </div>
                      <input
                        type="range"
                        min="1"
                        max="50"
                        step="0.5"
                        value={light.radius}
                        onChange={(e) => updateLight(index, { radius: parseFloat(e.target.value) })}
                        className="w-full accent-blue-500 bg-white/5 rounded-full h-1 appearance-none cursor-pointer"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <div className="flex justify-between text-[11px]">
                          <label className="text-white/60">X-Pos</label>
                          <span className="text-white/40 font-mono">{light.x?.toFixed(1) ?? '0.0'}</span>
                        </div>
                        <input
                          type="range"
                          min="-20"
                          max="20"
                          step="0.5"
                          value={light.x}
                          onChange={(e) => updateLight(index, { x: parseFloat(e.target.value) })}
                          className="w-full accent-blue-500 bg-white/5 rounded-full h-1 appearance-none cursor-pointer"
                        />
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-[11px]">
                          <label className="text-white/60">Y-Pos</label>
                          <span className="text-white/40 font-mono">{light.y?.toFixed(1) ?? '0.0'}</span>
                        </div>
                        <input
                          type="range"
                          min="-20"
                          max="20"
                          step="0.5"
                          value={light.y}
                          onChange={(e) => updateLight(index, { y: parseFloat(e.target.value) })}
                          className="w-full accent-blue-500 bg-white/5 rounded-full h-1 appearance-none cursor-pointer"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <div className="flex justify-between text-[11px]">
                          <label className="text-white/60">Z-Pos (+ towards camera)</label>
                          <span className="text-white/40 font-mono">{light.z?.toFixed(1) ?? '0.0'}</span>
                        </div>
                        <input
                           type="range"
                           min="-20"
                           max="20"
                           step="0.1"
                           value={light.z}
                           onChange={(e) => updateLight(index, { z: parseFloat(e.target.value) })}
                           className="w-full accent-blue-500 bg-white/5 rounded-full h-1 appearance-none cursor-pointer"
                        />
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-[11px]">
                          <label className="text-white/60">Falloff (Distance)</label>
                          <span className="text-white/40 font-mono">{light.softness?.toFixed(0) ?? '0'}</span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          step="1"
                          value={light.softness}
                          onChange={(e) => updateLight(index, { softness: parseFloat(e.target.value) })}
                          className="w-full accent-blue-500 bg-white/5 rounded-full h-1 appearance-none cursor-pointer"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                       <label className="text-[11px] text-white/60 block mb-2">Bulb Color</label>
                       <div className="flex gap-2">
                         <input
                           type="color"
                           value={light.color}
                           onChange={(e) => updateLight(index, { color: e.target.value })}
                           className="w-full h-10 bg-transparent rounded border border-white/20 p-0 cursor-pointer"
                         />
                       </div>
                    </div>
                  </div>
                )}
              </div>
            ))}

            <button
              onClick={addLight}
              className="mt-4 w-full py-3.5 flex justify-center items-center gap-2 border border-dashed border-white/10 bg-white/5 hover:bg-white/10 transition-colors rounded-lg text-[11px] font-bold text-white/60 hover:text-white uppercase tracking-widest"
            >
              <Plus className="w-4 h-4" /> Add Bulb
            </button>
          </div>
        )}

        {activeTab === 'settings' && (
          <section className="animate-in fade-in slide-in-from-right-4 duration-300 space-y-8">
            <div>
              <h2 className="text-[11px] font-bold text-blue-500 uppercase tracking-widest mb-4">Interaction</h2>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[11px] text-white/60 block mb-2">Drag Activator Key</label>
                  <select 
                    value={interactionKey} 
                    onChange={(e) => setInteractionKey(e.target.value as any)}
                    className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-sm text-white/80 outline-none focus:border-blue-500/50"
                  >
                    <option value="Control">Control (Ctrl)</option>
                    <option value="Meta">Command (Cmd / Meta)</option>
                    <option value="Shift">Shift</option>
                    <option value="Alt">Alt / Option</option>
                  </select>
                  <p className="text-[10px] text-white/40 mt-1">Hold this key to move light bulbs with cursor.</p>
                </div>
              </div>
            </div>

            <div>
              <h2 className="text-[11px] font-bold text-blue-500 uppercase tracking-widest mb-4">On New Image</h2>
              <div className="space-y-6">
                
                <label className="flex items-center gap-2 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={autoPickColor}
                    onChange={(e) => setAutoPickColor(e.target.checked)}
                    className="accent-blue-500"
                  />
                  <span className="text-[11px] text-white/80">Auto-pick Ambient Color from Image</span>
                </label>

                {!autoPickColor && (
                  <div className="space-y-2">
                     <label className="text-[11px] text-white/60 block mb-2">Default Ambient Color</label>
                     <div className="flex gap-2">
                       <input
                         type="color"
                         value={defaultAmbientColor}
                         onChange={(e) => setDefaultAmbientColor(e.target.value)}
                         className="w-full h-10 bg-transparent rounded border border-white/20 p-0 cursor-pointer"
                       />
                     </div>
                  </div>
                )}

                <div className="space-y-2">
                  <div className="flex justify-between text-[11px]">
                    <label className="text-white/60">Default Ambient Intensity</label>
                    <span className="text-white/40 font-mono">{defaultAmbientIntensity?.toFixed(2) ?? '0.00'}</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="3"
                    step="0.1"
                    value={defaultAmbientIntensity}
                    onChange={(e) => setDefaultAmbientIntensity(parseFloat(e.target.value))}
                    className="w-full accent-blue-500 bg-white/5 rounded-full h-1 appearance-none cursor-pointer"
                  />
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-white/10 space-y-3">
               <button 
                 onClick={() => {
                   saveSettings();
                   alert("Settings saved to local storage!");
                 }}
                 className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-bold uppercase tracking-widest rounded transition-colors"
               >
                 Save Defaults
               </button>
               <button 
                 onClick={() => {
                   if (confirm("Reset settings to factory defaults?")) {
                     resetSettings();
                   }
                 }}
                 className="w-full py-2.5 bg-white/5 hover:bg-red-500/20 text-white/60 hover:text-red-400 text-[11px] font-bold uppercase tracking-widest rounded transition-colors"
               >
                 Reset Defaults
               </button>
            </div>
          </section>
        )}
      </div>
    </aside>
  );
};
