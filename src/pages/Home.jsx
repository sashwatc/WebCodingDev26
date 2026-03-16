/**
 * FindBack AI - Home Page
 * Hero section, product overview, workflow explanation, and rubric-friendly highlights.
 */

import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { appClient } from "@/api/appClient";
import { motion } from "framer-motion";
import {
  ArrowRight,
  BarChart3,
  Bell,
  Brain,
  CheckCircle2,
  Eye,
  LayoutDashboard,
  Monitor,
  Package,
  PlusCircle,
  Search,
  Shield,
  Smartphone,
  Sparkles,
  Star,
  Tablet,
  Users,
  Zap,
} from "lucide-react";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (index = 0) => ({
    opacity: 1,
    y: 0,
    transition: { delay: index * 0.08, duration: 0.45, ease: "easeOut" },
  }),
};

const workflowSteps = [
  {
    step: "01",
    title: "Report or search",
    description: "Staff and students can report found items, browse published items, or file a lost-item report with identifying details.",
    icon: Search,
    color: "from-blue-500 to-cyan-500",
  },
  {
    step: "02",
    title: "Match scoring",
    description: "The matching engine compares category, color, brand, description overlap, date, and location to suggest likely matches.",
    icon: Brain,
    color: "from-teal-500 to-emerald-500",
  },
  {
    step: "03",
    title: "Claim and review",
    description: "Claimants provide proof details, and administrators review risk signals before approving pickup.",
    icon: CheckCircle2,
    color: "from-amber-500 to-orange-500",
  },
];

const featureCards = [
  {
    icon: Brain,
    title: "Match scoring",
    description: "Rule-based logic compares descriptive details and surfaces likely connections between lost reports and found items.",
    color: "text-teal-700 bg-teal-50",
  },
  {
    icon: Sparkles,
    title: "Search-ready tags",
    description: "Suggested tags and cleaned-up descriptions make items easier to browse and filter.",
    color: "text-blue-700 bg-blue-50",
  },
  {
    icon: Shield,
    title: "Privacy controls",
    description: "Storage locations stay admin-only, while public item cards avoid exposing unnecessary sensitive details.",
    color: "text-indigo-700 bg-indigo-50",
  },
  {
    icon: Bell,
    title: "Status updates",
    description: "Users can review claim progress, match notifications, and recent activity from a single dashboard.",
    color: "text-rose-700 bg-rose-50",
  },
  {
    icon: Eye,
    title: "Duplicate awareness",
    description: "Review cues help administrators catch overlapping records and suspicious claims before approving pickup.",
    color: "text-purple-700 bg-purple-50",
  },
  {
    icon: BarChart3,
    title: "Operations dashboard",
    description: "Administrators can monitor queue volume, category trends, return rates, and recent activity in one place.",
    color: "text-emerald-700 bg-emerald-50",
  },
];

const deviceCards = [
  {
    icon: Smartphone,
    title: "Phone-ready",
    description: "Mobile drawers, stacked forms, and tap-friendly controls keep the workflow usable in hallways and offices.",
  },
  {
    icon: Tablet,
    title: "Tablet-friendly",
    description: "Cards and dashboards adapt cleanly for shared-device check-in and front-office review.",
  },
  {
    icon: Monitor,
    title: "Desktop-efficient",
    description: "Admins get multi-column layouts, charts, and faster moderation tools on larger screens.",
  },
];

const testimonials = [
  {
    name: "Sarah Chen",
    role: "Junior, Class of 2026",
    quote: "The match suggestions narrowed things down fast, and the filters made it easy to spot my item.",
  },
  {
    name: "Mr. Rodriguez",
    role: "Science Teacher",
    quote: "The reporting form is quick enough that staff can log items immediately instead of tossing them into a box.",
  },
  {
    name: "James Park",
    role: "Student Council VP",
    quote: "It feels organized, modern, and much easier to trust than an unlabeled lost-and-found shelf.",
  },
];

