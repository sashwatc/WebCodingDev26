/**
 * FindBack AI - Public Layout Wrapper
 * Wraps public-facing pages with the Navbar and Footer.
 * Uses React Router's <Outlet> for clean page rendering.
 */

import React from "react";
import { Outlet } from "react-router-dom";
import Navbar from "./Navbar";
import Footer from "./Footer";

export default function PublicLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-[hsl(210,20%,98%)]">
      <Navbar />
      {/* Main content area with top padding for fixed navbar */}
      <main className="flex-1 pt-16" id="main-content" role="main">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}