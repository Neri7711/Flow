/** Single source of truth for app URLs. */
export const routes = {
  login: () => "/login",
  space: (teamId: string) => `/${teamId}`,
  inbox: (teamId: string) => `/${teamId}/inbox`,
  calendar: (teamId: string) => `/${teamId}/calendar`,
  tasks: (teamId: string) => `/${teamId}/tasks`,
  members: (teamId: string) => `/${teamId}/members`,
  document: (teamId: string, documentId: string) => `/${teamId}/docs/${documentId}`,
} as const;
