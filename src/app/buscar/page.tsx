"use client";

import { Suspense } from "react";
import BuscarContent from "./BuscarContent";

export default function BuscarPage() {
    return (
        <Suspense fallback={
            <div className="max-w-6xl mx-auto px-4 py-8">
                <div className="h-12 bg-surface border border-border rounded-xl animate-pulse mb-6" />
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {[...Array(8)].map((_, i) => (
                        <div key={i} className="h-52 bg-surface border border-border rounded-2xl animate-pulse" />
                    ))}
                </div>
            </div>
        }>
            <BuscarContent />
        </Suspense>
    );
}
