import { describe, it, expect } from "vitest";
import { cleanText, cleanTitle, extractDenunciado } from "./clean-dataset.mjs";

describe("cleanText", () => {
  it("separa marcadores pegados", () => {
    expect(cleanText("el señorNOMBRE 1presentó")).toBe("el señor NOMBRE 1 presentó");
    expect(cleanText("[NOMBRE 1], dijo")).toBe("[NOMBRE 1], dijo");
  });
  it("enmascara cédulas físicas y celulares, no jurídicas ni años", () => {
    expect(cleanText("cedula 4-0213-0845 y")).toBe("cedula [CÉDULA] y");
    expect(cleanText("cédula de identidad número 111160790, al")).toBe("cédula de identidad número [CÉDULA], al");
    expect(cleanText("teléfono 8846-0724,")).toBe("teléfono [TELÉFONO],");
    expect(cleanText("hermanoNOMBRE 22-0651-0747 al")).toBe("hermano NOMBRE 2 [CÉDULA] al");
    expect(cleanText("en su voto, 5802-1999,")).toBe("en su voto, 5802-1999,");
    expect(cleanText("cédula jurídica 3-101-091720")).toBe("cédula jurídica 3-101-091720");
    expect(cleanText("expediente 138-07-2023-DEN, periodo 2019-2020")).toBe("expediente 138-07-2023-DEN, periodo 2019-2020");
  });
  it("es idempotente", () => {
    const once = cleanText("porNOMBRE 1contra 1-1425-0348");
    expect(cleanText(once)).toBe(once);
  });
});

describe("extractDenunciado", () => {
  it("toma la entidad del encabezado", () => {
    expect(extractDenunciado("denuncia formulada por NOMBRE 1 contra SCOTIABANK. RESULTANDO - 1.")).toBe("SCOTIABANK");
    expect(extractDenunciado("contra GENTE MAS GENTE (en delante Beto le Presta). RESULTANDO")).toBe("GENTE MAS GENTE");
    expect(extractDenunciado("contra OPC COBRO COMERCIAL S.A. RESULTANDO")).toBe("OPC COBRO COMERCIAL S.A.");
    expect(extractDenunciado("por NOMBRE 1 contraNOMBRE 2 RESULTANDO 1.")).toBeNull();
    expect(extractDenunciado("contra resolución No 702-2024 RESULTANDO")).toBeNull();
  });
});

describe("cleanTitle", () => {
  it("corrige errores y es idempotente", () => {
    const t = "Violación a la determinación informativa por COOPENAE R y Coopejudicial R.L, candelada ";
    const ok = "Violación a la autodeterminación informativa por COOPENAE R.L. y Coopejudicial R.L., cancelada";
    expect(cleanTitle(t)).toBe(ok);
    expect(cleanTitle(ok)).toBe(ok);
  });
});
