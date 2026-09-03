import axios from "axios";

const configuredApiUrl = import.meta.env.VITE_API_URL?.trim();

if (!configuredApiUrl && import.meta.env.PROD) {
  throw new Error(
    "VITE_API_URL is not configured. Add your backend URL to the deployment environment and redeploy.",
  );
}

const baseURL = (configuredApiUrl || "http://localhost:3000").replace(
  /\/+$/,
  "",
);

export const api = axios.create({
  baseURL,
  withCredentials: true,
});
