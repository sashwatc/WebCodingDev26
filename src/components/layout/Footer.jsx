/**
 * FindBack AI - Footer Component
 * Includes site links, contact info, accessibility statement, and legal links.
 */

import React from "react";
import { Link } from "react-router-dom";
import { FileSearch, Mail, Phone, MapPin, Heart } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-[hsl(222,65%,12%)] text-slate-300" role="contentinfo">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                <FileSearch className="w-4 h-4 text-white" />
              </div>
              <div className="flex flex-col leading-none">
                <span className="text-base font-extrabold text-white">FindBack AI</span>
                <span className="text-[10px] text-slate-400 tracking-wide">Pleasant Valley High School</span>
              </div>
            </div>
            <p className="text-sm text-slate-400 leading-relaxed">
              Standalone lost-and-found platform for Pleasant Valley High School with searchable items,
              guided claim workflows, accessibility support, and judging-ready documentation.
            </p>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <Heart className="w-3 h-3 text-red-400" />
              Built for FBLA 2025–2026
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">Quick Links</h3>
            <ul className="space-y-2.5">
              {[
                { to: "/Search", label: "Search Items" },
                { to: "/ReportFound", label: "Report Found Item" },
                { to: "/ReportLost", label: "Report Lost Item" },
                { to: "/FAQ", label: "FAQ & Help" },
                { to: "/About", label: "About FindBack AI" },
                { to: "/Documentation", label: "Project Documentation" },
              ].map(link => (
                <li key={link.to}>
                  <Link to={link.to} className="text-sm text-slate-400 hover:text-white transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">Contact</h3>
            <ul className="space-y-3">
              <li className="flex items-center gap-2 text-sm text-slate-400">
                <Mail className="w-4 h-4 flex-shrink-0" />
                lostandfound@school.edu
              </li>
              <li className="flex items-center gap-2 text-sm text-slate-400">
                <Phone className="w-4 h-4 flex-shrink-0" />
                (555) 123-4567
              </li>
              <li className="flex items-center gap-2 text-sm text-slate-400">
                <MapPin className="w-4 h-4 flex-shrink-0" />
                Main Office, Room 102
              </li>
            </ul>
          </div>

          {/* Legal & Accessibility */}
          <div>
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">Legal</h3>
            <ul className="space-y-2.5">
              {[
                { to: "/Privacy", label: "Privacy Policy" },
                { to: "/Terms", label: "Terms of Use" },
                { to: "/Accessibility", label: "Accessibility Statement" },
                { to: "/Sources", label: "Sources & Citations" },
              ].map(link => (
                <li key={link.to}>
                  <Link to={link.to} className="text-sm text-slate-400 hover:text-white transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-slate-700/50 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-slate-500">
            © {new Date().getFullYear()} FindBack AI — Pleasant Valley High School · FBLA Website Coding & Development
          </p>
          <p className="text-xs text-slate-500">
            This judging build stores data locally in the current browser for demo purposes.
          </p>
        </div>
      </div>
    </footer>
  );
}
