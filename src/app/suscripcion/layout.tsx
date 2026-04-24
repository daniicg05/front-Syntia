"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import ContainerSuscription from "@/components/ui/ContainerSuscription";

export default function SuscripcionLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="relative min-h-screen bg-background">

            {/* 🔹 Logo FIXED arriba izquierda */}
            <Link href="/" className="absolute top-4 left-40 z-50">
                <Image
                    src="/images/syntia-grants-logo.png"
                    alt="Syntia Grants"
                    width={160}
                    height={54}
                    className="w-[60px] md:w-[100px] h-auto cursor-pointer"
                    priority
                />
            </Link>

            {/* 🔹 Contenido */}
            <ContainerSuscription className="pt-5 pb-12">
                {children}
            </ContainerSuscription>
        </div>
    );
}
