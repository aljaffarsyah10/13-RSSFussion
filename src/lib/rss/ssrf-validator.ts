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

    // 0.0.0.0/8 (Current network)
    if (b0 === 0) return true;
    // 10.0.0.0/8 (Private)
    if (b0 === 10) return true;
    // 127.0.0.0/8 (Loopback)
    if (b0 === 127) return true;
    // 100.64.0.0/10 (Carrier-grade NAT)
    if (b0 === 100 && b1 >= 64 && b1 <= 127) return true;
    // 169.254.0.0/16 (Link-local / AWS metadata 169.254.169.254)
    if (b0 === 169 && b1 === 254) return true;
    // 172.16.0.0/12 (Private)
    if (b0 === 172 && b1 >= 16 && b1 <= 31) return true;
    // 192.168.0.0/16 (Private)
    if (b0 === 192 && b1 === 168) return true;
    // 198.18.0.0/15 (Benchmarking)
    if (b0 === 198 && (b1 === 18 || b1 === 19)) return true;
    // 224.0.0.0/4 (Multicast) & 240.0.0.0/4 (Reserved)
    if (b0 >= 224) return true;

    return false;
  }

  if (net.isIPv6(ip)) {
    const lower = ip.toLowerCase();
    // Loopback ::1
    if (lower === "::1" || lower === "0:0:0:0:0:0:0:1") return true;
    // Unspecified ::
    if (lower === "::" || lower === "0:0:0:0:0:0:0:0") return true;
    // Unique local fc00::/7 (fc00 - fdff)
    if (lower.startsWith("fc") || lower.startsWith("fd")) return true;
    // Link-local fe80::/10 (fe80 - febf)
    if (
      lower.startsWith("fe8") ||
      lower.startsWith("fe9") ||
      lower.startsWith("fea") ||
      lower.startsWith("feb")
    ) {
      return true;
    }
    // IPv4-mapped IPv6 (::ffff:127.0.0.1 or hex ::ffff:7f00:1)
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

  // 1. Protocol check
  if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") {
    return { valid: false, reason: "Only HTTP and HTTPS protocols are permitted" };
  }

  // 2. Reject credentials in URL
  if (parsedUrl.username || parsedUrl.password) {
    return { valid: false, reason: "Embedded user credentials in URL are prohibited" };
  }

  // 3. Port check (80 and 443 only)
  const port = parsedUrl.port;
  if (port && port !== "80" && port !== "443") {
    return { valid: false, reason: "Only standard ports 80 and 443 are allowed" };
  }

  // 4. Hostname normalization & blacklist check
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
    return { valid: false, reason: "Internal or metadata hostnames are blocked" };
  }

  // Direct IP literal check before DNS lookup
  if (net.isIP(hostname)) {
    if (isPrivateOrReservedIP(hostname)) {
      return {
        valid: false,
        resolvedIp: hostname,
        reason: `IP (${hostname}) is in a private, local, or reserved range`,
      };
    }
    return { valid: true, resolvedIp: hostname };
  }

  // 5. DNS Resolution check
  try {
    const lookupResult = await dns.promises.lookup(hostname, { all: true });
    if (!lookupResult || lookupResult.length === 0) {
      return { valid: false, reason: "DNS resolution failed: no records found" };
    }

    // Verify all resolved IP addresses
    for (const record of lookupResult) {
      if (isPrivateOrReservedIP(record.address)) {
        return {
          valid: false,
          resolvedIp: record.address,
          reason: `Resolved IP (${record.address}) is in a private, local, or reserved range`,
        };
      }
    }

    return { valid: true, resolvedIp: lookupResult[0].address };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return { valid: false, reason: `DNS lookup error: ${message}` };
  }
}

/**
 * Performs an HTTP fetch while validating every redirect hop against SSRF rules.
 */
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
