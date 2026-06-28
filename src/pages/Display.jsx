/**
 * Display page
 *
 * A big-screen "kiosk"/signage view meant to be projected on a TV or monitor at
 * an event. It pulls the public, redacted display feed of approved found items
 * for an event and auto-rotates through them as a slideshow (one large "Now
 * showing" panel plus a grid of selectable item cards). A QR/link code lets
 * passers-by open the event hub. The feed is intentionally public-safe: no
 * private clues, claimant data, or storage locations are shown.
 *
 * Behavior:
 * - `event` id comes from the URL query (defaults to a demo event).
 * - The active item auto-advances every 8s unless paused, unless the user
 *   prefers reduced motion, or unless there is 0/1 item.
 * - Clicking an item card jumps to it and pauses rotation.
 */
import React, { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { appClient } from "@/api/appClient";
import { Button } from "@/components/ui/button";
import RecoveryLinkCode from "@/components/recovery/RecoveryLinkCode";

// Hook: tracks the OS "prefers-reduced-motion" setting reactively. When true,
// the auto-rotation slideshow is suppressed.
function useReducedMotion() {
  const [reduced, setReduced] = useState(false);

  // Initialize from the current match value and subscribe to changes so the
  // page reacts live if the user toggles the OS preference.
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
  // Event id from the URL (?event=), defaulting to a seeded demo event.
  const location = useLocation();
  const eventId = new URLSearchParams(location.search).get("event") || "hub_basketball_game";
  // Public-safe display feed for this event; auto-refetches every 30s so the
  // kiosk stays current without a manual reload.
  const { data: feed } = useQuery({ queryKey: ["displayFeed", eventId], queryFn: () => appClient.eventHubs.displayFeed(eventId), refetchInterval: 30000 });
  // activeIndex = which item is featured in the big panel; paused = whether the
  // auto-rotation is temporarily stopped (toggled by button or card click).
  const [activeIndex, setActiveIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const reducedMotion = useReducedMotion();
  // Shareable hash-route link back to this event's public hub (rendered as a QR).
  const eventLink = `${window.location.origin}${window.location.pathname}#/EventHub?id=${eventId}`;
  // Memoized list of items from the feed (stable reference for the effect dep).
  const items = useMemo(() => feed?.found_items || [], [feed?.found_items]);
  // Currently featured item (modulo guards against a stale index after refetch).
  const activeItem = items.length > 0 ? items[activeIndex % items.length] : null;

  // Slideshow timer: advance to the next item every 8s. Skipped entirely when
  // paused, when reduced-motion is preferred, or when there are <=1 items.
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
        {/* Header bar: event name + rotation pause/resume and event-hub links */}
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

        {/* Feature row: large "Now showing" panel (left) + event QR code (right) */}
        <div className="mt-6 grid gap-5 lg:grid-cols-[1fr_360px]">
          {/* Big featured-item panel for the currently active item */}
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

        {/* Item grid: every feed item as a selectable card. The active card is
            highlighted; clicking one features it and pauses auto-rotation. */}
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
        {/* Privacy disclaimer: clarifies the feed is intentionally public-safe */}
        <p className="mt-8 text-sm text-slate-400">Public-safe display feed only. No private clues, claimant data, storage locations, or restricted assets are shown. This does not claim control of actual school TVs.</p>
      </div>
    </div>
  );
}
