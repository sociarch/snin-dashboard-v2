'use client';

import { useEffect } from 'react';

export default function BotpressEmbed() {
  useEffect(() => {
    // Load the Botpress script
    const script = document.createElement('script');
    script.src = 'https://cdn.botpress.cloud/webchat/v2.2/inject.js';
    script.async = true;
    document.body.appendChild(script);

    // Load the custom script
    const customScript = document.createElement('script');
    customScript.src = 'https://files.bpcontent.cloud/2024/10/21/06/20241021062910-6QRSUQCY.js';
    customScript.async = true;
    document.body.appendChild(customScript);

    return () => {
      // Clean up the scripts when the component unmounts
      document.body.removeChild(script);
      document.body.removeChild(customScript);
    };
  }, []);

  return null; // This component doesn't render anything visible
}
