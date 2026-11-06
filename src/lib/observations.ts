import { cacheLife } from "next/cache";
import { createClient } from "@supabase/supabase-js";

export type Observation = {
  country: string;
  indicator: "inflation" | "unemployment";
  year: number;
  value: number;
};

// Public read with the publishable key; RLS allows select only.
export async function getObservations(): Promise<Observation[]> {
  "use cache";
  cacheLife("hours");

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
  );
  const { data, error } = await supabase
    .from("observations")
    .select("country, indicator, year, value")
    .gte("year", 2010)
    .order("year");
  if (error) throw new Error(`Supabase: ${error.message}`);
  return data as Observation[];
}
