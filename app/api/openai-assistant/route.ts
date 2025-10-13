"use server";

import OpenAI from "openai";
import { NextResponse } from "next/server";

const DEFAULT_ASSISTANT_NAME = "English Tutor Assistant";
const DEFAULT_ASSISTANT_INSTRUCTIONS = `You are an English tutor. Help students improve their language skills by:
- Correcting mistakes in grammar and vocabulary
- Explaining concepts with examples
- Engaging in conversation practice
- Providing learning suggestions

IMPORTANT: Keep all responses SHORT, CONCISE, and COMPLETE. Maximum 2-3 sentences. Be direct and to the point.`;
const DEFAULT_ASSISTANT_MODEL = "gpt-4-turbo-preview";
let cachedAssistantId: string | null = process.env.OPENAI_ASSISTANT_ID ?? null;

export async function POST(request: Request) {
  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json(
      { error: "Missing OPENAI_API_KEY environment variable." },
      { status: 500 },
    );
  }

  try {
    const body = await request.json();
    const message = typeof body?.message === "string" ? body.message : null;
    const existingThreadId =
      typeof body?.threadId === "string" ? body.threadId : null;
    const customInstructions =
      typeof body?.instructions === "string" ? body.instructions : null;

    if (!message) {
      return NextResponse.json(
        { error: "The `message` field is required." },
        { status: 400 },
      );
    }

    const client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    let assistantId = cachedAssistantId;

    if (!assistantId) {
      const assistant = await client.beta.assistants.create({
        name: process.env.OPENAI_ASSISTANT_NAME ?? DEFAULT_ASSISTANT_NAME,
        instructions:
          customInstructions ??
          process.env.OPENAI_ASSISTANT_INSTRUCTIONS ??
          DEFAULT_ASSISTANT_INSTRUCTIONS,
        tools: [],
        model: process.env.OPENAI_ASSISTANT_MODEL ?? DEFAULT_ASSISTANT_MODEL,
      });

      assistantId = assistant.id;
      cachedAssistantId = assistant.id;
    }

    const thread =
      existingThreadId !== null
        ? { id: existingThreadId }
        : await client.beta.threads.create();

    await client.beta.threads.messages.create(thread.id, {
      role: "user",
      content: message,
    });

    const run = await client.beta.threads.runs.createAndPoll(thread.id, {
      assistant_id: assistantId,
    });

    if (run.status !== "completed") {
      return NextResponse.json(
        {
          error: `Assistant run did not complete. Current status: ${run.status}`,
          threadId: thread.id,
          runId: run.id,
        },
        { status: 500 },
      );
    }

    const messages = await client.beta.threads.messages.list(thread.id, {
      order: "desc",
      limit: 5,
    });

    const assistantMessage = messages.data.find(
      (entry) => entry.role === "assistant",
    );

    const responseText =
      assistantMessage?.content.find(
        (part): part is { type: "text"; text: { value: string; annotations: any[] } } =>
          part.type === "text",
      )?.text.value ?? "";

    return NextResponse.json({
      response: responseText,
      threadId: thread.id,
      runId: run.id,
    });
  } catch (error) {
    console.error("OpenAI assistant route error:", error);

    return NextResponse.json(
      { error: "Failed to process assistant request." },
      { status: 500 },
    );
  }
}
