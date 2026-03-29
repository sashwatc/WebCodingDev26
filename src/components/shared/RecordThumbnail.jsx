import React from "react";
import { Package } from "lucide-react";

export default function RecordThumbnail({
  src = "",
  alt = "",
  sizeClass = "h-16 w-16",
  className = "",
}) {
  return (
    <div className={`${sizeClass} overflow-hidden rounded-[18px] bg-slate-100 flex-shrink-0 ${className}`.trim()}>
      {src ? (
        <img src={src} alt={alt} className="h-full w-full object-cover" />
      ) : (
        <div className="flex h-full w-full items-center justify-center">
          <Package className="h-6 w-6 text-slate-300" />
        </div>
      )}
    </div>
  );
}
