"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FloatingDock } from "@/components/ui/floating-dock";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAuth } from "@/contexts/AuthContext";
import * as d3 from "d3";
import { jsPDF } from "jspdf";
import { LogOut, X } from "lucide-react";
import { useRouter } from "next/navigation"; // Add this import at the top
import { useEffect, useRef, useState } from "react";
import { fetchPollData } from "./fetchPollData";
import { PollDataItem } from "./pollData";

// Add this type declaration at the top of your file
declare global {
    interface Window {
        botpress?: {
            on: (event: string, callback: (data: any) => void) => void;
            sendEvent: (event: any) => void;
            updateUser: (data: any) => void;
        };
    }
}

// Add this near the top of your component, with other function declarations
const generateReport = () => {
    console.log("Generating report...");
    // Placeholder for report generation logic
    alert("Report generation started. This is a placeholder.");
};

// Add this near the top of your Dashboard component
const showAlert = (message: string, type: "error" | "success" | "info") => {
    console.log(`${type.toUpperCase()}: ${message}`);
    // You can replace this with a more sophisticated alert system later
};

// Add this function near the top of your component
const calculateFontSize = (text: string) => {
    const wordCount = text.split(" ").length;
    if (wordCount <= 10) return "text-3xl";
    if (wordCount <= 15) return "text-2xl";
    if (wordCount <= 20) return "text-xl";
    return "text-lg";
};

