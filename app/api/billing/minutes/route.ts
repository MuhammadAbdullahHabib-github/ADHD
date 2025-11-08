import { NextResponse } from "next/server";

import { forwardBillingRequest } from "../utils";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const token = typeof body?.token === "string" ? body.token : null;
    const extend = typeof body?.extend === "boolean" ? body.extend : false;

    if (!token) {
      return NextResponse.json(
        { error: "Missing token payload." },
        { status: 400 },
      );
    }

    return await forwardBillingRequest({
      endpoint: "/minutes_remaining",
      payload: { token, extend },
    });
  } catch (error) {
    console.error("Billing minutes route error:", error);
    return NextResponse.json(
      { error: "Failed to retrieve remaining minutes." },
      { status: 500 },
    );
  }
}
