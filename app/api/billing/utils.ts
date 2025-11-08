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
    data = text ? JSON.parse(text) : {};
  } catch {
    data = { raw: text };
  }

  return NextResponse.json(data, { status: res.status });
}
