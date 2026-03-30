/**
 * FindBack AI - Photo Uploader Component
 * Drag-and-drop file upload with preview, validation, and progress feedback.
 * Reused across found item and lost report forms.
 */

import React, { useState, useRef } from "react";
import { Upload, X, Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { appClient } from "@/api/appClient";

export default function PhotoUploader({ photos = [], onChange, maxPhotos = 3, label }) {
  const { t } = useTranslation();
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);
  const displayLabel = label || t("photo_uploader.upload_photos");

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
      <label className="text-sm font-medium text-slate-800">{displayLabel}</label>
      
      {/* Drag & Drop Zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`relative rounded-[18px] border-2 border-dashed p-6 text-center transition-all ${
          isDragging
            ? "border-primary bg-slate-100"
            : "border-slate-300 bg-slate-50 hover:border-slate-400 hover:bg-slate-100"
        } ${photos.length >= maxPhotos ? "opacity-50 pointer-events-none" : ""}`}
        role="button"
        aria-label={t("photo_uploader.upload_area_label")}
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
            <p className="text-sm text-slate-500">{t("photo_uploader.uploading")}</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white shadow-[0_8px_18px_rgba(15,23,42,0.05)]">
              <Upload className="w-5 h-5 text-primary" />
            </div>
            <p className="text-sm font-semibold text-slate-700">
              {t("photo_uploader.drag_drop")}
            </p>
            <p className="text-xs text-slate-500">
              {t("photo_uploader.max_photos", { count: maxPhotos })}
            </p>
          </div>
        )}
      </div>

      {/* Photo Previews */}
      {photos.length > 0 && (
        <div className="flex gap-3 flex-wrap">
          {photos.map((url, i) => (
            <div key={i} className="group relative h-24 w-24 overflow-hidden rounded-[18px] border border-slate-200 bg-white shadow-[0_8px_18px_rgba(15,23,42,0.05)]">
              <img src={url} alt={t("photo_uploader.uploaded_photo", { count: i + 1 })} className="w-full h-full object-cover" />
              <button
                onClick={(e) => { e.stopPropagation(); removePhoto(i); }}
                className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-slate-900 text-white opacity-0 transition-opacity group-hover:opacity-100"
                aria-label={t("photo_uploader.remove_photo", { count: i + 1 })}
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