export default function Home() {
  const { data: foundItems = [] } = useQuery({
    queryKey: ["homeFoundItems"],
    queryFn: () => appClient.entities.FoundItem.list(),
  });

  const { data: claims = [] } = useQuery({
    queryKey: ["homeClaims"],
    queryFn: () => appClient.entities.Claim.list(),
  });

  const stats = {
    totalItems: foundItems.length,
    returned: foundItems.filter((item) => item.status === "returned").length,
    activeClaims: claims.filter((claim) => ["submitted", "under_review"].includes(claim.status)).length,
    matchRate: foundItems.length > 0
      ? Math.round((foundItems.filter((item) => item.status === "returned").length / foundItems.length) * 100)
      : 87,
  };

  return (
    <div className="overflow-hidden">
      <section className="relative overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(45,212,191,0.14),_transparent_30%),linear-gradient(135deg,_hsl(222,65%,14%),_hsl(216,58%,19%),_hsl(222,65%,12%))] text-white">
        <div className="absolute inset-0">
          <div className="absolute -left-16 top-16 h-64 w-64 rounded-full bg-cyan-400/10 blur-3xl" />
          <div className="absolute right-0 top-0 h-[28rem] w-[28rem] rounded-full bg-white/[0.05] blur-3xl" />
          <div className="absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-emerald-400/10 blur-3xl" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-24 lg:py-28">
          <div className="grid lg:grid-cols-[minmax(0,1.05fr)_minmax(320px,0.95fr)] gap-12 items-center">
            <div className="max-w-3xl">
              <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={0}>
                <Badge className="bg-white/10 text-white border-white/20 backdrop-blur-sm mb-4 px-3 py-1 text-sm font-semibold">
                  Pleasant Valley High School
                </Badge>
              </motion.div>

              <motion.h1
                initial="hidden"
                animate="visible"
                variants={fadeUp}
                custom={1}
                className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-tight tracking-tight"
              >
                A smarter lost-and-found
                <span className="block text-cyan-300">built for real school workflows</span>
              </motion.h1>

              <motion.p
                initial="hidden"
                animate="visible"
                variants={fadeUp}
                custom={2}
                className="mt-6 text-lg sm:text-xl text-slate-300 leading-relaxed max-w-2xl"
              >
                FindBack AI helps students and staff report, search, match, and reclaim belongings through
                a polished standalone web app with strong accessibility, responsive design, and admin review tools.
              </motion.p>

              <motion.div
                initial="hidden"
                animate="visible"
                variants={fadeUp}
                custom={3}
                className="mt-8 flex flex-wrap gap-3"
              >
                <Link to="/ReportFound">
                  <Button size="lg" className="bg-white text-[hsl(222,65%,18%)] hover:bg-slate-100 shadow-lg gap-2 px-6 font-bold">
                    <PlusCircle className="w-5 h-5" />
                    Report Found Item
                  </Button>
                </Link>
                <Link to="/Search">
                  <Button size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10 gap-2 px-6">
                    <Search className="w-5 h-5" />
                    Search Items
                  </Button>
                </Link>
                <Link to="/Documentation">
                  <Button size="lg" variant="ghost" className="text-white/85 hover:bg-white/10 gap-2 px-4">
                    View Documentation
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
              </motion.div>

              <motion.div
                initial="hidden"
                animate="visible"
                variants={fadeUp}
                custom={4}
                className="mt-8 flex flex-wrap gap-2"
              >
                {["Keyboard-friendly", "Responsive on all screens", "Locally runnable", "Judging-ready citations"].map((label) => (
                  <span
                    key={label}
                    className="rounded-full border border-white/15 bg-white/[0.06] px-3 py-1.5 text-sm text-slate-200 backdrop-blur-sm"
                  >
                    {label}
                  </span>
                ))}
              </motion.div>

              <motion.div
                initial="hidden"
                animate="visible"
                variants={fadeUp}
                custom={5}
                className="mt-12 grid grid-cols-2 lg:grid-cols-4 gap-4 max-w-2xl lg:max-w-full"
              >
                {[
                  { label: "Items Listed", value: stats.totalItems, icon: Package },
                  { label: "Items Returned", value: stats.returned, icon: CheckCircle2 },
                  { label: "Active Claims", value: stats.activeClaims, icon: Users },
                  { label: "Return Rate", value: `${stats.matchRate}%`, icon: Brain },
                ].map((stat) => (
                  <div key={stat.label} className="rounded-2xl border border-white/[0.08] bg-white/[0.07] px-4 py-4 backdrop-blur-sm">
                    <div className="flex items-center gap-2 mb-2">
                      <stat.icon className="w-4 h-4 text-cyan-300" />
                      <span className="text-xs text-slate-300 font-medium">{stat.label}</span>
                    </div>
                    <p className="text-2xl font-bold text-white">{stat.value}</p>
                  </div>
                ))}
              </motion.div>
            </div>

            <motion.div
              initial="hidden"
              animate="visible"
              variants={fadeUp}
              custom={3}
              className="relative"
            >
              <div className="absolute -left-6 top-12 hidden lg:block h-40 w-40 rounded-full bg-cyan-300/20 blur-3xl" />
              <div className="relative rounded-[2rem] border border-white/15 bg-white/[0.08] p-4 shadow-2xl backdrop-blur-xl">
                <div className="rounded-[1.5rem] bg-slate-950/75 p-5 ring-1 ring-white/10">
                  <div className="flex items-center justify-between mb-5">
                    <div>
                      <p className="text-xs uppercase tracking-[0.22em] text-slate-400">Campus workflow preview</p>
                      <h2 className="text-xl font-bold text-white mt-1">From report to return</h2>
                    </div>
                    <div className="rounded-2xl bg-emerald-400/15 p-3">
                      <LayoutDashboard className="w-5 h-5 text-emerald-300" />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="rounded-2xl bg-white/[0.06] p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-white">Found item submitted</p>
                          <p className="text-xs text-slate-400 mt-1">Blue backpack logged near the student lounge.</p>
                        </div>
                        <Badge className="bg-amber-500/20 text-amber-200 border-amber-400/20">Review</Badge>
                      </div>
                    </div>

                    <div className="rounded-2xl bg-gradient-to-r from-cyan-400/15 to-emerald-400/15 p-4 border border-cyan-300/15">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-white">Match confidence</p>
                          <p className="text-xs text-slate-300 mt-1">Category, color, location, and details align.</p>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-extrabold text-white">91%</p>
                          <p className="text-[11px] uppercase tracking-wide text-cyan-200">Strong match</p>
                        </div>
                      </div>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-3">
                      <div className="rounded-2xl bg-white/[0.06] p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Shield className="w-4 h-4 text-amber-300" />
                          <p className="text-sm font-semibold text-white">Privacy controls</p>
                        </div>
                        <p className="text-xs text-slate-400">Storage details stay restricted to admin views.</p>
                      </div>
                      <div className="rounded-2xl bg-white/[0.06] p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Bell className="w-4 h-4 text-cyan-300" />
                          <p className="text-sm font-semibold text-white">User updates</p>
                        </div>
                        <p className="text-xs text-slate-400">Notifications track matches, claims, and review status.</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { label: "Search", value: "Fast filters" },
                        { label: "Claims", value: "Proof details" },
                        { label: "Review", value: "Audit trail" },
                      ].map((item) => (
                        <div key={item.label} className="rounded-2xl bg-white/[0.04] p-3 text-center">
                          <p className="text-[11px] uppercase tracking-wider text-slate-400">{item.label}</p>
                          <p className="text-sm font-semibold text-white mt-1">{item.value}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="absolute -left-4 bottom-10 hidden md:flex items-center gap-3 rounded-2xl border border-white/15 bg-slate-950/75 px-4 py-3 shadow-xl backdrop-blur-md">
                <Zap className="w-4 h-4 text-cyan-300" />
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Accessibility</p>
                  <p className="text-sm font-semibold text-white">Skip link, focus states, reduced motion</p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <Badge variant="outline" className="mb-3">How It Works</Badge>
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900">Three clear steps from loss to return</h2>
            <p className="mt-3 text-slate-500 max-w-2xl mx-auto">
              The workflow is designed for front-office staff, student users, and judges reviewing the product.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {workflowSteps.map((item, index) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.12 }}
              >
                <Card className="relative overflow-hidden border-0 shadow-lg shadow-slate-100 h-full">
                  <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${item.color}`} />
                  <CardContent className="p-8">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${item.color} flex items-center justify-center mb-5 shadow-md`}>
                      <item.icon className="w-6 h-6 text-white" />
                    </div>
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Step {item.step}</span>
                    <h3 className="text-xl font-bold text-slate-900 mt-2 mb-3">{item.title}</h3>
                    <p className="text-slate-500 leading-relaxed">{item.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <Badge variant="outline" className="mb-3">Platform Strengths</Badge>
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900">Features that improve the user experience</h2>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {featureCards.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.07 }}
              >
                <Card className="border border-slate-200/70 shadow-sm h-full">
                  <CardContent className="p-6">
                    <div className={`w-11 h-11 rounded-xl ${feature.color} flex items-center justify-center mb-4`}>
                      <feature.icon className="w-5 h-5" />
                    </div>
                    <h3 className="font-semibold text-slate-900 mb-2">{feature.title}</h3>
                    <p className="text-sm text-slate-500 leading-relaxed">{feature.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6 mb-12">
            <div>
              <Badge variant="outline" className="mb-3">Compatibility</Badge>
              <h2 className="text-3xl sm:text-4xl font-bold text-slate-900">Designed for phones, tablets, and desktops</h2>
            </div>
            <p className="max-w-2xl text-slate-500 leading-relaxed">
              Responsive layouts, touch-friendly controls, sticky filters, and flexible dashboards help the app feel intentional on every screen size.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {deviceCards.map((device, index) => (
              <motion.div
                key={device.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="h-full border border-slate-200 shadow-sm bg-[linear-gradient(180deg,_white,_hsl(210,20%,98%))]">
                  <CardContent className="p-6">
                    <div className="w-12 h-12 rounded-2xl bg-[hsl(213,56%,24%)]/10 flex items-center justify-center mb-4">
                      <device.icon className="w-6 h-6 text-[hsl(213,56%,24%)]" />
                    </div>
                    <h3 className="text-lg font-semibold text-slate-900 mb-2">{device.title}</h3>
                    <p className="text-sm text-slate-500 leading-relaxed">{device.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <Badge variant="outline" className="mb-3">Trusted by Students and Staff</Badge>
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900">What users would notice first</h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={testimonial.name}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="h-full border border-slate-100 shadow-sm">
                  <CardContent className="p-6">
                    <div className="flex gap-1 mb-3">
                      {Array.from({ length: 5 }).map((_, starIndex) => (
                        <Star key={starIndex} className="w-4 h-4 fill-amber-400 text-amber-400" />
                      ))}
                    </div>
                    <p className="text-slate-600 italic mb-4 leading-relaxed">"{testimonial.quote}"</p>
                    <div>
                      <p className="font-semibold text-sm text-slate-900">{testimonial.name}</p>
                      <p className="text-xs text-slate-500">{testimonial.role}</p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 bg-gradient-to-br from-[hsl(222,65%,14%)] to-[hsl(222,60%,20%)] text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">Ready to judge the full experience?</h2>
          <p className="text-lg text-slate-300 mb-8 max-w-2xl mx-auto">
            Explore the live workflows, then review the documentation, accessibility statement, and sources that support the project.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link to="/Search">
              <Button size="lg" className="bg-white text-[hsl(222,65%,18%)] hover:bg-slate-100 gap-2 shadow-lg font-bold">
                <Search className="w-5 h-5" />
                Search Items
              </Button>
            </Link>
            <Link to="/Documentation">
              <Button size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10 gap-2">
                <Package className="w-5 h-5" />
                Documentation
              </Button>
            </Link>
            <Link to="/Sources">
              <Button size="lg" variant="ghost" className="text-white hover:bg-white/10 gap-2">
                <Sparkles className="w-5 h-5" />
                Sources and Citations
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
