"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import * as d3 from "d3";
import { pollData } from "./pollData";

export function Dashboard() {
    const [selectedPoll, setSelectedPoll] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [filteredData, setFilteredData] = useState(pollData);
    const chartRef = useRef(null);
    const itemsPerPage = 10;

    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentPolls = filteredData.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredData.length / itemsPerPage);

    const handleRowClick = (poll) => {
        setSelectedPoll(poll);
    };

    const handleSearch = (event) => {
        const searchTerm = event.target.value.toLowerCase();
        setSearchTerm(searchTerm);
        const filtered = pollData.filter((poll) => poll.caption.toLowerCase().includes(searchTerm));
        setFilteredData(filtered);
        setCurrentPage(1);
    };

    const createChart = (poll) => {
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

    const calculatePValue = (data) => {
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

    const renderPaginationButtons = () => {
        const buttons = [];
        const showEllipsis = totalPages > 7;
        const showFirstLastButtons = totalPages > 2;

        if (showFirstLastButtons) {
            buttons.push(
                <Button key="first" onClick={() => setCurrentPage(1)} disabled={currentPage === 1}>
                    First
                </Button>
            );
        }

        buttons.push(
            <Button key="prev" onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))} disabled={currentPage === 1}>
                Previous
            </Button>
        );

        if (showEllipsis) {
            if (currentPage > 3) {
                buttons.push(<span key="ellipsis1">...</span>);
            }

            for (let i = Math.max(1, currentPage - 1); i <= Math.min(totalPages, currentPage + 1); i++) {
                buttons.push(
                    <Button key={i} onClick={() => setCurrentPage(i)} className={currentPage === i ? "bg-blue-500" : "bg-gray-200"}>
                        {i}
                    </Button>
                );
            }

            if (currentPage < totalPages - 2) {
                buttons.push(<span key="ellipsis2">...</span>);
            }
        } else {
            for (let i = 1; i <= totalPages; i++) {
                buttons.push(
                    <Button key={i} onClick={() => setCurrentPage(i)} className={currentPage === i ? "bg-blue-500" : "bg-gray-200"}>
                        {i}
                    </Button>
                );
            }
        }

        buttons.push(
            <Button key="next" onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages}>
                Next
            </Button>
        );

        if (showFirstLastButtons) {
            buttons.push(
                <Button key="last" onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages}>
                    Last
                </Button>
            );
        }

        return buttons;
    };

    return (
        <div className="flex flex-col h-screen">
            <div className="flex-none p-4">
                <h1 className="text-2xl font-bold">Poll Results Dashboard</h1>
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
                    <Card className="flex flex-col">
                        <CardHeader>
                            <CardTitle>Poll Data</CardTitle>
                            <CardDescription>Click a row to update the chart</CardDescription>
                        </CardHeader>
                        <CardContent className="flex-grow overflow-auto">
                            <Input placeholder="Search polls..." value={searchTerm} onChange={handleSearch} className="mb-4" />
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Question</TableHead>
                                        <TableHead>Option 1</TableHead>
                                        <TableHead>Option 2</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {currentPolls.map((poll) => (
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
                        </CardContent>
                    </Card>
                </div>
            </div>
            <div className="flex-none p-4 flex justify-center items-center space-x-2">{renderPaginationButtons()}</div>
        </div>
    );
}
