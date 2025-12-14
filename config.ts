interface Config {
  baseUrl: string;
}

const checkConfig = (server: string): Config | {} => {
  let config: Config | {} = {};
  switch (server) {
    case "production":
      config = {
        baseUrl: "https://awegift.vercel.app",
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

export const selectServer = "local";
export const config = checkConfig(selectServer) as Config;


export const absoluteUrl = (path: string) => {
  // For server-side API calls, we need absolute URLs
  return `${config.baseUrl}${path}`;
};
