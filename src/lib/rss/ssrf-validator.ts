import * as dns from "dns";
import * as net from "net";

export interface SSRFValidationResult {
  valid: boolean;
  resolvedIp?: string;
  reason?: string;
}

export function isPrivateOrReservedIP(ip: string): boolean {
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
    // 224.0.0.0/4 (Multicast)
    if (b0 >= 224 && b0 <= 239) return true;
    // 240.0.0.0/4 (Reserved / Future use)
    if (b0 >= 240) return true;

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
    if (lower.startsWith("fe8") || lower.startsWith("fe9") || lower.startsWith("fea") || lower.startsWith("feb")) return true;
    // IPv4-mapped IPv6 (::ffff:127.0.0.1, etc.)
    if (lower.startsWith("::ffff:")) {
      const ipv4Part = lower.replace("::ffff:", "");
      return isPrivateOrReservedIP(ipv4Part);
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

  // 4. Hostname blacklist check
  const hostname = parsedUrl.hostname.toLowerCase();
  if (
    hostname === "localhost" ||
    hostname.endsWith(".localhost") ||
    hostname.endsWith(".local") ||
    hostname.endsWith(".internal") ||
    hostname === "metadata.google.internal" ||
    hostname === "169.254.169.254"
  ) {
    return { valid: false, reason: "Internal or metadata hostnames are blocked" };
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
