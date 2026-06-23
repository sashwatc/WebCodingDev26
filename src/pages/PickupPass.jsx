import React from "react";
import { useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { appClient } from "@/api/appClient";
import { Badge } from "@/components/ui/badge";
import RecoveryLinkCode from "@/components/recovery/RecoveryLinkCode";

export default function PickupPass() {
  const passId = new URLSearchParams(useLocation().search).get("id") || "";
  const { data: pass, isLoading } = useQuery({ queryKey: ["pickupPass", passId], queryFn: () => appClient.returnPasses.get(passId), enabled: !!passId });

  if (isLoading) return <div className="page-shell py-16 text-sm text-slate-500">Loading pickup pass...</div>;
  if (!pass) return <div className="page-shell py-16 text-sm text-slate-500">Pickup pass not found.</div>;

  return (
    <div className="page-shell max-w-xl py-16">
      <div className="surface-card p-8 text-center">
        <Badge variant="outline" className="mb-4">{pass.status}</Badge>
        <h1 className="text-2xl font-bold text-slate-950">Pickup Pass</h1>
        <p className="mt-2 text-sm text-slate-600">{pass.pickup_window}</p>
        <div className="my-8 rounded-lg border border-slate-200 bg-slate-50 p-6">
          <p className="text-xs font-semibold uppercase text-slate-500">One-time code</p>
          <p className="mt-2 text-5xl font-black tracking-widest text-slate-950">{pass.one_time_code}</p>
        </div>
        <div className="my-6 text-left">
          <RecoveryLinkCode
            value={`${pass.id || "return-pass"}:${pass.one_time_code || "manual-code"}`}
            label="Pickup verification marker"
            description="Manual code entry remains the required fallback at the Pickup Station."
            compact
          />
        </div>
        <p className="text-sm text-slate-600">{pass.pickup_location}</p>
        {pass.expires_at && <p className="mt-2 text-xs text-slate-500">Expires {new Date(pass.expires_at).toLocaleString()}</p>}
        <p className="mt-3 text-xs text-slate-500">Private Proof Vault data is not shown on pickup passes.</p>
      </div>
    </div>
  );
}
