import { auth } from "./firebase";

export const apiFetch = async (endpoint: string, options: RequestInit = {}) => {
    let token = "";
    if (auth.currentUser) {
        token = await auth.currentUser.getIdToken();
    }

    const defaultHeaders: Record<string, string> = {};

    if (token) {
        defaultHeaders["Authorization"] = `Bearer ${token}`;
    }

    if (!(options.body instanceof FormData)) {
        defaultHeaders["Content-Type"] = "application/json";
    }

    const config = {
        ...options,
        headers: {
            ...defaultHeaders,
            ...options.headers,
        }
    };

    const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}${endpoint}`, config);

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || response.statusText || "API Error");
    }

    return response.json();
};
