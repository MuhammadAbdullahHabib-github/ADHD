import { NextResponse } from "next/server";

import { forwardBillingRequest } from "../utils";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const token = typeof body?.token === "string" ? body.token : null;

    if (!token) {
      return NextResponse.json(
        { error: "Missing token payload." },
        { status: 400 },
      );
    }

    return await forwardBillingRequest({
      endpoint: "/verify_token",
      payload: { token },
    });
  } catch (error) {
    console.error("Billing verify route error:", error);
    return NextResponse.json(
      { error: "Failed to verify token." },
      { status: 500 },
    );
  }
}
