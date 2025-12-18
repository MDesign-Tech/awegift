import { absoluteUrl } from "../../../../config";

export const getData = async (path: string) => {
  const url = absoluteUrl(path);

  const res = await fetch(url, {
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch ${url}`);
  }

  return res.json();
};
