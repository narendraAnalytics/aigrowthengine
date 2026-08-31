/**
 * Liveness probe for uptime monitors (parity with the API's /healthz).
 * No dependencies — just proves the web server is answering.
 */
export async function GET() {
  return Response.json({ status: "ok" });
}
