import { absoluteUrl } from "../../../../config";

export class DataFetchError extends Error {
  constructor(
    url: string,
    readonly status: number
  ) {
    super(`Failed to fetch ${url} (${status})`);
    this.name = "DataFetchError";
  }
}

export const getData = async (path: string) => {
  const url = typeof window === "undefined" ? absoluteUrl(path) : path;

  const res = await fetch(url, {
    cache: "no-store",
  });

  if (!res.ok) {
    throw new DataFetchError(url, res.status);
  }

  return res.json();
};
