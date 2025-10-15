import React from "react";
import { useMicPermission } from "../logic/useMicPermission";

export const AudioStatus: React.FC = () => {
  const { state, request, error } = useMicPermission();

  return (
    <div className="text-xs text-zinc-300 bg-zinc-800/70 border border-zinc-700 rounded px-2 py-1">
      Mic permission: <b>{state}</b>
      {error ? <span className="text-red-400"> ({error})</span> : null}
      {state !== "granted" && (
        <>
          <button className="ml-2 underline" onClick={() => void request()}>
            Enable mic
          </button>
          <button
            className="ml-2 underline"
            title="Open browser site settings for microphone"
            onClick={() => {
              // Chromium site settings deep-link (may be blocked by browser)
              const site = encodeURIComponent(location.origin);
              const targets = [
                `chrome://settings/content/siteDetails?site=${site}`,
                `edge://settings/content/siteDetails?site=${site}`,
                `chrome://settings/content/microphone`,
                `edge://settings/content/microphone`,
              ];
              for (const url of targets) {
                const w = window.open(url, "_blank");
                if (w) break; // stop after the first successful open
              }
              // If blocked, user can click the lock icon and allow Microphone
            }}
          >
            Open site settings
          </button>
        </>
      )}
    </div>
  );
};



