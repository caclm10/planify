import { ProjectWorkspaceClient } from "@/components/projects/project-workspace-client";

export default async function ProjectWorkspacePage({ params }: { params: Promise<{ project_id: string }> }) {
  const unwrappedParams = await params;
  const projectId = unwrappedParams.project_id;

  return <ProjectWorkspaceClient projectId={projectId} />;
}
