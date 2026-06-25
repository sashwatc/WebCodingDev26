import React, { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { appClient } from "@/api/appClient";
import { Button } from "@/components/ui/button";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { CheckCircle, Loader2, Package, RotateCcw } from "lucide-react";

// ── States ─────────────────────────────────────────────────────────────────

const S = { ENTRY: "entry", CONFIRM: "confirm", SUCCESS: "success" };

// ── Main component ─────────────────────────────────────────────────────────

export default function PickupStation() {
  useEffect(() => { document.title = "Pickup Station — Lost Then Found"; }, []);
  const [screen, setScreen]           = useState(S.ENTRY);
  const [pin, setPin]                 = useState("");
  const [verifyResult, setVerifyResult] = useState(null); // {found_item_id, return_pass_id, claimant_name, ...}
  const [verifying, setVerifying]     = useState(false);
  const [redeeming, setRedeeming]     = useState(false);
  const [error, setError]             = useState(null);

  const otpRef = useRef(null);

  // Focus OTP on mount / return-to-desk
  useEffect(() => {
    if (screen === S.ENTRY) otpRef.current?.focus();
  }, [screen]);

  // ── Item query (fires once verify succeeds) ──────────────────────────────

  const { data: item, isLoading: itemLoading } = useQuery({
    queryKey: ["pickupStationItem", verifyResult?.found_item_id],
    queryFn: () => appClient.items.get(verifyResult.found_item_id),
    enabled: !!verifyResult?.found_item_id,
    staleTime: Infinity,
  });

  // ── Handlers ─────────────────────────────────────────────────────────────

  const reset = () => {
    setScreen(S.ENTRY);
    setPin("");
    setVerifyResult(null);
    setError(null);
  };

  const handleVerify = async () => {
    if (pin.length < 6 || verifying) return;
    setVerifying(true);
    setError(null);
    try {
      const result = await appClient.returnPasses.verify(pin);
      if (!result?.valid) {
        setError("Invalid or expired code — please try again");
        setPin("");
        return;
      }
      setVerifyResult(result);
      setScreen(S.CONFIRM);
    } catch {
      setError("Invalid or expired code — please try again");
      setPin("");
    } finally {
      setVerifying(false);
    }
  };

  const handleRedeem = async () => {
    if (!verifyResult || redeeming) return;
    setRedeeming(true);
    try {
      await appClient.returnPasses.redeem(verifyResult.return_pass_id, pin);
      const { default: confetti } = await import("canvas-confetti");
      confetti({ particleCount: 120, spread: 70 });
      setScreen(S.SUCCESS);
    } catch (err) {
      setError(err?.message || "Redemption failed — please try again");
      setScreen(S.ENTRY);
      setPin("");
    } finally {
      setRedeeming(false);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-6 py-12">
      <div className="w-full max-w-lg">

        {/* ── STATE 1: PIN Entry ─────────────────────────────────────────── */}
        {screen === S.ENTRY && (
          <div className="text-center">
            <h1 className="text-4xl font-extrabold tracking-tight text-foreground">
              Pickup Desk
            </h1>
            <p className="mt-3 text-lg text-muted-foreground">
              Enter the student's 6-digit pickup code
            </p>

            <div className="mt-10 flex justify-center">
              <InputOTP
                ref={otpRef}
                maxLength={6}
                value={pin}
                onChange={(val) => { setPin(val); setError(null); }}
                onComplete={handleVerify}
              >
                <InputOTPGroup>
                  {Array.from({ length: 6 }).map((_, i) => (
                    <InputOTPSlot
                      key={i}
                      index={i}
                      className="h-16 w-14 text-2xl font-bold"
                    />
                  ))}
                </InputOTPGroup>
              </InputOTP>
            </div>

            {error && (
              <p className="mt-4 text-sm font-medium text-destructive" role="alert">
                {error}
              </p>
            )}

            <Button
              size="lg"
              className="mt-8 w-full max-w-xs text-base"
              disabled={pin.length < 6 || verifying}
              onClick={handleVerify}
            >
              {verifying && <Loader2 className="mr-2 h-5 w-5 animate-spin" aria-hidden="true" />}
              {verifying ? "Verifying…" : "Verify Code"}
            </Button>
          </div>
        )}

        {/* ── STATE 2: Confirmation ──────────────────────────────────────── */}
        {screen === S.CONFIRM && (
          <div className="text-center">
            <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
              Confirm Handoff
            </h1>

            {/* Item card */}
            <div className="mx-auto mt-8 overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
              {itemLoading ? (
                <div className="flex h-56 items-center justify-center bg-muted">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" aria-hidden="true" />
                </div>
              ) : item?.photo_urls?.[0] ? (
                <img
                  src={item.photo_urls[0]}
                  alt={item.title}
                  className="h-56 w-full object-cover"
                />
              ) : (
                <div className="flex h-56 items-center justify-center bg-muted">
                  <Package className="h-16 w-16 text-muted-foreground/30" aria-hidden="true" />
                </div>
              )}

              <div className="px-6 py-5">
                <h2 className="text-xl font-bold text-foreground">
                  {item?.title || verifyResult?.found_item_title || "Item"}
                </h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  Returning to:{" "}
                  <span className="font-semibold text-foreground">
                    {verifyResult?.claimant_name || "Student"}
                  </span>
                </p>
              </div>
            </div>

            {error && (
              <p className="mt-4 text-sm font-medium text-destructive" role="alert">
                {error}
              </p>
            )}

            {/* Actions */}
            <div className="mt-8 flex gap-4">
              <Button
                variant="outline"
                size="lg"
                className="flex-1 text-base"
                onClick={reset}
                disabled={redeeming}
              >
                Cancel
              </Button>
              <Button
                size="lg"
                className="flex-1 bg-emerald-600 text-base text-white hover:bg-emerald-700 focus-visible:ring-emerald-500"
                disabled={redeeming}
                onClick={handleRedeem}
              >
                {redeeming && <Loader2 className="mr-2 h-5 w-5 animate-spin" aria-hidden="true" />}
                {redeeming ? "Processing…" : "Complete Handoff"}
              </Button>
            </div>
          </div>
        )}

        {/* ── STATE 3: Success ───────────────────────────────────────────── */}
        {screen === S.SUCCESS && (
          <div className="text-center">
            <CheckCircle
              className="mx-auto text-emerald-500"
              style={{ width: 80, height: 80 }}
              aria-hidden="true"
            />
            <h2 className="mt-6 text-3xl font-extrabold tracking-tight text-foreground">
              Item successfully returned!
            </h2>
            <p className="mt-3 text-lg font-semibold text-foreground">
              {item?.title || verifyResult?.found_item_title || "Item"}
            </p>
            <p className="mt-1 text-base text-muted-foreground">
              Returned to{" "}
              <span className="font-semibold text-foreground">
                {verifyResult?.claimant_name || "Student"}
              </span>
            </p>
            <Button
              size="lg"
              variant="outline"
              className="mt-10 gap-2 text-base"
              onClick={reset}
            >
              <RotateCcw className="h-5 w-5" aria-hidden="true" />
              Return to Desk
            </Button>
          </div>
        )}

      </div>
    </div>
  );
}
