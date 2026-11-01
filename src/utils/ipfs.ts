import axios from "axios";

/**
 * IPFS helpers.
 *
 * Pinning goes through our own serverless endpoint (`/api/ipfs/pin`) so the
 * Pinata secret never ships in the client bundle. Reads try several public
 * gateways, because any single gateway may rate-limit or drop content.
 */

const PIN_ENDPOINT = "/api/ipfs/pin";

const CONFIGURED_GATEWAY = (
  import.meta.env.VITE_PINATA_GATEWAY as string | undefined
)?.replace(/\/+$/, "");

export const IPFS_GATEWAYS: string[] = Array.from(
  new Set(
    [
      CONFIGURED_GATEWAY,
      "https://gateway.pinata.cloud",
      "https://ipfs.filebase.io",
      "https://ipfs.io",
      "https://dweb.link",
    ].filter(Boolean) as string[]
  )
);

export interface IPFSUploadResponse {
  IpfsHash: string;
  PinSize: number;
  Timestamp: string;
}

async function pin(body: Record<string, unknown>): Promise<string> {
  try {
    const response = await axios.post<{ cid: string }>(PIN_ENDPOINT, body, {
      headers: { "Content-Type": "application/json" },
      timeout: 60000,
    });
    if (!response.data?.cid) throw new Error("No CID returned");
    return response.data.cid;
  } catch (error: any) {
    const reason =
      error?.response?.data?.error || error?.message || "unknown error";
    console.error("IPFS pin failed:", reason);
    throw new Error(`Failed to upload to IPFS: ${reason}`);
  }
}

/** Upload JSON data to IPFS (pinned via Pinata). Returns the CID. */
export async function uploadJSONToIPFS(
  data: unknown,
  filename?: string
): Promise<string> {
  return pin({
    kind: "json",
    name: filename || `invoice-${Date.now()}`,
    content: data,
  });
}

/** Upload a file (sent base64-encoded) to IPFS. Returns the CID. */
export async function uploadFileToIPFS(file: File): Promise<string> {
  const buf = await file.arrayBuffer();
  let binary = "";
  const bytes = new Uint8Array(buf);
  for (let i = 0; i < bytes.length; i += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  }
  return pin({
    kind: "file",
    name: file.name || `invoice-file-${Date.now()}`,
    contentType: file.type || "application/octet-stream",
    base64: btoa(binary),
  });
}

async function fetchFromGateways<T>(
  hash: string,
  responseType: "json" | "text"
): Promise<T> {
  let lastError: unknown;
  for (const gateway of IPFS_GATEWAYS) {
    try {
      const response = await axios.get(`${gateway}/ipfs/${hash}`, {
        responseType,
        timeout: 20000,
      });
      return response.data as T;
    } catch (error) {
      lastError = error;
      console.warn(`IPFS gateway failed (${gateway}), trying next…`);
    }
  }
  console.error("All IPFS gateways failed:", lastError);
  throw new Error("Failed to retrieve file from IPFS");
}

/** Retrieve (and JSON-parse when possible) a file from IPFS. */
export async function getFileFromIPFS(hash: string): Promise<any> {
  return fetchFromGateways<any>(hash, "json");
}

/** Public URL for an IPFS file on the primary gateway. */
export function getIPFSUrl(hash: string): string {
  return `${IPFS_GATEWAYS[0]}/ipfs/${hash}`;
}

/** Download raw file content from IPFS as text. */
export async function downloadFromIPFS(hash: string): Promise<string> {
  return fetchFromGateways<string>(hash, "text");
}

/** Upload an invoice file plus a metadata JSON that links to it. */
export async function uploadMedicalInvoice(
  file: File,
  metadata: {
    patientName?: string;
    doctorName?: string;
    date?: string;
    invoiceNumber?: string;
    description?: string;
  }
): Promise<string> {
  const fileHash = await uploadFileToIPFS(file);
  const invoiceData = {
    fileHash,
    filename: file.name,
    fileSize: file.size,
    fileType: file.type,
    uploadedAt: new Date().toISOString(),
    ...metadata,
  };
  return uploadJSONToIPFS(invoiceData, `invoice-metadata-${Date.now()}`);
}
