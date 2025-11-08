"use client";

import React, { Suspense } from "react";
import dynamic from "next/dynamic";

const InteractiveAvatar = dynamic(
  () => import("@/components/InteractiveAvatar"),
  { ssr: false },
);

export default function EmbedPage() {
  return (
    <div className="w-screen h-screen">
      <Suspense fallback={null}>
        <InteractiveAvatar />
      </Suspense>
    </div>
  );
}
