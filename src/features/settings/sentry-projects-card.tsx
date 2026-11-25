import type { SentryProjectChoices } from "@/features/integrations/server/sentry-projects";

/** Which Sentry projects feed the inbox. Everything is watched until you narrow it down. */
export function SentryProjectsCard({ choices }: { choices: SentryProjectChoices }) {
  const isChecked = (id: string) => choices.selected === null || choices.selected.includes(id);
  return (
    <form
      action="/api/integrations/sentry/settings"
      method="post"
      aria-label="Sentry projects"
      className="mt-3 space-y-3 rounded-lg border border-border bg-panel p-3"
    >
      <h3 className="text-sm font-medium">Sentry projects to watch</h3>
      {choices.projects.length === 0 ? (
        <p className="text-sm text-muted">No projects found in this organization.</p>
      ) : (
        <ul className="grid gap-1.5 sm:grid-cols-2">
          {choices.projects.map((project) => (
            <li key={project.id}>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  name="projectId"
                  value={project.id}
                  defaultChecked={isChecked(project.id)}
                />
                {project.name}
              </label>
            </li>
          ))}
        </ul>
      )}
      <p className="text-xs text-muted">
        Leave all checked to watch every project, including new ones you create later.
      </p>
      <button type="submit" className="btn btn-primary">
        Save projects
      </button>
    </form>
  );
}
