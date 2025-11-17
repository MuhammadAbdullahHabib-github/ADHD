"use client";

import {
  AvatarQuality,
  StreamingEvents,
  VoiceChatTransport,
  VoiceEmotion,
  StartAvatarRequest,
  STTProvider,
  ElevenLabsModel,
} from "@heygen/streaming-avatar";
import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useMemoizedFn, useUnmount } from "ahooks";

import { Button } from "./Button";
import { AvatarConfig } from "./AvatarConfig";
import { AvatarVideo } from "./AvatarSession/AvatarVideo";
import { useStreamingAvatarSession } from "./logic/useStreamingAvatarSession";
import { AvatarControls } from "./AvatarSession/AvatarControls";
import { useVoiceChat } from "./logic/useVoiceChat";
import { useMicPermission } from "./logic/useMicPermission";
import { StreamingAvatarProvider, StreamingAvatarSessionState } from "./logic";
import { LoadingIcon } from "./Icons";

import { AVATARS } from "@/app/lib/constants";

function buildMicHelpMessage(origin: string) {
  const ua = typeof navigator !== "undefined" ? navigator.userAgent.toLowerCase() : "";

  // Opera (check before Chrome since Opera includes "chrome" in UA)
  if (ua.includes("opr") || ua.includes("opera")) {
    return (
      "🔹 Opera\n\n" +
      "1. Click the lock icon 🔒 next to the URL\n" +
      "2. Choose Site settings\n" +
      "3. Set Microphone → Allow\n" +
      "4. Refresh the tab"
    );
  }

  // Microsoft Edge
  if (ua.includes("edg")) {
    return (
      "🔹 Microsoft Edge\n\n" +
      "1. Click the lock icon 🔒 beside the URL\n" +
      "2. Select Permissions for this site\n" +
      "3. Set Microphone → Allow\n" +
      "4. Reload the page"
    );
  }

  // Google Chrome
  if (ua.includes("chrome")) {
    return (
      "🔹 Google Chrome\n\n" +
      "1. Click the lock icon 🔒 in the address bar\n" +
      "2. Go to Site settings\n" +
      "3. Set Microphone → Allow\n" +
      "4. Refresh the page"
    );
  }

  // Mozilla Firefox
  if (ua.includes("firefox")) {
    return (
      "🔹 Mozilla Firefox\n\n" +
      "1. Click the microphone icon 🎙️ in the address bar\n" +
      "2. Choose Allow microphone access\n" +
      "3. Reload if needed"
    );
  }

  // Safari
  if (ua.includes("safari")) {
    return (
      "🔹 Safari (Mac/iPhone)\n\n" +
      "1. Go to Safari → Settings for This Website\n" +
      "2. Under Microphone, choose Allow\n" +
      "3. Reload the page"
    );
  }

  // Generic fallback
  return (
    "Microphone permission is required.\n\n" +
    "1. Click the lock icon 🔒 near the address bar\n" +
    "2. Set Microphone → Allow\n" +
    "3. Refresh the page"
  );
}

// Function to get current date and time
function getCurrentDateTimeInfo(): string {
  const now = new Date();
  const options: Intl.DateTimeFormatOptions = { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  };
  const dateString = now.toLocaleDateString('en-US', options);
  const timeString = now.toLocaleTimeString('en-US', { 
    hour: 'numeric', 
    minute: '2-digit',
    hour12: true 
  });
  
  return `**CURRENT DATE & TIME:**\nToday is ${dateString}.\nCurrent time is ${timeString}.\nWhen asked about the date or time, use this information.\n\n`;
}

