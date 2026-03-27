import { renderHtml } from "@/tests/regression/helpers/render";

vi.mock("@/components/shell/TianezhaScaffold", () => import("@/tests/regression/helpers/mock-scaffold"));

import BitClawPage from "@/app/bitclaw/page";
import BolClawPage from "@/app/bolclaw/page";
import GenDelvePage from "@/app/gendelve/page";
import HomePage from "@/app/page";
import NezhaPage from "@/app/nezha/page";
import TianshiPage from "@/app/tianshi/page";
import TianziPage from "@/app/tianzi/page";
import { SiteNav } from "@/components/SiteNav";

describe("naming and copy regressions", () => {
  it("keeps final public product naming consistent across the main shell", async () => {
    const homeHtml = renderHtml(await HomePage());
    const bolclawHtml = renderHtml(await BolClawPage());
    const tianziHtml = renderHtml(await TianziPage());
    const nezhaHtml = renderHtml(await NezhaPage());
    const tianshiHtml = renderHtml(await TianshiPage());
    const gendelveHtml = renderHtml(await GenDelvePage());
    const navHtml = renderHtml(<SiteNav />);

    expect(homeHtml).toContain("BitClaw");
    expect(bolclawHtml).toContain("BolClaw");
    expect(tianziHtml).toContain("Prediction and futarchy markets");
    expect(nezhaHtml).toContain("Simulated perps");
    expect(tianshiHtml).toContain("The brain, world interpreter, and heartbeat publisher");
    expect(gendelveHtml).toContain("Narrow, real governance");
    expect(navHtml).not.toContain("HeartBeat");
  });

  it("does not let old public HeartBeat or livestream branding leak back into major pages", async () => {
    const pages = [
      renderHtml(await HomePage()),
      renderHtml(await BitClawPage()),
      renderHtml(await BolClawPage()),
      renderHtml(await TianziPage()),
      renderHtml(await NezhaPage()),
      renderHtml(await TianshiPage()),
      renderHtml(await GenDelvePage()),
    ];

    for (const html of pages) {
      expect(html).not.toContain("HeartBeat");
      expect(html).not.toContain("Livestream");
      expect(html).not.toContain("runtime wall");
    }
  });

  it("keeps builder jargon off the main public pages", async () => {
    const publicPages = [
      renderHtml(await HomePage()),
      renderHtml(await BitClawPage()),
      renderHtml(await BolClawPage()),
      renderHtml(await TianziPage()),
      renderHtml(await NezhaPage()),
      renderHtml(await GenDelvePage()),
    ];

    for (const html of publicPages) {
      expect(html).not.toContain("ownership walls");
      expect(html).not.toContain("runtime state");
      expect(html).not.toContain("diagnostics");
      expect(html).not.toContain("seams");
    }
  });
});
