import type { ReactElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

export function renderHtml(element: ReactElement) {
  return renderToStaticMarkup(element).replace(/\s+/g, " ").trim();
}

export async function renderAsyncComponent<TProps>(
  component: (props: TProps) => Promise<ReactElement> | ReactElement,
  props: TProps,
) {
  return renderHtml(await component(props));
}

export function expectInOrder(content: string, labels: string[]) {
  let cursor = -1;
  for (const label of labels) {
    const next = content.indexOf(label, cursor + 1);
    expect(next).toBeGreaterThan(cursor);
    cursor = next;
  }
}
