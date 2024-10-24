"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import * as d3 from "d3";
import { pollData, PollDataItem } from "./pollData";
import { ThemeToggle } from "./theme-toggle";

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
        console.log(`Button ${buttonId} clicked`);
        // Placeholder for future functionality
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

                    <Card id="data-table-card" className="flex flex-col overflow-hidden">
                        <CardHeader>
                            <CardTitle>Your Micro Surveys</CardTitle>
                        </CardHeader>
                        <CardContent id="data-table-content" className="flex flex-col flex-grow overflow-hidden">
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
                        </CardContent>
                    </Card>
                </div>
            </main>
            <footer id="dashboard-footer" className="flex-none p-4">
                <div id="button-container" className="flex justify-center space-x-4">
                    <Button id="function1-button" onClick={() => handleButtonClick("function1")}>
                        Function 1
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
