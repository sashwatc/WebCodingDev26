/**
 * FindBack AI - App Error Boundary
 *
 * Top-level React error boundary (a class component, since error boundaries
 * cannot be implemented with hooks). Wrap it around the app/route tree: when a
 * descendant throws during rendering, instead of unmounting the whole tree to a
 * blank white page, this catches the error and renders a friendly fallback
 * screen that surfaces the error message (and full stack in dev) plus a reload
 * button.
 */
import React from "react";
import { BRAND_NAME } from "@/lib/constants";

export default class AppErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    // `error` holds the caught error; null means "no crash, render children".
    this.state = { error: null };
  }

  // React lifecycle: runs when a child throws during render. Returning new
  // state flips this boundary into its error (fallback) mode.
  static getDerivedStateFromError(error) {
    return { error };
  }

  // React lifecycle: side-effect hook for logging the error + component stack.
  componentDidCatch(error, errorInfo) {
    console.error("AppErrorBoundary", error, errorInfo);
  }

  // Hard reload of the page to attempt full recovery from the crashed state.
  handleReload = () => {
    window.location.reload();
  };

  render() {
    // No error captured: render the wrapped subtree untouched (pass-through).
    if (!this.state.error) {
      return this.props.children;
    }

    // Error captured: render the fallback crash screen instead of children.
    return (
      <div className="min-h-screen bg-background px-6 py-16 text-foreground">
        <div className="mx-auto max-w-2xl rounded-xl border border-border bg-card p-8 text-card-foreground">
          <p className="text-sm font-medium text-muted-foreground">{BRAND_NAME}</p>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight">The app hit a runtime error.</h1>
          <p className="mt-4 text-base leading-7 text-muted-foreground">
            A crash was detected while rendering the application. Use the message below to track the failure instead of
            getting a blank page.
          </p>
          {/* Error detail block: show the full stack trace in development,
              but only the (less sensitive) message in production builds. */}
          <pre className="mt-6 overflow-x-auto rounded-xl bg-muted p-4 text-sm leading-6 text-foreground">
            {import.meta.env.DEV
              ? (this.state.error?.stack || this.state.error?.message || "Unknown runtime error")
              : (this.state.error?.message || "Unknown runtime error")}
          </pre>
          {/* Recovery action: full page reload */}
          <button
            type="button"
            onClick={this.handleReload}
            className="mt-6 inline-flex items-center justify-center rounded-[10px] bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:opacity-90"
          >
            Reload App
          </button>
        </div>
      </div>
    );
  }
}
