// lib/fetcher.ts
export const apiFetch = async (url: string, options: RequestInit = {}) => {
  // Merge default options
  const opts: RequestInit = {
    credentials: "include", // 🔥 ALWAYS include cookies
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    ...options,
  };

  const res = await fetch(url, opts);

  // Optional: handle 401 globally
  if (res.status === 401) {
    if (typeof window !== "undefined") {
      window.location.href = "/auth/signin";
    }
    return null;
  }

  const data = await res.json();
  return data;
};
