import React from "react";

import { useVoiceChat } from "../logic/useVoiceChat";

import { AudioInput } from "./AudioInput";
import { TextInput } from "./TextInput";

export const AvatarControls: React.FC = () => {
  const { isVoiceChatLoading, isVoiceChatActive } = useVoiceChat();

  return (
    <div className="flex flex-col gap-3 relative w-full items-center">
      {isVoiceChatActive || isVoiceChatLoading ? <AudioInput /> : null}
      <TextInput />
    </div>
  );
};
