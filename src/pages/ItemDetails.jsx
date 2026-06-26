import React, { useState } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useToast } from "@/components/ui/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "@tanstack/react-query";
import { appClient } from "@/api/appClient";
import { useAuth } from "@/lib/AuthContext";
import {
  formatLocalizedDate,
  translateCategory,
  translateColor,
  translateCondition,
  translateLocation,
} from "@/lib/i18n-helpers";
import {
  ArrowLeft, MapPin, Calendar, Clock, Tag, Package,
  Shield, Printer, Share2, ChevronLeft, ChevronRight,
  BookmarkPlus, BookmarkCheck, Camera, CheckCircle2, Lock
} from "lucide-react";

function normalizeLostReport(report = {}) {
  return {
    id: report.id || "",
    title: report.item_type || "Lost item report",
    description: report.description || "",
    ai_description: "",
    category: report.category || "",
    color: report.color || "",
    brand: report.brand || "",
    location_found: report.last_seen_location || "",
    date_found: report.date_lost || "",
    time_found: "",
    photo_urls: report.photo_url ? [report.photo_url] : [],
    status: report.status || "open",
    record_type: "lost",
    tags: [report.color, report.brand].filter(Boolean),
    created_date: report.created_date || "",
    updated_date: report.updated_date || "",
    distinguishing_features: report.extra_notes || "",
    matching_count: report.matched_items?.length || 0,
    matched_items: report.matched_items || [],
    contact_name: report.contact_name || "",
  };
}

const BG_MAIN = "#080c13";
const BG_PANEL = "#0a0e17";
const BG_CARD = "#0f1620";
const BORDER = "#1a2232";
const TEXT_PRIMARY = "#e2e8f0";
const TEXT_MUTED = "#475569";
const TEXT_DIM = "#64748b";
const AMBER = "#d97706";

const card = {
  background: BG_CARD,
  border: `1px solid ${BORDER}`,
  borderRadius: "10px",
  padding: "18px 20px",
};

const divider = {
  height: "1px",
  background: BORDER,
};

const actionBtn = {
  display: "flex", alignItems: "center", gap: "7px",
  background: BG_CARD, border: `1px solid ${BORDER}`, borderRadius: "8px",
  padding: "9px 18px", font: "600 13px Inter,sans-serif", color: "#94a3b8",
  cursor: "pointer", flexShrink: 0,
};

