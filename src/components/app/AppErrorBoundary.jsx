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
      <div className="min-h-screen bg-[linear-gradient(to_bottom,_#ffffff,_#f8fafc)] px-6 py-16 text-slate-900">
        <div className="mx-auto max-w-2xl rounded-[28px] border border-slate-200 bg-white p-8 shadow-[0_24px_60px_rgba(15,23,42,0.08)]">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">{BRAND_NAME}</p>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight">The app hit a runtime error.</h1>
          <p className="mt-4 text-base leading-7 text-slate-600">
            A crash was detected while rendering the application. Use the message below to track the failure instead of
            getting a blank page.
          </p>
          <pre className="mt-6 overflow-x-auto rounded-2xl bg-slate-950 p-4 text-sm leading-6 text-slate-100">
            {this.state.error?.stack || this.state.error?.message || "Unknown runtime error"}
          </pre>
          <button
            type="button"
            onClick={this.handleReload}
            className="mt-6 inline-flex items-center justify-center rounded-[14px] bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            Reload App
          </button>
        </div>
      </div>
    );
  }
}
