"use client";

import { useEffect, useState } from "react";

import { Icon } from "@/components/landing/icons";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

export function PwaPrompt() {
  const [installEvent, setInstallEvent] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [updateReady, setUpdateReady] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const onBeforeInstall = (e: Event) => {
      e.preventDefault();
      setInstallEvent(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", onBeforeInstall);

    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.getRegistration().then((reg) => {
        if (!reg) return;
        reg.addEventListener("updatefound", () => {
          const sw = reg.installing;
          sw?.addEventListener("statechange", () => {
            if (
              sw.state === "installed" &&
              navigator.serviceWorker.controller
            ) {
              setUpdateReady(true);
            }
          });
        });
      });
    }

    return () =>
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
  }, []);

  if (dismissed) return null;

  if (updateReady) {
    return (
      <Toast
        label="A new version is available."
        actionLabel="Refresh"
        onAction={() => window.location.reload()}
        onClose={() => setDismissed(true)}
      />
    );
  }

  if (installEvent) {
    return (
      <Toast
        label="Install AI Growth Engine for a faster, app-like experience."
        actionLabel="Install"
        onAction={async () => {
          await installEvent.prompt();
          await installEvent.userChoice;
          setInstallEvent(null);
        }}
        onClose={() => setDismissed(true)}
      />
    );
  }

  return null;
}

function Toast({
  label,
  actionLabel,
  onAction,
  onClose,
}: {
  label: string;
  actionLabel: string;
  onAction: () => void;
  onClose: () => void;
}) {
  return (
    <div
      role="status"
      className="glass-panel fixed inset-x-4 bottom-4 z-50 mx-auto flex max-w-md items-center gap-3 rounded-2xl p-4 sm:inset-x-auto sm:right-6"
    >
      <p className="text-cream-dim flex-1 text-[0.85rem]">{label}</p>
      <button
        type="button"
        onClick={onAction}
        className="btn-gold rounded-lg px-3 py-1.5 text-[0.8rem] font-bold"
      >
        {actionLabel}
      </button>
      <button
        type="button"
        onClick={onClose}
        aria-label="Dismiss"
        className="text-faint hover:text-cream transition"
      >
        <Icon.close className="size-4" />
      </button>
    </div>
  );
}
