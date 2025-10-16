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
import { useEffect, useRef, useState } from "react";
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

const DEFAULT_CONFIG: StartAvatarRequest = {
  quality: AvatarQuality.High,
  avatarName: AVATARS[0].avatar_id,
  knowledgeId: undefined,
  knowledgeBase: `You are a real ADHD coach with 10+ years experience. Use authentic coaching language and techniques:

- Start with validation: 'I hear you' or 'That makes total sense'
- Use ADHD-specific strategies: body doubling, time blocking, external structure
- Ask powerful questions: 'What's getting in your way right now?' or 'What would help you feel more in control?'
- Normalize ADHD challenges: 'Your brain works differently, not wrong'
- Focus on systems over willpower: 'Let's build some scaffolding for your brain'
- Use coaching language: 'What I'm hearing is...' or 'It sounds like...'
- End with one concrete next step
- Keep responses SHORT and CONCISE (1-2 sentences max)
- Be warm, encouraging, and direct
- Avoid medical advice, focus on practical strategies`,
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
  const { startVoiceChat } = useVoiceChat();

  const [config, setConfig] = useState<StartAvatarRequest>(DEFAULT_CONFIG);
  const [isStarting, setIsStarting] = useState(false);

  const mediaStream = useRef<HTMLVideoElement>(null);
  const searchParams = useSearchParams();
  const { state: micState, request: requestMic } = useMicPermission();
  const isStoppingRef = useRef(false);

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

  const startSessionV2 = useMemoizedFn(async (isVoiceChat: boolean) => {
    try {
      setIsStarting(true);
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

      await startAvatar(config);

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
    stopAvatar();
  });

  useEffect(() => {
    // Apply avatar from query param ?avatar=male|female when lobby is visible
    const qp = searchParams?.get("avatar");
    if (!qp) return;
    setConfig((prev) => ({
      ...prev,
      avatarName:
        qp === "male" ? "Shawn_Therapist_public" : qp === "female" ? "Ann_Therapist_public" : prev.avatarName,
    }));
  }, [searchParams, setConfig]);

  useEffect(() => {
    if (stream && mediaStream.current) {
      mediaStream.current.srcObject = stream;
      mediaStream.current.onloadedmetadata = () => {
        mediaStream.current!.play();
      };
    }
  }, [mediaStream, stream]);

  // Monitor mic permission during active session - stop if mic gets disabled
  useEffect(() => {
    if (sessionState === StreamingAvatarSessionState.CONNECTED) {
      if (micState === "denied" && !isStoppingRef.current) {
        console.log("🛑 Microphone disabled during session - stopping avatar");
        isStoppingRef.current = true;
        (async () => {
          await stopAvatar();
          if (typeof window !== "undefined") {
            window.alert("⚠️ Technical Issue Detected\nYour microphone has stopped working.\nPlease enable microphone access and start the session again.");
          }
          isStoppingRef.current = false;
        })();
      }
    } else if (sessionState === StreamingAvatarSessionState.INACTIVE) {
      // Reset the flag when session is inactive
      isStoppingRef.current = false;
    }
  }, [micState, sessionState, stopAvatar]);

  return (
    <div className="w-full h-full flex flex-col">
      <div className="flex flex-col h-full bg-zinc-900 overflow-hidden">
        <div className="relative flex-1 overflow-hidden flex flex-col items-center justify-center">
          {sessionState !== StreamingAvatarSessionState.INACTIVE ? (
            <AvatarVideo ref={mediaStream} />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center p-4 gap-2">
              <AvatarConfig config={config} onConfigChange={setConfig} />
            </div>
          )}
        </div>
        <div className="flex flex-col gap-3 items-center justify-center p-4 border-t border-zinc-700 w-full">
          {sessionState === StreamingAvatarSessionState.CONNECTED ? (
            <AvatarControls />
          ) : sessionState === StreamingAvatarSessionState.INACTIVE ? (
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
          ) : (
            <LoadingIcon />
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
