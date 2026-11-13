import { supabase } from "../lib/supabase";
import type { CostItem } from "../services/calculations";

export type CostItemInput = {
  category: string;
  description: string;
  estimated_cost: number;
  actual_cost: number;
};

const COLUMNS = "id, project_id, category, description, estimated_cost, actual_cost, created_at";

export async function listCostItems(projectId: string): Promise<CostItem[]> {
  const { data, error } = await supabase
    .from("cost_items")
    .select(COLUMNS)
    .eq("project_id", projectId)
    .order("created_at", { ascending: true });
  if (error) throw new Error("Could not load cost items.");
  return (data ?? []) as CostItem[];
}

export async function createCostItem(projectId: string, input: CostItemInput): Promise<CostItem> {
  const { data, error } = await supabase
    .from("cost_items")
    .insert({ ...input, project_id: projectId })
    .select(COLUMNS)
    .single();
  if (error) throw new Error("Could not add the cost item.");
  return data as CostItem;
}

export async function updateCostItem(id: string, input: CostItemInput): Promise<CostItem | null> {
  const { data, error } = await supabase
    .from("cost_items")
    .update(input)
    .eq("id", id)
    .select(COLUMNS)
    .maybeSingle();
  if (error) throw new Error("Could not save the cost item.");
  return data as CostItem | null;
}

export async function deleteCostItem(id: string): Promise<void> {
  const { error } = await supabase.from("cost_items").delete().eq("id", id);
  if (error) throw new Error("Could not delete the cost item.");
}

export async function bulkInsertCostItems(projectId: string, items: CostItemInput[]): Promise<CostItem[]> {
  if (items.length === 0) return [];
  const rows = items.map((item) => ({ ...item, project_id: projectId }));
  const { data, error } = await supabase
    .from("cost_items")
    .insert(rows)
    .select(COLUMNS);
  if (error) throw new Error("Could not import the cost items.");
  return (data ?? []) as CostItem[];
}
