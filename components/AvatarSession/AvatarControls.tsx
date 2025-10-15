import React from "react";

import { useVoiceChat } from "../logic/useVoiceChat";

import { AudioInput } from "./AudioInput";
import { TextInput } from "./TextInput";
import { AudioStatus } from "./AudioStatus";

export const AvatarControls: React.FC = () => {
  const { isVoiceChatLoading, isVoiceChatActive } = useVoiceChat();

  return (
    <div className="flex flex-col gap-3 relative w-full items-center">
      {isVoiceChatActive || isVoiceChatLoading ? (
        <div className="relative w-full flex items-center justify-center">
          {/* Centered mic button */}
          <AudioInput />
          {/* Status pill pinned to the right end */}
          <div className="absolute right-0">
            <AudioStatus />
          </div>
        </div>
      ) : null}
      <TextInput />
    </div>
  );
};
