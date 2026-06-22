/**
 * FindBack AI - Photo Uploader Component
 * Drag-and-drop file upload with preview, validation, and progress feedback.
 * Reused across found item and lost report forms.
 */

import React, { useState, useRef } from "react";
import { Upload, X, Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { appClient } from "@/api/appClient";
import { useToast } from "@/components/ui/use-toast";

export default function PhotoUploader({ photos = [], onChange, maxPhotos = 3, label }) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);
  const dragDepthRef = useRef(0);
  const displayLabel = label || t("photo_uploader.upload_photos");

  const handleFiles = async (files) => {
    if (uploading || photos.length >= maxPhotos) return;

    const incomingFiles = Array.from(files || []);
    if (incomingFiles.length === 0) return;

    const validFiles = incomingFiles.filter(f => 
      f.type.startsWith("image/") && f.size < 10 * 1024 * 1024 // Max 10MB
    );
    if (validFiles.length === 0) {
      toast({
        title: t("photo_uploader.invalid_files_title", "No supported photos"),
        description: t("photo_uploader.invalid_files_description", "Upload image files under 10 MB."),
        variant: "destructive",
      });
      return;
    }

    setUploading(true);
    const newPhotos = [...photos];

    try {
      for (const file of validFiles) {
        if (newPhotos.length >= maxPhotos) break;
        const { file_url } = await appClient.integrations.Core.UploadFile({ file });
        if (file_url) newPhotos.push(file_url);
      }

      onChange(newPhotos);
    } catch (error) {
      toast({
        title: t("photo_uploader.upload_failed_title", "Upload failed"),
        description: error.message || t("photo_uploader.upload_failed_description", "Try the upload again."),
        variant: "destructive",
      });
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const removePhoto = (index) => {
    onChange(photos.filter((_, i) => i !== index));
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    dragDepthRef.current = 0;
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    dragDepthRef.current += 1;
    setIsDragging(true);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = "copy";
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    dragDepthRef.current = Math.max(0, dragDepthRef.current - 1);
    if (dragDepthRef.current === 0) {
      setIsDragging(false);
    }
  };

  return (
    <div className="space-y-3">
      <label className="text-sm font-medium text-slate-800">{displayLabel}</label>
      
      {/* Drag & Drop Zone */}
      <div
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`relative rounded-xl border-2 border-dashed p-6 text-center transition-colors ${
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
          disabled={uploading || photos.length >= maxPhotos}
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
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white">
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
            <div key={i} className="group relative h-24 w-24 overflow-hidden rounded-xl border border-slate-200 bg-white">
              <img src={url} alt={t("photo_uploader.uploaded_photo", { count: i + 1 })} className="w-full h-full object-cover" />
              <button
                onClick={(e) => { e.stopPropagation(); removePhoto(i); }}
                className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-slate-900 text-white opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100 sm:focus-visible:opacity-100"
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
