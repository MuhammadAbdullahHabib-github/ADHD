import StreamingAvatar, {
  ConnectionQuality,
  StreamingEvents,
  StreamingTalkingMessageEvent,
  TaskMode,
  TaskType,
  UserTalkingMessageEvent,
} from "@heygen/streaming-avatar";
import React, { useRef, useState } from "react";

export enum StreamingAvatarSessionState {
  INACTIVE = "inactive",
  CONNECTING = "connecting",
  CONNECTED = "connected",
}

export enum MessageSender {
  CLIENT = "CLIENT",
  AVATAR = "AVATAR",
}

export interface Message {
  id: string;
  sender: MessageSender;
  content: string;
}

type StreamingAvatarContextProps = {
  avatarRef: React.MutableRefObject<StreamingAvatar | null>;
  basePath?: string;

  isMuted: boolean;
  setIsMuted: (isMuted: boolean) => void;
  isVoiceChatLoading: boolean;
  setIsVoiceChatLoading: (isVoiceChatLoading: boolean) => void;
  isVoiceChatActive: boolean;
  setIsVoiceChatActive: (isVoiceChatActive: boolean) => void;

  sessionState: StreamingAvatarSessionState;
  setSessionState: (sessionState: StreamingAvatarSessionState) => void;
  stream: MediaStream | null;
  setStream: (stream: MediaStream | null) => void;

  messages: Message[];
  clearMessages: () => void;
  handleUserTalkingMessage: ({
    detail,
  }: {
    detail: UserTalkingMessageEvent;
  }) => void;
  handleStreamingTalkingMessage: ({
    detail,
  }: {
    detail: StreamingTalkingMessageEvent;
  }) => void;
  handleEndMessage: () => void;
  addUserMessage: (content: string) => string;

  isListening: boolean;
  setIsListening: (isListening: boolean) => void;
  isUserTalking: boolean;
  setIsUserTalking: (isUserTalking: boolean) => void;
  isAvatarTalking: boolean;
  setIsAvatarTalking: (isAvatarTalking: boolean) => void;

  connectionQuality: ConnectionQuality;
  setConnectionQuality: (connectionQuality: ConnectionQuality) => void;

  sendAssistantMessage: (
    message: string,
    options?: { messageId?: string },
  ) => Promise<string | null>;
  isAssistantProcessing: boolean;
};

const StreamingAvatarContext = React.createContext<StreamingAvatarContextProps>(
  {
    avatarRef: { current: null },
    isMuted: true,
    setIsMuted: () => {},
    isVoiceChatLoading: false,
    setIsVoiceChatLoading: () => {},
    sessionState: StreamingAvatarSessionState.INACTIVE,
    setSessionState: () => {},
    isVoiceChatActive: false,
    setIsVoiceChatActive: () => {},
    stream: null,
    setStream: () => {},
    messages: [],
    clearMessages: () => {},
    handleUserTalkingMessage: () => {},
    handleStreamingTalkingMessage: () => {},
    handleEndMessage: () => {},
    addUserMessage: () => "",
    isListening: false,
    setIsListening: () => {},
    isUserTalking: false,
    setIsUserTalking: () => {},
    isAvatarTalking: false,
    setIsAvatarTalking: () => {},
    connectionQuality: ConnectionQuality.UNKNOWN,
    setConnectionQuality: () => {},
    sendAssistantMessage: async () => null,
    isAssistantProcessing: false,
  },
);

const useStreamingAvatarSessionState = () => {
  const [sessionState, setSessionState] = useState(
    StreamingAvatarSessionState.INACTIVE,
  );
  const [stream, setStream] = useState<MediaStream | null>(null);

  return {
    sessionState,
    setSessionState,
    stream,
    setStream,
  };
};

const useStreamingAvatarVoiceChatState = () => {
  const [isMuted, setIsMuted] = useState(true);
  const [isVoiceChatLoading, setIsVoiceChatLoading] = useState(false);
  const [isVoiceChatActive, setIsVoiceChatActive] = useState(false);

  return {
    isMuted,
    setIsMuted,
    isVoiceChatLoading,
    setIsVoiceChatLoading,
    isVoiceChatActive,
    setIsVoiceChatActive,
  };
};

const useStreamingAvatarMessageState = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const currentSenderRef = useRef<MessageSender | null>(null);

  const handleUserTalkingMessage = ({
    detail,
  }: {
    detail: UserTalkingMessageEvent;
  }) => {
    if (currentSenderRef.current === MessageSender.CLIENT) {
      setMessages((prev) => [
        ...prev.slice(0, -1),
        {
          ...prev[prev.length - 1],
          content: [prev[prev.length - 1].content, detail.message].join(""),
        },
      ]);
    } else {
      currentSenderRef.current = MessageSender.CLIENT;
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          sender: MessageSender.CLIENT,
          content: detail.message,
        },
      ]);
    }
  };

  const handleStreamingTalkingMessage = ({
    detail,
  }: {
    detail: StreamingTalkingMessageEvent;
  }) => {
    if (currentSenderRef.current === MessageSender.AVATAR) {
      setMessages((prev) => [
        ...prev.slice(0, -1),
        {
          ...prev[prev.length - 1],
          content: [prev[prev.length - 1].content, detail.message].join(""),
        },
      ]);
    } else {
      currentSenderRef.current = MessageSender.AVATAR;
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          sender: MessageSender.AVATAR,
          content: detail.message,
        },
      ]);
    }
  };

  const handleEndMessage = () => {
    currentSenderRef.current = null;
  };

  return {
    messages,
    clearMessages: () => {
      setMessages([]);
      currentSenderRef.current = null;
    },
    handleUserTalkingMessage,
    handleStreamingTalkingMessage,
    handleEndMessage,
    addUserMessage: (content: string) => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

      setMessages((prev) => [
        ...prev,
        {
          id,
          sender: MessageSender.CLIENT,
          content,
        },
      ]);
      currentSenderRef.current = null;

      return id;
    },
  };
};

