import React, { forwardRef } from "react";
import { ConnectionQuality } from "@heygen/streaming-avatar";

import { useConnectionQuality } from "../logic/useConnectionQuality";
import { useStreamingAvatarSession } from "../logic/useStreamingAvatarSession";
import { StreamingAvatarSessionState } from "../logic";
import { CloseIcon } from "../Icons";
import { Button } from "../Button";

interface AvatarVideoProps {
  minutesRemaining?: number | null;
  secondsRemaining?: number | null;
}

export const AvatarVideo = forwardRef<HTMLVideoElement, AvatarVideoProps>(
  ({ minutesRemaining, secondsRemaining }, ref) => {
    const { sessionState, stopAvatar } = useStreamingAvatarSession();
    const { connectionQuality } = useConnectionQuality();

    const isLoaded = sessionState === StreamingAvatarSessionState.CONNECTED;
    const showCountdown = minutesRemaining === 1 && secondsRemaining !== null && secondsRemaining !== undefined;

    return (
      <>
        {/* {connectionQuality !== ConnectionQuality.UNKNOWN && (
          <div className="absolute top-3 left-3 bg-black text-white rounded-lg px-3 py-2">
            Connection Quality: {connectionQuality}
          </div>
        )} */}
        {isLoaded && minutesRemaining !== null && minutesRemaining !== undefined && (
          <div className={`absolute top-4 left-4 z-20 rounded-xl px-4 py-3 border-2 shadow-2xl backdrop-blur-md transition-all duration-500 ${
            showCountdown 
              ? "bg-gradient-to-br from-red-600/95 via-red-500/90 to-orange-500/95 border-red-300/60 animate-pulse shadow-red-500/50" 
              : "bg-gradient-to-br from-slate-900/95 via-slate-800/90 to-slate-900/95 border-slate-500/40 shadow-slate-900/50"
          }`}>
            <div className="flex flex-col items-center gap-1">
              {showCountdown ? (
                <>
                  <p 
                    key={secondsRemaining} 
                    className="text-2xl font-extrabold text-white tabular-nums animate-fadeInScale leading-none"
                  >
                    {secondsRemaining}
                  </p>
                  <p className="text-[10px] font-medium text-white/90 uppercase tracking-wider">
                    {secondsRemaining === 1 ? "second left" : "seconds left"}
                  </p>
                </>
              ) : (
                <>
                  <p className="text-2xl font-extrabold text-white tabular-nums leading-none">
                    {minutesRemaining > 0 ? minutesRemaining : 0}
                  </p>
                  <p className="text-[10px] font-medium text-white/90 uppercase tracking-wider">
                    {minutesRemaining === 1 ? "minute left" : "minutes left"}
                  </p>
                </>
              )}
            </div>
          </div>
        )}
        {isLoaded && (
          <Button
            className="absolute top-3 right-3 !p-2 bg-zinc-700 bg-opacity-50 z-10"
            onClick={stopAvatar}
          >
            <CloseIcon />
          </Button>
        )}
        {/* after 8 years */}
      <video
        ref={ref}
        autoPlay
        playsInline
        className="w-full h-full object-cover"
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
        }}
      >
        <track kind="captions" />
      </video>
      {!isLoaded && (
        <div className="w-full h-full flex items-center justify-center absolute top-0 left-0">
          Loading...
        </div>
      )}
    </>
  );
});
AvatarVideo.displayName = "AvatarVideo";
