import React, { useCallback } from 'react';
import { UploadCloud } from 'lucide-react';

interface UploadAreaProps {
  onImageSelected: (file: File) => void;
}

export const UploadArea: React.FC<UploadAreaProps> = ({ onImageSelected }) => {
  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        if (e.dataTransfer.files[0].type.startsWith('image/')) {
          onImageSelected(e.dataTransfer.files[0]);
        }
      }
    },
    [onImageSelected]
  );

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  }, []);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
        onImageSelected(e.target.files[0]);
      }
    },
    [onImageSelected]
  );

  return (
    <div
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      className="w-full h-full min-h-[400px] flex flex-col items-center justify-center border-2 border-dashed border-white/10 bg-[#0a0a0a] hover:bg-white/5 transition-colors rounded-lg cursor-pointer"
      onClick={() => document.getElementById('file-upload')?.click()}
    >
      <input
        id="file-upload"
        type="file"
        accept="image/*"
        onChange={handleChange}
        className="hidden"
      />
      <div className="flex flex-col items-center text-white/40">
        <UploadCloud className="w-12 h-12 mb-4 text-blue-500/80" />
        <h3 className="text-[11px] font-bold text-white uppercase tracking-widest mb-2">Import Image Asset</h3>
        <p className="mt-2 text-xs text-center px-4 max-w-sm leading-relaxed">
          Drag and drop an image here or click to browse.
          <br className="hidden sm:block mt-1" /> Models will execute entirely locally in browser runtime.
        </p>
      </div>
    </div>
  );
};
