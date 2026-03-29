const { stores } = require("./stores");

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

function collectClaimPhotoUrls(claim = {}) {
  return unique([claim.proof_photo_url, claim.proofPhotoUrl]);
}

function collectLostReportPhotoUrls(report = {}) {
  return unique([report.photo_url, report.photoUrl]);
}

function buildFoundItemImageSet(item = {}, claims = [], lostReports = []) {
  const currentImages = collectItemPhotoUrls(item);
  const relatedClaimImages = claims
    .filter((claim) => claim.found_item_id === item.id)
    .flatMap((claim) => collectClaimPhotoUrls(claim));

  const relatedLostReportImages = lostReports
    .filter((report) =>
      Array.isArray(report.matched_items) &&
      report.matched_items.some((match) => match?.found_item_id === item.id)
    )
    .flatMap((report) => collectLostReportPhotoUrls(report));

  const mergedImages = unique([...currentImages, ...relatedClaimImages, ...relatedLostReportImages]);
  const realImages = mergedImages.filter((url) => !isPlaceholderImage(url));
  return realImages.length > 0 ? realImages : mergedImages;
}

async function enrichFoundItemMedia(item) {
  if (!item) {
    return item;
  }

  const [claims, lostReports] = await Promise.all([
    stores.Claim.list(),
    stores.LostReport.list(),
  ]);

  const photoUrls = buildFoundItemImageSet(item, claims, lostReports);
  return {
    ...item,
    imageUrl: photoUrls[0] || item.imageUrl || "",
    photoUrls,
  };
}

async function enrichFoundItemsMedia(items = []) {
  const [claims, lostReports] = await Promise.all([
    stores.Claim.list(),
    stores.LostReport.list(),
  ]);

  return items.map((item) => {
    const photoUrls = buildFoundItemImageSet(item, claims, lostReports);
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
