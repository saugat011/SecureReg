// components/auth/TurnstileWidget.tsx
"use client";

import { useEffect, useRef } from "react";

type Props = {
  siteKey: string;
  onToken: (token: string | null) => void;
};

declare global {
  interface Window {
    turnstile?: {
      render: (
        container: string | HTMLElement,
        options: {
          sitekey: string;
          callback?: (token: string) => void;
          "error-callback"?: () => void;
          "expired-callback"?: () => void;
        }
      ) => string;
      reset?: (id?: string) => void;
      remove?: (id?: string) => void;
    };
  }
}

export default function TurnstileWidget({ siteKey, onToken }: Props) {
  const widgetIdRef = useRef<string | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!siteKey) return;

    function renderWidget() {
      if (!window.turnstile || !containerRef.current) return;

      // If already rendered, reset instead of duplicating
      if (widgetIdRef.current && window.turnstile.reset) {
        window.turnstile.reset(widgetIdRef.current);
        return;
      }

      const id = window.turnstile.render(containerRef.current, {
        sitekey: siteKey,
        callback: (token: string) => onToken(token),
        "error-callback": () => onToken(null),
        "expired-callback": () => onToken(null),
      });

      widgetIdRef.current = id;
    }

    // Script might already be on the page
    if (window.turnstile) {
      renderWidget();
      return;
    }

    // Load script once
    const scriptId = "cf-turnstile-script";
    if (!document.getElementById(scriptId)) {
      const script = document.createElement("script");
      script.id = scriptId;
      script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?onload=onloadTurnstileCallback";
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
    }

    (window as any).onloadTurnstileCallback = () => {
      renderWidget();
    };

    return () => {
      // Optional cleanup
      if (widgetIdRef.current && window.turnstile?.remove) {
        window.turnstile.remove(widgetIdRef.current);
        widgetIdRef.current = null;
      }
      onToken(null);
    };
  }, [siteKey, onToken]);

  return <div ref={containerRef} />;
}
