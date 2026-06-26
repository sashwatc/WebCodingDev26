import React from "react";
import { BRAND_NAME } from "@/lib/constants";

export default class AppErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("AppErrorBoundary", error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (!this.state.error) {
      return this.props.children;
    }

    return (
      <div className="min-h-screen bg-background px-6 py-16 text-foreground">
        <div className="mx-auto max-w-2xl rounded-xl border border-border bg-card p-8 text-card-foreground">
          <p className="text-sm font-medium text-muted-foreground">{BRAND_NAME}</p>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight">The app hit a runtime error.</h1>
          <p className="mt-4 text-base leading-7 text-muted-foreground">
            A crash was detected while rendering the application. Use the message below to track the failure instead of
            getting a blank page.
          </p>
          <pre className="mt-6 overflow-x-auto rounded-xl bg-muted p-4 text-sm leading-6 text-foreground">
            {import.meta.env.DEV
              ? (this.state.error?.stack || this.state.error?.message || "Unknown runtime error")
              : (this.state.error?.message || "Unknown runtime error")}
          </pre>
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
