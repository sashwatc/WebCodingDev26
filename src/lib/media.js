export function getRecordPhotoUrls(record = {}, fallbackRecord = null) {
  const directUrls = [
    ...(Array.isArray(record.photo_urls) ? record.photo_urls : []),
    ...(Array.isArray(record.photoUrls) ? record.photoUrls : []),
    record.photo_url,
    record.photoUrl,
    record.proof_photo_url,
    record.proofPhotoUrl,
  ].filter(Boolean);

  if (directUrls.length > 0) {
    return [...new Set(directUrls)];
  }

  if (!fallbackRecord) {
    return [];
  }

  return getRecordPhotoUrls(fallbackRecord);
}

export function getPrimaryRecordPhoto(record = {}, fallbackRecord = null) {
  return getRecordPhotoUrls(record, fallbackRecord)[0] || "";
}
