export const IMAGE_UPLOAD_LIMITS = {
  maxBytes: 8 * 1024 * 1024,
  acceptedMimeTypes: ["image/jpeg", "image/png", "image/webp"],
  acceptAttribute: "image/jpeg,image/png,image/webp",
  maxOutputWidth: 1600,
  jpegQuality: 0.88,
};

export function formatFileSize(bytes = 0) {
  if (bytes < 1024) {
    return `${bytes} B`;
  }
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function validateImageFile(file) {
  if (!file) {
    return { valid: false, code: "missing" };
  }

  if (!IMAGE_UPLOAD_LIMITS.acceptedMimeTypes.includes(file.type)) {
    return { valid: false, code: "type" };
  }

  if (file.size > IMAGE_UPLOAD_LIMITS.maxBytes) {
    return { valid: false, code: "size", size: file.size };
  }

  return { valid: true };
}

export function loadImageFromFile(file) {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const image = new Image();

    image.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(image);
    };

    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Image could not be loaded."));
    };

    image.src = objectUrl;
  });
}

export function cropImageElement(image, { aspectRatio = 4 / 3, zoom = 1 } = {}) {
  const sourceWidth = image.naturalWidth || image.width;
  const sourceHeight = image.naturalHeight || image.height;
  const safeZoom = Math.min(Math.max(zoom, 1), 3);
  const sourceAspect = sourceWidth / sourceHeight;

  let cropWidth;
  let cropHeight;

  if (sourceAspect > aspectRatio) {
    cropHeight = sourceHeight / safeZoom;
    cropWidth = cropHeight * aspectRatio;
  } else {
    cropWidth = sourceWidth / safeZoom;
    cropHeight = cropWidth / aspectRatio;
  }

  const sx = Math.max(0, (sourceWidth - cropWidth) / 2);
  const sy = Math.max(0, (sourceHeight - cropHeight) / 2);

  const outputWidth = Math.min(IMAGE_UPLOAD_LIMITS.maxOutputWidth, Math.round(cropWidth));
  const outputHeight = Math.round(outputWidth / aspectRatio);

  const canvas = document.createElement("canvas");
  canvas.width = outputWidth;
  canvas.height = outputHeight;

  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("Canvas is not available.");
  }

  context.drawImage(image, sx, sy, cropWidth, cropHeight, 0, 0, outputWidth, outputHeight);
  return canvas;
}

export function canvasToFile(canvas, fileName = "photo.jpg", mimeType = "image/jpeg", quality = IMAGE_UPLOAD_LIMITS.jpegQuality) {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("Cropped image could not be created."));
          return;
        }

        resolve(new File([blob], fileName, { type: mimeType, lastModified: Date.now() }));
      },
      mimeType,
      quality
    );
  });
}

export async function cropFileToAspect(file, options = {}) {
  const image = await loadImageFromFile(file);
  const canvas = cropImageElement(image, options);
  const extension = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
  const mimeType = file.type === "image/png" ? "image/png" : file.type === "image/webp" ? "image/webp" : "image/jpeg";
  const baseName = (file.name || "photo").replace(/\.[^.]+$/, "");
  return canvasToFile(canvas, `${baseName}-cropped.${extension}`, mimeType);
}
