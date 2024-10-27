"use client";

import { Dashboard } from "@/components/dashboard";
import { FloatingDock } from "@/components/ui/floating-dock";

export default function DashboardPage() {
    return (
        <>
            <Dashboard />
            <FloatingDock />
        </>
    );
}
