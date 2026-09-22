import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { buildQueryPatterns, highlightText } from "./highlightText";

describe("buildQueryPatterns", () => {
  it("ignores words of 2 characters or fewer", () => {
    expect(buildQueryPatterns("un si de datos")).toHaveLength(1);
  });

  it("splits on whitespace and builds one pattern per word", () => {
    expect(buildQueryPatterns("consentimiento datos")).toHaveLength(2);
  });

  it("escapes regex special characters", () => {
    const [pattern] = buildQueryPatterns("art.5");
    expect("art.5 y art85".match(pattern)).toEqual(["art.5"]);
  });

  it("returns [] for blank input", () => {
    expect(buildQueryPatterns("   ")).toEqual([]);
  });
});

describe("highlightText", () => {
  it("returns the original text unchanged when there are no patterns", () => {
    expect(highlightText("hola mundo", [], [])).toBe("hola mundo");
  });

  it("wraps a single match in <mark>", () => {
    const patterns = buildQueryPatterns("consentimiento");
    const html = renderToStaticMarkup(highlightText("requiere consentimiento previo", patterns, []) as any);
    expect(html).toContain("<mark");
    expect(html).toContain(">consentimiento<");
  });

  it("merges overlapping query and descriptor ranges into one mark", () => {
    const queryPatterns = buildQueryPatterns("personales");
    const descriptorPatterns = [/personales sensibles/gi];
    const html = renderToStaticMarkup(
      highlightText("tratamiento de datos personales sensibles", queryPatterns, descriptorPatterns) as any,
    );
    expect(html.match(/<mark/g)).toHaveLength(1);
    expect(html).toContain(">personales sensibles<");
  });

  it("is case-insensitive", () => {
    const patterns = buildQueryPatterns("Consentimiento");
    const html = renderToStaticMarkup(highlightText("el CONSENTIMIENTO otorgado", patterns, []) as any);
    expect(html).toContain(">CONSENTIMIENTO<");
  });
});