export function Dashboard() {
    const router = useRouter(); // Add this near other hooks
    const { signOut, remainingQuestions, userAttributes, userGroups } = useAuth();
    const botpressListenersAdded = useRef(false);
    const latestUserAttributes = useRef(userAttributes);

    // State variables
    const [selectedPoll, setSelectedPoll] = useState<PollDataItem | null>(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [pollData, setPollData] = useState<PollDataItem[]>([]);
    const chartContainerRef = useRef<HTMLDivElement>(null);
    const [chartDimensions, setChartDimensions] = useState({ width: 0, height: 0 });

    // Add new state to control visibility
    const [showTitle, setShowTitle] = useState(false);
    const [showPercentages, setShowPercentages] = useState(false);
    const [showAnnotation, setShowAnnotation] = useState(false);

    // Add new state to handle loading
    const [isLoading, setIsLoading] = useState(true);
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Add this new state variable
    const [showRightColumnContent, setShowRightColumnContent] = useState(true);
    const [isTransitioning, setIsTransitioning] = useState(false);

    const [reportContent, setReportContent] = useState<string | null>(null);
    const [pdfFileName, setPdfFileName] = useState("");
    const [isGeneratingReport, setIsGeneratingReport] = useState(false); // New state for loading spinner
    const [preloadedReport, setPreloadedReport] = useState<string | null>(null);

    // Add this new state to control the fade effect
    const [isFadingOut, setIsFadingOut] = useState(false);

    // Add this new state near your other state declarations
    const [isChartTransitioning, setIsChartTransitioning] = useState(false);

    // Add these near your other state declarations
    const fadeTimeoutRef = useRef<NodeJS.Timeout>();
    const chartTimeoutRef = useRef<NodeJS.Timeout>();
    const percentagesTimeoutRef = useRef<NodeJS.Timeout>();
    const annotationTimeoutRef = useRef<NodeJS.Timeout>();

    // Create a derived/computed value for filtered data
    const filteredData = pollData.filter(
        (poll) =>
            !searchTerm || // if no search term, include all items
            poll.caption.toLowerCase().includes(searchTerm.toLowerCase()) ||
            poll.option1.toLowerCase().includes(searchTerm.toLowerCase()) ||
            poll.option2.toLowerCase().includes(searchTerm.toLowerCase()) ||
            poll.resp_option1.toString().includes(searchTerm.toLowerCase()) ||
            poll.resp_option2.toString().includes(searchTerm.toLowerCase())
    );

    // Add a ref to track if data is already loaded
    const dataLoadedRef = useRef(false);

    // Modify the useEffect for loading poll data
    useEffect(() => {
        const loadPollData = async () => {
            // Skip if we've already loaded data
            if (dataLoadedRef.current) {
                console.log("Data already loaded, skipping fetch");
                return;
            }

            try {
                setIsLoading(true);
                console.log("Starting to fetch poll data");
                console.log("Current user groups:", userGroups);

                if (!userGroups || userGroups.length === 0) {
                    console.log("No user groups available yet, waiting...");
                    return; // Exit early if no user groups
                }

                const rawData = await fetchPollData();
                console.log("Fetched raw data:", rawData);

                // Filter the data based on user groups
                const filteredData = rawData.filter((poll) => {
                    if (!poll.sponsor_id) {
                        console.log("Skipping poll with no sponsor_id:", poll);
                        return false;
                    }

                    const sponsorId = poll.sponsor_id.toLowerCase();
                    const hasMatchingGroup = userGroups.some((group) => {
                        const matches = group && sponsorId.includes(group.toLowerCase());
                        console.log(`Checking ${sponsorId} against ${group}: ${matches}`);
                        return matches;
                    });

                    return hasMatchingGroup;
                });

                console.log("Filtered data:", filteredData);

                if (filteredData.length === 0) {
                    console.warn("No polls match user groups after filtering");
                }

                setPollData(filteredData);
                dataLoadedRef.current = true;
            } catch (error) {
                console.error("Error in loadPollData:", error);
            } finally {
                setIsLoading(false);
            }
        };

        loadPollData();
    }, [userGroups]); // Only depend on userGroups

    // Modify the handleRowClick function
    const handleRowClick = (poll: PollDataItem) => {
        if (poll !== selectedPoll) {
            // First, hide everything
            setIsChartTransitioning(true);
            setShowTitle(false);
            setShowPercentages(false);
            setShowAnnotation(false);

            // Wait for fade out to complete
            setTimeout(() => {
                // Update the poll and preload report while everything is hidden
                setSelectedPoll(poll);
                setShowRightColumnContent(true);
                preloadReport(poll);

                // Small delay to ensure DOM updates
                setTimeout(() => {
                    // End chart transition
                    setIsChartTransitioning(false);

                    // Start the fade-in sequence after chart is ready
                    setTimeout(() => {
                        setShowTitle(true);
                        setTimeout(() => setShowPercentages(true), 150);
                        setTimeout(() => setShowAnnotation(true), 300);
                    }, 100);
                }, 50);
            }, 300);
        }
    };

    // Function to preload the report
    const preloadReport = async (poll: PollDataItem) => {
        const promptIntro = "You are a data scientist and analyst..."; // Your existing prompt intro
        let questionData = Object.values(poll).join(",");
        let reportInstructions = ". Please write a concise report..."; // Your existing instructions
        let additionalGuidelines = " Follow-up questions should not be..."; // Your existing guidelines
        let fullPrompt = promptIntro + questionData + reportInstructions + additionalGuidelines;

        const options = {
            method: "POST",
            headers: {
                accept: "application/json",
                "content-type": "application/json",
                Authorization: "Bearer 8d95a9a2f429b79f8c2464de290193b505d5b551b38c87294c45ffa3c5d50099",
            },
            body: JSON.stringify({
                model: "meta-llama/Meta-Llama-3.1-405B-Instruct-Turbo",
                max_tokens: 2048,
                messages: [{ role: "system", content: fullPrompt }],
                temperature: 0.44,
                repetition_penalty: 1.1,
                top_p: 0.7,
                top_k: 50,
            }),
        };

        try {
            const response = await fetch("https://8ho3c3e0ne.execute-api.ap-southeast-1.amazonaws.com/Prod/instructai", options);
            const data = await response.json();
            setPreloadedReport(data.response);
        } catch (err) {
            console.error("Error preloading report:", err);
        }
    };

    // Modify the search handler to only update searchTerm
    const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(event.target.value.toLowerCase());
    };

    // Function to update chart dimensions
    const updateChartDimensions = () => {
        if (chartContainerRef.current) {
            const width = chartContainerRef.current.clientWidth;
            const height = Math.min(width / 2, 500); // Maintain proportion, but limit the height
            setChartDimensions({ width, height });
        }
    };

    // Effect to handle window resize and initial dimension calculation
    useEffect(() => {
        updateChartDimensions();
        window.addEventListener("resize", updateChartDimensions);
        return () => window.removeEventListener("resize", updateChartDimensions);
    }, []);

    // Function to create the D3 chart
    const createChart = (poll: PollDataItem) => {
        if (!chartContainerRef.current) return;

        const containerWidth = chartContainerRef.current.clientWidth;
        const svgWidth = containerWidth * 0.95; // 95% of the container width
        const svgHeight = svgWidth / 2; // Half the width for a semi-circle

        // Clear existing chart
        d3.select(chartContainerRef.current).selectAll("*").remove();

        const svg = d3
            .select(chartContainerRef.current)
            .append("svg")
            .attr("width", svgWidth)
            .attr("height", svgHeight)
            .style("display", "block")
            .style("margin", "auto") // Center the SVG horizontally
            .append("g")
            .attr("transform", `translate(${svgWidth / 2}, ${svgHeight})`);

        // Define arc generators
        const arc = d3
            .arc<d3.PieArcDatum<any>>()
            .innerRadius(svgHeight * 0.6)
            .outerRadius(svgHeight);

        const labelArc = d3
            .arc<d3.PieArcDatum<any>>()
            .innerRadius(svgHeight * 0.85)
            .outerRadius(svgHeight * 0.85);

        // Define pie layout
        const pie = d3
            .pie<any>()
            .sort(null)
            .value((d) => d.value)
            .startAngle(-Math.PI / 2)
            .endAngle(Math.PI / 2);

        // Prepare data for the pie chart
        const data = [
            { label: poll.option1, value: parseInt(poll.resp_option1), color: "#ffd700" },
            { label: poll.option2, value: parseInt(poll.resp_option2), color: "#FA8072" },
        ];

        const total = data.reduce((acc, d) => acc + d.value, 0);

        // Create arc groups and paths
        const arcs = svg.selectAll(".arc").data(pie(data)).enter().append("g").attr("class", "arc");

        arcs.append("path")
            .attr("d", arc)
            .style("fill", (d) => d.data.color)
            .transition()
            .duration(1000)
            .attrTween("d", function (d) {
                const interpolate = d3.interpolate({ startAngle: -Math.PI / 2, endAngle: -Math.PI / 2 }, d as d3.PieArcDatum<any>);
                return (t: number) => arc(interpolate(t)) || "";
            });

        // Add label paths
        arcs.append("path")
            .attr("class", "label-path")
            .attr("id", (d, i) => `label-path-${i}`)
            .attr("d", labelArc)
            .style("fill", "none")
            .style("stroke", "none");

        // Add labels
        arcs.append("text")
            .append("textPath")
            .attr("xlink:href", (d, i) => `#label-path-${i}`)
            .attr("startOffset", (d, i) => (i === 0 ? "3%" : "47%"))
            .text((d) => `${d.data.label}`)
            .style("text-anchor", (d, i) => (i === 0 ? "start" : "end"))
            .style("font-family", "'Roboto', sans-serif")
            .style("font-size", "1.1em") // Increased from 0.875em to 1.1em
            .style("fill", "black") // Changed from white to black
            .attr("dy", "0.35em")
            .style("opacity", 0)
            .transition()
            .delay(1000)
            .duration(500)
            .style("opacity", 1);
    };

    // Function to calculate p-value (simplified approximation)
    const calculatePValue = (data: { value: number }[]) => {
        const n = data.reduce((acc, d) => acc + d.value, 0);
        const p1 = data[0].value / n;
        const p2 = data[1].value / n;
        const p = (data[0].value + data[1].value) / (2 * n);

        const z = (p1 - p2) / Math.sqrt(p * (1 - p) * (1 / n + 1 / n));
        const pValue = Math.exp(-0.717 * z - 0.416 * z * z);

        return pValue;
    };

    // Update the chart effect
    useEffect(() => {
        if (selectedPoll && chartDimensions.width > 0 && !isChartTransitioning) {
            createChart(selectedPoll);

            // Store timeouts in refs
            chartTimeoutRef.current = setTimeout(() => {
                setShowTitle(true);
                percentagesTimeoutRef.current = setTimeout(() => setShowPercentages(true), 300);
                annotationTimeoutRef.current = setTimeout(() => setShowAnnotation(true), 600);
            }, 50);
        }

        // Cleanup function
        return () => {
            chartTimeoutRef.current && clearTimeout(chartTimeoutRef.current);
            percentagesTimeoutRef.current && clearTimeout(percentagesTimeoutRef.current);
            annotationTimeoutRef.current && clearTimeout(annotationTimeoutRef.current);
        };
    }, [selectedPoll, chartDimensions, isChartTransitioning]);

    // Clean up the timeout on component unmount
    useEffect(() => {
        const currentTimeout = timeoutRef.current;
        return () => {
            if (currentTimeout) {
                clearTimeout(currentTimeout);
            }
        };
    }, []);

    // Update the button click handler
    const handleButtonClick = (buttonId: string) => {
        if (buttonId === "function1") {
            if (showRightColumnContent) {
                if (selectedPoll) {
                    setIsFadingOut(true);
                    fadeTimeoutRef.current = setTimeout(() => {
                        setShowRightColumnContent(false);
                        setIsFadingOut(false);
                    }, 300);
                } else {
                    showAlert("Please select a question before viewing the report", "error");
                }
            } else {
                setShowRightColumnContent(true);
            }
        } else {
            console.log(`Button ${buttonId} clicked`);
        }
    };

    const generateReport = async () => {
        if (!selectedPoll) {
            showAlert("Please select a question before generating a report", "error");
            return;
        }

        setIsGeneratingReport(true);

        if (preloadedReport) {
            setReportContent(preloadedReport);
            setShowRightColumnContent(false);
            setIsGeneratingReport(false);
        } else {
            let promptIntro =
                "You are a data scientist and analyst. You are analyzing data from a question asked to the general public. The question is in a 'Yes/No' or 'Either/Or' format only and is sponsored by a company. You are provided with a dataset containing the following fields: create_date,post_id,is_user_generated,is_sponsored,sponsor_id,caption,option1,option2,total_responses,resp_option1,pct_option1,resp_option2,pct_option2,count_like,count_comment,count_bookmark,count_skip. Question response data corresponding to the above fields: ";

            let questionData = Object.values(selectedPoll).join(",");

            let reportInstructions =
                ". Please write a concise report in order of: 1. Analyze the data and numbers: Identify key trends and insights related to the sponsor's specific question. 2. Summary and Insight: Clearly summarize the results of the question. Highlight any statistically significant findings. 3. Suggest potential next steps: Formulate 2-3 follow-up questions in the 'Either/Or' format that could help the sponsor gather more specific information based on these initial results.";

            let additionalGuidelines =
                " Follow-up questions should not be open-ended. These questions should directly build upon the insights gained. Also, potential next steps could include, for example, 'Consider a new marketing campaign targeting X demographic. Include only if it is appropriate'. IMPORTANT: Ensure the data comes from the provided data above. Please NEVER include statements about the quality of the question and its engagement with (likes, comments, bookmarks, and skips). Please avoid commenting on the question's limited engagement or low response rate if possible.";

            let fullPrompt = promptIntro + questionData + reportInstructions + additionalGuidelines;

            console.log("Prompt for AI:", fullPrompt);

            const fileName = `SnapInput Report: ${selectedPoll.option1} vs ${selectedPoll.option2} (${selectedPoll.post_id})`;
            setPdfFileName(`SnapInput_report_${selectedPoll.option1}_${selectedPoll.option2}_${selectedPoll.post_id}.pdf`);

            const options = {
                method: "POST",
                headers: {
                    accept: "application/json",
                    "content-type": "application/json",
                    Authorization: "Bearer 8d95a9a2f429b79f8c2464de290193b505d5b551b38c87294c45ffa3c5d50099",
                },
                body: JSON.stringify({
                    model: "meta-llama/Meta-Llama-3.1-405B-Instruct-Turbo",
                    max_tokens: 2048,
                    messages: [
                        {
                            role: "system",
                            content: fullPrompt,
                        },
                    ],
                    temperature: 0.44,
                    repetition_penalty: 1.1,
                    top_p: 0.7,
                    top_k: 50,
                }),
            };

            try {
                const response = await fetch("https://8ho3c3e0ne.execute-api.ap-southeast-1.amazonaws.com/Prod/instructai", options);
                const data = await response.json();
                const responseContent = data.response;
                setReportContent(responseContent);

                // Switch to the report view
                setShowRightColumnContent(false);
            } catch (err) {
                console.error(err);
                showAlert("Error generating report", "error");
            } finally {
                setIsGeneratingReport(false);
            }
        }
    };

    const formatText = (text: string) => {
        const lines = text.split("\n");
        let formattedLines = [];

        for (let line of lines) {
            if (line.startsWith("**") && line.endsWith("**")) {
                formattedLines.push({
                    text: line.slice(2, -2),
                    isBold: true,
                    isBullet: false,
                });
            } else if (line.startsWith("* ")) {
                formattedLines.push({
                    text: line.slice(2),
                    isBold: false,
                    isBullet: true,
                });
            } else {
                formattedLines.push({
                    text: line.replace(/\*/g, ""),
                    isBold: false,
                    isBullet: false,
                });
            }
        }

        return formattedLines;
    };

    const buildPDF = (text: string) => {
        const pdf = new jsPDF("p", "mm", "a4");
        const editedText =
            text +
            "\n\n\n----------\nThis report was created by an artificial intelligence language model. While we strive for accuracy and quality, please note that the information and calculations provided may not be entirely error-free or up-to-date. We recommend independently verifying the content and consulting with professionals for specific advice or information. We do not assume any responsibility or liability for the use or interpretation of this content.\n\n- SnapInput";
        pdf.setFont("Courier");
        pdf.setFontSize(11);
        pdf.setTextColor("#000000");

        const formattedLines = formatText(editedText);
        const pageHeight = 247;
        let y = 25;

        for (let line of formattedLines) {
            if (line.isBold) {
                pdf.setFont("Courier", "bold");
                pdf.setFontSize(13);
            } else {
                pdf.setFont("Courier", "normal");
                pdf.setFontSize(11);
            }

            let splitLine = pdf.splitTextToSize(line.text, 180);

            for (let part of splitLine) {
                if (y > pageHeight) {
                    y = 15;
                    pdf.addPage();
                }

                if (line.isBullet) {
                    pdf.circle(12, y - 2, 0.5, "F");
                    pdf.text(part, 15, y);
                } else {
                    pdf.text(part, line.isBullet ? 15 : 10, y);
                }

                y += 7;
            }

            if (line.isBold) {
                y += 3;
            }
        }

        return pdf.output("dataurlstring");
    };

    const showReportModal = (title: string, content: string) => {
        console.log("Showing report modal:", title, content);
    };

    const copyReportToClipboard = async () => {
        // Implement clipboard copy logic here
        console.log("Copying report to clipboard:", reportContent);
    };

    const downloadReportPDF = async () => {
        if (!reportContent) return; // Add null check
        const doc = buildPDF(reportContent);
        const link = document.createElement("a");
        link.href = doc;
        link.download = pdfFileName;
        link.click();
    };

    // Modify the reset search handler
    const handleResetSearch = () => {
        setSearchTerm("");
    };

    const addBotpressEventListeners = () => {
        if (window.botpress && !botpressListenersAdded.current) {
            window.botpress.on("*", (event) => {
                console.log(`Event: ${event.type}`);
            });

            window.botpress.on("webchat:ready", (conversationId) => {
                console.log("Webchat Ready");
                console.log("User Attributes:", latestUserAttributes.current);
            });

            window.botpress.on("webchat:opened", (conversationId) => {
                console.log("Webchat Opened");
                console.log("User Attributes:", latestUserAttributes.current);

                // Add a delay and check if the webchat is ready before sending the event
                setTimeout(() => {
                    if (window.botpress && typeof window.botpress.sendEvent === "function" && latestUserAttributes.current) {
                        try {
                            // Update Botpress user data
                            window.botpress.updateUser({
                                data: {
                                    firstName: "John",
                                    lastName: "Doe",
                                    email: latestUserAttributes.current.email,
                                },
                            });
                            window.botpress.sendEvent({
                                type: "trigger",
                                payload: {
                                    usr: latestUserAttributes.current.email,
                                    zipnum: latestUserAttributes.current["custom:zipnum"],
                                    qs_remain: latestUserAttributes.current["custom:qs_remain"],
                                    time_sent: new Date().toISOString(),
                                },
                            });
                        } catch (error) {
                            console.error("Error sending event to Botpress:", error);
                        }
                    } else {
                        console.warn("Botpress sendEvent function not available");
                    }
                }, 1000); // Wait for 1 second before sending the event
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

            botpressListenersAdded.current = true;
        }
    };

    useEffect(() => {
        const initBotpress = () => {
            if (window.botpress) {
                addBotpressEventListeners();
            } else {
                setTimeout(initBotpress, 1000);
            }
        };

        initBotpress();

        return () => {
            // Cleanup function to remove listeners when component unmounts
            if (window.botpress && botpressListenersAdded.current) {
                // Note: Botpress might not have an 'off' method, so we'll need to handle this differently
                botpressListenersAdded.current = false;
            }
        };
    }, []); // Empty dependency array

    useEffect(() => {
        // Log user groups whenever they change
        console.log("User groups in Dashboard:", userGroups);
    }, [userGroups]);

    // Update the signOut handler
    const handleSignOut = async () => {
        try {
            await signOut(); // Call the existing signOut from AuthContext
            router.push("/login"); // Use the Next.js 15 router to redirect
            router.refresh(); // Ensure the router cache is cleared
        } catch (error) {
            console.error("Error signing out:", error);
        }
    };

    // Add cleanup for fade timeout
    useEffect(() => {
        return () => {
            fadeTimeoutRef.current && clearTimeout(fadeTimeoutRef.current);
        };
    }, []);

    return (
        <div id="dashboard-container" className="flex flex-col h-screen">
            <header id="dashboard-header" className="flex-none p-4 flex justify-between items-center">
                <div className="flex items-center">
                    <h1 id="dashboard-title" className="text-xl font-semibold">
                        <span className="text-[#ffd700]">Snap</span>
                        <span className="text-white">Input</span>
                    </h1>
                </div>
                <div id="header-controls" className="flex items-center space-x-4">
                    <Button id="sign-out-button" onClick={handleSignOut} variant="ghost" size="icon" title="Sign Out">
                        <LogOut className="h-[1.2rem] w-[1.2rem]" />
                    </Button>
                </div>
            </header>
            <main id="dashboard-main" className="flex-grow overflow-hidden p-4 flex flex-col">
                <div id="dashboard-grid" className="grid grid-cols-1 lg:grid-cols-[minmax(auto,600px)_1fr] gap-4 flex-grow">
                    <Card id="chart-card" className="flex flex-col bg-black text-white w-full max-w-[600px] mx-auto">
                        <CardContent
                            id="chart-content"
                            className={`flex-grow flex flex-col h-full transition-opacity duration-300 ${isChartTransitioning ? "opacity-0" : "opacity-100"}`}
                        >
                            <div
                                id="chart-title-container"
                                className={`flex-1 flex items-center justify-center transition-opacity duration-500 ${showTitle ? "opacity-100" : "opacity-0"}`}
                            >
                                <h2 id="chart-title" className={`font-bold text-center px-4 ${calculateFontSize(selectedPoll ? selectedPoll.caption : "")}`}>
                                    {selectedPoll ? selectedPoll.caption : "Click a row to see detailed results"}
                                </h2>
                            </div>
                            <div id="chart-container" ref={chartContainerRef} className="flex-1 flex justify-center items-center">
                                {/* SVG will be inserted here */}
                            </div>
                            <div
                                id="chart-percentages"
                                className={`flex justify-center items-center transition-opacity duration-500 ${showPercentages ? "opacity-100" : "opacity-0"}`}
                            >
                                <table id="percentages-table" className="w-[95%] mx-auto">
                                    <tbody>
                                        <tr className="w-full">
                                            <td
                                                id="option1-percentage"
                                                className="w-1/2 text-left font-['Roboto'] text-[2em] font-bold"
                                                style={{ color: "#ffd700" }}
                                            >
                                                {selectedPoll ? `${(parseFloat(selectedPoll.pct_option1) * 100).toFixed(0)}%` : ""}
                                            </td>
                                            <td
                                                id="option2-percentage"
                                                className="w-1/2 text-right font-['Roboto'] text-[2em] font-bold"
                                                style={{ color: "#FA8072" }}
                                            >
                                                {selectedPoll ? `${(parseFloat(selectedPoll.pct_option2) * 100).toFixed(0)}%` : ""}
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                            <div
                                id="chart-annotation"
                                className={`flex justify-center items-center py-4 transition-opacity duration-500 ${
                                    showAnnotation ? "opacity-100" : "opacity-0"
                                }`}
                            >
                                <span id="chart-footer-center" className="text-[1.5em] text-center">
                                    Most people prefer{" "}
                                    {selectedPoll &&
                                        (parseInt(selectedPoll.resp_option1) > parseInt(selectedPoll.resp_option2)
                                            ? selectedPoll.option1
                                            : selectedPoll.option2)}
                                </span>
                            </div>
                            <div id="chart-footer" className="flex-1 flex justify-between items-end px-2">
                                <span id="chart-footer-left" className="text-xs">
                                    snapinput.com
                                </span>
                                <span id="chart-footer-right" className="text-xs">
                                    {selectedPoll &&
                                        `p < ${calculatePValue([
                                            { value: parseInt(selectedPoll.resp_option1) },
                                            { value: parseInt(selectedPoll.resp_option2) },
                                        ]).toFixed(2)} (n=${parseInt(selectedPoll.resp_option1) + parseInt(selectedPoll.resp_option2)})`}
                                </span>
                            </div>
                        </CardContent>
                    </Card>

                    <Card id="data-table-card" className="flex flex-col">
                        <CardHeader
                            className={`transition-opacity duration-300 ${showRightColumnContent && !isLoading ? "opacity-100" : "opacity-0"} ${
                                showRightColumnContent && !isLoading ? "" : "hidden"
                            }`}
                        >
                            <CardTitle id="data-table-title">Your Micro Surveys</CardTitle>
                        </CardHeader>
                        <CardContent id="data-table-content" className="flex-grow overflow-hidden relative">
                            {isLoading ? (
                                <div id="loading-spinner" className="flex items-center justify-center h-full">
                                    <div className="spinner"></div>
                                </div>
                            ) : (
                                <div
                                    id="data-table-container"
                                    className={`absolute inset-0 flex flex-col transition-opacity duration-300 ${
                                        showRightColumnContent && !isFadingOut ? "opacity-100" : "opacity-0 pointer-events-none"
                                    }`}
                                >
                                    <div id="data-table-inner" className="p-4 flex flex-col h-full">
                                        <div id="search-container" className="flex mb-4">
                                            <Input id="search-input" placeholder="Search..." value={searchTerm} onChange={handleSearch} className="flex-grow" />
                                            <Button id="reset-search-button" onClick={handleResetSearch} className="ml-2" variant="outline" size="icon">
                                                <X className="h-4 w-4" />
                                            </Button>
                                        </div>
                                        <div id="table-container" className="overflow-auto flex-grow">
                                            <Table>
                                                <TableHeader>
                                                    <TableRow>
                                                        <TableHead>Question</TableHead>
                                                        <TableHead>Option 1</TableHead>
                                                        <TableHead>Option 2</TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {filteredData.map((poll) => (
                                                        <TableRow
                                                            key={poll.post_id}
                                                            onClick={() => handleRowClick(poll)}
                                                            className="cursor-pointer transition-colors hover:bg-gray-100 dark:hover:bg-gray-800"
                                                        >
                                                            <TableCell>{poll.caption}</TableCell>
                                                            <TableCell>
                                                                {poll.option1} ({poll.resp_option1})
                                                            </TableCell>
                                                            <TableCell>
                                                                {poll.option2} ({poll.resp_option2})
                                                            </TableCell>
                                                        </TableRow>
                                                    ))}
                                                </TableBody>
                                            </Table>
                                        </div>
                                    </div>
                                </div>
                            )}
                            <div
                                id="report-container"
                                className={`absolute inset-0 flex flex-col transition-opacity duration-300 ${
                                    !showRightColumnContent ? "opacity-100" : "opacity-0 pointer-events-none"
                                }`}
                            >
                                {isGeneratingReport ? (
                                    <div id="report-loading" className="flex items-center justify-center h-full">
                                        <div className="loader">Loading...</div>
                                    </div>
                                ) : reportContent || preloadedReport ? (
                                    <div id="report-content" className="p-4 overflow-auto relative">
                                        <button
                                            id="close-report-button"
                                            onClick={() => setShowRightColumnContent(true)}
                                            className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 text-2xl"
                                        >
                                            &times;
                                        </button>
                                        <div id="report-text" className="whitespace-pre-wrap">
                                            {reportContent || preloadedReport}
                                        </div>
                                        <div id="report-disclaimer" className="mt-4 text-sm text-gray-500">
                                            This report was created by an artificial intelligence language model. While we strive for accuracy and quality,
                                            please note that the information and calculations provided may not be entirely error-free or up-to-date. We
                                            recommend independently verifying the content and consulting with professionals for specific advice or information.
                                            We do not assume any responsibility or liability for the use or interpretation of this content.
                                        </div>
                                    </div>
                                ) : (
                                    <div id="generate-report-container" className="flex items-center justify-center h-full">
                                        <Button id="generate-report-button" onClick={generateReport} className="text-2xl font-bold">
                                            Generate Report
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <footer id="dashboard-footer" className="mt-4">
                    <div id="button-container" className="flex justify-center space-x-2 max-w-3xl mx-auto">
                        <Button
                            id="function1-button"
                            onClick={() => handleButtonClick("function1")}
                            disabled={showRightColumnContent && !selectedPoll}
                            className={`flex-1 bg-black hover:bg-gray-800 text-white border-4 border-gray-600 hover:border-[#ffd700] transition-colors duration-200 ${
                                showRightColumnContent && !selectedPoll ? "opacity-50 cursor-not-allowed" : ""
                            }`}
                        >
                            {showRightColumnContent ? "View Report" : "Show Surveys"}
                        </Button>
                        {/* <Button
                            id="function2-button"
                            onClick={() => handleButtonClick("function2")}
                            className="flex-1 bg-black hover:bg-gray-800 text-white border-4 border-gray-600 hover:border-[#FA8072] transition-colors duration-200"
                        >
                            Function 2
                        </Button>
                        <Button
                            id="function3-button"
                            onClick={() => handleButtonClick("function3")}
                            className="flex-1 bg-black hover:bg-gray-800 text-white border-4 border-gray-600 hover:border-[#ffd700] transition-colors duration-200"
                        >
                            Function 3
                        </Button>
                        <Button
                            id="function4-button"
                            onClick={() => handleButtonClick("function4")}
                            className="flex-1 bg-black hover:bg-gray-800 text-white border-4 border-gray-600 hover:border-[#FA8072] transition-colors duration-200"
                        >
                            Function 4
                        </Button> */}
                        <Button
                            id="function5-button"
                            onClick={() => handleButtonClick("function5")}
                            className="flex-1 bg-black hover:bg-gray-800 text-white border-4 border-gray-600 hover:border-[#ffd700] transition-colors duration-200"
                        >
                            {remainingQuestions !== null ? `Questions Left: ${remainingQuestions}` : "Loading..."}
                        </Button>
                    </div>
                </footer>
            </main>
            <FloatingDock />
        </div>
    );
}
