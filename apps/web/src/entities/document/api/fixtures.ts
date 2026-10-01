import type { Document, DocumentComment } from "../model/types";

/** Ordered as they appear in each space's sidebar. */
export const DOCUMENTS: readonly Document[] = [
  // Play
  { id: "pl-roadmap", teamId: "pl", title: "Roadmap del semestre", parentId: null, updatedAt: "2026-09-25T12:00:00-06:00", updatedById: "u-moge" },
  { id: "pl-game-jam", teamId: "pl", title: "Game jam de otoño", parentId: null, updatedAt: "2026-09-26T18:00:00-06:00", updatedById: "u-moge" },
  { id: "pl-ideas", teamId: "pl", title: "Ideas y pitches", parentId: "pl-game-jam", updatedAt: "2026-09-30T07:30:00-06:00", updatedById: "u-fer" },
  { id: "pl-roles", teamId: "pl", title: "Equipos y roles", parentId: "pl-game-jam", updatedAt: "2026-09-26T10:00:00-06:00", updatedById: "u-moge" },
  { id: "pl-deliverables", teamId: "pl", title: "Entregables", parentId: "pl-game-jam", updatedAt: "2026-09-24T10:00:00-06:00", updatedById: "u-nico" },
  { id: "pl-jam-rules", teamId: "pl", title: "Reglas de la game jam", parentId: "pl-deliverables", updatedAt: "2026-09-29T20:00:00-06:00", updatedById: "u-moge" },
  { id: "pl-minutes", teamId: "pl", title: "Minutas semanales", parentId: null, updatedAt: "2026-09-22T19:00:00-06:00", updatedById: "u-nico" },
  { id: "pl-minute-0929", teamId: "pl", title: "Minuta · 29 sep", parentId: "pl-minutes", updatedAt: "2026-09-29T19:00:00-06:00", updatedById: "u-nico" },
  { id: "pl-wiki", teamId: "pl", title: "Wiki del equipo", parentId: null, updatedAt: "2026-09-20T10:00:00-06:00", updatedById: "u-ana" },
  { id: "pl-art-guide", teamId: "pl", title: "Guía de estilo de arte", parentId: "pl-wiki", updatedAt: "2026-09-27T11:00:00-06:00", updatedById: "u-ana" },

  // Computer Science
  { id: "cs-sprints", teamId: "cs", title: "Sprints", parentId: null, updatedAt: "2026-09-28T10:00:00-06:00", updatedById: "u-ana" },
  { id: "cs-wiki", teamId: "cs", title: "Wiki del equipo", parentId: null, updatedAt: "2026-09-22T10:00:00-06:00", updatedById: "u-ana" },
  {
    id: "cs-onboarding",
    teamId: "cs",
    title: "Onboarding para nuevos integrantes",
    parentId: "cs-wiki",
    updatedAt: "2026-09-30T09:25:00-06:00",
    updatedById: "u-ana",
    properties: { status: "En revisión", ownerId: "u-ana", tags: ["guía", "primer semestre"] },
  },
  { id: "cs-backend", teamId: "cs", title: "Arquitectura del backend", parentId: "cs-wiki", updatedAt: "2026-09-21T10:00:00-06:00", updatedById: "u-ana" },
  { id: "cs-sprite-import", teamId: "cs", title: "Importar sprites al motor", parentId: "cs-wiki", updatedAt: "2026-09-23T10:00:00-06:00", updatedById: "u-ana" },
  { id: "cs-conventions", teamId: "cs", title: "Convenciones de código", parentId: "cs-wiki", updatedAt: "2026-09-19T10:00:00-06:00", updatedById: "u-ana" },
  { id: "cs-minutes", teamId: "cs", title: "Minutas", parentId: null, updatedAt: "2026-09-29T10:00:00-06:00", updatedById: "u-nico" },
  { id: "cs-resources", teamId: "cs", title: "Recursos", parentId: null, updatedAt: "2026-09-10T10:00:00-06:00", updatedById: "u-ana" },

  // Mechanics
  { id: "me-wiki", teamId: "me", title: "Wiki del equipo", parentId: null, updatedAt: "2026-09-18T10:00:00-06:00", updatedById: "u-nico" },
  { id: "me-minutes", teamId: "me", title: "Minutas", parentId: null, updatedAt: "2026-09-26T10:00:00-06:00", updatedById: "u-nico" },

  // IISE
  { id: "ii-wiki", teamId: "ii", title: "Wiki del equipo", parentId: null, updatedAt: "2026-09-18T10:00:00-06:00", updatedById: "u-fer" },
  { id: "ii-minutes", teamId: "ii", title: "Minutas", parentId: null, updatedAt: "2026-09-26T10:00:00-06:00", updatedById: "u-fer" },
];

/** Block content as HTML (TipTap schema). Pages without an entry start empty. */
export const DOCUMENT_CONTENT: Readonly<Record<string, string>> = {
  "cs-onboarding": `
    <p>Bienvenida al equipo de Computer Science. Esta guía reúne todo lo que necesitas para tu primera semana: con quién hablar, cómo preparar tu entorno y dónde vive cada cosa.</p>
    <div data-type="callout"><p>Si es tu primera semana, empieza por la sección 2 y agenda una sesión con tu mentor.</p></div>
    <h2>1. Antes de tu primera reunión</h2>
    <ul data-type="taskList">
      <li data-type="taskItem" data-checked="true"><p>Unirte al canal del equipo</p></li>
      <li data-type="taskItem" data-checked="false"><p>Leer las convenciones de código</p></li>
      <li data-type="taskItem" data-checked="false"><p>Pedir acceso al repositorio a tu líder</p></li>
    </ul>
    <h2>2. Configura tu entorno</h2>
    <p>Clona el proyecto y levanta el servidor local. Si algo falla, deja un comentario en esta página. El avance del entorno compartido está en <span data-type="task-mention" data-id="CS-17"></span>.</p>
    <pre><code class="language-bash">git clone [URL DEL REPOSITORIO]
cd panteras-web
npm install
npm run dev</code></pre>
    <p></p>
  `,
};

export const DOCUMENT_COMMENTS: readonly DocumentComment[] = [
  { id: "dc-1", documentId: "cs-onboarding", authorId: "u-nico", body: "¿Agregamos aquí el link al canal de dudas?", at: "2026-09-30T08:30:00-06:00" },
];
