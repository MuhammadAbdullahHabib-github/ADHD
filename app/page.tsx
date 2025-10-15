"use client";

import React, { Suspense } from "react";
import InteractiveAvatar from "@/components/InteractiveAvatar";
export default function App() {
  return (
    <div className="w-screen h-screen">
      <Suspense fallback={null}>
        <InteractiveAvatar />
      </Suspense>
    </div>
  );
}
