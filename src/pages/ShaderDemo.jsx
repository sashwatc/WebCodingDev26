import React from "react"
import { Link } from "react-router-dom"
import { ArrowLeft, Sparkles } from "lucide-react"

import { Button } from "@/components/ui/button"
import { LiquidButton } from "@/components/ui/liquid-glass-button"
import { WebGLShader } from "@/components/ui/web-gl-shader"

export default function ShaderDemo() {
  return (
    <div className="relative min-h-[calc(100vh-9rem)] overflow-hidden px-4 py-12">
      <WebGLShader variant="rainbow" />

      <div className="relative z-10 mx-auto flex max-w-4xl flex-col gap-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/60">
              Component Integration Demo
            </p>
            <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-white sm:text-5xl">
              Design is Everything
            </h1>
          </div>
          <Link to="/Documentation">
            <Button variant="outline" className="gap-2 border-white/20 bg-slate-950/60 text-white hover:bg-slate-900">
              <ArrowLeft className="h-4 w-4" />
              Back to Documentation
            </Button>
          </Link>
        </div>

        <div className="mx-auto w-full max-w-3xl border border-zinc-800 bg-black/65 p-2 shadow-[0_24px_80px_rgba(0,0,0,0.45)] backdrop-blur-sm">
          <main className="relative overflow-hidden border border-zinc-800 px-6 py-12 sm:px-10">
            <div className="mx-auto max-w-2xl text-center">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-400">
                <Sparkles className="h-3.5 w-3.5" />
                WebGL shader + custom glass button
              </div>

              <h2 className="mb-3 text-center text-5xl font-extrabold tracking-tighter text-white md:text-[clamp(2rem,8vw,5.75rem)]">
                Design is Everything
              </h2>
              <p className="px-2 text-center text-sm text-white/60 md:text-base lg:text-lg">
                Unleashing creativity through bold visuals, seamless interfaces, and limitless possibilities.
              </p>

              <div className="my-8 flex items-center justify-center gap-2">
                <span className="relative flex h-3 w-3 items-center justify-center">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-500 opacity-75"></span>
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500"></span>
                </span>
                <p className="text-xs text-green-400">Available for New Projects</p>
              </div>

              <div className="flex justify-center">
                <LiquidButton className="rounded-full border text-white" size="xl">
                  Let&apos;s Go
                </LiquidButton>
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  )
}
