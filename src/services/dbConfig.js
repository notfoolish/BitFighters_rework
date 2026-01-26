

export const dbConfig = {
  host: import.meta.env.VITE_DB_HOST,
  database: import.meta.env.VITE_DB_NAME,
  user: import.meta.env.VITE_DB_USER,
  password: import.meta.env.VITE_DB_PASSWORD,
}

export function assertDbEnv() {
  const missing = Object.entries(dbConfig)
    .filter(([, v]) => !v)
    .map(([k]) => k)
  return missing
}
