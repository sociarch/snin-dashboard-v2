"use client";

import Script from "next/script";
import { useEffect } from "react";

export function BotpressEmbed() {
  return (
    <>
      <Script
        src="https://cdn.botpress.cloud/webchat/v2.2/inject.js"
        strategy="afterInteractive"
      />
      <Script
        src="https://files.bpcontent.cloud/2024/10/21/06/20241021062910-6QRSUQCY.js"
        strategy="afterInteractive"
        onLoad={() => {
          // Optional: Add any initialization code here if needed
          console.log("Botpress webchat loaded");
        }}
      />
    </>
  );
}
