// Avoid importing from "vitest/node" in config dependency chain.
// Provide a structurally compatible sequencer class.

type MinimalWorkspaceSpec = { moduleId: string };

export default class CustomSequencer {
  // ctx parameter accepted for compatibility with Vitest constructor
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  constructor(_ctx: unknown) {}

  async shard(files: MinimalWorkspaceSpec[]): Promise<MinimalWorkspaceSpec[]> {
    return files;
  }

  async sort(files: MinimalWorkspaceSpec[]): Promise<MinimalWorkspaceSpec[]> {
    const oracle = files.filter((f) => f.moduleId.includes("oracle"));
    const others = files
      .filter((f) => !f.moduleId.includes("oracle"))
      .sort((a, b) => a.moduleId.localeCompare(b.moduleId));
    return [...oracle, ...others];
  }
}
