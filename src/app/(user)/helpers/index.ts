import { absoluteUrl } from "../../../../config";

export const getData = async (path: string) => {
  const url = typeof window === "undefined" ? absoluteUrl(path) : path;

  const res = await fetch(url, {
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch ${url}`);
  }

  return res.json();
};
