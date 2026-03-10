import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!url) throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL");
if (!key) throw new Error("Missing NEXT_PUBLIC_SUPABASE_ANON_KEY");

console.log("URL:", url);
console.log("KEY prefix:", key.slice(0, 20));
console.log("KEY length:", key.length);

const supabase = createClient(url, key);

// 1) auth check (não precisa tabela)
const { data: sessionData, error: sessionErr } = await supabase.auth.getSession();
console.log("auth.getSession error:", sessionErr?.message ?? null);
console.log("auth.getSession ok:", !!sessionData);

// 2) quick request que deve responder (mesmo que dê erro de tabela)
const { error: pingErr } = await supabase.from("_nonexistent_table_").select("*").limit(1);
console.log("select ping error:", pingErr?.message ?? null);
