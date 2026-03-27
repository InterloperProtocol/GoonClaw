import { InternalAdminDashboard } from "@/components/InternalAdminDashboard";
import { TianshiSimulationAdminPanel } from "@/components/TianshiSimulationAdminPanel";
import { getServerEnv } from "@/lib/env";

export const dynamic = "force-dynamic";

export default function HiddenAdminPage() {
  return (
    <>
      <InternalAdminDashboard defaultUsername={getServerEnv().INTERNAL_ADMIN_LOGIN} />
      <div className="app-shell">
        <TianshiSimulationAdminPanel />
      </div>
    </>
  );
}
