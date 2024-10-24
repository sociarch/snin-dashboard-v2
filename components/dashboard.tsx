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
    const chartRef = useRef<HTMLDivElement | null>(null);

    // Handler for when a table row is clicked
    const handleRowClick = (poll: PollDataItem) => {
        setSelectedPoll(poll);
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

    // Function to create the D3 chart
    const createChart = (poll: PollDataItem) => {
        if (!chartRef.current) return;

        const chartContainer = chartRef.current;
        d3.select(chartContainer).selectAll("*").remove(); // Clear existing chart

        // Set up chart dimensions
        const width = chartContainer.clientWidth;
        const height = chartContainer.clientHeight;
        const radius = (Math.min(width, height) / 2) * 0.8; // Increased radius slightly

        // Create a container for all elements
        const container = d3.select(chartContainer)
            .append("div")
            .style("position", "relative")
            .style("width", "100%")
            .style("height", "100%");

        // Create SVG element for the pie chart
        const svg = container.append("svg")
            .attr("width", width)
            .attr("height", height - 60) // Reduced height to make room for text below
            .style("position", "absolute")
            .style("top", "0")
            .append("g")
            .attr("transform", `translate(${width / 2},${(height - 60) / 2})`);

        // Define arc generators for the pie chart
        const arc = d3
            .arc<d3.PieArcDatum<any>>()
            .innerRadius(radius * 0.6)
            .outerRadius(radius);

        const labelArc = d3
            .arc<d3.PieArcDatum<any>>()
            .innerRadius(radius * 0.85)
            .outerRadius(radius * 0.85);

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
        arcs.append('path')
            .attr('class', 'label-path')
            .attr('id', (d, i) => `label-path-${i}`)
            .attr('d', labelArc)
            .style('fill', 'none')
            .style('stroke', 'none');

        // Add labels
        arcs.append('text')
            .append('textPath')
            .attr('xlink:href', (d, i) => `#label-path-${i}`)
            .attr('startOffset', (d, i) => (i === 0 ? '3%' : '47%'))
            .text((d) => `${d.data.label}`)
            .style('text-anchor', (d, i) => (i === 0 ? 'start' : 'end'))
            .style('font-family', "'Roboto', sans-serif")
            .style('font-size', '0.875em') // Changed from 14px to 0.875em
            .style('fill', 'white')
            .attr('dy', '0.35em')
            .style('opacity', 0)
            .transition()
            .delay(1000)
            .duration(500)
            .style('opacity', 1);

        // Create a container for the bottom text elements
        const bottomTextContainer = container.append("div")
            .style("position", "absolute")
            .style("bottom", "0")
            .style("left", "0")
            .style("width", "100%")
            .style("height", "60px")
            .style("display", "flex")
            .style("justify-content", "space-between")
            .style("align-items", "center")
            .style("padding", "0 10px");

        // Add snapinput.com text
        bottomTextContainer.append("div")
            .style("color", "white")
            .style("font-family", "'Roboto', sans-serif")
            .style("font-size", "0.75em") // Changed from 12px to 0.75em
            .text("snapinput.com");

        // Add subtitle with the preferred option
        bottomTextContainer.append("div")
            .style("color", "white")
            .style("font-family", "'Libre Baskerville', serif")
            .style("font-size", "1em") // Changed from 16px to 1em
            .style("text-align", "center")
            .style("opacity", "0")
            .text("Most people prefer " + (data[0].value > data[1].value ? data[0].label : data[1].label))
            .transition()
            .delay(1500)
            .duration(500)
            .style("opacity", "1");

        // Add p-value
        bottomTextContainer.append("div")
            .style("color", "white")
            .style("font-family", "'Roboto', sans-serif")
            .style("font-size", "0.75em") // Changed from 12px to 0.75em
            .text(`p < ${calculatePValue(data).toFixed(2)} (n=${total})`);
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

    // Effect to create/update chart when selectedPoll changes
    useEffect(() => {
        if (selectedPoll) {
            createChart(selectedPoll);
        }
    }, [selectedPoll]);

    // Handler for button clicks (placeholder for future functionality)
    const handleButtonClick = (buttonId: string) => {
        console.log(`Button ${buttonId} clicked`);
        // Placeholder for future functionality
    };

    return (
        <div className="flex flex-col h-screen">
            {/* Header */}
            <div className="flex-none p-4 flex justify-between items-center">
                <h1 className="text-2xl font-bold">Snapinput</h1>
                <ThemeToggle />
            </div>
            {/* Main content */}
            <div className="flex-grow overflow-hidden p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-full">
                    {/* Chart card */}
                    <Card className="flex flex-col bg-black text-white">
                        <CardHeader className="pb-0">
                            <CardTitle className="text-2xl font-bold text-center font-serif">
                                {selectedPoll ? selectedPoll.caption : "Click a row to see detailed results"}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="flex-grow h-full pt-0">
                            <div ref={chartRef} className="w-full h-full"></div>
                        </CardContent>
                    </Card>

                    {/* Data table card */}
                    <Card className="flex flex-col overflow-hidden">
                        <CardHeader>
                            <CardTitle>Micro Surveys</CardTitle>
                            <CardDescription>Click a row to update the chart</CardDescription>
                        </CardHeader>
                        <CardContent className="flex flex-col flex-grow overflow-hidden">
                            <Input placeholder="Search..." value={searchTerm} onChange={handleSearch} className="mb-4" />
                            <div className="overflow-auto flex-grow">
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
            </div>
            {/* Footer with buttons */}
            <div className="flex-none p-4">
                <div className="flex justify-center space-x-4">
                    <Button onClick={() => handleButtonClick("function1")}>Function 1</Button>
                    <Button onClick={() => handleButtonClick("function2")}>Function 2</Button>
                    <Button onClick={() => handleButtonClick("function3")}>Function 3</Button>
                    <Button onClick={() => handleButtonClick("function4")}>Function 4</Button>
                    <Button onClick={() => handleButtonClick("function5")}>Function 5</Button>
                </div>
            </div>
        </div>
    );
}
