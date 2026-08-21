const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

export default function HomePage() {
  return (
    <main style={{ padding: '2rem', maxWidth: 640 }}>
      <h1>Relay</h1>
      <p>
        Monorepo placeholder for the web app. Replace this package with the Circle UI
        starter when ready.
      </p>
      <p>
        API base URL: <code>{apiUrl}</code>
      </p>
      <p>
        Health check: <code>{apiUrl}/health</code>
      </p>
    </main>
  );
}