export default function ItemDetails() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { isAdmin, isLoadingAuth } = useAuth();
  const urlParams = new URLSearchParams(location.search);
  const itemId = urlParams.get("id");
  const itemTypeParam = urlParams.get("type");
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [savedItems, setSavedItems] = useState(() =>
    JSON.parse(localStorage.getItem("ltf_saved_items") || "[]")
  );
  const isSaved = savedItems.includes(itemId);

  const toggleSave = () => {
    const next = isSaved
      ? savedItems.filter((id) => id !== itemId)
      : [...savedItems, itemId];
    setSavedItems(next);
    localStorage.setItem("ltf_saved_items", JSON.stringify(next));
    toast({ title: isSaved ? "Removed from saved" : "Saved to your collection" });
  };

  const { data: item, isLoading, error } = useQuery({
    queryKey: ["itemDetails", itemTypeParam || "found", itemId],
    queryFn: async () => {
      if (itemTypeParam === "lost") {
        const reports = await appClient.entities.LostReport.filter({ id: itemId });
        return reports[0] ? normalizeLostReport(reports[0]) : null;
      }
      const foundItem = await appClient.entities.FoundItem.get(itemId);
      if (foundItem) return foundItem;
      const reports = await appClient.entities.LostReport.filter({ id: itemId });
      return reports[0] ? normalizeLostReport(reports[0]) : null;
    },
    enabled: !!itemId,
  });

  const isAdminView = !isLoadingAuth && isAdmin;
  const isLostReport = item?.record_type === "lost";

  const { data: custodyEvents = [] } = useQuery({
    queryKey: ["custodyEvents", itemId, isAdminView],
    queryFn: () => appClient.custody.events(itemId),
    enabled: !!itemId && !isLostReport,
  });

  const { data: custodyVerification } = useQuery({
    queryKey: ["custodyVerify", itemId],
    queryFn: () => appClient.custody.verify(itemId),
    enabled: !!itemId && !isLostReport,
  });

  const { data: proofVault } = useQuery({
    queryKey: ["proofVault", itemId],
    queryFn: () => appClient.proofVault.item(itemId),
    enabled: !!itemId && isAdminView && !isLostReport,
    retry: false,
  });

  const { data: recoveryCase } = useQuery({
    queryKey: ["lostReportRecoveryCase", itemId],
    queryFn: () => appClient.recoveryCases.byLostReport(itemId),
    enabled: !!itemId && isLostReport,
  });

  if (isLoading) {
    return (
      <div style={{ height: "calc(100vh - 64px)", display: "flex", overflow: "hidden", background: BG_MAIN }}>
        <div style={{ width: "46%", background: BG_PANEL }} />
        <div style={{ flex: 1, padding: "48px 52px" }}>
          <Skeleton className="h-6 w-32 mb-6" />
          <Skeleton className="h-10 w-3/4 mb-4" />
          <Skeleton className="h-4 w-full mb-2" />
          <Skeleton className="h-4 w-2/3" />
        </div>
      </div>
    );
  }

  if (error || !item) {
    return (
      <div style={{
        height: "calc(100vh - 64px)", display: "flex", alignItems: "center",
        justifyContent: "center", background: BG_MAIN, color: TEXT_PRIMARY,
        flexDirection: "column", gap: "16px",
      }}>
        <Package style={{ width: "48px", height: "48px", color: TEXT_MUTED }} />
        <h2 style={{ font: "700 20px/1.2 Inter,sans-serif" }}>
          {error ? t("item_details.unable_to_load") : t("item_details.item_not_found")}
        </h2>
        <p style={{ color: TEXT_DIM, fontSize: "14px" }}>
          {error ? error.message : t("item_details.item_not_found_description")}
        </p>
        <button
          onClick={() => navigate("/Search")}
          style={{
            background: AMBER, border: "none", borderRadius: "8px",
            padding: "10px 20px", font: "600 14px Inter,sans-serif", color: "#000", cursor: "pointer",
          }}
        >
          {t("item_details.back_to_search")}
        </button>
      </div>
    );
  }

  const photos = item.photo_urls || [];
  const displayTitle =
    isLostReport && (!item.title || item.title === "Lost item report")
      ? t("item_details.lost_item_report")
      : item.title;
  const locationLabel = isLostReport ? t("item_details.last_seen") : t("item_details.found_at");
  const dateLabel = isLostReport ? t("item_details.date_lost") : t("item_details.date_found");
  const privacyNote = isLostReport
    ? t("item_details.privacy_note_lost")
    : t("item_details.privacy_note_found");

  const statusBadge = isLostReport
    ? { bg: "#0f2d4a", text: "#38bdf8", border: "1px solid #164060", label: "LOST" }
    : { bg: "#14532d", text: "#4ade80", border: "none", label: "FOUND" };

  const canClaim = !isLostReport;
  const canMarkFound = isLostReport && !["resolved", "closed"].includes(item.status);

  const metaFields = [
    { icon: Tag, label: t("common.category"), value: translateCategory(t, item.category) || "—" },
    { icon: MapPin, label: locationLabel, value: translateLocation(t, item.location_found) || t("common.unknown_location") },
    { icon: Calendar, label: dateLabel, value: item.date_found ? formatLocalizedDate(item.date_found, "MMM d, yyyy") : t("common.not_available") },
    { icon: Clock, label: t("common.time"), value: item.time_found || t("common.not_available") },
  ];

  const attrRows = [
    item.color && { label: t("common.color"), value: translateColor(t, item.color) },
    item.brand && { label: t("common.brand"), value: item.brand },
    item.condition && { label: t("common.condition"), value: translateCondition(t, item.condition), green: true },
    item.distinguishing_features && { label: t("common.features"), value: item.distinguishing_features },
  ].filter(Boolean);

  const privateClues = proofVault?.private_verification_clues?.filter(Boolean) || [];

  return (
    <div style={{
      height: "calc(100vh - 64px)", overflow: "hidden", display: "flex",
      background: BG_MAIN, color: "#fff", fontFamily: "Inter, system-ui, sans-serif",
    }}>

      {/* LEFT: Photo panel */}
      <div style={{ width: "46%", flexShrink: 0, position: "relative", background: BG_PANEL }}>

        {/* Back button */}
        <button
          onClick={() => navigate(-1)}
          style={{
            position: "absolute", top: "20px", left: "20px", zIndex: 2,
            display: "flex", alignItems: "center", gap: "7px",
            background: "rgba(8,12,19,.7)", border: "1px solid rgba(255,255,255,.1)",
            backdropFilter: "blur(8px)", borderRadius: "8px", padding: "7px 14px",
            font: "600 13px Inter,sans-serif", color: "#fff", cursor: "pointer",
          }}
        >
          <ArrowLeft style={{ width: "14px", height: "14px" }} />
          Back
        </button>

        {/* Arrow navigation for multiple photos */}
        {photos.length > 1 && (
          <>
            <button
              onClick={() => setCurrentPhotoIndex((i) => (i - 1 + photos.length) % photos.length)}
              style={{
                position: "absolute", left: "20px", top: "50%", transform: "translateY(-50%)", zIndex: 2,
                background: "rgba(8,12,19,.7)", border: "1px solid rgba(255,255,255,.1)",
                backdropFilter: "blur(8px)", borderRadius: "8px", padding: "8px",
                color: "#fff", cursor: "pointer", display: "flex",
              }}
            >
              <ChevronLeft style={{ width: "16px", height: "16px" }} />
            </button>
            <button
              onClick={() => setCurrentPhotoIndex((i) => (i + 1) % photos.length)}
              style={{
                position: "absolute", right: "20px", top: "50%", transform: "translateY(-50%)", zIndex: 2,
                background: "rgba(8,12,19,.7)", border: "1px solid rgba(255,255,255,.1)",
                backdropFilter: "blur(8px)", borderRadius: "8px", padding: "8px",
                color: "#fff", cursor: "pointer", display: "flex",
              }}
            >
              <ChevronRight style={{ width: "16px", height: "16px" }} />
            </button>
          </>
        )}

        {/* Photo or placeholder */}
        {photos.length > 0 ? (
          <img
            src={photos[currentPhotoIndex]}
            alt={displayTitle}
            style={{ width: "100%", height: "100%", objectFit: "contain" }}
          />
        ) : (
          <div style={{
            width: "100%", height: "100%",
            background: "linear-gradient(160deg,#111827 0%,#0d1520 60%,#090e18 100%)",
            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "16px",
          }}>
            <Camera style={{ width: "56px", height: "56px", color: BORDER }} />
            <span style={{ font: "500 13px Inter,sans-serif", color: BORDER }}>Item photo</span>
          </div>
        )}

        {/* Bottom gradient */}
        <div style={{
          position: "absolute", bottom: 0, left: 0, right: 0, height: "120px",
          background: "linear-gradient(to top,rgba(8,12,19,.8),transparent)",
          pointerEvents: "none",
        }} />

        {/* Dot indicator for multiple photos */}
        {photos.length > 1 && (
          <div style={{
            position: "absolute", bottom: "18px", left: "50%", transform: "translateX(-50%)",
            display: "flex", gap: "6px", zIndex: 3,
          }}>
            {photos.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentPhotoIndex(i)}
                style={{
                  width: i === currentPhotoIndex ? "20px" : "6px", height: "6px",
                  borderRadius: "3px", border: "none", cursor: "pointer", padding: 0,
                  background: i === currentPhotoIndex ? AMBER : "rgba(255,255,255,.3)",
                  transition: "width .2s, background .2s",
                }}
              />
            ))}
          </div>
        )}

        {/* Item ID watermark */}
        {item.item_code && photos.length <= 1 && (
          <div style={{
            position: "absolute", bottom: "18px", left: "20px",
            font: "500 11px 'JetBrains Mono',monospace",
            color: "rgba(255,255,255,.25)", letterSpacing: ".5px",
          }}>
            {item.item_code}
          </div>
        )}
      </div>

      {/* RIGHT: Detail panel */}
      <div style={{
        flex: 1, overflowY: "auto", background: BG_MAIN, padding: "48px 52px 48px",
        scrollbarWidth: "thin", scrollbarColor: `${BORDER} transparent`,
      }}>

        {/* Status badges */}
        <div style={{ display: "flex", gap: "7px", marginBottom: "24px", flexWrap: "wrap" }}>
          <span style={{
            background: statusBadge.bg, color: statusBadge.text,
            font: "600 10px Inter,sans-serif", padding: "4px 10px",
            borderRadius: "20px", letterSpacing: ".5px", border: statusBadge.border,
          }}>
            {statusBadge.label}
          </span>
          {!isLostReport && item.status === "approved" && (
            <span style={{
              background: "#0f2d4a", color: "#38bdf8", font: "600 10px Inter,sans-serif",
              padding: "4px 10px", borderRadius: "20px", letterSpacing: ".5px", border: "1px solid #164060",
            }}>
              AVAILABLE
            </span>
          )}
          {item.item_code && (
            <span style={{
              background: "#111827", color: TEXT_MUTED,
              font: "500 11px 'JetBrains Mono',monospace",
              padding: "4px 10px", borderRadius: "20px", letterSpacing: ".3px",
            }}>
              {item.item_code}
            </span>
          )}
        </div>

        {/* Title */}
        <h1 style={{ font: "800 34px/1.15 Inter,sans-serif", color: "#fff", marginBottom: "14px" }}>
          {displayTitle}
        </h1>

        {/* Description */}
        <p style={{ font: "400 15px/1.75 Inter,sans-serif", color: TEXT_DIM, marginBottom: "34px" }}>
          {item.ai_description || item.description || "No description provided."}
        </p>

        {/* Divider */}
        <div style={{ ...divider, marginBottom: "30px" }} />

        {/* 2×2 metadata grid */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "30px" }}>
          {metaFields.map(({ icon: Icon, label, value }) => (
            <div key={label} style={card}>
              <div style={{ display: "flex", alignItems: "center", gap: "5px", marginBottom: "5px" }}>
                <Icon style={{ width: "11px", height: "11px", color: TEXT_MUTED }} />
                <span style={{ font: "600 10px Inter,sans-serif", color: TEXT_MUTED, textTransform: "uppercase", letterSpacing: ".6px" }}>
                  {label}
                </span>
              </div>
              <div style={{ font: "600 14px Inter,sans-serif", color: TEXT_PRIMARY }}>{value}</div>
            </div>
          ))}
        </div>

        {/* Attributes panel */}
        {attrRows.length > 0 && (
          <div style={{ ...card, marginBottom: "20px" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {attrRows.map((row, i) => (
                <React.Fragment key={row.label}>
                  {i > 0 && <div style={divider} />}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "12px" }}>
                    <span style={{ font: "500 13px Inter,sans-serif", color: TEXT_MUTED, flexShrink: 0 }}>
                      {row.label}
                    </span>
                    <span style={{ font: "600 13px Inter,sans-serif", color: row.green ? "#4ade80" : TEXT_PRIMARY, textAlign: "right" }}>
                      {row.value}
                    </span>
                  </div>
                </React.Fragment>
              ))}
            </div>
          </div>
        )}

        {/* Tags */}
        {item.tags?.length > 0 && (
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "30px" }}>
            {item.tags.map((tag, i) => (
              <span key={i} style={{
                background: "#111827", border: `1px solid ${BORDER}`, borderRadius: "20px",
                padding: "4px 12px", font: "500 11px Inter,sans-serif", color: TEXT_DIM, letterSpacing: ".3px",
              }}>
                {String(tag).toUpperCase()}
              </span>
            ))}
          </div>
        )}

        {/* Admin Only: storage location */}
        {isAdminView && !isLostReport && item.storage_location && (
          <div style={{
            background: "#1c1500", border: "1px solid #3b2800", borderRadius: "12px",
            padding: "20px 22px", marginBottom: "14px",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "7px", marginBottom: "6px" }}>
              <Shield style={{ width: "13px", height: "13px", color: AMBER }} />
              <span style={{ font: "700 11px Inter,sans-serif", color: AMBER, textTransform: "uppercase", letterSpacing: ".7px" }}>
                Admin Only
              </span>
            </div>
            <div style={{ font: "600 15px Inter,sans-serif", color: "#fbbf24" }}>
              Storage: {item.storage_location}
            </div>
          </div>
        )}

        {/* Custody Ledger */}
        {!isLostReport && custodyEvents.length > 0 && (
          <div style={{ ...card, borderRadius: "12px", marginBottom: "14px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px" }}>
              <div>
                <div style={{ font: "600 13px Inter,sans-serif", color: "#fff", marginBottom: "2px" }}>
                  Tamper-Evident Custody Ledger
                </div>
                <div style={{ font: "500 11px Inter,sans-serif", color: TEXT_MUTED }}>Chain of custody record</div>
              </div>
              <span style={{
                background: custodyVerification?.verified === false ? "#3b2800" : "#14532d",
                color: custodyVerification?.verified === false ? AMBER : "#4ade80",
                font: "600 10px Inter,sans-serif", padding: "4px 10px", borderRadius: "6px",
                letterSpacing: ".5px", display: "flex", alignItems: "center", gap: "5px",
              }}>
                <CheckCircle2 style={{ width: "10px", height: "10px" }} />
                {custodyVerification?.verified === false ? "ATTENTION NEEDED" : "INTEGRITY VERIFIED"}
              </span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {custodyEvents.map((event) => (
                <div key={event.id || `${event.sequence_number}-${event.event_type}`}
                  style={{ display: "flex", gap: "12px", alignItems: "flex-start" }}>
                  <div style={{
                    width: "22px", height: "22px", background: "#14532d",
                    border: "2px solid #4ade80", borderRadius: "50%",
                    display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                  }}>
                    <span style={{ font: "700 10px 'JetBrains Mono',monospace", color: "#4ade80" }}>
                      {event.sequence_number}
                    </span>
                  </div>
                  <div style={{ flex: 1, paddingTop: "2px" }}>
                    <div style={{ font: "600 13px Inter,sans-serif", color: TEXT_PRIMARY, marginBottom: "2px", textTransform: "capitalize" }}>
                      {String(event.event_type || "").replaceAll("_", " ")}
                    </div>
                    {event.note && (
                      <div style={{ font: "500 11px Inter,sans-serif", color: TEXT_MUTED }}>{event.note}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recovery zones (lost items) */}
        {isLostReport && recoveryCase && (
          <div style={{ ...card, borderRadius: "12px", marginBottom: "14px" }}>
            <div style={{ font: "600 13px Inter,sans-serif", color: "#fff", marginBottom: "10px" }}>
              Likely Recovery Zones
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: recoveryCase.recovery_plan ? "12px" : 0 }}>
              {(recoveryCase.likely_zone_summaries || []).map((zone) => (
                <span key={zone} style={{
                  background: "#111827", border: `1px solid ${BORDER}`, borderRadius: "20px",
                  padding: "4px 12px", font: "500 11px Inter,sans-serif", color: TEXT_DIM,
                }}>
                  {zone}
                </span>
              ))}
            </div>
            {recoveryCase.recovery_plan && (
              <p style={{ font: "400 12px/1.6 Inter,sans-serif", color: TEXT_MUTED, whiteSpace: "pre-line" }}>
                {recoveryCase.recovery_plan}
              </p>
            )}
          </div>
        )}

        {/* Private clues (admin proof vault) */}
        {isAdminView && privateClues.length > 0 && (
          <div style={{
            background: "#1c1500", border: "1px solid #7c4e00", borderRadius: "12px",
            padding: "20px 22px", marginBottom: "14px",
          }}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
              <Lock style={{ width: "14px", height: "14px", color: AMBER, flexShrink: 0, marginTop: "2px" }} />
              <div style={{ font: "500 13px/1.6 Inter,sans-serif", color: AMBER, fontStyle: "italic" }}>
                Private clues: {privateClues.join(", ")}
              </div>
            </div>
          </div>
        )}

        {/* Asset tag */}
        {isAdminView && proofVault?.asset_tag && (
          <div style={{
            background: "#1c1500", border: "1px solid #7c4e00", borderRadius: "12px",
            padding: "16px 22px", marginBottom: "14px",
          }}>
            <span style={{ font: "500 12px Inter,sans-serif", color: TEXT_MUTED }}>Asset tag: </span>
            <span style={{ font: "600 12px 'JetBrains Mono',monospace", color: "#fbbf24" }}>
              {proofVault.asset_tag}
            </span>
          </div>
        )}

        {/* Privacy note */}
        <div style={{ ...card, borderRadius: "12px", marginBottom: "24px", display: "flex", alignItems: "flex-start", gap: "12px" }}>
          <Shield style={{ width: "13px", height: "13px", color: TEXT_MUTED, flexShrink: 0, marginTop: "2px" }} />
          <p style={{ font: "400 12px/1.6 Inter,sans-serif", color: TEXT_MUTED }}>{privacyNote}</p>
        </div>

        {/* Action bar */}
        <div style={{
          borderTop: `1px solid ${BORDER}`, paddingTop: "20px",
          display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap",
        }}>
          {canClaim && (
            <Link to={`/ClaimItem?id=${item.id}`} style={{
              flex: 1, minWidth: "140px", background: "#16a34a", border: "none", borderRadius: "8px",
              padding: "11px 20px", font: "700 14px Inter,sans-serif", color: "#fff",
              cursor: "pointer", display: "flex", alignItems: "center",
              justifyContent: "center", gap: "8px", textDecoration: "none", whiteSpace: "nowrap",
            }}>
              <CheckCircle2 style={{ width: "15px", height: "15px" }} />
              {t("item_details.claim_button")}
            </Link>
          )}
          {canMarkFound && (
            <Link to={`/ReportFound?lost_report_id=${item.id}`} style={{
              flex: 1, minWidth: "140px", background: AMBER, border: "none", borderRadius: "8px",
              padding: "11px 20px", font: "700 14px Inter,sans-serif", color: "#000",
              cursor: "pointer", display: "flex", alignItems: "center",
              justifyContent: "center", gap: "8px", textDecoration: "none", whiteSpace: "nowrap",
            }}>
              <CheckCircle2 style={{ width: "15px", height: "15px" }} />
              {t("lost_items.i_found_this", "I Found This")}
            </Link>
          )}
          <button onClick={() => window.print()} style={actionBtn}>
            <Printer style={{ width: "14px", height: "14px" }} />
            {t("common.print")}
          </button>
          <button
            onClick={() => {
              const shareUrl = `${window.location.origin}${window.location.pathname}#/ItemDetails?id=${itemId}`;
              navigator.clipboard.writeText(shareUrl).then(() => toast({ title: "Link copied" }));
            }}
            style={actionBtn}
          >
            <Share2 style={{ width: "14px", height: "14px" }} />
            {t("common.share")}
          </button>
          <button
            onClick={toggleSave}
            style={{
              ...actionBtn,
              background: isSaved ? "#1c1500" : BG_CARD,
              border: `1px solid ${isSaved ? "#7c4e00" : BORDER}`,
              color: isSaved ? AMBER : "#94a3b8",
            }}
          >
            {isSaved
              ? <BookmarkCheck style={{ width: "14px", height: "14px", fill: AMBER, stroke: AMBER }} />
              : <BookmarkPlus style={{ width: "14px", height: "14px" }} />
            }
            {isSaved ? "Saved" : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}
