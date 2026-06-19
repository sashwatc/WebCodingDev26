import React from "react"
import { Link } from "react-router-dom"
import { ArrowLeft, CheckCircle2, Search, Shield } from "lucide-react"

import { Button } from "@/components/ui/button"

export default function ShaderDemo() {
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

      <div className="grid gap-4 md:grid-cols-3">
        {samples.map((sample) => (
          <section key={sample.title} className="surface-card p-5">
            <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-primary">
              <sample.icon className="h-5 w-5" />
            </div>
            <h2 className="text-base font-semibold text-slate-950">{sample.title}</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">{sample.description}</p>
          </section>
        ))}
      </div>

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
