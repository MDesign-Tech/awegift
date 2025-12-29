const IGNORED = ["gray", "silver"];

export async function extractProductColors(imageUrls: string[]) {
  const auth = Buffer.from(
    `${process.env.IMAGGA_API_KEY}:${process.env.IMAGGA_API_SECRET}`
  ).toString("base64");

  const scores: Record<string, number> = {};
  const urls = imageUrls.slice(0, 3);

  for (let i = 0; i < urls.length; i++) {
    const weight = i === 0 ? 1.5 : 1; // thumbnail weighted

    const res = await fetch(
      `${process.env.IMAGGA_API_BASE_URL}/v2/colors?image_url=${encodeURIComponent(urls[i])}`,
      { headers: { Authorization: `Basic ${auth}` } }
    );

    const colors = (await res.json())?.result?.colors?.image_colors || [];

    colors.forEach((c: any) => {
      const name = c.color_name.toLowerCase();

      if (IGNORED.includes(name)) return;
      if (c.percentage < 18) return;

      if (["white", "black"].includes(name) && c.percentage < 40) return;

      scores[name] = (scores[name] || 0) + c.percentage * weight;
    });
  }

  return Object.entries(scores)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 2)
    .map(([color]) => color);
}
