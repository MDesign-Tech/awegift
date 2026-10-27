interface Config {
  baseUrl: string;
}

const checkConfig = (server: string): Config | {} => {
  let config: Config | {} = {};
  switch (server) {
    case "production":
      config = {
        baseUrl: process.env.NEXT_PUBLIC_API_BASE_URL || "",
      };
      break;
    case "local":
      config = {
        baseUrl: "http://localhost:3000",
      };
      break;
    default:
      break;
  }
  return config;
};

export const selectServer = process.env.NODE_ENV === "production" ? "production" : "local";
export const config = checkConfig(selectServer) as Config;


export const absoluteUrl = (path: string) => {
  if (!config.baseUrl) {
    throw new Error(
      "NEXT_PUBLIC_API_BASE_URL must be set to this deployment's public URL"
    );
  }

  return `${config.baseUrl}${path}`;
};
console.log("API Base URL:", config.baseUrl);