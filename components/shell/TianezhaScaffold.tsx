import type { ReactNode } from "react";

import { LoadedIdentityRail } from "@/components/identity/LoadedIdentityRail";
import { LoadedIdentitySidebar } from "@/components/identity/LoadedIdentitySidebar";
import { SiteNav } from "@/components/SiteNav";

export function TianezhaScaffold({ children }: { children: ReactNode }) {
  return (
    <div className="app-shell">
      <SiteNav />
      <div className="tianezha-layout">
        <aside className="tianezha-left-rail">
          <LoadedIdentityRail />
        </aside>
        <main className="tianezha-main">{children}</main>
        <aside className="tianezha-right-rail">
          <LoadedIdentitySidebar />
        </aside>
      </div>
    </div>
  );
}
