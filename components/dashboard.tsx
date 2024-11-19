"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FloatingDock } from "@/components/ui/floating-dock";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAuth } from "@/contexts/AuthContext";
import * as d3 from "d3";
import { LogOut, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { fetchPollData } from "./fetchPollData";
import { PollDataItem } from "./pollData";
import { BotpressEmbed } from "@/components/BotpressEmbed";

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
    const router = useRouter();
    const { signOut, remainingQuestions, userAttributes, userGroups } = useAuth();
    const botpressListenersAdded = useRef(false);
    const latestUserAttributes = useRef(userAttributes);

    // Add useEffect to keep latestUserAttributes current
    useEffect(() => {
        latestUserAttributes.current = userAttributes;
        if (process.env.NODE_ENV === "development") {
            console.log("Updated latestUserAttributes:", latestUserAttributes.current);
        }
    }, [userAttributes]);

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
            if (dataLoadedRef.current) return;

            try {
                setIsLoading(true);

                if (!userGroups || userGroups.length === 0) {
                    console.log("No user groups available yet, waiting...");
                    return;
                }

                const rawData = await fetchPollData();

                // Filter the data based on user groups
                const filteredData = rawData.filter((poll) => {
                    if (!poll.sponsor_id) return false;

                    const sponsorId = poll.sponsor_id.toLowerCase();
                    return userGroups.some((group) => group && sponsorId.includes(group.toLowerCase()));
                });

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
    }, [userGroups]);

    // Modify the handleRowClick function
    const handleRowClick = (poll: PollDataItem) => {
        if (poll !== selectedPoll) {
            // Clear existing report content
            setReportContent(null);
            setPreloadedReport(null);

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
        console.log("Preloading AI report for poll:", poll.caption);
        const promptIntro = "You are a data scientist and analyst...";
        let questionData = Object.values(poll).join(",");
        let reportInstructions = ". Please write a concise report...";
        let additionalGuidelines = " Follow-up questions should not be...";
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
            console.log("Sending preload AI report request");
            const response = await fetch("https://8ho3c3e0ne.execute-api.ap-southeast-1.amazonaws.com/Prod/instructai", options);
            const data = await response.json();
            console.log("Preloaded AI report generated successfully");
            setPreloadedReport(data.response);
        } catch (err) {
            console.error("Error preloading AI report:", err);
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

        // Function to truncate text
        const truncateText = (text: string, maxLength: number) => {
            if (text.length <= maxLength) return text;
            return text.slice(0, maxLength - 3) + "...";
        };

        // Add labels with truncation
        arcs.append("text")
            .append("textPath")
            .attr("xlink:href", (d, i) => `#label-path-${i}`)
            .attr("startOffset", (d, i) => (i === 0 ? "5%" : "45%"))
            .text((d) => truncateText(d.data.label, 25)) // Adjust 25 to control max length
            .style("text-anchor", (d, i) => (i === 0 ? "start" : "end"))
            .style("font-family", "var(--font-roboto)")
            .style("font-size", "1.1em")
            .style("fill", "black")
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
                    // Clear any existing report content before transitioning
                    setReportContent(null);

                    setIsFadingOut(true);
                    fadeTimeoutRef.current = setTimeout(() => {
                        setShowRightColumnContent(false);
                        setIsFadingOut(false);
                        // Generate report for current selection
                        generateReport();
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

    // Update the generateReport function to handle preloaded reports more reliably
    const generateReport = async () => {
        if (!selectedPoll) {
            showAlert("Please select a question before generating a report", "error");
            return;
        }

        setIsGeneratingReport(true);
        console.log("Requesting AI report generation for poll:", selectedPoll.caption);

        try {
            if (preloadedReport) {
                console.log("Using preloaded report");
                setReportContent(preloadedReport);
                setPreloadedReport(null);
                setShowRightColumnContent(false);
                return;
            }

            let promptIntro = "You are a data scientist and analyst...";
            let questionData = Object.values(selectedPoll).join(",");
            let reportInstructions = ". Please write a concise report...";
            let additionalGuidelines = " Follow-up questions should not be...";
            let fullPrompt = promptIntro + questionData + reportInstructions + additionalGuidelines;

            console.log("Sending AI report request to API");
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

            const response = await fetch("https://8ho3c3e0ne.execute-api.ap-southeast-1.amazonaws.com/Prod/instructai", options);
            const data = await response.json();
            console.log("AI report generation completed successfully");
            setReportContent(data.response);
            setShowRightColumnContent(false);
        } catch (err) {
            console.error("Error generating AI report:", err);
            showAlert("Error generating report", "error");
        } finally {
            setIsGeneratingReport(false);
        }
    };

    const showReportModal = (title: string, content: string) => {
        // Implementation without logging
    };

    const copyReportToClipboard = async () => {
        // Implement clipboard copy logic here without logging
    };

    // Modify the reset search handler
    const handleResetSearch = () => {
        setSearchTerm("");
    };

    // Update the addBotpressEventListeners function to add more logging
    const addBotpressEventListeners = () => {
        if (!window.botpress || botpressListenersAdded.current) return;

        const botpressReady = new Promise<boolean>((resolve) => {
            window.botpress?.on("webchat:ready", () => {
                resolve(true);
            });
        });

        window.botpress.on("webchat:opened", (conversationId?: string) => {
            if (process.env.NODE_ENV === "development") {
                console.log("Webchat opened with conversation ID:", conversationId);
            }

            // Handle the async operations
            void (async () => {
                try {
                    await botpressReady;

                    if (!window.botpress?.updateUser || !window.botpress?.sendEvent) {
                        throw new Error("Botpress methods not available");
                    }

                    if (!latestUserAttributes.current) {
                        throw new Error("User attributes not available");
                    }

                    await window.botpress.updateUser({
                        data: {
                            email: latestUserAttributes.current.email || "",
                            usr: latestUserAttributes.current.email || "",
                            zipnum: latestUserAttributes.current["custom:zipnum"] || "",
                            qs_remain: latestUserAttributes.current["custom:qs_remain"] || "",
                            time_sent: new Date().toISOString(),
                        },
                    });
                } catch (error) {
                    console.error("Error in webchat:opened handler:", error);
                }
            })();
        });

        window.botpress.on("webchat:closed", () => {});
        window.botpress.on("conversation", () => {});
        window.botpress.on("message", () => {});
        window.botpress.on("messageSent", () => {});
        window.botpress.on("error", (error: Error) => {
            console.error(`Botpress Error:`, error);
        });

        botpressListenersAdded.current = true;
    };

    // Update the initialization useEffect
    useEffect(() => {
        let initAttempts = 0;
        const maxAttempts = 10;

        const initBotpress = () => {
            if (window.botpress) {
                addBotpressEventListeners();
                return;
            }

            initAttempts++;
            if (initAttempts < maxAttempts) {
                setTimeout(initBotpress, 1000);
            } else {
                console.warn("Failed to initialize Botpress after maximum attempts");
            }
        };

        initBotpress();

        return () => {
            botpressListenersAdded.current = false;
        };
    }, []);

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
        <div id="dashboard-container" className="flex flex-col h-screen font-serif">
            <header id="dashboard-header" className="flex-none p-4 flex justify-between items-center">
                <div className="flex items-center">
                    <h1 id="dashboard-title" className="text-xl font-semibold">
                        <span className="text-[#ffd700]">Snap</span>
                        <span className="dark:text-white text-black">Input</span>
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
                                                            className={`cursor-pointer transition-colors ${
                                                                selectedPoll?.post_id === poll.post_id
                                                                    ? "bg-gray-100 dark:bg-gray-800"
                                                                    : "hover:bg-gray-50 dark:hover:bg-gray-800"
                                                            }`}
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
            <BotpressEmbed />
        </div>
    );
}
