import type { ReactNode } from 'react';

// Disabled per product decision — web now renders exactly what native does
// (no marketing landing page, no desktop sidebar, no auth card treatment).
// The desktop shell code (sidebar/card/marketing layout) still exists in
// web-sidebar.tsx, web-landing-page.tsx, web-card-backdrop.tsx, and
// constants/layout.ts if it's wanted again later — this component just
// stops wiring it in.
export function WebShell({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
