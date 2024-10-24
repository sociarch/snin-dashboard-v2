"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import * as d3 from "d3";
import { pollData, PollDataItem } from "./pollData";
import { ThemeToggle } from "./theme-toggle";

// Add these new imports
import { jsPDF } from "jspdf";
import { showAlert } from "@/lib/utils"; // You'll need to create this utility function

// Add this near the top of your component, with other function declarations
const generateReport = () => {
    console.log("Generating report...");
    // Placeholder for report generation logic
    alert("Report generation started. This is a placeholder.");
};

export function Dashboard() {
    // State variables
    const [selectedPoll, setSelectedPoll] = useState<PollDataItem | null>(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [filteredData, setFilteredData] = useState<PollDataItem[]>(pollData);
    const chartContainerRef = useRef<HTMLDivElement>(null);
    const [chartDimensions, setChartDimensions] = useState({ width: 0, height: 0 });

    // Add new state to control visibility
    const [showTitle, setShowTitle] = useState(false);
    const [showPercentages, setShowPercentages] = useState(false);
    const [showAnnotation, setShowAnnotation] = useState(false);

    // Add new state to handle loading
    const [isLoading, setIsLoading] = useState(false);
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Add this new state variable
    const [showRightColumnContent, setShowRightColumnContent] = useState(true);
    const [isTransitioning, setIsTransitioning] = useState(false);

    const [reportContent, setReportContent] = useState("");
    const [pdfFileName, setPdfFileName] = useState("");

    // Handler for when a table row is clicked
    const handleRowClick = (poll: PollDataItem) => {
        if (poll !== selectedPoll) {
            setIsLoading(true);

            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }

            // Increase the delay before updating the poll
            timeoutRef.current = setTimeout(() => {
                setSelectedPoll(poll);
                // Keep isLoading true to allow for chart creation
            }, 500); // Increased from 300ms to 500ms
        }
    };

    // Handler for search input changes
    const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
        const searchTerm = event.target.value.toLowerCase();
        setSearchTerm(searchTerm);
        // Filter the poll data based on the search term
        const filtered = pollData.filter(
            (poll) =>
                poll.caption.toLowerCase().includes(searchTerm) ||
                poll.option1.toLowerCase().includes(searchTerm) ||
                poll.option2.toLowerCase().includes(searchTerm) ||
                poll.resp_option1.toString().includes(searchTerm) ||
                poll.resp_option2.toString().includes(searchTerm)
        );
        setFilteredData(filtered);
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
                const interpolate = d3.interpolate({ startAngle: -Math.PI / 2, endAngle: -Math.PI / 2 }, d);
                return function (t) {
                    return arc(interpolate(t));
                };
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

    // Effect to create/update chart when selectedPoll or chartDimensions change
    useEffect(() => {
        if (selectedPoll && chartDimensions.width > 0 && isLoading) {
            createChart(selectedPoll);

            // Reset visibility states
            setShowTitle(false);
            setShowPercentages(false);
            setShowAnnotation(false);

            // Delay the start of fade-in effects and set isLoading to false
            setTimeout(() => {
                setIsLoading(false);
                setTimeout(() => setShowTitle(true), 300);
                setTimeout(() => setShowPercentages(true), 600);
                setTimeout(() => setShowAnnotation(true), 900);
            }, 500); // Allow 500ms for chart creation before starting fade-ins
        }
    }, [selectedPoll, chartDimensions, isLoading]);

    // Clean up the timeout on component unmount
    useEffect(() => {
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, []);

    // Handler for button clicks (placeholder for future functionality)
    const handleButtonClick = (buttonId: string) => {
        if (buttonId === "function1") {
            setShowRightColumnContent((prev) => !prev);
        } else {
            console.log(`Button ${buttonId} clicked`);
        }
    };

    const generateReport = async () => {
        if (!selectedPoll) {
            showAlert("Please select a question before generating a report", "error");
            return false;
        }

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

            showReportModal(
                fileName,
                responseContent +
                    "\n\n\n----------\nThis report was created by an artificial intelligence language model. While we strive for accuracy and quality, please note that the information and calculations provided may not be entirely error-free or up-to-date. We recommend independently verifying the content and consulting with professionals for specific advice or information. We do not assume any responsibility or liability for the use or interpretation of this content.\n\n- SnapInput"
            );

            return responseContent;
        } catch (err) {
            console.error(err);
            showAlert("Error generating report", "error");
        }
    };

    const formatText = (text) => {
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

    const buildPDF = (text) => {
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

    const showReportModal = (title, content) => {
        // Implement your modal logic here
        console.log("Showing report modal:", title, content);
    };

    const copyReportToClipboard = async () => {
        // Implement clipboard copy logic here
        console.log("Copying report to clipboard:", reportContent);
    };

    const downloadReportPDF = async () => {
        const doc = buildPDF(reportContent);
        const link = document.createElement("a");
        link.href = doc;
        link.download = pdfFileName;
        link.click();
    };

    return (
        <div id="dashboard-container" className="flex flex-col h-screen">
            <header id="dashboard-header" className="flex-none p-4 flex justify-between items-center">
                <h1 className="text-2xl font-bold">Snapinput</h1>
                <ThemeToggle />
            </header>
            <main id="dashboard-main" className="flex-grow overflow-hidden p-4">
                <div id="dashboard-grid" className="grid grid-cols-1 lg:grid-cols-[minmax(auto,600px)_1fr] gap-4 h-full">
                    <Card id="chart-card" className="flex flex-col bg-black text-white w-full max-w-[600px] mx-auto">
                        <CardContent
                            id="chart-content"
                            className={`flex-grow flex flex-col h-full max-h-[800px] transition-opacity duration-500 ${
                                isLoading ? "opacity-0" : "opacity-100"
                            }`}
                        >
                            <div
                                id="chart-title"
                                className={`flex-1 flex items-center justify-center transition-opacity duration-500 ${showTitle ? "opacity-100" : "opacity-0"}`}
                            >
                                <h2 className="text-3xl font-bold text-center px-4">
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
                                <table className="w-[95%] mx-auto">
                                    <tbody>
                                        <tr className="w-full">
                                            <td className="w-1/2 text-left font-['Roboto'] text-[2em] font-bold" style={{ color: "#ffd700" }}>
                                                {selectedPoll ? `${(parseFloat(selectedPoll.pct_option1) * 100).toFixed(0)}%` : ""}
                                            </td>
                                            <td className="w-1/2 text-right font-['Roboto'] text-[2em] font-bold" style={{ color: "#FA8072" }}>
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

                    <Card id="data-table-card" className="flex flex-col h-full">
                        <CardHeader>
                            <CardTitle>{showRightColumnContent ? "Your Micro Surveys" : "MyFunctionTitle"}</CardTitle>
                        </CardHeader>
                        <CardContent id="data-table-content" className="flex-grow overflow-hidden relative">
                            <div
                                className={`absolute inset-0 flex flex-col transition-opacity duration-300 ${
                                    showRightColumnContent ? "opacity-100" : "opacity-0 pointer-events-none"
                                }`}
                            >
                                <div className="p-4 flex flex-col h-full">
                                    {" "}
                                    {/* Added padding here */}
                                    <Input id="search-input" placeholder="Search..." value={searchTerm} onChange={handleSearch} className="mb-4" />
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
                            <div
                                className={`absolute inset-0 flex items-center justify-center transition-opacity duration-300 ${
                                    !showRightColumnContent ? "opacity-100" : "opacity-0 pointer-events-none"
                                }`}
                            >
                                <Button onClick={generateReport} className="text-2xl font-bold">
                                    Generate Report
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </main>
            <footer id="dashboard-footer" className="flex-none p-4">
                <div id="button-container" className="flex justify-center space-x-4">
                    <Button id="function1-button" onClick={() => handleButtonClick("function1")}>
                        {showRightColumnContent ? "Hide Content" : "Show Content"}
                    </Button>
                    <Button id="function2-button" onClick={() => handleButtonClick("function2")}>
                        Function 2
                    </Button>
                    <Button id="function3-button" onClick={() => handleButtonClick("function3")}>
                        Function 3
                    </Button>
                    <Button id="function4-button" onClick={() => handleButtonClick("function4")}>
                        Function 4
                    </Button>
                    <Button id="function5-button" onClick={() => handleButtonClick("function5")}>
                        Function 5
                    </Button>
                </div>
            </footer>
        </div>
    );
}
