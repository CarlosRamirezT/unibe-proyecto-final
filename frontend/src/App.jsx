import { useEffect, useState } from "react";

export default function App() {
  const [status, setStatus] = useState("checking");

  useEffect(() => {
    const controller = new AbortController();

    fetch("/api/health", { signal: controller.signal })
      .then((res) => {
        if (!res.ok) throw new Error("Health endpoint failed");
        return res.json();
      })
      .then(() => setStatus("online"))
      .catch(() => setStatus("offline"));

    return () => controller.abort();
  }, []);

  return (
    <main style={{ fontFamily: "system-ui, sans-serif", margin: "3rem auto", maxWidth: "48rem", padding: "0 1rem" }}>
      <h1>Trading Frontend Container</h1>
      <p>Frontend service is running on port 8080 via Docker.</p>
      <p>Backend connectivity: <strong>{status}</strong></p>
      <p>This container is ready for your React app integration.</p>
    </main>
  );
}
