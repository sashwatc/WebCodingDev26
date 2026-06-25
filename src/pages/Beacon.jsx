import React from "react";
import { Link, useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { appClient } from "@/api/appClient";
import { Button } from "@/components/ui/button";
import { MapPin } from "lucide-react";

export default function Beacon() {
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const zoneId = params.get("zone") || "";
  const eventId = params.get("event") || "";
  const { data: zones = [] } = useQuery({ queryKey: ["beaconZones"], queryFn: () => appClient.campusZones.list() });
  const zone = zones.find((entry) => entry.id === zoneId);
  const searchTarget = zone?.label ? `/Search?q=${encodeURIComponent(zone.label)}` : "/Search";

  return (
    <div className="page-shell max-w-2xl py-8 sm:py-16">
      <div className="surface-card p-5 text-center sm:p-8">
        <MapPin className="mx-auto mb-4 h-10 w-10 text-primary" />
        <p className="text-sm font-semibold text-slate-500">You are reporting from:</p>
        <h1 className="mt-1 text-3xl font-bold text-slate-950">{zone?.label || "PVHS zone"}</h1>
        <p className="mt-3 text-sm text-slate-600">This beacon does not use GPS. You can change or correct the location on the report form.</p>
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
