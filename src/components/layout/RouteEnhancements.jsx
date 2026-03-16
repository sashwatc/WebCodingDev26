import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";

const PAGE_TITLES = {
  "/Home": "Home",
  "/Search": "Search Found Items",
  "/ReportFound": "Report Found Item",
  "/ReportLost": "Report Lost Item",
  "/ItemDetails": "Item Details",
  "/ClaimItem": "Submit a Claim",
  "/UserDashboard": "My Dashboard",
  "/AdminDashboard": "Admin Dashboard",
  "/About": "About FindBack AI",
  "/FAQ": "FAQ",
  "/Privacy": "Privacy Policy",
  "/Terms": "Terms of Use",
  "/Accessibility": "Accessibility Statement",
  "/Sources": "Sources and Citations",
  "/Documentation": "Project Documentation",
};

export default function RouteEnhancements() {
  const location = useLocation();
  const [announcement, setAnnouncement] = useState("");

  useEffect(() => {
    const pageTitle = PAGE_TITLES[location.pathname] || "FindBack AI";
    document.title = pageTitle.includes("FindBack AI") ? pageTitle : `${pageTitle} | FindBack AI`;
    window.scrollTo(0, 0);
    setAnnouncement(`${pageTitle} loaded`);
  }, [location.pathname]);

  return (
    <p aria-live="polite" aria-atomic="true" className="sr-only">
      {announcement}
    </p>
  );
}
