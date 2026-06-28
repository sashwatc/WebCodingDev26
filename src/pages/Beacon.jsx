/**
 * Beacon page
 *
 * A location-aware landing page reached by scanning/opening a per-zone "beacon"
 * link (e.g. a QR code posted in a campus area). The page reads `zone` and
 * `event` ids from the URL query string, looks up the human-readable zone label,
 * and presents quick actions pre-scoped to that zone: report a found item here,
 * report a lost item here, browse nearby items, or jump back to the event hub.
 * It deliberately does NOT use GPS — the location is inferred purely from the
 * scanned beacon link and can be corrected later on the report form.
 */
import React from "react";
import { Link, useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { appClient } from "@/api/appClient";
import { Button } from "@/components/ui/button";
import { MapPin } from "lucide-react";

export default function Beacon() {
  // Read the zone/event identifiers encoded in the beacon link's query string.
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const zoneId = params.get("zone") || "";
  const eventId = params.get("event") || "";
  // Fetch the full list of campus zones so we can resolve zoneId -> label.
  const { data: zones = [] } = useQuery({ queryKey: ["beaconZones"], queryFn: () => appClient.campusZones.list() });
  const zone = zones.find((entry) => entry.id === zoneId);
  // Pre-fill the search query with the zone label when known, so "Browse
  // Nearby Items" lands on results scoped to this location.
  const searchTarget = zone?.label ? `/Search?q=${encodeURIComponent(zone.label)}` : "/Search";

  return (
    <div className="page-shell max-w-2xl py-8 sm:py-16">
      {/* Single centered card: zone confirmation + scoped action buttons */}
      <div className="surface-card p-5 text-center sm:p-8">
        <MapPin className="mx-auto mb-4 h-10 w-10 text-primary" />
        <p className="text-sm font-semibold text-muted-foreground">You are reporting from:</p>
        {/* Resolved zone label (falls back to a generic name before zones load) */}
        <h1 className="mt-1 text-3xl font-bold text-foreground">{zone?.label || "PVHS zone"}</h1>
        <p className="mt-3 text-sm text-muted-foreground">This beacon does not use GPS. You can change or correct the location on the report form.</p>
        {/* Action buttons — all carry the zone/event ids forward in their links */}
        <div className="mt-8 grid gap-3 sm:grid-cols-2">
          <Link to={`/ReportFound?zone=${zoneId}&event=${eventId}`}><Button className="w-full">Report Found Here</Button></Link>
          <Link to={`/ReportLost?zone=${zoneId}&event=${eventId}`}><Button className="w-full" variant="outline">Report Lost Here</Button></Link>
          <Link to={searchTarget}><Button className="w-full" variant="outline">Browse Nearby Items</Button></Link>
          <Link to={`/EventHub?id=${eventId}`}><Button className="w-full" variant="outline">Choose another event zone</Button></Link>
        </div>
      </div>
    </div>
  );
}
