const windows = new Map<string, number[]>();

// Clean old entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, timestamps] of windows) {
    const valid = timestamps.filter((t) => now - t < 120_000);
    if (valid.length === 0) windows.delete(key);
    else windows.set(key, valid);
  }
}, 300_000);

export function rateLimit(
  key: string,
  maxRequests: number,
  windowMs: number
): { allowed: boolean; retryAfter: number } {
  const now = Date.now();
  const timestamps = windows.get(key) || [];
  const valid = timestamps.filter((t) => now - t < windowMs);

  if (valid.length >= maxRequests) {
    const oldest = valid[0];
    const retryAfter = Math.ceil((oldest + windowMs - now) / 1000);
    return { allowed: false, retryAfter };
  }

  valid.push(now);
  windows.set(key, valid);
  return { allowed: true, retryAfter: 0 };
}
