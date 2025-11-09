import { NextResponse } from "next/server";

const BILLING_API_BASE =
  process.env.BILLING_API_BASE ?? "https://adhdtoolsdaily.com/wp-json/adhd/v1";
const BILLING_API_BEARER = process.env.BILLING_API_BEARER;

export async function forwardBillingRequest({
  endpoint,
  payload,
}: {
  endpoint: string;
  payload: Record<string, unknown>;
}) {
  if (!BILLING_API_BEARER) {
    return NextResponse.json(
      { error: "Billing bearer token is not configured." },
      { status: 500 },
    );
  }

  const res = await fetch(`${BILLING_API_BASE}${endpoint}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${BILLING_API_BEARER}`,
    },
    body: JSON.stringify(payload),
    cache: "no-store",
  });

  const text = await res.text();
  let data: any = {};

  try {
    if (text) {
      // Try to parse as JSON
      data = JSON.parse(text);
    } else {
      data = {};
    }
  } catch {
    // If parsing fails, check if it's a boolean string or other value
    const trimmed = text.trim().toLowerCase();
    if (trimmed === "true") {
      data = true;
    } else if (trimmed === "false") {
      data = false;
    } else {
      data = { raw: text };
    }
  }

  // Log for debugging (remove in production if needed)
  console.log(`[Billing API] ${endpoint} - Status: ${res.status}, Response:`, data);

  return NextResponse.json(data, { status: res.status });
}
