import { NextRequest } from "next/server";

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

async function handler(
    request: NextRequest,
    { params }: { params: Promise<{ slug: string[] }> }
) {
    const { slug } = await params;
    const pathname = "/api/" + slug.join("/");
    const search = request.nextUrl.search || "";
    const url = new URL(pathname + search, BACKEND_URL);

    const headers = new Headers(request.headers);
    headers.delete("host");

    const hasBody = !["GET", "HEAD"].includes(request.method);
    const body = hasBody ? await request.text() : undefined;

    const proxyRequest = new Request(url, {
        method: request.method,
        headers,
        body,
    });

    return fetch(proxyRequest);
}

export const GET = handler;
export const POST = handler;
export const PUT = handler;
export const DELETE = handler;
export const PATCH = handler;
export const OPTIONS = handler;
