import React, { type ReactNode } from "react";

export function TianezhaScaffold({ children }: { children: ReactNode }) {
  return (
    <div data-testid="tianezha-scaffold">
      <nav>Mock Tianezha nav</nav>
      <main>{children}</main>
      <aside data-testid="persistent-rail">Persistent Tianezha left shell</aside>
    </div>
  );
}
