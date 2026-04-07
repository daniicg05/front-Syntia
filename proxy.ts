import {
    NextRequest, NextResponse
} from "next/server";

type TokenPayload = {
    exp?: number;
    rol?: string;
};

function decodeBase64Url(value: string): string {
    const normalized = value
        .replace(/-/g, "+")
        .replace(/_/g, "/")
        .padEnd(Math.ceil(value.length / 4) * 4, "=");

    if (typeof atob === "function") {
        return atob(normalized);
    }

    return Buffer.from(normalized, "base64").toString("utf-8");
}

function decodeTokenPayload(token: string): TokenPayload | null {
    try {
        const parts = token.split(".");
        if (parts.length < 2) return null;

        const payload = parts[1];
        if (!payload) return null;

        const decoded = decodeBase64Url(payload);
        return JSON.parse(decoded) as TokenPayload;
    } catch {
        return null;
    }
}

const PROTECTED_USER = ["/dashboard", "/perfil", "/proyectos"];
const PROTECTED_ADMIN = ["/admin"];

export function proxy(request: NextRequest) {
    const {
        pathname
    } = request.nextUrl;

    const isUserRoute = PROTECTED_USER.some((p) => pathname.startsWith(p));
    const isAdminRoute = PROTECTED_ADMIN.some((p) => pathname.startsWith(p));

    if (!isUserRoute && !isAdminRoute) return NextResponse.next();

    const token = request.cookies.get("syntia_token")?.value;

    if (!token) {
        return NextResponse.redirect(new URL("/login", request.url));
    }

    const payload = decodeTokenPayload(token);
    if (!payload || typeof payload.exp !== "number" || payload.exp * 1000 < Date.now()) {
        const res = NextResponse.redirect(new URL("/login", request.url));
        res.cookies.delete("syntia_token");
        return res;
    }

    if (isAdminRoute && payload.rol !== "ADMIN") {
        return NextResponse.redirect(new URL("/login", request.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: ["/dashboard/:path*", "/perfil/:path*", "/proyectos/:path*", "/admin/:path*"],
}
