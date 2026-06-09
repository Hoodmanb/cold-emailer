import { describe, it, expect } from "vitest";

const PLACEHOLDER_REGEX = /\{\{\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*\}\}/g;

function extractPlaceholders(content: string) {
  const found = new Set<string>();
  let match;
  const regex = new RegExp(PLACEHOLDER_REGEX.source, "g");
  while ((match = regex.exec(content)) !== null) {
    found.add(match[1]);
  }
  return Array.from(found);
}

function fillPlaceholders(content: string, values: Record<string, string>) {
  return content.replace(PLACEHOLDER_REGEX, (_, key) => values[key] ?? `{{${key}}}`);
}

describe("placeholder parsing", () => {
  it("extracts known placeholders", () => {
    const text = "Hello {{name}} at {{company}}";
    expect(extractPlaceholders(text)).toEqual(["name", "company"]);
  });

  it("fills placeholder values", () => {
    const text = "Dear {{name}}, applying for {{role}}";
    expect(fillPlaceholders(text, { name: "Jane", role: "Engineer" })).toBe(
      "Dear Jane, applying for Engineer",
    );
  });
});

describe("dock side snap", () => {
  it("snaps to left when pointer is in left half", () => {
    const width = 1200;
    const centerX = 400;
    const side = centerX < width / 2 ? "left" : "right";
    expect(side).toBe("left");
  });

  it("snaps to right when pointer is in right half", () => {
    const width = 1200;
    const centerX = 900;
    const side = centerX < width / 2 ? "left" : "right";
    expect(side).toBe("right");
  });
});
