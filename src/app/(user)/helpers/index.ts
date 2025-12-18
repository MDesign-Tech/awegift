import { absoluteUrl } from "../../../../config";

export const getData = async (endpoint: string) => {
  const response = await fetch(absoluteUrl(endpoint), {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const error = new Error(`HTTP ${response.status}: ${response.statusText}`);
    (error as any).status = response.status;
    throw error;
  }

  const data = await response.json();
  return data;
};
