import * as dns from "dns";
import * as net from "net";

export interface SSRFValidationResult {
  valid: boolean;
  resolvedIp?: string;
  reason?: string;
}

export function isPrivateOrReservedIP(rawIp: string): boolean {
  const ip = rawIp.trim().replace(/^\[|\]$/g, "");

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
    if (b0 === 198 && (b1 === 18 || b1 === 19)) return true;
    if (b0 >= 224) return true;

    return false;
  }

  if (net.isIPv6(ip)) {
    const lower = ip.toLowerCase();
    if (lower === "::1" || lower === "0:0:0:0:0:0:0:1") return true;
    if (lower === "::" || lower === "0:0:0:0:0:0:0:0") return true;
    if (lower.startsWith("fc") || lower.startsWith("fd")) return true;
    if (
      lower.startsWith("fe8") ||
      lower.startsWith("fe9") ||
      lower.startsWith("fea") ||
      lower.startsWith("feb")
    ) {
      return true;
    }
    if (lower.startsWith("::ffff:")) {
      const mapped = lower.slice(7);
      if (net.isIPv4(mapped)) {
        return isPrivateOrReservedIP(mapped);
      }
      const hexParts = mapped.split(":");
      if (hexParts.length === 2) {
        const hi = parseInt(hexParts[0], 16);
        const lo = parseInt(hexParts[1], 16);
        if (!Number.isNaN(hi) && !Number.isNaN(lo)) {
          const ipv4 = `${(hi >> 8) & 0xff}.${hi & 0xff}.${(lo >> 8) & 0xff}.${lo & 0xff}`;
          return isPrivateOrReservedIP(ipv4);
        }
      }
      return true;
    }
    return false;
  }

  return true;
}

export async function validateFeedUrl(urlString: string): Promise<SSRFValidationResult> {
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

  const hostname = parsedUrl.hostname.toLowerCase().replace(/^\[|\]$/g, "");
  if (
    !hostname ||
    hostname === "localhost" ||
    hostname.endsWith(".localhost") ||
    hostname.endsWith(".local") ||
    hostname.endsWith(".internal") ||
    hostname === "metadata.google.internal" ||
    hostname === "169.254.169.254"
  ) {
    return { valid: false, reason: "Internal hostnames blocked" };
  }

  if (net.isIP(hostname)) {
    if (isPrivateOrReservedIP(hostname)) {
      return {
        valid: false,
        resolvedIp: hostname,
        reason: `IP (${hostname}) is in a private/reserved subnet`,
      };
    }
    return { valid: true, resolvedIp: hostname };
  }

  try {
    const lookupResult = await dns.promises.lookup(hostname, { all: true });
    if (!lookupResult || lookupResult.length === 0) {
      return { valid: false, reason: "DNS lookup failed" };
    }

    for (const record of lookupResult) {
      if (isPrivateOrReservedIP(record.address)) {
        return {
          valid: false,
          resolvedIp: record.address,
          reason: `Resolved IP (${record.address}) is in a private/reserved subnet`,
        };
      }
    }

    return { valid: true, resolvedIp: lookupResult[0].address };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return { valid: false, reason: `DNS lookup failed: ${message}` };
  }
}

export async function safeFetchWithRedirects(
  initialUrl: string,
  init: RequestInit,
  maxRedirects = 5
): Promise<Response> {
  let currentUrl = initialUrl;

  for (let hop = 0; hop <= maxRedirects; hop++) {
    const ssrfCheck = await validateFeedUrl(currentUrl);
    if (!ssrfCheck.valid) {
      throw new Error(`SSRF_BLOCKED: ${ssrfCheck.reason}`);
    }

    const response = await fetch(currentUrl, {
      ...init,
      redirect: "manual",
    });

    if (
      response.status === 301 ||
      response.status === 302 ||
      response.status === 303 ||
      response.status === 307 ||
      response.status === 308
    ) {
      const location = response.headers.get("location");
      if (!location) {
        throw new Error(`HTTP_${response.status}: Redirect response missing Location header`);
      }
      if (hop === maxRedirects) {
        throw new Error("TOO_MANY_REDIRECTS: Maximum redirect hops (5) exceeded");
      }
      currentUrl = new URL(location, currentUrl).toString();
      continue;
    }

    return response;
  }

  throw new Error("TOO_MANY_REDIRECTS: Maximum redirect hops exceeded");
}
