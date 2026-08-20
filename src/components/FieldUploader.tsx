'use client';

import { useRef, useState } from 'react';
import { Loader2 } from 'lucide-react';

interface FieldUploaderProps {
  onUpload?: (file: File, previewUrl: string) => void;
}

export default function FieldUploader({ onUpload }: FieldUploaderProps) {
  const [isDragging, setIsDragging]   = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl]   = useState<string | null>(null);
  const [isLoading, setIsLoading]     = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File) => {
    setIsLoading(true);
    const objectUrl = URL.createObjectURL(file);
    setTimeout(() => {
      setPreviewUrl(objectUrl);
      setUploadedFile(file);
      setIsLoading(false);
      onUpload?.(file, objectUrl);
    }, 1500);
  };

  const handleDragOver  = (e: React.DragEvent<HTMLDivElement>) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = () => setIsDragging(false);
  const handleDrop      = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault(); setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file?.type.startsWith('image/')) handleFile(file);
  };
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };
  const handleRemove = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null); setUploadedFile(null); setIsLoading(false);
    if (inputRef.current) inputRef.current.value = '';
  };
  const truncate = (name: string, max = 28) => {
    if (name.length <= max) return name;
    const ext = name.slice(name.lastIndexOf('.'));
    return name.slice(0, max - ext.length - 3) + '...' + ext;
  };

  return (
    <div className="bg-[#FFFDE7] border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-6">
      <h2 className="font-black text-2xl text-black mb-6 tracking-tight">📷 FIELD PHOTO UPLOAD</h2>

      <input ref={inputRef} type="file" accept="image/*" capture="environment"
        className="hidden" onChange={handleInputChange} />

      {/* Loading */}
      {isLoading && (
        <div className="flex items-center justify-center bg-[#FFD600] border-4 border-black h-64">
          <Loader2 className="w-16 h-16 animate-spin text-black" />
        </div>
      )}

      {/* Drop Zone */}
      {!isLoading && !previewUrl && (
        <div
          onClick={() => inputRef.current?.click()}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`border-4 border-dashed border-black p-12 text-center cursor-pointer transition-colors duration-100 select-none
            ${isDragging ? 'bg-[#FFD600] border-solid' : 'bg-[#FFFDE7] hover:bg-yellow-50'}`}
        >
          <div className="text-6xl mb-4">📷</div>
          <p className="font-black text-2xl text-black mb-2 tracking-tight">DRAG PHOTO HERE</p>
          <p className="text-black font-bold text-sm">or tap to use camera</p>
        </div>
      )}

      {/* Preview */}
      {!isLoading && previewUrl && uploadedFile && (
        <div>
          <div className="relative border-4 border-black overflow-hidden">
            <img src={previewUrl} alt="Field crop photo" className="object-cover w-full h-64" />
            <div className="absolute bottom-0 left-0 right-0 bg-black text-white px-4 py-2 flex items-center justify-between">
              <span className="text-sm font-bold truncate max-w-[70%]">{truncate(uploadedFile.name)}</span>
              <button onClick={handleRemove}
                className="text-[#FFD600] font-bold text-sm ml-4 hover:underline shrink-0 min-h-[32px]">
                REMOVE
              </button>
            </div>
          </div>
          <button
            className="mt-4 w-full py-4 bg-[#1B5E20] text-white border-4 border-black
              shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] font-black text-lg flex items-center justify-center gap-2
              transition-all duration-100 hover:translate-x-[2px] hover:translate-y-[2px]
              hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] min-h-[56px]"
          >
            ANALYSE CROP →
          </button>
        </div>
      )}
    </div>
  );
}
