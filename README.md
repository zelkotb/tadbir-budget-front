# Tadbir Budget — Frontend

Angular 21 base application, carrying the reusable platform infrastructure extracted
from an earlier project. Domain-specific screens have been removed — this is the
foundation to build the budget features on.

## Stack

- **Angular 21** (standalone components, zoneless change detection, signals)
- **PrimeNG 21** + `@primeuix/themes` (Aura/Lara/Nora presets, dark mode)
- **Tailwind CSS 4** (`tailwindcss-primeui`)
- **@ngx-translate** — FR / AR with RTL support
- TypeScript strict mode + strict templates

## Getting started

```bash
npm install
npm start          # ng serve  → http://localhost:4200
npm run build      # production build → dist/tadbir-budget/
npm test           # karma / jasmine
```

The dev API base is absolute (`http://localhost:8080/api/v1`, see
`src/environments/environment.ts`); production uses the same-origin `/api/v1`
(reverse-proxied by nginx — see `deploy/`).

## What's included (reusable base)

| Area | Location |
|------|----------|
| **Authentication** — login, signup, session restore, silent refresh | `pages/auth/`, `interceptors/auth.interceptor.ts` |
| **Authorization** — role guards, `hasAnyRole` directive, role helpers | `guards/`, `directives/`, `constants/roles.ts` |
| **Rate limiting** — 429 countdown surfaced to auth forms | `services/rate-limit.service.ts` |
| **Error handling** — global HTTP error → toast / redirect | `interceptors/error.interceptor.ts`, `models/api-error.model.ts` |
| **Loading** — global overlay + per-request opt-out | `interceptors/loading.interceptor.ts`, `services/loading.service.ts` |
| **Notifications** — bell panel, categories, mark-read | `components/notifications/` |
| **Files management** — generic upload / list / download by entity | `components/documents/`, `services/document.service.ts`, `services/file.service.ts`, `utils/file.util.ts`, `models/document.model.ts` |
| **Workflow** — generic task claim / complete / inbox | `services/workflow.service.ts`, `models/workflow.model.ts` |
| **User management** — list, detail, roles, enable/disable | `pages/users/` |
| **Audit / logging** — logs, per-user audit, dashboard | `pages/audit/` |
| **Layout** — sidebar, topbar, menu, footer, theming | `components/layout/`, `configuration/` |
| **i18n** — FR / AR bundles + RTL | `public/i18n/`, `services/language.service.ts` |

## Using the generic file-management components

Both components resolve their endpoints from a `basePath` (`{basePath}/{entityId}/documents`):

```html
<app-document-uploader [basePath]="'/budgets'" [entityId]="budgetId" (uploaded)="onUploaded($event)" />
<app-document-list [basePath]="'/budgets'" [entityId]="budgetId" [documents]="docs()" [canDelete]="true" />
```

Tune `FILE_MAX_BYTES`, `FILE_ALLOWED_EXT`, and `DOC_TYPES` in
`models/document.model.ts`. Document UI strings live under the `document` key in
`public/i18n/*.json`.

## Notes for the next build-out

- **Post-login landing** is `/account` (`app.constants.ts` → `DEFAULT_ROUTE`). Point it
  at a real home once one exists, and branch `homeRouteFor(roles)` if you need a
  role-specific landing.
- **Roles** in `constants/roles.ts` are carried over as-is — adjust the set and the
  `roles.*` i18n labels for the budget domain.
- **Landing / CGU** pages retain placeholder copy — rewrite for the budget context.
- Notification click-through (`components/notifications`) has no entity route in the
  base; wire it to your detail route when it exists.
