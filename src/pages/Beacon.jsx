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
  const { data: zones = [] } = useQuery({ queryKey: ["beaconZones"], queryFn: () => appClient.recoveryMesh.campusZones() });
  const zone = zones.find((entry) => entry.id === zoneId);
  const searchTarget = zone?.label ? `/Search?q=${encodeURIComponent(zone.label)}` : "/Search";

  return (
    <div className="page-shell max-w-2xl py-16">
      <div className="surface-card p-8 text-center">
        <MapPin className="mx-auto mb-4 h-10 w-10 text-primary" />
        <p className="text-sm font-semibold text-slate-500">You are reporting from:</p>
        <h1 className="mt-1 text-3xl font-bold text-slate-950">{zone?.label || "PVHS zone"}</h1>
        <p className="mt-3 text-sm text-slate-600">This beacon does not use GPS. You can change or correct the location on the report form.</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link to={`/ReportFound?zone=${zoneId}&event=${eventId}`}><Button>Report Found Here</Button></Link>
          <Link to={`/ReportLost?zone=${zoneId}&event=${eventId}`}><Button variant="outline">Report Lost Here</Button></Link>
          <Link to={searchTarget}><Button variant="outline">Browse items from this location</Button></Link>
          <Link to={`/EventHub?id=${eventId}`}><Button variant="outline">Change location</Button></Link>
        </div>
      </div>
    </div>
  );
}
