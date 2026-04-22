import { NextRequest } from "next/server";

export async function GET(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    const token = req.headers.get("authorization") ?? "";

    const backendRes = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/usuario/convocatorias/${params.id}/analisis-ia`,
        {
            headers: { Authorization: token },
            cache: "no-store",
        }
    );

    if (!backendRes.ok || !backendRes.body) {
        return new Response("Error al conectar con el backend", { status: 502 });
    }

    return new Response(backendRes.body, {
        headers: {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache, no-transform",
            Connection: "keep-alive",
            "X-Accel-Buffering": "no",
        },
    });
}