import "server-only";

/**
 * Sends a message through a self-hosted signal-cli-rest-api instance
 * (https://github.com/bbernhard/signal-cli-rest-api). That service holds the
 * actual Signal identity (linked as a secondary device) and does the real
 * work — this just calls its HTTP API.
 */
export async function sendSignalMessage(text: string): Promise<void> {
  const apiUrl = process.env.SIGNAL_API_URL;
  const sender = process.env.SIGNAL_SENDER_NUMBER;
  const recipient = process.env.SIGNAL_RECIPIENT;

  if (!apiUrl || !sender || !recipient) {
    throw new Error(
      "Signal is not configured — set SIGNAL_API_URL, SIGNAL_SENDER_NUMBER, and SIGNAL_RECIPIENT."
    );
  }

  const res = await fetch(`${apiUrl.replace(/\/$/, "")}/v2/send`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      message: text,
      number: sender,
      recipients: [recipient],
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`signal-cli-rest-api returned ${res.status}: ${body}`);
  }
}
