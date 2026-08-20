'use client';

import { useRef, useState } from 'react';
import { Loader2, UploadCloud, Camera, X } from 'lucide-react';

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
    <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 sm:p-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-emerald-100 rounded-lg text-emerald-600">
          <Camera className="w-6 h-6" />
        </div>
        <h2 className="font-bold text-xl text-gray-900 tracking-tight">Field Photo Upload</h2>
      </div>

      <input ref={inputRef} type="file" accept="image/*" capture="environment"
        className="hidden" onChange={handleInputChange} />

      {/* Loading */}
      {isLoading && (
        <div className="flex flex-col items-center justify-center bg-gray-50 rounded-2xl border-2 border-gray-100 h-64 space-y-4">
          <Loader2 className="w-12 h-12 animate-spin text-emerald-500" />
          <p className="text-gray-500 font-medium">Processing image...</p>
        </div>
      )}

      {/* Drop Zone */}
      {!isLoading && !previewUrl && (
        <div
          onClick={() => inputRef.current?.click()}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all duration-200 select-none flex flex-col items-center justify-center min-h-[16rem]
            ${isDragging ? 'bg-emerald-50 border-emerald-500' : 'bg-gray-50 border-gray-300 hover:bg-gray-100 hover:border-gray-400'}`}
        >
          <div className="p-4 bg-white rounded-full shadow-sm mb-4">
            <UploadCloud className={`w-8 h-8 ${isDragging ? 'text-emerald-500' : 'text-gray-400'}`} />
          </div>
          <p className="font-semibold text-lg text-gray-700 mb-1">Drag photo here</p>
          <p className="text-gray-500 text-sm">or tap to browse / use camera</p>
        </div>
      )}

      {/* Preview */}
      {!isLoading && previewUrl && uploadedFile && (
        <div className="space-y-4">
          <div className="relative rounded-2xl overflow-hidden border border-gray-200 shadow-sm group">
            <img src={previewUrl} alt="Field crop photo" className="object-cover w-full h-64 transition-transform duration-500 group-hover:scale-105" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-100"></div>
            <div className="absolute bottom-0 left-0 right-0 p-4 flex items-center justify-between">
              <span className="text-sm font-medium text-white truncate max-w-[70%] drop-shadow-md">
                {truncate(uploadedFile.name)}
              </span>
              <button 
                onClick={handleRemove}
                className="p-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-full text-white transition-colors"
                title="Remove photo"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
          
          <button
            className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-md font-bold text-lg flex items-center justify-center gap-2 transition-all duration-200 hover:shadow-lg min-h-[56px]"
          >
            Analyse Crop
          </button>
        </div>
      )}
    </div>
  );
}
