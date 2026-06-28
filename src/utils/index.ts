/**
 * utils/index.ts - Small shared helpers.
 */

// Build an in-app route path from a human page name. Prefixes a leading slash
// and converts spaces to hyphens, e.g. "Lost Items" -> "/Lost-Items", so links
// can be written using readable page names while producing URL-safe paths.
export function createPageUrl(pageName: string) {
    return '/' + pageName.replace(/ /g, '-');
}