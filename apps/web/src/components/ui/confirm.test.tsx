import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { ConfirmProvider, useConfirm } from "./confirm";

const Consumer = ({ onSee }: { onSee: (value: unknown) => void }) => {
  onSee(useConfirm());
  return null;
};

describe("confirm provider", () => {
  it("hands the confirm function to whoever renders inside it", () => {
    let seen: unknown = null;

    renderToString(
      <ConfirmProvider>
        <Consumer onSee={(value) => (seen = value)} />
      </ConfirmProvider>,
    );

    expect(typeof seen).toBe("function");
  });

  it("says plainly what is missing when there is no provider", () => {
    expect(() => renderToString(<Consumer onSee={() => {}} />)).toThrow(/ConfirmProvider/);
  });
});
