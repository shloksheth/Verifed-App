// These identify the public Supabase API; they do not grant administrator access.
// Database permissions protect each user's rows. Never put a service-role key here.
export const supabaseUrl =
  import.meta.env.VITE_SUPABASE_URL ||
  "https://dpcxzqovrxvxeladucuz.supabase.co";
export const supabasePublishableKey =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  "sb_publishable_LibLu5_Nro06ZmEZ2jre3w_Z8U8qNtj";

// Enable only after the Google client and Supabase provider are configured.
export const googleAuthEnabled =
  import.meta.env.VITE_GOOGLE_AUTH_ENABLED === "true";
