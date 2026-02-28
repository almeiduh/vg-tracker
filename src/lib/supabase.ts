import { createClient } from "@supabase/supabase-js";

// Supabase project URL and anon key from environment variables defined in `.env.local`.
// RLS is enabled — the user must be authenticated for data access.
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error(
        "Missing Supabase environment variables. " +
        "Verify that VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set in your .env.local file."
    );
}

export const supabase = createClient(
    supabaseUrl || "https://placeholder-url.supabase.co",
    supabaseKey || "placeholder-key"
);