// Function to get full knowledge base text for each avatar
function getKnowledgeBaseForAvatar(avatarName: string): string {
  const dateTimeInfo = getCurrentDateTimeInfo();
  const therapistName = avatarName === "Ann_Therapist_public" ? "Ann" : "Graham";
  
  return `${dateTimeInfo}## **PERSONA:**

Every time that you respond to user input, you must adopt and adhere to the following persona:

You are **${therapistName}**, the ADHD therapist and coach.
You are warm, calm, and empathetic. You speak gently, validating the user's feelings while helping them build systems for focus, structure, and emotional regulation.
You understand ADHD from a compassionate, real-world perspective—not medical. You always aim to make the user feel seen, safe, and supported.

---

## **KNOWLEDGE BASE:**

Every time that you respond to user input, provide answers from the below knowledge. Always prioritize this knowledge when replying to users:

### **ADHD Coaching Principles:**

* **Validation First:** Begin responses with warmth and understanding. Examples:
  "I hear you." / "That makes total sense." / "You're not alone in that."

* **Normalize ADHD:**
  "Your brain works differently, not wrong." / "It's okay that focus feels hard sometimes."

* **Core Strategies:**

  * Body doubling
  * Time blocking
  * External structure (timers, planners, reminders)
  * Breaking tasks into micro-steps
  * Using rewards and accountability partners

* **Powerful Coaching Questions:**
  "What's getting in your way right now?" / "What would help you feel more in control?" / "What's one small step you can take next?"

* **Focus on Systems, Not Willpower:**
  "Let's build some scaffolding for your brain." / "We can design your environment to make focus easier."

---

### **Accessibility & Rapport:**

People with ADHD often ask grounding or connection questions before diving into deeper topics.
Always answer these **clearly and kindly**, then gently redirect to ADHD support.

**Examples:**

* "My name is ${therapistName}."
* "I'm an ADHD support coach—I don't have a physical location."
* "I don't have real emotions, but I'm here to help you."
* "Today is ${new Date().toLocaleDateString()}, ${new Date().toLocaleString('en-US', {weekday: 'long'})}"
* "Current time is ${new Date().toLocaleTimeString()}"
* "When asked about the date or time, use this information."  

After responding, gently bridge back to your role:

> "Would you like to talk about focus, routines, or emotional regulation today?"

---

### **Boundaries:**

* Do **not** provide medical or diagnostic advice.
* Do **not** reference medication, therapy prescriptions, or mental health diagnoses.
* Focus only on **coaching, structure, and encouragement.**

---

## **INSTRUCTIONS:**

### **Communication Style:**

* Keep responses **short and conversational (1–2 sentences max)**.
* Use a warm, human, and encouraging tone.
* Use everyday, easy-to-understand language.

### **Response Guidelines:**

* **[Overcome ASR Errors]:** If user audio is unclear, respond naturally as if you heard static or a choppy voice (e.g., "Sorry, didn't catch that—could you say it again?").
* **[Stay in Role]:** You are an **interactive avatar**, not a medical professional or real person.
* **[Speech Only]:** Never include non-speech actions (no *nods*, *smiles*, or stage directions).
* **[Empathy First]:** Always validate before giving advice.`;
}

const DEFAULT_CONFIG: StartAvatarRequest = {
  quality: AvatarQuality.High,
  avatarName: AVATARS[0].avatar_id,
  knowledgeId: undefined,
  knowledgeBase: getKnowledgeBaseForAvatar(AVATARS[0].avatar_id),
  voice: {
    rate: 1.5,
    emotion: VoiceEmotion.EXCITED,
    model: ElevenLabsModel.eleven_flash_v2_5,
  },
  language: "en",
  voiceChatTransport: VoiceChatTransport.WEBSOCKET,
  sttSettings: {
    provider: STTProvider.DEEPGRAM,
  },
};

