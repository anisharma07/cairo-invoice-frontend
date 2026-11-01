/**
 * POST /api/ipfs/pin
 *
 * Pins invoice data to IPFS through Pinata, server-side, so the Pinata
 * credentials never reach the browser.
 *
 * Body (JSON):
 *   { kind: "json", name: string, content: any }
 *   { kind: "file", name: string, contentType: string, base64: string }
 *
 * Response: { cid: string }
 *
 * Credentials are read from (first match wins):
 *   PINATA_JWT
 *   PINATA_API_KEY + PINATA_SECRET_KEY
 *   VITE_PINATA_API_KEY + VITE_PINATA_SECRET_KEY   (legacy names)
 */

const MAX_BYTES = 2 * 1024 * 1024; // 2 MB per invoice is plenty

function pinataHeaders(env) {
  const jwt = env.PINATA_JWT;
  if (jwt) return { Authorization: `Bearer ${jwt}` };
  const key = env.PINATA_API_KEY || env.VITE_PINATA_API_KEY;
  const secret = env.PINATA_SECRET_KEY || env.VITE_PINATA_SECRET_KEY;
  if (key && secret) {
    return { pinata_api_key: key, pinata_secret_api_key: secret };
  }
  return null;
}

function sameOrigin(req) {
  const origin = req.headers.origin;
  if (!origin) return true; // non-browser callers (curl, server-to-server)
  try {
    const host = new URL(origin).host;
    return host === req.headers.host || host.startsWith("localhost:");
  } catch {
    return false;
  }
}

export async function pinToIpfs(body, env = process.env) {
  const headers = pinataHeaders(env);
  if (!headers) {
    return { status: 500, json: { error: "IPFS pinning is not configured" } };
  }

  const name = String(body?.name || `invoice-${Date.now()}`).slice(0, 120);
  const keyvalues = {
    app: "cairo-invoice",
    timestamp: new Date().toISOString(),
  };

  let upstream;
  if (body?.kind === "file") {
    if (typeof body.base64 !== "string" || !body.base64) {
      return { status: 400, json: { error: "Missing file data" } };
    }
    const bytes = Buffer.from(body.base64, "base64");
    if (bytes.length > MAX_BYTES) {
      return { status: 413, json: { error: "File too large (max 2 MB)" } };
    }
    const form = new FormData();
    form.append(
      "file",
      new Blob([bytes], {
        type: body.contentType || "application/octet-stream",
      }),
      name
    );
    form.append("pinataMetadata", JSON.stringify({ name, keyvalues }));
    form.append("pinataOptions", JSON.stringify({ cidVersion: 0 }));
    upstream = await fetch("https://api.pinata.cloud/pinning/pinFileToIPFS", {
      method: "POST",
      headers,
      body: form,
    });
  } else {
    if (body?.content === undefined) {
      return { status: 400, json: { error: "Missing content" } };
    }
    const payload = JSON.stringify({
      pinataContent: body.content,
      pinataMetadata: { name, keyvalues },
      pinataOptions: { cidVersion: 0 },
    });
    if (payload.length > MAX_BYTES) {
      return { status: 413, json: { error: "Invoice too large (max 2 MB)" } };
    }
    upstream = await fetch("https://api.pinata.cloud/pinning/pinJSONToIPFS", {
      method: "POST",
      headers: { ...headers, "Content-Type": "application/json" },
      body: payload,
    });
  }

  if (!upstream.ok) {
    const text = await upstream.text().catch(() => "");
    console.error("Pinata error", upstream.status, text.slice(0, 300));
    return {
      status: 502,
      json: { error: `Pinning service returned ${upstream.status}` },
    };
  }
  const data = await upstream.json();
  return { status: 200, json: { cid: data.IpfsHash } };
}

export default async function handler(req, res) {
  if (req.method === "GET") {
    // Health check: reports whether credentials are configured (never values).
    res.status(200).json({ ok: true, configured: !!pinataHeaders(process.env) });
    return;
  }
  if (req.method !== "POST") {
    res.setHeader("Allow", "GET, POST");
    res.status(405).json({ error: "Method not allowed" });
    return;
  }
  if (!sameOrigin(req)) {
    res.status(403).json({ error: "Cross-origin requests are not allowed" });
    return;
  }
  try {
    let body = req.body;
    if (typeof body === "string") body = JSON.parse(body);
    const result = await pinToIpfs(body);
    res.status(result.status).json(result.json);
  } catch (error) {
    console.error("pin handler error", error);
    res.status(500).json({ error: "Unexpected error while pinning" });
  }
}
