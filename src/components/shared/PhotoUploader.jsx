/**
 * FindBack AI - Photo Uploader Component
 * Drag-and-drop file upload with preview, validation, and progress feedback.
 * Reused across found item and lost report forms.
 */

import React, { useState, useRef } from "react";
import { Upload, X, Loader2 } from "lucide-react";
import { appClient } from "@/api/appClient";

export default function PhotoUploader({ photos = [], onChange, maxPhotos = 3, label = "Upload Photos" }) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  const handleFiles = async (files) => {
    const validFiles = Array.from(files).filter(f => 
      f.type.startsWith("image/") && f.size < 10 * 1024 * 1024 // Max 10MB
    );
    if (validFiles.length === 0) return;

    setUploading(true);
    const newPhotos = [...photos];

    for (const file of validFiles) {
      if (newPhotos.length >= maxPhotos) break;
      const { file_url } = await appClient.integrations.Core.UploadFile({ file });
      newPhotos.push(file_url);
    }

    onChange(newPhotos);
    setUploading(false);
  };

  const removePhoto = (index) => {
    onChange(photos.filter((_, i) => i !== index));
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  return (
    <div className="space-y-3">
      <label className="text-sm font-medium text-slate-700">{label}</label>
      
      {/* Drag & Drop Zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
          isDragging
            ? "border-[hsl(174,60%,40%)] bg-teal-50/50"
            : "border-slate-200 hover:border-slate-300 bg-slate-50/50"
        } ${photos.length >= maxPhotos ? "opacity-50 pointer-events-none" : ""}`}
        role="button"
        aria-label="Upload photos by clicking or dragging files here"
        tabIndex={0}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") fileInputRef.current?.click(); }}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={(e) => handleFiles(e.target.files)}
          className="hidden"
          aria-hidden="true"
        />
        {uploading ? (
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="w-8 h-8 text-teal-600 animate-spin" />
            <p className="text-sm text-slate-500">Uploading...</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <Upload className="w-8 h-8 text-slate-400" />
            <p className="text-sm text-slate-600 font-medium">
              Drag & drop photos or click to browse
            </p>
            <p className="text-xs text-slate-400">
              Max {maxPhotos} photos, 10MB each • JPG, PNG, WEBP
            </p>
          </div>
        )}
      </div>

      {/* Photo Previews */}
      {photos.length > 0 && (
        <div className="flex gap-3 flex-wrap">
          {photos.map((url, i) => (
            <div key={i} className="relative w-20 h-20 rounded-lg overflow-hidden border border-slate-200 shadow-sm group">
              <img src={url} alt={`Uploaded photo ${i + 1}`} className="w-full h-full object-cover" />
              <button
                onClick={(e) => { e.stopPropagation(); removePhoto(i); }}
                className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                aria-label={`Remove photo ${i + 1}`}
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}