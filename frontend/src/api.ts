import axios from "axios";

const configuredApiUrl = import.meta.env.VITE_API_URL?.trim();

export const apiConfigurationError =
  import.meta.env.PROD && !configuredApiUrl
    ? "The application service is not configured. Please try again later."
    : null;

const baseURL = (configuredApiUrl || "http://localhost:3000").replace(
  /\/+$/,
  "",
);

export const api = axios.create({
  baseURL,
  withCredentials: true,
});
