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
    const [selectedPoll, setSelectedPoll] = useState<PollDataItem | null>(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [filteredData, setFilteredData] = useState<PollDataItem[]>(pollData);
    const chartRef = useRef<HTMLDivElement | null>(null);

    const handleRowClick = (poll: PollDataItem) => {
        setSelectedPoll(poll);
    };

    const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
        const searchTerm = event.target.value.toLowerCase();
        setSearchTerm(searchTerm);
        const filtered = pollData.filter((poll) => 
            poll.caption.toLowerCase().includes(searchTerm) ||
            poll.option1.toLowerCase().includes(searchTerm) ||
            poll.option2.toLowerCase().includes(searchTerm) ||
            poll.resp_option1.toString().includes(searchTerm) ||
            poll.resp_option2.toString().includes(searchTerm)
        );
        setFilteredData(filtered);
    };

    const createChart = (poll: PollDataItem) => {
        if (!chartRef.current) return;

        const chartContainer = chartRef.current;
        d3.select(chartContainer).selectAll("*").remove();

        const width = chartContainer.clientWidth;
        const height = Math.min(width / 2, 250);
        const radius = Math.min(width, height * 2) / 2;

        const svg = d3
            .select(chartContainer)
            .append("svg")
            .attr("width", width)
            .attr("height", height)
            .style("background-color", "black")
            .append("g")
            .attr("transform", `translate(${width / 2}, ${height})`);

        const arc = d3
            .arc()
            .innerRadius(radius * 0.6)
            .outerRadius(radius);

        const pie = d3
            .pie()
            .sort(null)
            .value((d) => d.value)
            .startAngle(-Math.PI / 2)
            .endAngle(Math.PI / 2);

        const data = [
            { label: poll.option1, value: parseInt(poll.resp_option1), color: "#ffd700" },
            { label: poll.option2, value: parseInt(poll.resp_option2), color: "#FA8072" },
        ];

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

        const total = data.reduce((acc, d) => acc + d.value, 0);

        // Add percentage labels
        arcs.append("text")
            .attr("transform", (d) => `translate(${arc.centroid(d)})`)
            .attr("dy", ".35em")
            .style("text-anchor", "middle")
            .style("fill", "white")
            .style("font-size", "16px")
            .style("opacity", 0)
            .transition()
            .delay(1000)
            .duration(500)
            .style("opacity", 1)
            .text((d) => `${Math.round((d.data.value / total) * 100)}%`);

        // Add p-value
        const pValue = calculatePValue(data);
        svg.append("text")
            .attr("x", 0)
            .attr("y", height - 10)
            .attr("text-anchor", "middle")
            .style("fill", "white")
            .style("font-size", "12px")
            .text(`p ${pValue > 0.05 ? ">" : "<"} ${pValue.toFixed(2)} (n=${total})`);
    };

    const calculatePValue = (data: { value: number }[]) => {
        const n = data.reduce((acc, d) => acc + d.value, 0);
        const p1 = data[0].value / n;
        const p2 = data[1].value / n;
        const p = (data[0].value + data[1].value) / (2 * n);

        const z = (p1 - p2) / Math.sqrt(p * (1 - p) * (1 / n + 1 / n));
        const pValue = Math.exp(-0.717 * z - 0.416 * z * z);

        return pValue;
    };

    useEffect(() => {
        if (selectedPoll) {
            createChart(selectedPoll);
        }
    }, [selectedPoll]);

    const handleButtonClick = (buttonId: string) => {
        console.log(`Button ${buttonId} clicked`);
        // Placeholder for future functionality
    };

    return (
        <div className="flex flex-col h-screen">
            <div className="flex-none p-4 flex justify-between items-center">
                <h1 className="text-2xl font-bold">Poll Results Dashboard</h1>
                <ThemeToggle />
            </div>
            <div className="flex-grow overflow-hidden p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-full">
                    <Card className="flex flex-col">
                        <CardHeader>
                            <CardTitle>Poll Results Chart</CardTitle>
                            <CardDescription>{selectedPoll ? selectedPoll.caption : "Click a row to see detailed results"}</CardDescription>
                        </CardHeader>
                        <CardContent className="flex-grow">
                            <div ref={chartRef} className="w-full h-full"></div>
                        </CardContent>
                    </Card>

                    <Card className="flex flex-col overflow-hidden">
                        <CardHeader>
                            <CardTitle>Poll Data</CardTitle>
                            <CardDescription>Click a row to update the chart</CardDescription>
                        </CardHeader>
                        <CardContent className="flex flex-col flex-grow overflow-hidden">
                            <Input placeholder="Search polls..." value={searchTerm} onChange={handleSearch} className="mb-4" />
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
                                            <TableRow key={poll.post_id} onClick={() => handleRowClick(poll)} className="cursor-pointer hover:bg-gray-100">
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
