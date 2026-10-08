export function apiUrl(): string {
  return process.env.API_URL ?? "http://localhost:3000";
}
