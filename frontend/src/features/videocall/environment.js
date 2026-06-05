const server = import.meta.env.VITE_API_URL?.replace('/api', '') || (import.meta.env.PROD ? '' : "http://localhost:3001");
export default server;
