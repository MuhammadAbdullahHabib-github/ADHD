import React, { useMemo, useState } from "react";
import {
  AvatarQuality,
  ElevenLabsModel,
  STTProvider,
  VoiceEmotion,
  StartAvatarRequest,
  VoiceChatTransport,
} from "@heygen/streaming-avatar";

import { Input } from "../Input";
import { Select } from "../Select";

import { Field } from "./Field";

import { AVATARS, STT_LANGUAGE_LIST } from "@/app/lib/constants";

interface AvatarConfigProps {
  onConfigChange: (config: StartAvatarRequest) => void;
  config: StartAvatarRequest;
}

export const AvatarConfig: React.FC<AvatarConfigProps> = ({
  onConfigChange,
  config,
}) => {
  const onChange = <T extends keyof StartAvatarRequest>(
    key: T,
    value: StartAvatarRequest[T],
  ) => {
    onConfigChange({ ...config, [key]: value });
  };
  const [showMore, setShowMore] = useState<boolean>(false);

  return (
    <div className="relative flex flex-col gap-4 w-full h-full max-w-2xl mx-auto py-8 overflow-y-auto px-4">
      {/*
      <Field label="Custom Knowledge Base ID">
        <Input
          placeholder="Enter custom knowledge base ID"
          value={config.knowledgeId}
          onChange={(value) => onChange("knowledgeId", value)}
        />
      </Field>
      */}
      <Field label="Avatar">
        <div className="flex gap-2 w-full">
          <button
            className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              config.avatarName === "Ann_Therapist_public"
                ? "text-white"
                : "bg-zinc-700 text-zinc-300 hover:bg-zinc-600"
            }`}
            style={config.avatarName === "Ann_Therapist_public" ? { backgroundColor: '#7559ff' } : {}}
            onClick={() => onChange("avatarName", "Ann_Therapist_public")}
          >
            Ann Therapist (Female)
          </button>
          <button
            className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              config.avatarName === "Graham_Chair_Sitting_public"
                ? "text-white"
                : "bg-zinc-700 text-zinc-300 hover:bg-zinc-600"
            }`}
            style={config.avatarName === "Graham_Chair_Sitting_public" ? { backgroundColor: '#7559ff' } : {}}
            onClick={() => onChange("avatarName", "Graham_Chair_Sitting_public")}
          >
            Graham Therapist (Male)
          </button>
        </div>
      </Field>

      <Field label="Language">
        <Select
          isSelected={(option) => option.value === config.language}
          options={STT_LANGUAGE_LIST}
          renderOption={(option) => option.label}
          value={
            STT_LANGUAGE_LIST.find((option) => option.value === config.language)
              ?.label
          }
          onSelect={(option) => onChange("language", option.value)}
        />
      </Field>
      
       {/*
      <Field label="Avatar Quality">
        <Select
          isSelected={(option) => option === config.quality}
          options={Object.values(AvatarQuality)}
          renderOption={(option) => option}
          value={config.quality}
          onSelect={(option) => onChange("quality", option)}
        />
      </Field>
     
      <Field label="Voice Chat Transport">
        <Select
          isSelected={(option) => option === config.voiceChatTransport}
          options={Object.values(VoiceChatTransport)}
          renderOption={(option) => option}
          value={config.voiceChatTransport}
          onSelect={(option) => onChange("voiceChatTransport", option)}
        />
      </Field>
      */}

      {showMore && (
        <>
          {/* Voice Settings Header 
          <h1 className="text-zinc-100 w-full text-center mt-5">Voice Settings</h1>
          
          <Field label="Custom Voice ID">
            <Input
              placeholder="Enter custom voice ID"
              value={config.voice?.voiceId}
              onChange={(value) =>
                onChange("voice", { ...config.voice, voiceId: value })
              }
            />
          </Field>
          */}
          
          {/* 
          <Field label="ElevenLabs Model">
            <Select
              isSelected={(option) => option === config.voice?.model}
              options={Object.values(ElevenLabsModel)}
              renderOption={(option) => option}
              value={config.voice?.model}
              onSelect={(option) =>
                onChange("voice", { ...config.voice, model: option })
              }
            />
          </Field>
          STT Settings Header 
          <h1 className="text-zinc-100 w-full text-center mt-5">STT Settings</h1>
          
          <Field label="Provider">
            <Select
              isSelected={(option) => option === config.sttSettings?.provider}
              options={Object.values(STTProvider)}
              renderOption={(option) => option}
              value={config.sttSettings?.provider}
              onSelect={(option) =>
                onChange("sttSettings", {
                  ...config.sttSettings,
                  provider: option,
                })
              }
            />
          </Field>
          */}
        </>
      )}
      <button
        className="text-zinc-400 text-sm cursor-pointer w-full text-center bg-transparent"
        onClick={() => setShowMore(!showMore)}
      >
        {/* {showMore ? "Show less" : "Show more..."} */}
      </button>
    </div>
  );
};
