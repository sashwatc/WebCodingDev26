function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

function isPlaceholderImage(url = "") {
  const value = String(url || "");
  return value.startsWith("data:image/svg+xml");
}

function collectItemPhotoUrls(item = {}) {
  return unique([
    ...(Array.isArray(item.photoUrls) ? item.photoUrls : []),
    ...(Array.isArray(item.photo_urls) ? item.photo_urls : []),
    item.imageUrl,
    item.image_url,
  ]);
}

function buildFoundItemImageSet(item = {}) {
  const currentImages = collectItemPhotoUrls(item);
  const realImages = currentImages.filter((url) => !isPlaceholderImage(url));
  return realImages.length > 0 ? realImages : currentImages;
}

async function enrichFoundItemMedia(item) {
  if (!item) {
    return item;
  }

  const photoUrls = buildFoundItemImageSet(item);
  return {
    ...item,
    imageUrl: photoUrls[0] || item.imageUrl || "",
    photoUrls,
  };
}

async function enrichFoundItemsMedia(items = []) {
  return items.map((item) => {
    const photoUrls = buildFoundItemImageSet(item);
    return {
      ...item,
      imageUrl: photoUrls[0] || item.imageUrl || "",
      photoUrls,
    };
  });
}

module.exports = {
  enrichFoundItemMedia,
  enrichFoundItemsMedia,
};
