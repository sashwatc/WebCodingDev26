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
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const eventId = params.get("id") || "hub_basketball_game";

  const { data: hub } = useQuery({
    queryKey: ["eventHub", eventId],
    queryFn: () => appClient.eventHubs.get(eventId),
  });
  const { data: feed } = useQuery({
    queryKey: ["eventHubFeed", eventId],
    queryFn: () => appClient.eventHubs.displayFeed(eventId),
  });

  const hubLink = `${window.location.origin}${window.location.pathname}#/EventHub?id=${eventId}`;

  return (
    <div className="page-shell max-w-6xl py-10 space-y-6">
      <div className="page-header">
        <span className="page-kicker">Event Recovery Hub</span>
        <h1 className="page-title">{hub?.name || "PVHS Event Recovery"}</h1>
        <p className="page-subtitle">{hub?.description}</p>
      </div>

      <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900">
        Grounded event recovery demo. This event context is manually configured and does not claim live PVHS calendar integration.
      </div>

      <div className="flex flex-wrap gap-3">
        <Link to={`/ReportLost?event=${eventId}`}><Button>Report Lost</Button></Link>
        <Link to={`/ReportFound?event=${eventId}`}><Button variant="outline">Report Found</Button></Link>
        <Link to="/Search"><Button variant="outline">Browse related items</Button></Link>
        <Link to={`/Display?event=${eventId}`}><Button variant="outline" className="gap-2"><Monitor className="h-4 w-4" /> Display mode</Button></Link>
      </div>

      <RecoveryLinkCode
        value={hubLink}
        copyValue={hubLink}
        label="Event Hub link"
        description="Use this link from posters, announcements, or a QR-code handoff during the event."
      />

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <CalendarDays className="mb-3 h-5 w-5 text-primary" />
          <p className="font-semibold text-slate-900">Event status</p>
          <p className="mt-1 text-sm text-slate-600">{hub?.status || "active"}</p>
        </div>
        {(feed?.zones || []).map((zone) => (
          <div key={zone.id} className="rounded-xl border border-slate-200 bg-white p-5">
            <MapPin className="mb-3 h-5 w-5 text-primary" />
            <p className="font-semibold text-slate-900">{zone.label}</p>
            <p className="mt-1 text-sm text-slate-600">{zone.description}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link to={`/Beacon?zone=${zone.id}&event=${eventId}`}><Button size="sm" variant="outline">Open beacon</Button></Link>
              <Link to={`/ReportFound?zone=${zone.id}&event=${eventId}`}><Button size="sm" variant="outline">Report found</Button></Link>
              <Link to={`/ReportLost?zone=${zone.id}&event=${eventId}`}><Button size="sm" variant="outline">Report lost</Button></Link>
            </div>
          </div>
        ))}
      </div>

      <section>
        <h2 className="text-lg font-bold text-slate-900">Approved event-related found items</h2>
        <p className="mt-1 text-sm text-slate-600">Public cards use redacted item fields only; storage and verification clues stay private.</p>
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          {(feed?.found_items || []).map((item) => (
            <Link key={item.id} to={`/ItemDetails?id=${item.id}`} className="rounded-xl border border-slate-200 bg-white p-4 hover:border-primary">
              <div className="flex gap-3">
                <RecordThumbnail src={item.photo_urls?.[0]} alt={item.title} />
                <div>
                  <p className="font-semibold text-slate-900">{item.title}</p>
                  <p className="mt-1 text-sm text-slate-600">{item.location_found}</p>
                  <Badge variant="outline" className="mt-2">{item.status}</Badge>
                </div>
              </div>
            </Link>
          ))}
          {(feed?.found_items || []).length === 0 && (
            <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
              <Package className="mx-auto mb-3 h-8 w-8 text-slate-300" />
              No public event items are listed yet.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
