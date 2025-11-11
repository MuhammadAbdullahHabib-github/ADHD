import { NextResponse } from "next/server";

import { forwardBillingRequest } from "../utils";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const token = typeof body?.token === "string" ? body.token : null;
    const minutes = typeof body?.minutes === "number" ? body.minutes : null;

    if (!token) {
      return NextResponse.json(
        { error: "Missing token payload." },
        { status: 400 },
      );
    }

    if (minutes === null) {
      return NextResponse.json(
        { error: "Missing minutes payload." },
        { status: 400 },
      );
    }

    return await forwardBillingRequest({
      endpoint: "/set_minutes",
      payload: { token, minutes },
    });
  } catch (error) {
    console.error("Billing set-minutes route error:", error);
    return NextResponse.json(
      { error: "Failed to set minutes." },
      { status: 500 },
    );
  }
}

