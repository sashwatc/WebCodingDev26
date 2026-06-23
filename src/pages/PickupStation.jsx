import React, { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { appClient } from "@/api/appClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";

export default function PickupStation() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [code, setCode] = useState("");
  const [verified, setVerified] = useState(null);

  const verifyMutation = useMutation({
    mutationFn: () => appClient.recoveryMesh.verifyReturnPass(code),
    onSuccess: setVerified,
  });

  const redeemMutation = useMutation({
    mutationFn: () => appClient.recoveryMesh.redeemReturnPass(verified.return_pass_id, code),
    onSuccess: async () => {
      await queryClient.invalidateQueries();
      setVerified(null);
      setCode("");
      toast({ title: "Pickup completed", description: "The item was marked returned and the custody ledger was updated." });
    },
  });

  return (
    <div className="page-shell max-w-xl py-12">
      <div className="surface-card p-8">
        <h1 className="text-2xl font-bold text-slate-950">Pickup Station</h1>
        <p className="mt-2 text-sm text-slate-600">Manual code entry is required. Verify before redeeming.</p>
        <div className="mt-6 flex gap-2">
          <Input value={code} onChange={(event) => setCode(event.target.value)} placeholder="One-time code" />
          <Button onClick={() => { if (!verifyMutation.isPending) verifyMutation.mutate(); }} disabled={!code || verifyMutation.isPending}>Verify</Button>
        </div>
        {verified && (
          <div className="mt-5 rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm">
            <p className={verified.valid ? "font-semibold text-emerald-800" : "font-semibold text-amber-800"}>{verified.message}</p>
            {verified.valid && (
              <Button className="mt-4" onClick={() => { if (!redeemMutation.isPending) redeemMutation.mutate(); }} disabled={redeemMutation.isPending}>
                Redeem and complete handoff
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
