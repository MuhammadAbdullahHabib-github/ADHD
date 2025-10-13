import { TaskType, TaskMode } from "@heygen/streaming-avatar";
import React, { useCallback, useEffect, useState } from "react";
import { usePrevious } from "ahooks";

import { Select } from "../Select";
import { Button } from "../Button";
import { SendIcon } from "../Icons";
import { useTextChat } from "../logic/useTextChat";
import { Input } from "../Input";
import { useConversationState } from "../logic/useConversationState";
import { useStreamingAvatarContext } from "../logic/context";

export const TextInput: React.FC = () => {
  const { avatarRef } = useStreamingAvatarContext();
  const { startListening, stopListening } = useConversationState();
  const [taskType, setTaskType] = useState<TaskType>(TaskType.TALK);
  const [taskMode, setTaskMode] = useState<TaskMode>(TaskMode.ASYNC);
  const [message, setMessage] = useState("");

  const handleSend = useCallback(async () => {
    if (message.trim() === "") {
      return;
    }
    // Use HeyGen built-in voice processing instead of OpenAI
    if (avatarRef.current) {
      avatarRef.current.speak({
        text: message,
        taskType: TaskType.TALK,
        taskMode: TaskMode.ASYNC,
      });
    }
    setMessage("");
  }, [
    message,
    avatarRef,
  ]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Enter") {
        void handleSend();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleSend]);

  const previousText = usePrevious(message);

  useEffect(() => {
    if (!previousText && message) {
      startListening();
    } else if (previousText && !message) {
      stopListening();
    }
  }, [message, previousText, startListening, stopListening]);

  return (
    <div className="flex flex-row gap-2 items-end w-full">
      {/* Hidden selection bars - always use TALK mode with OpenAI API */}
      <div style={{ display: 'none' }}>
        <Select
          isSelected={(option) => option === taskType}
          options={Object.values(TaskType)}
          renderOption={(option) => option.toUpperCase()}
          value={taskType.toUpperCase()}
          onSelect={setTaskType}
        />
        <Select
          disabled={taskType === TaskType.TALK}
          isSelected={(option) => option === taskMode}
          options={Object.values(TaskMode)}
          renderOption={(option) => option.toUpperCase()}
          value={taskMode.toUpperCase()}
          onSelect={setTaskMode}
        />
      </div>
      {/* <Input
        className="min-w-[500px]"
        placeholder="Type something for the avatar to respond..."
        value={message}
        onChange={setMessage}
      />
      <Button
        className="!p-2"
        disabled={message.trim() === ""}
        onClick={handleSend}
      >
        <SendIcon size={20} />
      </Button> */}
    </div>
  );
};