function InteractiveAvatar() {
  const { initAvatar, startAvatar, stopAvatar, sessionState, stream } =
    useStreamingAvatarSession();

  // Debug session state changes
  useEffect(() => {
    console.log("🔄 Session state changed:", sessionState);
  }, [sessionState]);
  const { startVoiceChat } = useVoiceChat();

  const [config, setConfig] = useState<StartAvatarRequest>(DEFAULT_CONFIG);
  const [isStarting, setIsStarting] = useState(false);
  const [micPaused, setMicPaused] = useState(false); // Track if session is paused due to mic issue
  const [sessionWasActive, setSessionWasActive] = useState(false); // Track if we had an active session
  const [statusMessage, setStatusMessage] = useState("Checking microphone permissions...");

  const mediaStream = useRef<HTMLVideoElement>(null);
  const searchParams = useSearchParams();
  const [billingMessage, setBillingMessage] = useState<string | null>(null);
  const [clientToken, setClientToken] = useState<string | null>(null);
  const [tokenError, setTokenError] = useState<string | null>(null);
  const [minutesRemaining, setMinutesRemaining] = useState<number | null>(null);
  const [secondsRemaining, setSecondsRemaining] = useState<number | null>(null);
  const [totalAllocatedMinutes, setTotalAllocatedMinutes] = useState<number | null>(null);
  const [timeExpired, setTimeExpired] = useState(false);
  const [isVerifyingToken, setIsVerifyingToken] = useState(false);
  const secondsCountdownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const minutesPollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const minutesRemainingRef = useRef<number | null>(null);
  const hasExpiredRef = useRef(false);
  const tokenRef = useRef<string | null>(null);
  const queryToken = searchParams?.get("token") ?? null;
  
  // Callback to ensure video element is properly attached
  const setVideoRef = useCallback((element: HTMLVideoElement | null) => {
    mediaStream.current = element;
    console.log("🎥 Video element attached:", !!element);
    
    // If we have a stream but no element was attached before, set it now
    if (element && stream) {
      console.log("🎥 Setting stream on newly attached video element");
      element.srcObject = stream;
      element.onloadedmetadata = () => {
        console.log("🎥 Video metadata loaded, starting playback...");
        element.play();
      };
    }
  }, [stream]);
  const { state: micState, request: requestMic } = useMicPermission();
  const isStoppingRef = useRef(false);
  const stopCallCountRef = useRef(0);
  const lastConfigRef = useRef<StartAvatarRequest>(DEFAULT_CONFIG); // Store last config for reconnect

  useEffect(() => {
    if (queryToken && queryToken !== clientToken) {
      setClientToken(queryToken);
      tokenRef.current = queryToken;
      setTokenError(null);
    }
  }, [queryToken, clientToken]);

  async function fetchAccessToken() {
    try {
      const response = await fetch("/api/get-access-token", {
        method: "POST",
      });
      const token = await response.text();

      console.log("Access Token:", token); // Log the token to verify

      return token;
    } catch (error) {
      console.error("Error fetching access token:", error);
      throw error;
    }
  }

  const stopMinutesPolling = useCallback(() => {
    if (minutesPollingRef.current) {
      clearInterval(minutesPollingRef.current);
      minutesPollingRef.current = null;
    }
  }, []);

  const expireBillingToken = useCallback(async () => {
    const activeToken = tokenRef.current ?? clientToken ?? queryToken;
    if (!activeToken) {
      return;
    }

    try {
      await fetch("/api/billing/expire", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token: activeToken }),
      });
    } catch (error) {
      console.error("Failed to expire billing token:", error);
    }
  }, [clientToken, queryToken]);

  const handleTimeExpired = useCallback(async () => {
    if (hasExpiredRef.current) {
      return;
    }
    hasExpiredRef.current = true;
    setTimeExpired(true);
    // Don't set billingMessage - we'll show a single consolidated notification
    stopMinutesPolling();
    try {
      await expireBillingToken();
    } catch (error) {
      console.error("Failed to expire token after timeout:", error);
    }
    try {
      await stopAvatar();
    } catch (error) {
      console.error("Failed to stop avatar after timeout:", error);
    }
  }, [expireBillingToken, stopAvatar, stopMinutesPolling]);

  const parseMinutesValue = (data: any) => {
    // New format: remaining_minutes
    if (typeof data?.remaining_minutes === "number") {
      return data.remaining_minutes;
    }
    // Legacy formats for backward compatibility
    if (typeof data?.minutes_remaining === "number") {
      return data.minutes_remaining;
    }
    if (typeof data?.minutes === "number") {
      return data.minutes;
    }
    if (typeof data?.remaining === "number") {
      return data.remaining;
    }
    return null;
  };

  const setMinutes = useCallback(
    async (minutes: number) => {
      const activeToken = tokenRef.current ?? clientToken ?? queryToken;
      if (!activeToken) {
        return false;
      }

      try {
        const response = await fetch("/api/billing/set-minutes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token: activeToken, minutes }),
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
          const errorMessage = data.message || data.error || "Failed to set minutes";
          console.error("Failed to set minutes:", errorMessage);
          return false;
        }

        return true;
      } catch (error) {
        console.error("Set minutes error:", error);
        return false;
      }
    },
    [clientToken, queryToken],
  );

  const fetchMinutesRemaining = useCallback(
    async () => {
      const activeToken = tokenRef.current ?? clientToken ?? queryToken;
      if (!activeToken) {
        return null;
      }

      try {
        const response = await fetch("/api/billing/minutes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token: activeToken }),
        });

        if (!response.ok) {
          const text = await response.text();
          console.error("Failed to fetch minutes:", text);
          return null;
        }

        const data = await response.json();
        const minutes = parseMinutesValue(data);

        if (typeof minutes === "number") {
          // Display exact value from API
          setMinutesRemaining(minutes);
          setTotalAllocatedMinutes((prev) => {
            if (prev === null || minutes > prev) {
              return minutes;
            }
            return prev;
          });
          
          if (minutes <= 0) {
            await handleTimeExpired();
          }
        }

        return minutes ?? null;
      } catch (error) {
        console.error("Minutes polling error:", error);
        return null;
      }
    },
    [clientToken, queryToken, handleTimeExpired],
  );

  const startMinutesPolling = useCallback(() => {
    stopMinutesPolling();
    minutesPollingRef.current = setInterval(async () => {
      try {
        // Use current displayed minutes value from ref
        const currentDisplayedMinutes = minutesRemainingRef.current;
        
        if (currentDisplayedMinutes !== null && currentDisplayedMinutes > 0) {
          // Reduce by 1 on server using set_minutes BEFORE fetching
          const newMinutes = currentDisplayedMinutes - 1;
          const setSuccess = await setMinutes(newMinutes);
          
          if (setSuccess) {
            // Then fetch updated value from server
            await fetchMinutesRemaining();
          }
        }
      } catch (error) {
        console.error("Minutes polling loop error:", error);
      }
    }, 60000); // Poll every 1 minute
  }, [fetchMinutesRemaining, setMinutes, stopMinutesPolling])

  const verifyBillingToken = useCallback(async () => {
    const activeToken = tokenRef.current ?? clientToken ?? queryToken;
    if (!activeToken) {
      setTokenError(
        "Purchase token missing. Please open this page from your purchase link.",
      );
      return false;
    }

    setIsVerifyingToken(true);
    setTokenError(null);

    try {
      const response = await fetch("/api/billing/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: activeToken }),
      });

      // Parse response body
      let data: any = {};
      try {
        const text = await response.text();
        if (text) {
          data = JSON.parse(text);
        }
      } catch (parseError) {
        console.error("Failed to parse verification response:", parseError);
        setTokenError("Invalid response from verification server.");
        return false;
      }

      // Check if token is expired
      if (data?.expired === true || data?.is_expired === true || data?.token_expired === true) {
        setTokenError(
          "Your purchase token has expired. Please use a valid purchase link to access your session."
        );
        return false;
      }

      // Check if response indicates success
      // New format: {success: true, valid: true}
      const isSuccess = 
        response.ok && 
        data?.success === true && 
        data?.valid === true;

      if (!isSuccess) {
        const message =
          (typeof data?.error === "string" && data.error) ||
          (typeof data?.message === "string" && data.message) ||
          "Unable to verify your purchase token. Please ensure you're using a valid purchase link.";
        setTokenError(message);
        return false;
      }

      console.log("✅ Token verified successfully:", activeToken);
      tokenRef.current = activeToken;
      return true;
    } catch (error) {
      console.error("Token verification error:", error);
      setTokenError(
        "We couldn't verify your token. Please refresh and try again.",
      );
      return false;
    } finally {
      setIsVerifyingToken(false);
    }
  }, [clientToken, queryToken]);

  const startSessionV2 = useMemoizedFn(async (isVoiceChat: boolean) => {
    try {
      setIsStarting(true);
      setBillingMessage(null);
      setTokenError(null);
      setTimeExpired(false);
      hasExpiredRef.current = false;

      // Step 1: Verify token
      const tokenIsValid = await verifyBillingToken();
      if (!tokenIsValid) {
        setIsStarting(false);
        return;
      }

      // Step 2: Check minutes remaining and token expiry BEFORE starting session
      const activeToken = tokenRef.current ?? clientToken ?? queryToken;
      if (activeToken) {
        const minutes = await fetchMinutesRemaining();
        
        // Check if minutes are zero or negative
        if (minutes !== null && minutes <= 0) {
          setTokenError(
            "Your session has no remaining minutes. Please purchase more minutes to continue."
          );
          setIsStarting(false);
          return;
        }

        // Check if token is expired (verify endpoint should handle this, but double-check)
        // If verify returned false, we already returned above
        // Additional check: if minutes fetch failed, token might be expired
        if (minutes === null) {
          setTokenError(
            "Unable to verify your session status. Please refresh and try again."
          );
          setIsStarting(false);
          return;
        }
      }

      // If voice chat requested, acquire mic permission FIRST to trigger prompt immediately
      if (isVoiceChat) {
        let ok = micState === "granted";
        if (!ok) ok = await requestMic();
        if (!ok) {
          if (typeof window !== "undefined") {
            const msg = buildMicHelpMessage(location.origin);
            window.alert(msg);
          }
          setIsStarting(false);
          return;
        }
      }
      // Suppress LiveKit WebRTC console errors
      const originalConsoleError = console.error;
      console.error = (...args) => {
        const message = args[0]?.toString() || '';
        if (message.includes('Unknown DataChannel error') || 
            message.includes('WebRTC') || 
            message.includes('LiveKit')) {
          // Suppress these noisy WebRTC errors
          return;
        }
        originalConsoleError.apply(console, args);
      };

      const newToken = await fetchAccessToken();
      const avatar = initAvatar(newToken);

      avatar.on(StreamingEvents.AVATAR_START_TALKING, (e) => {
        console.log("Avatar started talking", e);
      });
      avatar.on(StreamingEvents.AVATAR_STOP_TALKING, (e) => {
        console.log("Avatar stopped talking", e);
      });
      avatar.on(StreamingEvents.STREAM_DISCONNECTED, () => {
        console.log("Stream disconnected");
        // Restore original console.error
        console.error = originalConsoleError;
      });
      avatar.on(StreamingEvents.STREAM_READY, (event) => {
        console.log(">>>>> Stream ready:", event.detail);
        console.log("🎥 Stream ready - video should appear now!");
      });
      avatar.on(StreamingEvents.USER_START, (event) => {
        console.log(">>>>> User started talking:", event);
      });
      avatar.on(StreamingEvents.USER_STOP, (event) => {
        console.log(">>>>> User stopped talking:", event);
      });
      avatar.on(StreamingEvents.USER_END_MESSAGE, (event) => {
        console.log(">>>>> User end message:", event);
      });
      avatar.on(StreamingEvents.USER_TALKING_MESSAGE, (event) => {
        console.log(">>>>> User talking message:", event);
      });
      avatar.on(StreamingEvents.AVATAR_TALKING_MESSAGE, (event) => {
        console.log(">>>>> Avatar talking message:", event);
      });
      avatar.on(StreamingEvents.AVATAR_END_MESSAGE, (event) => {
        console.log(">>>>> Avatar end message:", event);
      });

      // Update config with fresh date/time and knowledge base
      const configWithFreshData = {
        ...config,
        knowledgeId: undefined,
        knowledgeBase: getKnowledgeBaseForAvatar(config.avatarName),
      };
      
      // Store config for potential reconnect
      lastConfigRef.current = configWithFreshData;

      console.log("🚀 Starting avatar with config:");
      console.log("🎭 Avatar:", configWithFreshData.avatarName);
      console.log("📅 Knowledge Base Preview:", configWithFreshData.knowledgeBase?.substring(0, 150) + "...");
      
      await startAvatar(configWithFreshData);
      console.log("✅ Avatar start command completed");
      setBillingMessage(null);
      setTimeExpired(false);
      await fetchMinutesRemaining();
      startMinutesPolling();
      
      // Mark that we had an active session
      setSessionWasActive(true);
      setMicPaused(false);

      if (isVoiceChat) {
        await startVoiceChat();
      }
    } catch (error) {
      console.error("Error starting avatar session:", error);
    } finally {
      setIsStarting(false);
    }
  });

  useUnmount(() => {
    stopMinutesPolling();
    stopAvatar();
  });

  useEffect(() => {
    // Apply avatar from query param ?avatar=male|female when lobby is visible
    const qp = searchParams?.get("avatar");
    if (!qp) return;
    
    setConfig((prev) => {
      let avatarName = prev.avatarName;
      if (qp === "male") {
        avatarName = "Graham_Chair_Sitting_public";
      } else if (qp === "female") {
        avatarName = "Ann_Therapist_public";
      }
      
      return {
        ...prev,
        avatarName,
        knowledgeId: undefined,
      };
    });
  }, [searchParams, setConfig]);

  useEffect(() => {
    console.log("🎥 Stream effect:", { 
      hasStream: !!stream, 
      hasMediaElement: !!mediaStream.current,
      sessionState,
      streamTracks: stream?.getTracks?.()?.length || 0
    });
    
    if (stream && mediaStream.current) {
      console.log("🎥 Setting video stream...");
      mediaStream.current.srcObject = stream;
      mediaStream.current.onloadedmetadata = () => {
        console.log("🎥 Video metadata loaded, starting playback...");
        mediaStream.current!.play();
      };
      mediaStream.current.onerror = (e) => {
        console.error("🎥 Video error:", e);
      };
    } else if (stream && !mediaStream.current) {
      console.log("⚠️ Stream received but video element not ready yet - will retry");
      // Retry after a short delay to allow component to render
      setTimeout(() => {
        if (stream && mediaStream.current) {
          console.log("🎥 Retry: Setting video stream...");
          mediaStream.current.srcObject = stream;
          mediaStream.current.onloadedmetadata = () => {
            console.log("🎥 Retry: Video metadata loaded, starting playback...");
            mediaStream.current!.play();
          };
        }
      }, 100);
    }
  }, [mediaStream, stream, sessionState]);

  // Monitor mic permission during active session - pause if mic gets disabled, auto-reconnect when enabled
  useEffect(() => {
    if (sessionState === StreamingAvatarSessionState.CONNECTED) {
      if (micState === "denied" && !isStoppingRef.current && !micPaused) {
        console.log("🛑 Microphone disabled during session - pausing avatar");
        isStoppingRef.current = true;
        stopCallCountRef.current += 1;
        console.log("🛑 Stop call #", stopCallCountRef.current);
        (async () => {
          await stopAvatar();
          setMicPaused(true); // Enter paused state instead of going to lobby
          if (typeof window !== "undefined") {
            window.alert("⚠️ Technical Issue Detected\nYour microphone has stopped working.\nPlease enable microphone access - we'll reconnect automatically.");
          }
          isStoppingRef.current = false;
        })();
      }
    } else if (sessionState === StreamingAvatarSessionState.INACTIVE) {
      // Reset the flag when session is inactive
      isStoppingRef.current = false;
    }
  }, [micState, sessionState, stopAvatar, micPaused]);

  // Auto-reconnect when mic comes back online during paused state
  useEffect(() => {
    console.log("🔄 Auto-reconnect check:", { micPaused, micState, sessionWasActive, isStopping: isStoppingRef.current });
    if (micPaused && micState === "granted" && sessionWasActive && !isStoppingRef.current) {
      console.log("✅ Microphone re-enabled - reconnecting...");
      // Add a small delay to ensure previous session is fully stopped
      setTimeout(() => {
        if (micPaused && micState === "granted" && sessionWasActive) {
          console.log("🔄 Delayed reconnect starting...");
          startSessionV2(true);
        }
      }, 500);
    }
  }, [micPaused, micState, sessionWasActive, startSessionV2]);

  // Cycle through status messages when mic is paused
  useEffect(() => {
    if (!micPaused) return;

    const messages = [
      "Checking microphone permissions...",
      "Scanning for audio devices...",
      "Waiting for microphone access...",
      "Monitoring system audio...",
      "Preparing to reconnect...",
      "Almost ready to continue..."
    ];

    let index = 0;
    const interval = setInterval(() => {
      setStatusMessage(messages[index]);
      index = (index + 1) % messages.length;
    }, 2000);

    return () => clearInterval(interval);
  }, [micPaused]);

  // Keep ref in sync with state for polling
  useEffect(() => {
    minutesRemainingRef.current = minutesRemaining;
  }, [minutesRemaining]);

  // Start seconds countdown when 1 minute is left
  useEffect(() => {
    // Clear any existing countdown
    if (secondsCountdownRef.current) {
      clearInterval(secondsCountdownRef.current);
      secondsCountdownRef.current = null;
    }

    // Start countdown when exactly 1 minute is remaining
    if (minutesRemaining === 1 && sessionState === StreamingAvatarSessionState.CONNECTED) {
      setSecondsRemaining(60); // Start at 60 seconds
      
      secondsCountdownRef.current = setInterval(() => {
        setSecondsRemaining((prev) => {
          if (prev === null || prev <= 1) {
            if (secondsCountdownRef.current) {
              clearInterval(secondsCountdownRef.current);
              secondsCountdownRef.current = null;
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000); // Update every second
    } else if (minutesRemaining !== 1) {
      // Reset seconds when not at 1 minute
      setSecondsRemaining(null);
    }

    // Cleanup on unmount or when session ends
    return () => {
      if (secondsCountdownRef.current) {
        clearInterval(secondsCountdownRef.current);
        secondsCountdownRef.current = null;
      }
    };
  }, [minutesRemaining, sessionState]);

  useEffect(() => {
    if (sessionState !== StreamingAvatarSessionState.CONNECTED) {
      stopMinutesPolling();
      setMinutesRemaining(null);
      setSecondsRemaining(null);
      minutesRemainingRef.current = null;
      setTotalAllocatedMinutes(null);
      if (secondsCountdownRef.current) {
        clearInterval(secondsCountdownRef.current);
        secondsCountdownRef.current = null;
      }
      if (!timeExpired) {
        setBillingMessage(null);
      }
      hasExpiredRef.current = false;
    }
  }, [sessionState, stopMinutesPolling, timeExpired]);

  const handleBackToLobby = () => {
    setMicPaused(false);
    setSessionWasActive(false);
    // Already stopped, just return to lobby
  };

  const minutesProgressPct =
    totalAllocatedMinutes &&
    totalAllocatedMinutes > 0 &&
    minutesRemaining !== null
      ? Math.max(
          0,
          Math.min(
            100,
            Math.round((minutesRemaining / totalAllocatedMinutes) * 100),
          ),
        )
      : null;

  return (
    <div className="w-full h-full flex flex-col">
      <div className="flex flex-col h-full bg-zinc-900 overflow-hidden">
        {/* Back button - show when mic is paused */}
        {micPaused && (
          <div className="absolute top-4 left-4 z-50">
            <Button
              onClick={handleBackToLobby}
              className="flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-white px-4 py-2 rounded-lg shadow-lg"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z"
                  clipRule="evenodd"
                />
              </svg>
              Back
            </Button>
          </div>
        )}

        <div className="relative flex-1 overflow-hidden flex flex-col items-center justify-center">
          {micPaused ? (
            // Paused state - waiting for mic to come back
            <div className="w-full h-full flex flex-col items-center justify-center p-4 gap-6 relative overflow-hidden">
              {/* Subtle background animation */}
              <div className="absolute inset-0 opacity-5">
                <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-blue-500 rounded-full animate-ping"></div>
                <div className="absolute top-3/4 right-1/4 w-24 h-24 bg-green-500 rounded-full animate-ping" style={{animationDelay: '1s'}}></div>
                <div className="absolute bottom-1/4 left-1/3 w-20 h-20 bg-yellow-500 rounded-full animate-ping" style={{animationDelay: '2s'}}></div>
              </div>
              <div className="text-center max-w-lg">
                {/* Animated microphone with pulsing effect */}
                <div className="relative mb-6">
                  <div className="text-8xl animate-bounce">🎤</div>
                  <div className="absolute inset-0 text-8xl animate-ping opacity-20">🎤</div>
                </div>
                
                <h2 className="text-3xl font-bold text-white mb-3 animate-pulse">
                  Waiting for Microphone
                </h2>
                
                <p className="text-zinc-300 mb-6 text-lg">
                  Please enable your microphone to continue the session.
                  <br />
                  <span className="text-blue-400 font-semibold">We'll reconnect automatically once it's enabled.</span>
                </p>
                
                {/* Animated status indicator */}
                <div className="flex flex-col items-center gap-4">
                  <div className="flex items-center gap-3">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce" style={{animationDelay: '0ms'}}></div>
                      <div className="w-2 h-2 bg-yellow-500 rounded-full animate-bounce" style={{animationDelay: '150ms'}}></div>
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{animationDelay: '300ms'}}></div>
                    </div>
                    <span className="text-zinc-400 font-medium">Monitoring microphone status...</span>
                  </div>
                  
                  {/* Progress bar animation */}
                  <div className="w-64 h-1 bg-zinc-700 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-blue-500 to-green-500 rounded-full animate-pulse"></div>
                  </div>
                  
                  {/* Rotating status text */}
                  <div className="text-sm text-zinc-500 animate-pulse">
                    <span className="inline-block animate-spin mr-2">⟳</span>
                    {statusMessage}
                  </div>
                </div>
              </div>
            </div>
          ) : sessionState !== StreamingAvatarSessionState.INACTIVE ? (
            <AvatarVideo 
              ref={setVideoRef} 
              minutesRemaining={minutesRemaining}
              secondsRemaining={secondsRemaining}
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center p-4 gap-4">
              <AvatarConfig config={config} onConfigChange={setConfig} />
              {tokenError && (
                <div className="w-full max-w-xl">
                  <div className="flex gap-3 rounded-2xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-red-100">
                    <div className="text-xl font-semibold text-red-300">!</div>
                    <div>
                      <p className="text-sm font-semibold uppercase tracking-wide text-red-200">
                        Access Required
                      </p>
                      <p className="text-sm text-red-100/90">{tokenError}</p>
                    </div>
                  </div>
                </div>
              )}
              {isVerifyingToken && (
                <div className="w-full max-w-xl">
                  <div className="flex gap-3 rounded-2xl border border-indigo-400/40 bg-indigo-500/10 px-4 py-3 text-indigo-100">
                    <div className="w-5 h-5 border-2 border-indigo-200 border-t-transparent rounded-full animate-spin mt-1" />
                    <div>
                      <p className="text-sm font-semibold uppercase tracking-wide text-indigo-200">
                        Verifying Purchase
                      </p>
                      <p className="text-sm text-indigo-50/90">
                        Validating your token with the billing server...
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
        <div className="flex flex-col gap-3 items-center justify-center p-4 border-t border-zinc-700 w-full">
          {sessionState === StreamingAvatarSessionState.CONNECTED ? (
            <AvatarControls />
          ) : sessionState === StreamingAvatarSessionState.INACTIVE && !micPaused ? (
            <div className="flex flex-row gap-4">
              <Button 
                onClick={() => startSessionV2(true)}
                disabled={isStarting}
                className={`transition-all duration-200 transform active:scale-95 hover:scale-105 ${
                  isStarting ? 'opacity-75 cursor-not-allowed' : 'hover:shadow-lg'
                }`}
              >
                {isStarting ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Starting...
                  </div>
                ) : (
                  'Start Session'
                )}
              </Button>
              {/* <Button onClick={() => startSessionV2(false)}>
                Start Text Chat
              </Button> */}
            </div>
          ) : !micPaused ? (
            <LoadingIcon />
          ) : null}
          {billingMessage && (
            <div className="w-full max-w-xl">
              <div className="flex gap-3 rounded-2xl border border-amber-400/40 bg-amber-500/10 px-4 py-3 text-amber-100">
                <div className="text-xl font-semibold text-amber-300">⚠️</div>
                <div>
                  <p className="text-sm font-semibold uppercase tracking-wide text-amber-200">
                    Session Notice
                  </p>
                  <p className="text-sm text-amber-50/90">{billingMessage}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      {/* Voice Chat and Text Chat controls hidden for now */}
      {/* {sessionState === StreamingAvatarSessionState.CONNECTED && (
        <MessageHistory />
      )} */}
    </div>
  );
}

export default function InteractiveAvatarWrapper() {
  return (
    <StreamingAvatarProvider basePath={process.env.NEXT_PUBLIC_BASE_API_URL}>
      <InteractiveAvatar />
    </StreamingAvatarProvider>
  );
}
