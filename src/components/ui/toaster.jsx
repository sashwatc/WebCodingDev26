/**
 * Toaster — the live region that renders the app's custom (Radix-free) toasts.
 * Mount this once near the app root. It subscribes to the toast store via
 * useToast() and renders one <Toast> per entry. (Distinct from the sonner
 * Toaster in sonner.jsx.)
 */

import { useToast } from "@/components/ui/use-toast";
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast";

export function Toaster() {
  // Pull the current list of toasts and the dismiss() helper from the store.
  const { toasts, dismiss } = useToast();

  return (
    <ToastProvider duration={7000}>
      <ToastViewport>
        {/* Render each active toast; spread remaining props (variant, open, etc.) onto Toast. */}
        {toasts.map(function ({ id, title, description, action, ...props }) {
          return (
            <Toast key={id} {...props}>
              <div className="grid gap-1">
                {title && <ToastTitle>{title}</ToastTitle>}
                {description && (
                  <ToastDescription>{description}</ToastDescription>
                )}
              </div>
              {action}
              {/* X button dismisses just this toast by id. */}
              <ToastClose onClick={() => dismiss(id)} />
            </Toast>
          );
        })}
      </ToastViewport>
    </ToastProvider>
  );
}
