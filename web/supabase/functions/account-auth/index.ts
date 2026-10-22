// A narrow password-login adapter: the app never receives a username's email.
const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
function reply(status: number, body: object) {
  return new Response(JSON.stringify(body), {
    status, headers: { ...cors, "Content-Type": "application/json", "Cache-Control": "no-store" },
  });
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return reply(405, { error: "Use POST." });
  try {
    const text = await req.text();
    if (text.length > 5000) return reply(413, { error: "Request is too large." });
    const input = JSON.parse(text);
    const username = typeof input.username === "string" ? input.username.trim().toLowerCase() : "";
    if (!/^[a-z0-9_]{3,24}$/.test(username))
      return reply(400, { error: "Use 3–24 letters, numbers or underscores for your username." });
    if (!["available", "signin"].includes(input.action))
      return reply(400, { error: "Unknown account action." });
    if (input.action === "signin" && (typeof input.password !== "string" || !input.password || input.password.length > 1024))
      return reply(400, { error: "Enter your password." });

    const url = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(username));
    const bucket = Array.from(new Uint8Array(digest), b => b.toString(16).padStart(2, "0")).join("");
    const lookup = await fetch(`${url}/rest/v1/rpc/verifed_account_lookup`, {
      method: "POST",
      headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ p_username: username, p_bucket: bucket }),
    });
    if (!lookup.ok) return reply(503, { error: "Account service is unavailable. Please try again." });
    const account = await lookup.json();
    if (account.limited) return reply(429, { error: "Too many attempts. Wait a minute and try again." });
    if (input.action === "available") return reply(200, { available: !account.email });

    // Missing usernames still take the normal Auth path and return the same error.
    const signedIn = await fetch(`${url}/auth/v1/token?grant_type=password`, {
      method: "POST",
      headers: { apikey: Deno.env.get("SUPABASE_ANON_KEY")!, "Content-Type": "application/json" },
      body: JSON.stringify({ email: account.email || "missing-username@invalid.example", password: input.password }),
    });
    const session = await signedIn.json();
    if (!signedIn.ok) return reply(signedIn.status === 429 ? 429 : 401, {
      error: signedIn.status === 429 ? "Too many attempts. Wait a minute and try again." : "Username, email or password is incorrect.",
    });
    // Do not include Auth's user object, which contains the resolved email.
    return reply(200, { access_token: session.access_token, refresh_token: session.refresh_token });
  } catch {
    return reply(400, { error: "Could not complete the request. Check your connection and try again." });
  }
});
