import React, { useState, useRef, useCallback } from 'react';
import { supabase } from '../../supabase';
import { Upload, X, CheckCircle2, AlertCircle, ImageIcon, Star } from 'lucide-react';

// ============================================================================
// TYPES
// ============================================================================
type UploadStatus = 'idle' | 'uploading' | 'done' | 'error';

interface ImageSlot {
  id: string;
  file: File;
  preview: string;
  progress: number;
  status: UploadStatus;
  url?: string;
  error?: string;
}

interface ProductImageUploaderProps {
  onImagesChange: (urls: string[]) => void;
  maxImages?: number;
}

// ============================================================================
// SUPABASE STORAGE
// ============================================================================
const BUCKET = 'product-images';

// ============================================================================
// COMPONENT
// ============================================================================
export const ProductImageUploader: React.FC<ProductImageUploaderProps> = ({
  onImagesChange,
  maxImages = 6
}) => {
  const [slots, setSlots] = useState<ImageSlot[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dragCounter = useRef(0);

  // Notify parent whenever slot URLs change
  const notifyParent = useCallback((updated: ImageSlot[]) => {
    const urls = updated
      .filter(s => s.status === 'done' && s.url)
      .map(s => s.url!);
    onImagesChange(urls);
  }, [onImagesChange]);

  const validateFile = (file: File): string | null => {
    if (!file.type.startsWith('image/')) return 'Solo se permiten imágenes (PNG, JPG, WEBP)';
    if (file.size > 5 * 1024 * 1024) return 'El archivo supera el límite de 5 MB';
    return null;
  };

  const uploadSlot = useCallback(async (slot: ImageSlot) => {
    const ext = slot.file.name.split('.').pop() || 'jpg';
    const path = `products/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

    // Fake incremental progress while uploading
    let fakeProgress = 10;
    const ticker = setInterval(() => {
      fakeProgress = Math.min(fakeProgress + 12, 82);
      setSlots(prev => prev.map(s =>
        s.id === slot.id ? { ...s, progress: fakeProgress } : s
      ));
    }, 280);

    try {
      const { data, error } = await supabase.storage
        .from(BUCKET)
        .upload(path, slot.file, {
          cacheControl: '3600',
          upsert: false,
          contentType: slot.file.type
        });

      clearInterval(ticker);

      if (error) {
        const msg = error.message.toLowerCase().includes('bucket')
          ? 'Bucket no encontrado. Ejecuta SKINLY_SETUP.sql en Supabase SQL Editor.'
          : error.message;
        setSlots(prev => {
          const updated = prev.map(s =>
            s.id === slot.id
              ? { ...s, status: 'error' as UploadStatus, progress: 0, error: msg }
              : s
          );
          notifyParent(updated);
          return updated;
        });
        return;
      }

      const { data: { publicUrl } } = supabase.storage.from(BUCKET).getPublicUrl(data.path);

      setSlots(prev => {
        const updated = prev.map(s =>
          s.id === slot.id
            ? { ...s, status: 'done' as UploadStatus, progress: 100, url: publicUrl }
            : s
        );
        notifyParent(updated);
        return updated;
      });
    } catch (err: any) {
      clearInterval(ticker);
      setSlots(prev => {
        const updated = prev.map(s =>
          s.id === slot.id
            ? { ...s, status: 'error' as UploadStatus, progress: 0, error: err.message || 'Error de red' }
            : s
        );
        notifyParent(updated);
        return updated;
      });
    }
  }, [notifyParent]); // eslint-disable-line react-hooks/exhaustive-deps

  const processFiles = useCallback((files: File[]) => {
    setSlots(prev => {
      const remaining = maxImages - prev.length;
      if (remaining <= 0) return prev;

      const toAdd = files.slice(0, remaining);
      const newSlots: ImageSlot[] = toAdd.map(file => {
        const validationError = validateFile(file);
        return {
          id: `${Date.now()}-${Math.random()}`,
          file,
          preview: URL.createObjectURL(file),
          progress: validationError ? 0 : 5,
          status: validationError ? 'error' as UploadStatus : 'uploading' as UploadStatus,
          error: validationError || undefined
        };
      });

      const combined = [...prev, ...newSlots];

      // Kick off uploads for valid new slots
      newSlots
        .filter(s => s.status === 'uploading')
        .forEach(s => uploadSlot(s));

      return combined;
    });
  }, [maxImages, uploadSlot]);

  // Drag & Drop handlers
  const onDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    dragCounter.current++;
    setIsDragging(true);
  };
  const onDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    dragCounter.current--;
    if (dragCounter.current === 0) setIsDragging(false);
  };
  const onDragOver = (e: React.DragEvent) => { e.preventDefault(); };
  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    dragCounter.current = 0;
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    processFiles(files);
  };

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      processFiles(Array.from(e.target.files));
      e.target.value = '';
    }
  };

  const removeSlot = (id: string) => {
    setSlots(prev => {
      const slot = prev.find(s => s.id === id);
      if (slot) URL.revokeObjectURL(slot.preview);
      const updated = prev.filter(s => s.id !== id);
      notifyParent(updated);
      return updated;
    });
  };

  const retrySlot = (id: string) => {
    setSlots(prev => {
      const slot = prev.find(s => s.id === id);
      if (!slot) return prev;
      const reset = prev.map(s =>
        s.id === id
          ? { ...s, status: 'uploading' as UploadStatus, progress: 5, error: undefined }
          : s
      );
      uploadSlot({ ...slot, status: 'uploading', progress: 5, error: undefined });
      return reset;
    });
  };

  const doneCount = slots.filter(s => s.status === 'done').length;
  const uploadingCount = slots.filter(s => s.status === 'uploading').length;
  const canAddMore = slots.length < maxImages;

  return (
    <div className="space-y-3">

      {/* ── Header info ──────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <label className="block text-xs font-semibold uppercase tracking-wider text-brand-black/60">
          Imágenes del Producto
        </label>
        <span className="text-[10px] font-bold text-brand-black/35">
          {doneCount}/{maxImages} subidas
          {uploadingCount > 0 && (
            <span className="ml-1.5 text-brand-green-dark animate-pulse">
              · Subiendo {uploadingCount}…
            </span>
          )}
        </span>
      </div>

      {/* ── Drop Zone ─────────────────────────────────────────── */}
      {canAddMore && (
        <div
          onDragEnter={onDragEnter}
          onDragLeave={onDragLeave}
          onDragOver={onDragOver}
          onDrop={onDrop}
          onClick={() => inputRef.current?.click()}
          className={`
            relative flex flex-col items-center justify-center gap-3 p-6
            border-2 border-dashed rounded-luxury cursor-pointer
            transition-all duration-300 ease-luxury select-none
            ${isDragging
              ? 'border-brand-green-dark bg-brand-green-dark/8 scale-[1.01] shadow-lg shadow-brand-green-dark/10'
              : 'border-brand-black/12 hover:border-brand-green-dark/50 hover:bg-brand-green-dark/3'
            }
          `}
        >
          <input
            ref={inputRef}
            type="file"
            multiple
            accept="image/png,image/jpeg,image/webp,image/gif"
            className="hidden"
            onChange={onInputChange}
          />

          {/* Animated icon */}
          <div className={`
            w-12 h-12 rounded-full flex items-center justify-center
            transition-all duration-300
            ${isDragging ? 'bg-brand-green-dark/20 scale-110' : 'bg-brand-black/5'}
          `}>
            {isDragging
              ? <ImageIcon size={22} className="text-brand-green-dark" />
              : <Upload size={20} className="text-brand-black/40" />
            }
          </div>

          <div className="text-center">
            <p className={`text-xs font-bold transition-colors ${isDragging ? 'text-brand-green-dark' : 'text-brand-black/65'}`}>
              {isDragging ? '¡Suelta para subir!' : 'Arrastra imágenes aquí'}
            </p>
            <p className="text-[10px] text-brand-black/35 font-medium mt-0.5">
              o <span className="text-brand-green-dark font-bold underline underline-offset-2">haz clic para seleccionar</span>
            </p>
            <p className="text-[9px] text-brand-black/25 mt-1.5 font-medium">
              PNG · JPG · WEBP &nbsp;·&nbsp; Máx. 5 MB por imagen &nbsp;·&nbsp; Hasta {maxImages} fotos
            </p>
          </div>
        </div>
      )}

      {/* ── Image Grid ────────────────────────────────────────── */}
      {slots.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {slots.map((slot, idx) => (
            <ImageCard
              key={slot.id}
              slot={slot}
              isPrimary={idx === 0}
              onRemove={() => removeSlot(slot.id)}
              onRetry={() => retrySlot(slot.id)}
            />
          ))}
        </div>
      )}

      {/* ── Status summary ────────────────────────────────────── */}
      {doneCount > 0 && (
        <div className="flex items-center gap-1.5 text-[10px] font-semibold text-brand-green-dark bg-brand-green-dark/8 border border-brand-green-dark/15 px-3 py-2 rounded-luxury">
          <CheckCircle2 size={13} />
          {doneCount === 1
            ? '1 imagen guardada en Supabase Storage'
            : `${doneCount} imágenes guardadas en Supabase Storage`}
          {doneCount > 0 && (
            <span className="ml-auto text-brand-black/40 font-medium">La primera es la imagen principal</span>
          )}
        </div>
      )}
    </div>
  );
};

// ============================================================================
// IMAGE CARD — individual preview tile
// ============================================================================
const ImageCard: React.FC<{
  slot: ImageSlot;
  isPrimary: boolean;
  onRemove: () => void;
  onRetry: () => void;
}> = ({ slot, isPrimary, onRemove, onRetry }) => {
  return (
    <div className="relative group aspect-square rounded-luxury overflow-hidden border border-brand-black/8 bg-brand-gray-soft shadow-sm">

      {/* Preview image */}
      <img
        src={slot.preview}
        alt="preview"
        className={`w-full h-full object-cover transition-all duration-500 ${
          slot.status === 'uploading' ? 'opacity-55 scale-105' : 'opacity-100 scale-100'
        }`}
        draggable={false}
      />

      {/* Primary badge */}
      {isPrimary && slot.status === 'done' && (
        <div className="absolute top-1.5 left-1.5 flex items-center gap-0.5 bg-brand-green-dark text-white text-[8px] font-black uppercase tracking-wide px-1.5 py-0.5 rounded-full shadow">
          <Star size={8} className="fill-white" />
          Principal
        </div>
      )}

      {/* Uploading overlay — progress bar */}
      {slot.status === 'uploading' && (
        <div className="absolute inset-0 flex flex-col items-center justify-end bg-gradient-to-t from-brand-black/70 via-brand-black/20 to-transparent p-2.5">
          {/* Spinning ring */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-8 h-8 rounded-full border-2 border-white/20 border-t-brand-green-light animate-spin" />
          </div>
          {/* Progress bar */}
          <div className="w-full space-y-1">
            <div className="w-full h-1 bg-white/20 rounded-full overflow-hidden">
              <div
                className="h-full bg-brand-green-light rounded-full transition-all duration-300"
                style={{ width: `${slot.progress}%` }}
              />
            </div>
            <p className="text-[9px] text-white/70 font-bold text-center">{slot.progress}%</p>
          </div>
        </div>
      )}

      {/* Done check */}
      {slot.status === 'done' && (
        <div className="absolute bottom-1.5 right-1.5 w-5 h-5 rounded-full bg-brand-green-dark/90 flex items-center justify-center shadow">
          <CheckCircle2 size={12} className="text-white" />
        </div>
      )}

      {/* Error overlay */}
      {slot.status === 'error' && (
        <div className="absolute inset-0 bg-red-950/75 flex flex-col items-center justify-center gap-1 p-2">
          <AlertCircle size={18} className="text-red-300 shrink-0" />
          <p className="text-[8px] text-red-200 text-center font-semibold leading-tight line-clamp-2">
            {slot.error || 'Error al subir'}
          </p>
          <button
            onClick={(e) => { e.stopPropagation(); onRetry(); }}
            className="mt-0.5 text-[8px] font-black text-white/80 underline underline-offset-1 hover:text-white cursor-pointer transition-colors"
          >
            Reintentar
          </button>
        </div>
      )}

      {/* Remove button — visible on hover */}
      <button
        onClick={(e) => { e.stopPropagation(); onRemove(); }}
        className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-brand-black/65 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 cursor-pointer hover:bg-red-600 hover:scale-110 active:scale-95 shadow"
        title="Eliminar imagen"
      >
        <X size={11} />
      </button>
    </div>
  );
};
