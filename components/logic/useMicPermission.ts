import { useEffect, useState } from "react";

export function useMicPermission() {
  const [state, setState] = useState<"granted" | "denied" | "prompt" | "unknown">("unknown");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        // permissions API might be unavailable on some browsers
        const anyNavigator: any = navigator as any;
        const query = anyNavigator.permissions?.query?.bind(anyNavigator.permissions);
        if (!query) {
          setState("unknown");
          return;
        }
        const perm = await query({ name: "microphone" as any });
        const update = () => {
          if (!cancelled) setState((perm as any).state ?? "unknown");
        };
        update();
        (perm as any).onchange = update;
      } catch {
        setState("unknown");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const request = async (): Promise<boolean> => {
    setError(null);
    const tryConstraints = async (constraints: MediaStreamConstraints) => {
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      stream.getTracks().forEach((t) => t.stop());
    };
    try {
      // Try stricter constraints first for better device activation across browsers
      try {
        await tryConstraints({ audio: { echoCancellation: true, noiseSuppression: true } as any });
      } catch {
        await tryConstraints({ audio: true });
      }
      // Permissions API may not reflect instantly; set explicitly
      setState("granted");
      return true;
    } catch (e: any) {
      setState("denied");
      setError(e?.name || "getUserMedia failed");
      return false;
    }
  };

  return { state, request, error };
}



