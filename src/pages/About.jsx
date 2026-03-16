/**
 * FindBack AI - About Page
 * Explains the platform, its mission, and the technology behind it.
 */

import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Brain, Shield, Zap, Users, Heart, Code } from "lucide-react";

export default function About() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-16">
      <div className="text-center mb-12">
        <Badge variant="outline" className="mb-3">About</Badge>
        <h1 className="text-4xl font-bold text-slate-900 mb-4">About FindBack AI</h1>
        <p className="text-lg text-slate-500 max-w-2xl mx-auto leading-relaxed">
          FindBack AI is an intelligent lost-and-found platform built for schools. 
          We combine modern web technology with AI-powered matching to help students 
          and staff reunite with their belongings faster than ever.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6 mb-12">
        {[
          { icon: Brain, title: "AI-Powered Matching", desc: "Our engine analyzes descriptions, categories, colors, brands, and locations to find the best matches between lost and found items." },
          { icon: Shield, title: "Privacy First", desc: "Sensitive information like storage locations and contact details are protected. Only verified admins can access restricted data." },
          { icon: Zap, title: "Real-Time Processing", desc: "Items are processed and matched in real-time. Notifications keep users informed about status changes and new matches." },
          { icon: Users, title: "Built for Schools", desc: "Designed around real school workflows — from gym to cafeteria. Role-based access ensures proper oversight and accountability." },
        ].map((item) => (
          <Card key={item.title} className="border border-slate-200">
            <CardContent className="p-6">
              <div className="w-10 h-10 rounded-lg bg-teal-50 flex items-center justify-center mb-4">
                <item.icon className="w-5 h-5 text-teal-600" />
              </div>
              <h3 className="font-semibold text-slate-900 mb-2">{item.title}</h3>
              <p className="text-sm text-slate-500 leading-relaxed">{item.desc}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="bg-[hsl(213,56%,22%)] text-white border-0">
        <CardContent className="p-8 text-center">
          <Heart className="w-8 h-8 text-red-400 mx-auto mb-3" />
          <h3 className="text-xl font-bold mb-2">Built for FBLA 2025–2026</h3>
          <p className="text-slate-300 text-sm max-w-lg mx-auto">
            This project was created for the FBLA Website Coding & Development event. 
            It demonstrates full-stack development, AI integration, responsive design, 
            accessibility compliance, and real-world problem solving.
          </p>
          <div className="flex items-center justify-center gap-2 mt-4">
            <Code className="w-4 h-4 text-teal-400" />
            <span className="text-xs text-slate-400">React • Tailwind CSS • AI Integration • Cloud Database</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}