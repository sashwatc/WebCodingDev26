import React, { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { appClient } from "@/api/appClient";
import { Button } from "@/components/ui/button";
import RecoveryLinkCode from "@/components/recovery/RecoveryLinkCode";

function useReducedMotion() {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const query = window.matchMedia?.("(prefers-reduced-motion: reduce)");
    if (!query) {
      return undefined;
    }

    setReduced(query.matches);
    const update = () => setReduced(query.matches);
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  return reduced;
}

export default function Display() {
  const location = useLocation();
  const eventId = new URLSearchParams(location.search).get("event") || "hub_basketball_game";
  const { data: feed } = useQuery({ queryKey: ["displayFeed", eventId], queryFn: () => appClient.recoveryMesh.displayFeed(eventId), refetchInterval: 30000 });
  const [activeIndex, setActiveIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const reducedMotion = useReducedMotion();
  const eventLink = `${window.location.origin}${window.location.pathname}#/EventHub?id=${eventId}`;
  const items = useMemo(() => feed?.found_items || [], [feed?.found_items]);
  const activeItem = items.length > 0 ? items[activeIndex % items.length] : null;

  useEffect(() => {
    if (paused || reducedMotion || items.length <= 1) {
      return undefined;
    }

    const timer = window.setInterval(() => {
      setActiveIndex((index) => (index + 1) % items.length);
    }, 8000);

    return () => window.clearInterval(timer);
  }, [items.length, paused, reducedMotion]);

  return (
    <div className="min-h-screen bg-slate-950 text-white p-8">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-white/20 pb-6">
          <div>
            <p className="text-lg text-cyan-200">PVHS Recovery Mesh</p>
            <h1 className="mt-1 text-4xl font-bold">{feed?.event_hub?.name || "Event Display"}</h1>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="secondary" onClick={() => setPaused((value) => !value)}>
              {paused || reducedMotion ? "Resume rotation" : "Pause rotation"}
            </Button>
            <Link to={`/EventHub?id=${eventId}`}><Button variant="secondary">Open event hub</Button></Link>
          </div>
        </div>

        <div className="mt-6 grid gap-5 lg:grid-cols-[1fr_360px]">
          <div className="rounded-lg border border-white/20 bg-white/10 p-8">
            <p className="text-sm font-semibold uppercase text-cyan-200">Now showing</p>
            {activeItem ? (
              <>
                <h2 className="mt-3 text-5xl font-black leading-tight">{activeItem.title}</h2>
                <p className="mt-4 text-2xl text-slate-100">{activeItem.location_found}</p>
                <p className="mt-4 max-w-3xl text-xl leading-8 text-slate-200">{activeItem.description}</p>
              </>
            ) : (
              <p className="mt-4 text-2xl text-slate-200">No public event items are listed yet.</p>
            )}
          </div>
          <RecoveryLinkCode
            value={eventLink}
            copyValue={eventLink}
            label="Event Hub link"
            description="Open the public event hub to report or browse related items."
            compact
          />
        </div>

        <div className="mt-8 grid gap-5 md:grid-cols-2">
          {items.map((item, index) => (
            <button
              key={item.id}
              type="button"
              className={`rounded-lg border p-6 text-left transition ${index === activeIndex % Math.max(items.length, 1) ? "border-cyan-200 bg-white/15" : "border-white/20 bg-white/10 hover:bg-white/15"}`}
              onClick={() => {
                setActiveIndex(index);
                setPaused(true);
              }}
            >
              <p className="text-2xl font-bold">{item.title}</p>
              <p className="mt-2 text-lg text-slate-200">{item.location_found}</p>
              <p className="mt-3 text-sm text-slate-300">{item.description}</p>
            </button>
          ))}
        </div>
        <p className="mt-8 text-sm text-slate-400">Public-safe display feed only. No private clues, claimant data, storage locations, or restricted assets are shown. This does not claim control of actual school TVs.</p>
      </div>
    </div>
  );
}
