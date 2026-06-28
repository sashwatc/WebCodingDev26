/**
 * UserNotRegisteredError
 * --------------------------------------------------------------------------
 * A full-screen, static error page shown when an authenticated identity has no
 * matching registered user record in the app (e.g. signed in with an account
 * the system doesn't recognize). It is purely informational: it explains the
 * situation and lists troubleshooting steps. No props, no state, no actions —
 * all copy is localized via react-i18next.
 */

import React from "react";
import { useTranslation } from "react-i18next";

const UserNotRegisteredError = () => {
  const { t } = useTranslation();

  return (
    // Full-viewport centered container
    <div className="flex min-h-screen flex-col items-center justify-center bg-background">
      {/* Card */}
      <div className="w-full max-w-md rounded-lg border border-border bg-card p-8 shadow-lg">
        <div className="text-center">
          {/* Amber warning icon (triangle with exclamation) */}
          <div className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-full bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
            <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          {/* Title + explanatory description */}
          <h1 className="mb-4 text-3xl font-bold text-foreground">{t("user_not_registered.title")}</h1>
          <p className="mb-8 text-muted-foreground">
            {t("user_not_registered.description")}
          </p>
          {/* Troubleshooting box: intro line + bulleted recovery steps */}
          <div className="rounded-md bg-muted p-4 text-sm text-muted-foreground">
            <p>{t("user_not_registered.if_error")}</p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>{t("user_not_registered.verify_account")}</li>
              <li>{t("user_not_registered.contact_admin")}</li>
              <li>{t("user_not_registered.sign_in_again")}</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserNotRegisteredError;
