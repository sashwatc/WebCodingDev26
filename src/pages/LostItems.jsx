/**
 * LostItems.jsx — "Lost Reports" browse page.
 *
 * This is a thin wrapper around the shared Search page. It renders the exact
 * same UI as /Search but pins the record type to "lost", so the page lists
 * lost-item reports (what students/staff are looking for) instead of the
 * found-item inventory. All search, filter, and display logic lives in Search.
 */
import Search from "@/pages/Search";

export default function LostItems() {
  // recordTypeOverride="lost" tells Search to show lost reports, not found items.
  return <Search recordTypeOverride="lost" />;
}
