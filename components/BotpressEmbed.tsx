"use client";

import { useEffect } from "react";

export default function BotpressEmbed() {
    useEffect(() => {
        // Load the Botpress script
        const script = document.createElement("script");
        script.src = "https://cdn.botpress.cloud/webchat/v2.2/inject.js";
        script.async = true;

        // Add event listener for script load
        script.onload = () => {
            // Load the custom script
            const customScript = document.createElement("script");
            customScript.src = "https://files.bpcontent.cloud/2024/10/21/06/20241021062910-6QRSUQCY.js";
            customScript.async = true;

            // Add event listeners after custom script is loaded
            // customScript.onload = addEventListeners;

            document.body.appendChild(customScript);
        };

        document.body.appendChild(script);

        return () => {
            // Clean up the scripts when the component unmounts
            const scripts = document.querySelectorAll('script[src^="https://cdn.botpress.cloud"], script[src^="https://files.bpcontent.cloud"]');
            scripts.forEach((script) => script.remove());
        };
    }, []);

    return null; // This component doesn't render anything visible
}
