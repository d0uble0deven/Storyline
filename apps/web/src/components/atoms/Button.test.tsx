// @vitest-environment jsdom
import { describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach } from "vitest";
import { Button } from "./Button.js";
import { ScoreIndicator } from "../molecules/ScoreIndicator.js";

afterEach(cleanup);

describe("Button", () => {
  it("fires onClick", () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Approve</Button>);
    fireEvent.click(screen.getByRole("button", { name: "Approve" }));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it("blocks interaction while loading", () => {
    const onClick = vi.fn();
    render(
      <Button loading onClick={onClick}>
        Generate
      </Button>
    );
    const button = screen.getByRole("button", { name: "Generate" });
    expect(button).toHaveProperty("disabled", true);
    fireEvent.click(button);
    expect(onClick).not.toHaveBeenCalled();
  });
});

describe("ScoreIndicator", () => {
  it("exposes the score to screen readers", () => {
    render(<ScoreIndicator label="Story relevance" value={10} />);
    expect(screen.getByText("Story relevance: 10 out of 10")).toBeTruthy();
  });
});
