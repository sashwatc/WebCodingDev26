import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { BRAND_NAME } from "@/lib/constants";

const PAGE_TITLES = {
  "/Home": "Home",
  "/Search": "Search Found Items",
  "/ReportFound": "Report Found Item",
  "/ReportLost": "Report Lost Item",
  "/ItemDetails": "Item Details",
  "/ClaimItem": "Submit a Claim",
  "/UserDashboard": "My Dashboard",
  "/AdminDashboard": "Admin Dashboard",
  "/About": `About ${BRAND_NAME}`,
  "/FAQ": "FAQ",
  "/Privacy": "Privacy Policy",
  "/Terms": "Terms of Use",
  "/Accessibility": "Accessibility Statement",
  "/Sources": "Sources and Citations",
  "/Documentation": "Project Documentation",
  "/ShaderDemo": "Shader Demo",
};

export default function RouteEnhancements() {
  const location = useLocation();
  const [announcement, setAnnouncement] = useState("");

  useEffect(() => {
    const pageTitle = PAGE_TITLES[location.pathname] || BRAND_NAME;
    document.title = pageTitle.includes(BRAND_NAME) ? pageTitle : `${pageTitle} | ${BRAND_NAME}`;
    window.scrollTo(0, 0);
    setAnnouncement(`${pageTitle} loaded`);
  }, [location.pathname]);

  return (
    <p aria-live="polite" aria-atomic="true" className="sr-only">
      {announcement}
    </p>
  );
}
