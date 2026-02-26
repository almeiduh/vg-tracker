import { createClient } from "@supabase/supabase-js";

// Ensure you replace these with your actual Supabase project URL and anon key
// Note: We are ignoring RLS for this single-user project. Use environment variables defined in `.env.local`.
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
