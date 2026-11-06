import * as dns from "dns";
import * as net from "net";

export function isPrivateOrReservedIP(ip: string): boolean {
  if (net.isIPv4(ip)) {
    const parts = ip.split(".").map(Number);
    const [b0, b1] = parts;

    if (b0 === 0) return true;
    if (b0 === 10) return true;
    if (b0 === 127) return true;
    if (b0 === 100 && b1 >= 64 && b1 <= 127) return true;
    if (b0 === 169 && b1 === 254) return true;
    if (b0 === 172 && b1 >= 16 && b1 <= 31) return true;
    if (b0 === 192 && b1 === 168) return true;
    if (b0 >= 224) return true;

    return false;
  }

  if (net.isIPv6(ip)) {
    const lower = ip.toLowerCase();
    if (lower === "::1" || lower === "0:0:0:0:0:0:0:1") return true;
    if (lower === "::" || lower === "0:0:0:0:0:0:0:0") return true;
    if (lower.startsWith("fc") || lower.startsWith("fd")) return true;
    if (lower.startsWith("fe8") || lower.startsWith("fe9") || lower.startsWith("fea") || lower.startsWith("feb")) return true;
    if (lower.startsWith("::ffff:")) {
      return isPrivateOrReservedIP(lower.replace("::ffff:", ""));
    }
    return false;
  }

  return true;
}

export async function validateFeedUrl(urlString: string): Promise<{ valid: boolean; reason?: string }> {
  let parsedUrl: URL;
  try {
    parsedUrl = new URL(urlString);
  } catch {
    return { valid: false, reason: "Invalid URL syntax" };
  }

  if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") {
    return { valid: false, reason: "Only HTTP/HTTPS protocols allowed" };
  }

  if (parsedUrl.username || parsedUrl.password) {
    return { valid: false, reason: "Embedded credentials prohibited" };
  }

  const port = parsedUrl.port;
  if (port && port !== "80" && port !== "443") {
    return { valid: false, reason: "Only standard ports 80/443 allowed" };
  }

  const hostname = parsedUrl.hostname.toLowerCase();
  if (
    hostname === "localhost" ||
    hostname.endsWith(".localhost") ||
    hostname.endsWith(".local") ||
    hostname.endsWith(".internal") ||
    hostname === "metadata.google.internal" ||
    hostname === "169.254.169.254"
  ) {
    return { valid: false, reason: "Internal hostnames blocked" };
  }

  try {
    const lookupResult = await dns.promises.lookup(hostname, { all: true });
    if (!lookupResult || lookupResult.length === 0) {
      return { valid: false, reason: "DNS lookup failed" };
    }

    for (const record of lookupResult) {
      if (isPrivateOrReservedIP(record.address)) {
        return { valid: false, reason: `Resolved IP (${record.address}) is in a private/reserved subnet` };
      }
    }

    return { valid: true };
  } catch (err: any) {
    return { valid: false, reason: `DNS lookup failed: ${err.message}` };
  }
}
