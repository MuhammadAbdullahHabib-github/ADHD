"use client";

import React, { Suspense } from "react";
import dynamic from "next/dynamic";

const InteractiveAvatar = dynamic(
  () => import("@/components/InteractiveAvatar"),
  { 
    ssr: false,
    loading: () => (
      <div className="w-screen h-screen flex items-center justify-center bg-[#0f1116] text-white">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p>Loading avatar...</p>
        </div>
      </div>
    ),
  },
);

export default function EmbedPage() {
  return (
    <div className="w-screen h-screen bg-[#0f1116]">
      <Suspense 
        fallback={
          <div className="w-screen h-screen flex items-center justify-center text-white">
            <div className="text-center">
              <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p>Initializing...</p>
            </div>
          </div>
        }
      >
        <InteractiveAvatar />
      </Suspense>
    </div>
  );
}
