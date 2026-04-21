    "use client";

    import Cookies from "js-cookie";
    import axios from "axios";
    import { authApi } from "./api";

    function extractBackendError(err: unknown, fallback: string): Error {
        if (axios.isAxiosError(err)) {
            const msg = err.response?.data?.error ?? err.response?.data?.message;
            if (msg) return new Error(msg);
        }
        if (err instanceof Error) return err;
        return new Error(fallback);
    }

    export interface JwtPayload {
        sub: string;
        rol: string;
        iat: number;
        exp: number;
    }

    function decodeToken(token: string): JwtPayload | null {
        try {
            const payload = token.split(".")[1];
            const decoded = atob(payload.replace(/-/g, "+").replace(/_/g, "/"));
            return JSON.parse(decoded);
        } catch {
            return null;
        }
    }

    export function getToken(): string | undefined {
        return Cookies.get("syntia_token");
    }

    export function getUser(): JwtPayload | null {
        const token = getToken();
        if (!token) return null;
        const payload = decodeToken(token);
        if (!payload) return null;
        if (payload.exp * 1000 < Date.now()) {
            Cookies.remove("syntia_token");
            return null;
        }
        return payload;
    }

    export function isAuthenticated(): boolean {
        return getUser() !== null;
    }

    export function isAdmin(): boolean {
        return getUser()?.rol === "ADMIN";
    }

    export async function login(email: string, password: string) {
        try {
            const res = await authApi.login(email, password);
            const { token, rol } = res.data;
            Cookies.set("syntia_token", token, {
                expires: 1,
                sameSite: "Lax",
                secure: process.env.NODE_ENV === "production",
            });
            return { token, rol, email: res.data.email };
        } catch (err) {
            throw extractBackendError(err, "No se pudo iniciar sesión. Inténtalo de nuevo.");
        }
    }

    export async function registro(
        email: string,
        password: string,
        confirmarPassword: string
    ) {
        try {
            const res = await authApi.registro(email, password, confirmarPassword);
            const { token } = res.data;
            Cookies.set("syntia_token", token, {
                expires: 1,
                sameSite: "Lax",
                secure: process.env.NODE_ENV === "production",
            });

            // Limpiar favoritas residuales de este usuario en localStorage
            try {
                const payload = JSON.parse(atob(token.split(".")[1]));
                const userId = payload.sub ?? payload.id ?? payload.email;
                if (userId) {
                    localStorage.removeItem(`syntia_convocatorias_favoritas_${userId}`);
                }
            } catch {
                // Si falla el decode no hacemos nada, no es crítico
            }

            return res.data;
        } catch (err) {
            throw extractBackendError(err, "No se pudo crear la cuenta. Inténtalo de nuevo.");
        }
    }

    export function logout() {
        Cookies.remove("syntia_token");
        window.location.href = "/login";
    }