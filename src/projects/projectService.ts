import { supabase } from "../lib/supabase";

export type Project = {
  id: string;
  name: string;
  description: string;
  created_at: string;
};

export type ProjectInput = {
  name: string;
  description: string;
};

const PROJECT_COLUMNS = "id, name, description, created_at";

export async function listProjects(): Promise<Project[]> {
  const { data, error } = await supabase
    .from("projects")
    .select(PROJECT_COLUMNS)
    .order("created_at", { ascending: false });
  if (error) throw new Error("Could not load your projects.");
  return (data ?? []) as Project[];
}

export async function getProject(id: string): Promise<Project | null> {
  const { data, error } = await supabase
    .from("projects")
    .select(PROJECT_COLUMNS)
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error("Could not load this project.");
  return data as Project | null;
}

export async function createProject(input: ProjectInput): Promise<Project> {
  const { data, error } = await supabase
    .from("projects")
    .insert(input)
    .select(PROJECT_COLUMNS)
    .single();
  if (error) throw new Error("Could not create the project.");
  return data as Project;
}

export async function updateProject(id: string, input: ProjectInput): Promise<Project | null> {
  const { data, error } = await supabase
    .from("projects")
    .update(input)
    .eq("id", id)
    .select(PROJECT_COLUMNS)
    .maybeSingle();
  if (error) throw new Error("Could not save the project.");
  return data as Project | null;
}

export async function deleteProject(id: string): Promise<void> {
  const { error } = await supabase.from("projects").delete().eq("id", id);
  if (error) throw new Error("Could not delete the project.");
}
