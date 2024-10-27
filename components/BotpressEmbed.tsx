"use client";

import { useEffect } from "react";

export default function BotpressEmbed() {
    useEffect(() => {
        // Load the Botpress script
        const script = document.createElement("script");
        script.src = "https://cdn.botpress.cloud/webchat/v2.2/inject.js";
        script.async = true;

        // Function to add event listeners
        const addEventListeners = () => {
            if (window.botpress) {
                window.botpress.on("*", (event) => {
                    console.log(`Event: ${event.type}`);
                });

                window.botpress.on("webchat:ready", (conversationId) => {
                    console.log("Webchat Ready");
                });

                window.botpress.on("webchat:opened", (conversationId) => {
                    console.log("Webchat Opened");
                });

                window.botpress.on("webchat:closed", (conversationId) => {
                    console.log(`Webchat Closed`);
                });

                window.botpress.on("conversation", (conversationId) => {
                    console.log(`Conversation: ${conversationId}`);
                });

                window.botpress.on("message", (message) => {
                    console.log(`Message Received: ${message.id}`);
                });

                window.botpress.on("messageSent", (message) => {
                    console.log(`Message Sent: ${message}`);
                });

                window.botpress.on("error", (error) => {
                    console.log(`Error: ${error}`);
                });

                window.botpress.on("webchatVisibility", (visibility) => {
                    console.log(`Visibility: ${visibility}`);
                });

                window.botpress.on("webchatConfig", (visibility) => {
                    console.log("Webchat Config");
                });

                window.botpress.on("customEvent", (anyEvent) => {
                    console.log("Received a custom event");
                });
            } else {
                console.error("Botpress is not available");
            }
        };

        // Add event listener for script load
        script.onload = () => {
            // Load the custom script
            const customScript = document.createElement("script");
            customScript.src = "https://files.bpcontent.cloud/2024/10/21/06/20241021062910-6QRSUQCY.js";
            customScript.async = true;

            // Add event listeners after custom script is loaded
            customScript.onload = addEventListeners;

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
