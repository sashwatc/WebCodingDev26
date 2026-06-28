/**
 * ShaderDemo — a static "visual system preview" page.
 *
 * NOTE ON NAMING: despite the file name, this page contains NO canvas, WebGL,
 * or GPU shader code. There is no <canvas>, no WebGL context, no GLSL, and no
 * animation loop. It is a purely declarative, static React page that showcases
 * the app's restrained "operational interface patterns" after a redesign —
 * essentially a small style/pattern reference linked from the Documentation
 * page. The user lands here to see example UI cards and the standard button
 * variants used across the Lost Then Found app, then can navigate back to
 * Documentation.
 *
 * What the user sees:
 *   - A page header (kicker, title, subtitle) plus a "Back to Documentation"
 *     button on the right.
 *   - A 3-column grid of sample pattern cards (search, moderation, success),
 *     each with an icon, title, and description.
 *   - A card demonstrating the three primary Button variants.
 */
import React from "react"
import { Link } from "react-router-dom"
import { ArrowLeft, CheckCircle2, Search, Shield } from "lucide-react"

import { Button } from "@/components/ui/button"

export default function ShaderDemo() {
  // Static, hard-coded content for the three sample pattern cards. Each entry
  // pairs a lucide icon component with descriptive copy; rendered via .map below.
  // (No state, effects, data fetching, or handlers exist on this page.)
  const samples = [
    {
      title: "Student search",
      description: "Primary actions stay obvious and close to the task.",
      icon: Search,
    },
    {
      title: "Moderation review",
      description: "Status, privacy, and admin-only details use restrained system colors.",
      icon: Shield,
    },
    {
      title: "Return complete",
      description: "Success states are clear without celebration effects.",
      icon: CheckCircle2,
    },
  ]

  return (
    <div className="page-shell py-10">
      {/* Header row: page title block on the left, "Back to Documentation" link-button on the right */}
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div className="page-header mb-0">
          <p className="page-kicker">Visual system preview</p>
          <h1 className="page-title">Operational interface patterns</h1>
          <p className="page-subtitle">
            A quiet reference page for the core Lost Then Found surfaces after the redesign.
          </p>
        </div>
        <Button asChild variant="outline">
          <Link to="/Documentation">
            <ArrowLeft className="h-4 w-4" />
            Back to Documentation
          </Link>
        </Button>
      </div>

      {/* Sample pattern cards: one card per entry in the `samples` array */}
      <div className="grid gap-4 md:grid-cols-3">
        {samples.map((sample) => (
          <section key={sample.title} className="surface-card p-5">
            {/* Icon badge — `sample.icon` is the lucide component for this sample */}
            <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-muted text-primary">
              <sample.icon className="h-5 w-5" />
            </div>
            <h2 className="text-base font-semibold text-foreground">{sample.title}</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">{sample.description}</p>
          </section>
        ))}
      </div>

      {/* Button-variant showcase: demonstrates the default, outline, and secondary button styles */}
      <div className="mt-6 surface-card p-5">
        <div className="flex flex-wrap gap-3">
          <Button>Primary action</Button>
          <Button variant="outline">Secondary action</Button>
          <Button variant="secondary">Quiet state</Button>
        </div>
      </div>
    </div>
  )
}
