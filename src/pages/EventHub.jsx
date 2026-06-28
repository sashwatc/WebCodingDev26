/**
 * EventHub page
 *
 * The public hub for a specific event (e.g. a basketball game). Reachable via a
 * shareable link/QR posted at the event. The user can: report a lost/found item
 * scoped to the event, browse related items, open the big-screen Display view,
 * grab the shareable hub link, jump into per-zone beacons, and browse the
 * approved, redacted found-item cards for the event.
 *
 * Behavior:
 * - `id` (event id) comes from the URL query, defaulting to a seeded demo event.
 * - Two queries load the event metadata (`hub`) and its public display feed
 *   (`feed`, which includes zones + approved found items).
 * - A feed-unavailable banner shows when the request errors or the backend
 *   signals it is required/unavailable.
 */
import React from "react";
import { Link, useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { appClient } from "@/api/appClient";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import RecordThumbnail from "@/components/shared/RecordThumbnail";
import RecoveryLinkCode from "@/components/recovery/RecoveryLinkCode";
import { CalendarDays, MapPin, Monitor, Package } from "lucide-react";

export default function EventHub() {
  // Event id from the URL (?id=), defaulting to a seeded demo event.
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const eventId = params.get("id") || "hub_basketball_game";

  // Event metadata (name, description, status) for the header.
  const { data: hub } = useQuery({
    queryKey: ["eventHub", eventId],
    queryFn: () => appClient.eventHubs.get(eventId),
  });
  // Public display feed: zones + approved found items shown lower on the page.
  const { data: feed, isLoading: feedLoading, isError: feedError } = useQuery({
    queryKey: ["eventHubFeed", eventId],
    queryFn: () => appClient.eventHubs.displayFeed(eventId),
  });
  // True when the feed errored or the backend explicitly flagged it required.
  const feedUnavailable = feedError || feed?.backend_required;

  // Shareable hash-route link to this hub (rendered as a QR/copy code below).
  const hubLink = `${window.location.origin}${window.location.pathname}#/EventHub?id=${eventId}`;

  return (
    <div className="page-shell max-w-6xl py-10 space-y-6">
      {/* Header: event name + description */}
      <div className="page-header">
        <span className="page-kicker">Event Recovery Hub</span>
        <h1 className="page-title">{hub?.name || "PVHS Event Recovery"}</h1>
        <p className="page-subtitle">{hub?.description}</p>
      </div>

      {/* Disclaimer: this event context is manually configured, not a live feed */}
      <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900">
        Grounded event recovery demo. This event context is manually configured and does not claim live PVHS calendar integration.
      </div>

      {/* Error state: shown when the event feed cannot be loaded */}
      {feedUnavailable && (
        <div className="search-state-panel text-sm">
          <Monitor className="mx-auto mb-3 h-8 w-8 text-muted-foreground/40" />
          The event feed is unavailable right now. Please try again shortly.
        </div>
      )}

      {/* Primary actions: report lost/found (event-scoped), browse, Display mode */}
      <div className="flex flex-wrap gap-3">
        <Link to={`/ReportLost?event=${eventId}`}><Button>Report Lost</Button></Link>
        <Link to={`/ReportFound?event=${eventId}`}><Button variant="outline">Report Found</Button></Link>
        <Link to="/Search"><Button variant="outline">Browse related items</Button></Link>
        <Link to={`/Display?event=${eventId}`}><Button variant="outline" className="gap-2"><Monitor className="h-4 w-4" /> Display mode</Button></Link>
      </div>

      {/* Shareable hub link / QR code for posters and announcements */}
      <RecoveryLinkCode
        value={hubLink}
        copyValue={hubLink}
        label="Event Hub link"
        description="Use this link from posters, announcements, or a QR-code handoff during the event."
      />

      {/* Zones grid: an event-status card followed by one card per feed zone,
          each linking to that zone's beacon and scoped report flows */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="archive-card p-5">
          <CalendarDays className="mb-3 h-5 w-5 text-primary" />
          <p className="font-semibold text-foreground">Event status</p>
          <p className="mt-1 text-sm text-muted-foreground">{hub?.status || "active"}</p>
        </div>
        {(feed?.zones || []).map((zone) => (
          <div key={zone.id} className="archive-card p-5">
            <MapPin className="mb-3 h-5 w-5 text-primary" />
            <p className="font-semibold text-foreground">{zone.label}</p>
            <p className="mt-1 text-sm text-muted-foreground">{zone.description}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link to={`/Beacon?zone=${zone.id}&event=${eventId}`}><Button size="sm" variant="outline">Open beacon</Button></Link>
              <Link to={`/ReportFound?zone=${zone.id}&event=${eventId}`}><Button size="sm" variant="outline">Report found</Button></Link>
              <Link to={`/ReportLost?zone=${zone.id}&event=${eventId}`}><Button size="sm" variant="outline">Report lost</Button></Link>
            </div>
          </div>
        ))}
      </div>

      {/* Approved found items: redacted public cards linking to item details,
          with loading and empty states */}
      <section>
        <h2 className="text-lg font-bold text-foreground">Approved event-related found items</h2>
        <p className="mt-1 text-sm text-muted-foreground">Public cards use redacted item fields only; storage and verification clues stay private.</p>
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          {(feed?.found_items || []).map((item) => (
            <Link key={item.id} to={`/ItemDetails?id=${item.id}`} className="archive-card p-4 block hover:border-primary/40"style={{ textDecoration: 'none' }}>
              <div className="flex gap-3">
                <RecordThumbnail src={item.photo_urls?.[0]} alt={item.title} />
                <div>
                  <p className="font-semibold text-foreground">{item.title}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{item.location_found}</p>
                  <Badge variant="outline" className="mt-2">{item.status}</Badge>
                </div>
              </div>
            </Link>
          ))}
          {/* Loading placeholder while the feed query is in flight */}
          {feedLoading && (
            <div className="search-state-panel text-sm">
              Loading event items…
            </div>
          )}
          {/* Empty state: feed loaded successfully but has no public items */}
          {!feedLoading && !feedUnavailable && (feed?.found_items || []).length === 0 && (
            <div className="search-state-panel text-sm">
              <Package className="mx-auto mb-3 h-8 w-8 text-muted-foreground/40" />
              No public event items are listed yet.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