const useStreamingAvatarListeningState = () => {
  const [isListening, setIsListening] = useState(false);

  return { isListening, setIsListening };
};

const useStreamingAvatarTalkingState = () => {
  const [isUserTalking, setIsUserTalking] = useState(false);
  const [isAvatarTalking, setIsAvatarTalking] = useState(false);

  return {
    isUserTalking,
    setIsUserTalking,
    isAvatarTalking,
    setIsAvatarTalking,
  };
};

const useStreamingAvatarConnectionQualityState = () => {
  const [connectionQuality, setConnectionQuality] = useState(
    ConnectionQuality.UNKNOWN,
  );

  return { connectionQuality, setConnectionQuality };
};

const useStreamingAvatarAssistantIntegration = ({
  avatarRef,
  sessionState,
  messages,
}: {
  avatarRef: React.MutableRefObject<StreamingAvatar | null>;
  sessionState: StreamingAvatarSessionState;
  messages: Message[];
}) => {
  const [isAssistantProcessing, setIsAssistantProcessing] = useState(false);
  const threadIdRef = useRef<string | null>(null);
  const lastProcessedMessageIdRef = useRef<string | null>(null);
  const messagesRef = useRef<Message[]>(messages);

  React.useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  React.useEffect(() => {
    if (sessionState === StreamingAvatarSessionState.INACTIVE) {
      threadIdRef.current = null;
      lastProcessedMessageIdRef.current = null;
    }
  }, [sessionState]);

  const callAssistant = React.useCallback(
    async (userMessage: string, options?: { messageId?: string }) => {
      const trimmedMessage = userMessage.trim();

      if (!trimmedMessage) {
        return null;
      }

      if (options?.messageId) {
        lastProcessedMessageIdRef.current = options.messageId;
      }

      setIsAssistantProcessing(true);

      try {
        const response = await fetch("/api/openai-assistant", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            message: trimmedMessage,
            threadId: threadIdRef.current,
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();

          throw new Error(
            errorText || "Failed to retrieve response from assistant.",
          );
        }

        const data: {
          response?: string;
          threadId?: string;
        } = await response.json();

        if (data.threadId) {
          threadIdRef.current = data.threadId;
        }

        if (data.response && avatarRef.current) {
          await avatarRef.current.speak({
            text: data.response,
            taskType: TaskType.REPEAT,
            taskMode: TaskMode.ASYNC,
          });
        }

        return data.response ?? null;
      } catch (error) {
        if (options?.messageId) {
          lastProcessedMessageIdRef.current = null;
        }
        console.error("Assistant integration error:", error);
        throw error;
      } finally {
        setIsAssistantProcessing(false);
      }
    },
    [avatarRef],
  );

  const processLatestUserMessage = React.useCallback(async () => {
    const latestUserMessage = [...messagesRef.current]
      .reverse()
      .find((message) => message.sender === MessageSender.CLIENT);

    if (!latestUserMessage) {
      return;
    }

    if (!latestUserMessage.content.trim()) {
      return;
    }

    if (latestUserMessage.id === lastProcessedMessageIdRef.current) {
      return;
    }

    lastProcessedMessageIdRef.current = latestUserMessage.id;

    try {
      await callAssistant(latestUserMessage.content);
    } catch (error) {
      lastProcessedMessageIdRef.current = null;
    }
  }, [callAssistant]);

  // OpenAI integration disabled - using HeyGen built-in voice processing only
  // React.useEffect(() => {
  //   if (sessionState !== StreamingAvatarSessionState.CONNECTED) {
  //     return;
  //   }

  //   const avatar = avatarRef.current;

  //   if (!avatar) {
  //     return;
  //   }

  //   const handleUserEnd = () => {
  //     processLatestUserMessage();
  //   };

  //   avatar.on(StreamingEvents.USER_END_MESSAGE, handleUserEnd);

  //   return () => {
  //     avatar.off(StreamingEvents.USER_END_MESSAGE, handleUserEnd);
  //   };
  // }, [avatarRef, processLatestUserMessage, sessionState]);

  return {
    sendAssistantMessage: callAssistant,
    isAssistantProcessing,
  };
};

export const StreamingAvatarProvider = ({
  children,
  basePath,
}: {
  children: React.ReactNode;
  basePath?: string;
}) => {
  const avatarRef = React.useRef<StreamingAvatar>(null);
  const voiceChatState = useStreamingAvatarVoiceChatState();
  const sessionState = useStreamingAvatarSessionState();
  const messageState = useStreamingAvatarMessageState();
  const listeningState = useStreamingAvatarListeningState();
  const talkingState = useStreamingAvatarTalkingState();
  const connectionQualityState = useStreamingAvatarConnectionQualityState();
  const assistantState = useStreamingAvatarAssistantIntegration({
    avatarRef,
    sessionState: sessionState.sessionState,
    messages: messageState.messages,
  });

  return (
    <StreamingAvatarContext.Provider
      value={{
        avatarRef,
        basePath,
        ...voiceChatState,
        ...sessionState,
        ...messageState,
        ...listeningState,
        ...talkingState,
        ...connectionQualityState,
        ...assistantState,
      }}
    >
      {children}
    </StreamingAvatarContext.Provider>
  );
};

export const useStreamingAvatarContext = () => {
  return React.useContext(StreamingAvatarContext);
};
