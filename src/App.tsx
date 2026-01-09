"use client";

import React, { useEffect, useMemo, useState } from "react";
import ExcelJS, { Worksheet, Font } from "exceljs"; // Tipado TS

// Archivo de plantilla (machote) alojado en GitHub RAW para carga/descarga directa
const TEMPLATE_URL = "https://raw.githubusercontent.com/parrafran87-dev/upre-alerta-temprana/main/Boleta%20Alerta%20Temprana.xlsm";

/************************* Utilidad de descarga ***************************/
function saveFile(buffer: ArrayBuffer, filename: string) {
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/************************* Constantes ************************/ 
export const SHEETS = [
  "Hoja 1 Boleta Alerta temprana",
  "Hoja 2 Boleta de seguimiento",
  "Hoja 3 Plan de atención",
  "Hoja 4 Base de datos",
] as const;
export type SheetName = typeof SHEETS[number];

/************************* Tipos ***************************/
export type FieldDef = {
  key: string;
  label: string;
  placeholder?: string;
  type?: "text" | "select" | "date";
  options?: string[];
};
export type Target = { sheet: SheetName; addr: string };
export type Mapping = Record<string, Target[]>;
export type Values = Record<string, string>;

/************************* Campos ***************************/
export const FIELDS: FieldDef[] = [
  { key: "nombre", label: "Nombre", placeholder: "Juan Pérez", type: "text" },
  { key: "cedula", label: "Cédula", placeholder: "123456789", type: "text" },
  { key: "telefono", label: "Teléfono", placeholder: "88888888", type: "text" },
  { key: "edad", label: "Edad", placeholder: "15", type: "text" },
  { key: "seccion", label: "Sección", placeholder: "7-3", type: "text" },
  { key: "nivel", label: "Nivel", placeholder: "Sétimo", type: "text" },
  { key: "fecha", label: "Fecha", type: "date" },
  { key: "encargado", label: "Encargado", placeholder: "Nombre del encargado", type: "text" },
  { key: "telefono_encargado", label: "Teléfono Encargado", placeholder: "88888888", type: "text" },
  { key: "centro_educativo", label: "Centro Educativo", placeholder: "Nombre del centro", type: "text" },
  { key: "docente", label: "Docente", placeholder: "Nombre del docente", type: "text" },
  { key: "observaciones", label: "Observaciones", placeholder: "Texto", type: "text" },
  { key: "estado_persona", label: "Estado de la Persona Estudiante", type: "select", options: ["Riesgo de exclusión", "Excluida"] },
  { key: "dimension", label: "Dimensión", type: "select", options: [
      "Desempeno_educativo",
      "Convivencia_estudiantil",
      "Condición_económica",
      "Condición_familiar",
      "Riesgo_social",
      "Condición_cultural",
      "Condición_de_acceso",
      "Condición_de_salud",
    ] },
  { key: "tipo_alerta", label: "Tipo de Alerta", type: "select", options: [
      "Bajo rendimiento académico.",
      "Ausentismo a lecciones",
      "Repitencia / estudiante rezagado en alguna asignatura.",
      "Traslados repetitivos anualmente de la persona estudiante.",
      "Calificación de conducta reprobada.",
      "Hospitalización o convalecencia.",
      "Suspensión de la persona estudiante al centro educativo",
      "Ideación y tentativa de suicidio del estudiante.",
      "Lesiones autoinfligidas del estudiante.",
      "Trastornos alimenticios del estudiante.",
      "Condiciones de salud recurrentes a tratamiento.",
      "Persona estudiantes que presentan alergias medicamentosas, vectores y alimentarias.",
      "Afectación por situación de desastre de origen natural y/o antrópico o causado por el ser humano.",
    ] },
  { key: "estado_alerta", label: "Estado de la alerta", type: "select", options: ["Activada", "Proceso", "Espera", "Eliminada"] },
  { key: "oferta", label: "Oferta", type: "select", options: [
      "EDUCACIÓN ESPECIAL",
      "EDUCACIÓN PARA PERSONAS JÓVENES Y ADULTOS",
      "CICLO MATERNO INFANTIL Y TRANSICIÓN",
      "EDUCACIÓN TÉCNICA",
      "I Y II CICLOS DE LA EDUCACIÓN GENERAL BÁSICA",
      "III CICLO  Y EDUCACIÓN DIVERSIFICADA",
    ] },
  { key: "modalidad_epja", label: "Modalidad EPJA", type: "select", options: [
      "CINDEA CONVENCIONAL",
      "CINDEA-TÉCNICO DIURNO-COMERCIAL Y SERVICIOS",
      "COLEGIO ACADÉMICO NOCTURNO",
      "CONED-VIRTUAL",
      "ESCUELA NOCTURNA",
      "IPEC CONVENCIONAL",
      "IPEC-TÉCNICO DIURNO-COMERCIAL Y SERVICIOS",
      "IPEC-TÉCNICO DIURNO-INDUSTRIAL",
      "PLAN 2 AÑOS-COMERCIAL Y SERVICIOS",
      "PROYECTO O SEDE DE EDUCACIÓN ABIERTA",
    ] },
  { key: "direccion_regional", label: "Dirección Regional", type: "select", options: [
      "San José-Central","San José-Norte","San José Sur-Oeste","Desamparados","Los Santos","Puriscal","Pérez Zeledón","Alajuela","Occidente","San Carlos","Zona Norte-Norte","Cartago","Turrialba","Heredia","Sarapiquí","Liberia","Cañas","Nicoya","Santa Cruz","Puntarenas","Peninsular","Aguirre","Grande de Térraba","Coto","Limón","Sulá","Guápiles"
    ] },
  { key: "circuito", label: "Circuito", type: "select", options: ["01","02","03","04","05","06","07","08","09","10","11"] },
  { key: "fecha_activacion_at", label: "Fecha de Activación de la AT", type: "date" },
  { key: "fecha_cierre_at", label: "Fecha de cierre de la AT", type: "date" },
  { key: "docente_encargado_at", label: "Docente encargado de la AT", type: "text" },
  { key: "funcionario_saber", label: "Funcionario que registra en SABER", type: "text" },
  { key: "institucion_referida", label: "Institución a la que se refiere", type: "text" },
  { key: "codigo_institucional", label: "Código institucional", type: "text" },
];

/************************* Mapeo ***************************/
export const MAP: Mapping = {
  nombre: [
    { sheet: SHEETS[0], addr: "E2" },
    { sheet: SHEETS[2], addr: "D4" },
    { sheet: SHEETS[3], addr: "B10" },
  ],
  cedula: [
    { sheet: SHEETS[0], addr: "J2" },
    { sheet: SHEETS[2], addr: "C5" },
    { sheet: SHEETS[3], addr: "C10" },
  ],
  telefono: [{ sheet: SHEETS[0], addr: "L2:M2:N2" }],
  edad: [{ sheet: SHEETS[0], addr: "E3" }],
  seccion: [
    { sheet: SHEETS[0], addr: "J3" },
    { sheet: SHEETS[2], addr: "C6" },
    { sheet: SHEETS[3], addr: "E10" },
  ],
  nivel: [{ sheet: SHEETS[3], addr: "D10" }],
  fecha: [{ sheet: SHEETS[0], addr: "L3:M3:N3" }],
  encargado: [
    { sheet: SHEETS[0], addr: "E4:F4:G4:H4:I4" },
    { sheet: SHEETS[2], addr: "C7" },
  ],
  telefono_encargado: [{ sheet: SHEETS[0], addr: "K4:L4:M4:N4" }],
  centro_educativo: [
    { sheet: SHEETS[0], addr: "E5" },
    { sheet: SHEETS[3], addr: "D4:E4:F4" },
  ],
  docente: [{ sheet: SHEETS[0], addr: "K5:L5:M5:N5" }],
  observaciones: [{ sheet: SHEETS[1], addr: "B16" }], // etiqueta B15, dato B16
  tipo_alerta: [{ sheet: SHEETS[3], addr: "H10" }],
  estado_persona: [{ sheet: SHEETS[3], addr: "F10" }],
  estado_alerta: [{ sheet: SHEETS[3], addr: "I10" }],
  dimension: [{ sheet: SHEETS[3], addr: "G10" }],
  fecha_activacion_at: [
    { sheet: SHEETS[1], addr: "G28" },
    { sheet: SHEETS[3], addr: "J10" },
  ],
  fecha_cierre_at: [
    { sheet: SHEETS[1], addr: "G29" },
    { sheet: SHEETS[3], addr: "K10" },
  ],
  docente_encargado_at: [{ sheet: SHEETS[1], addr: "G30" }],
  funcionario_saber: [{ sheet: SHEETS[1], addr: "G31" }],
  institucion_referida: [{ sheet: SHEETS[2], addr: "B18" }],
  codigo_institucional: [{ sheet: SHEETS[3], addr: "D5:E5:F5" }],
  direccion_regional: [{ sheet: SHEETS[3], addr: "H4" }],
  circuito: [{ sheet: SHEETS[3], addr: "H5" }],
  oferta: [{ sheet: SHEETS[3], addr: "D6:E6:F6" }],
  modalidad_epja: [{ sheet: SHEETS[3], addr: "H6" }],
};

/************************* Utilidades ***************************/
function formatDateToDDMMYYYY(dateStr: string): string {
  if (!dateStr) return "";
  const [year, month, day] = dateStr.split("-");
  return `${day}/${month}/${year}`;
}

function colToNum(col: string): number {
  let n = 0;
  for (let i = 0; i < col.length; i++) n = n * 26 + (col.charCodeAt(i) - 64);
  return n;
}
function numToCol(n: number): string {
  let s = "";
  while (n > 0) {
    const m = (n - 1) % 26;
    s = String.fromCharCode(65 + m) + s;
    n = Math.floor((n - 1) / 26);
  }
  return s;
}
function isListAddr(addr: string): boolean {
  return (addr.match(/:/g) || []).length >= 2;
}
function normalizeRange(addr: string): { range: string; anchor: string } {
  if (!isListAddr(addr)) {
    const parts = addr.split(":");
    if (parts.length === 2) return { range: addr, anchor: parts[0] };
    return { range: addr, anchor: addr };
  }
  const cells = addr.split(":");
  const rows = new Set<number>();
  let minCol = Infinity, maxCol = -Infinity, rowNum = -1;
  for (const c of cells) {
    const m = c.match(/([A-Z]+)(\d+)/i);
    if (!m) continue;
    const col = m[1].toUpperCase();
    const row = parseInt(m[2], 10);
    rows.add(row);
    minCol = Math.min(minCol, colToNum(col));
    maxCol = Math.max(maxCol, colToNum(col));
    rowNum = row;
  }
  if (rows.size !== 1) return { range: cells[0], anchor: cells[0] };
  const left = `${numToCol(minCol)}${rowNum}`;
  const right = `${numToCol(maxCol)}${rowNum}`;
  return { range: `${left}:${right}`, anchor: left };
}

/************************* Helpers de estilo ***************************/
const labelFont: Partial<Font> = { name: "Calibri", size: 11, bold: true };
const dataFont: Partial<Font> = { name: "Calibri", size: 11, bold: true, underline: true }; // negrita + subrayado

/*************** Plantillas (etiquetas/campos en negrita) ***************/
function applyHoja1Template(ws: Worksheet) {
  const widths = [8, 10, 12, 14, 16, 16, 10, 10, 12, 12, 12, 12];
  widths.forEach((w, i) => (ws.getColumn(i + 1).width = w));

  ws.mergeCells("A1:L1");
  const title = ws.getCell("A1");
  title.value = "Boleta de Alerta temprana";
  title.font = { size: 14, name: "Calibri", bold: true };
  title.alignment = { horizontal: "center", vertical: "middle" } as any;
  (title as any).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFE8EEF7" } };

  for (let r = 2; r <= 5; r++) {
    for (let c = 1; c <= 12; c++) {
      const cell = ws.getCell(r, c);
      (cell as any).border = {
        top: { style: "thin", color: { argb: "FFBFBFBF" } },
        left: { style: "thin", color: { argb: "FFBFBFBF" } },
        bottom: { style: "thin", color: { argb: "FFBFBFBF" } },
        right: { style: "thin", color: { argb: "FFBFBFBF" } },
      };
      cell.font = { name: "Calibri", size: 11 };
    }
  }

  for (let c = 1; c <= 12; c++) {
    const cell = ws.getCell(2, c);
    (cell as any).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF5F5F5" } };
    (cell as any).alignment = { vertical: "middle" };
  }

  const right = { horizontal: "right", vertical: "middle" } as any;
  ws.mergeCells("B2:D2"); ws.getCell("B2").value = "Nombre de la persona estudiante:"; (ws.getCell("B2") as any).alignment = right; ws.getCell("B2").font = labelFont as Font;
  ws.mergeCells("B3:D3"); ws.getCell("B3").value = "Edad:"; (ws.getCell("B3") as any).alignment = right; ws.getCell("B3").font = labelFont as Font;
  ws.mergeCells("B4:D4"); ws.getCell("B4").value = "Nombre del encargado/a del estudiante:"; (ws.getCell("B4") as any).alignment = right; ws.getCell("B4").font = labelFont as Font;
  ws.mergeCells("B5:D5"); ws.getCell("B5").value = "Nombre del Centro Educativo :"; (ws.getCell("B5") as any).alignment = right; ws.getCell("B5").font = labelFont as Font;

  ws.mergeCells("G2:I2"); ws.getCell("G2").value = "Cédula:"; (ws.getCell("G2") as any).alignment = right; ws.getCell("G2").font = labelFont as Font;
  ws.mergeCells("G3:I3"); ws.getCell("G3").value = "Sección:"; (ws.getCell("G3") as any).alignment = right; ws.getCell("G3").font = labelFont as Font;
  ws.getCell("J4").value = "Teléfono /Móvil:"; (ws.getCell("J4") as any).alignment = right; ws.getCell("J4").font = labelFont as Font;
  ws.mergeCells("G5:J5"); ws.getCell("G5").value = "Nombre de la persona docente :"; (ws.getCell("G5") as any).alignment = right; ws.getCell("G5").font = labelFont as Font;

  ws.getCell("K2").value = "Teléfono /Móvil:"; (ws.getCell("K2") as any).alignment = right; ws.getCell("K2").font = labelFont as Font;
  ws.getCell("K3").value = "Fecha:"; (ws.getCell("K3") as any).alignment = right; ws.getCell("K3").font = labelFont as Font;

  (ws as any).views = [{ state: "frozen", ySplit: 1 }];
}

function applyHoja2Template(ws: Worksheet) {
  const right = { horizontal: "right", vertical: "middle" } as any;
  ws.getCell("B15").value = "Observaciones:";
  (ws.getCell("B15") as any).alignment = right;
  ws.getCell("B15").font = labelFont as Font;
}

function applyHoja3Template(ws: Worksheet) {
  const right = { horizontal: "right", vertical: "middle" } as any;
  ws.mergeCells("B4:C4"); ws.getCell("B4").value = "Nombre del estudiante:"; (ws.getCell("B4") as any).alignment = right; ws.getCell("B4").font = labelFont as Font;
  ws.getCell("B5").value = "Cédula:"; (ws.getCell("B5") as any).alignment = right; ws.getCell("B5").font = labelFont as Font;
  ws.getCell("B6").value = "Sección:"; (ws.getCell("B6") as any).alignment = right; ws.getCell("B6").font = labelFont as Font;
  ws.getCell("B7").value = "Contacto:"; (ws.getCell("B7") as any).alignment = right; ws.getCell("B7").font = labelFont as Font;
  ws.getCell("B8").value = "ALERTAS:"; (ws.getCell("B8") as any).alignment = right; ws.getCell("B8").font = labelFont as Font;
}

function applyHoja4Template(ws: Worksheet) {
  const right = { horizontal: "right", vertical: "middle" } as any;
  ws.mergeCells("B4:C4"); ws.getCell("B4").value = "Centro Educativo o Sede:"; (ws.getCell("B4") as any).alignment = right; ws.getCell("B4").font = labelFont as Font;
  ws.mergeCells("B5:C5"); ws.getCell("B5").value = "Código institucional:"; (ws.getCell("B5") as any).alignment = right; ws.getCell("B5").font = labelFont as Font;
  ws.getCell("C6").value = "Oferta:"; (ws.getCell("C6") as any).alignment = right; ws.getCell("C6").font = labelFont as Font;
  ws.getCell("G4").value = "Dirección Regional:"; (ws.getCell("G4") as any).alignment = right; ws.getCell("G4").font = labelFont as Font;
  ws.getCell("G5").value = "Circuito:"; (ws.getCell("G5") as any).alignment = right; ws.getCell("G5").font = labelFont as Font;
  ws.getCell("G6").value = "Modalidad EPJA:"; (ws.getCell("G6") as any).alignment = right; ws.getCell("G6").font = labelFont as Font;
}

/************************* Generación XLSX ***************************/
async function generateWorkbook(values: Values) {
  let wb = new ExcelJS.Workbook();
  let usedTemplate = false;

  // 1) Intentar cargar el machote (xlsm) desde GitHub RAW.
  try {
    const resp = await fetch(TEMPLATE_URL, { cache: "no-store" });
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    const buf = await resp.arrayBuffer();
    await wb.xlsx.load(buf); // Al guardar, ExcelJS exportará .xlsx (macros no se preservan)
    usedTemplate = true;
  } catch (e) {
    // 2) Fallback: generar desde cero con nuestras plantillas si el fetch falla o CORS bloquea
    wb = new ExcelJS.Workbook();
    const ws1 = wb.addWorksheet(SHEETS[0].slice(0, 31));
    const ws2 = wb.addWorksheet(SHEETS[1].slice(0, 31));
    const ws3 = wb.addWorksheet(SHEETS[2].slice(0, 31));
    const ws4 = wb.addWorksheet(SHEETS[3].slice(0, 31));
    applyHoja1Template(ws1);
    applyHoja2Template(ws2);
    applyHoja3Template(ws3);
    applyHoja4Template(ws4);
  }

  // Mapa de hojas: intentar por nombre y, si no existe, por índice
  const wsByNameOrIndex = (name: SheetName, idx: number): Worksheet => {
    const byName = wb.getWorksheet(name);
    if (byName) return byName as Worksheet;
    const byIndex = wb.worksheets[idx];
    if (!byIndex) throw new Error(`No se encontró la hoja requerida: ${name}`);
    return byIndex as Worksheet;
  };

  const ws1 = wsByNameOrIndex(SHEETS[0], 0);
  const ws2 = wsByNameOrIndex(SHEETS[1], 1);
  const ws3 = wsByNameOrIndex(SHEETS[2], 2);
  const ws4 = wsByNameOrIndex(SHEETS[3], 3);
  const wsMap: Record<SheetName, Worksheet> = {
    [SHEETS[0]]: ws1,
    [SHEETS[1]]: ws2,
    [SHEETS[2]]: ws3,
    [SHEETS[3]]: ws4,
  } as const;

  // Escribir datos
  for (const [fieldKey, targets] of Object.entries(MAP)) {
    let val = values[fieldKey] ?? "";
    if (fieldKey.includes("cedula") || fieldKey.includes("telefono")) val = val.replace(/-/g, "");
    if (fieldKey.includes("fecha")) val = formatDateToDDMMYYYY(val);

    for (const t of targets) {
      const ws = wsMap[t.sheet];
      const { range, anchor } = normalizeRange(t.addr);

      // En plantilla: NO forzar merges (el machote ya define los merges). Desde cero: aplicar merge si corresponde.
      if (!usedTemplate && range.includes(":")) {
        try { ws.mergeCells(range); } catch {}
      }
      const cell = ws.getCell(anchor);
      cell.value = String(val);
      (cell as any).alignment = { vertical: "middle" };
      cell.font = dataFont as Font; // datos del usuario: negrita + subrayado
    }
  }

  const buffer = await wb.xlsx.writeBuffer();
  // Nota: aunque la plantilla es .xlsm, ExcelJS exporta .xlsx y se pierden macros. Si necesitas conservar macros, se requerirá otra estrategia.
  saveFile(buffer as ArrayBuffer, "Boleta_Alerta_Temprana.xlsx");
}

/************************* Autotests ligeros ***************************/
function DevChecks() {
  useEffect(() => {
    // Test 1: fecha → DD/MM/YYYY
    console.assert(formatDateToDDMMYYYY("2025-10-17") === "17/10/2025", "Formato de fecha incorrecto");
    console.assert(formatDateToDDMMYYYY("") === "", "Fecha vacía debe devolver cadena vacía");

    // Test 2: normalización de rango tipo lista
    const r = normalizeRange("L2:M2:N2");
    console.assert(r.range === "L2:N2" && r.anchor === "L2", `Normalización incorrecta: ${r.range}, ${r.anchor}`);

    // Test 3: funciones de plantilla existen
    console.assert(typeof applyHoja1Template === "function", "applyHoja1Template debe existir");
    console.assert(typeof applyHoja2Template === "function", "applyHoja2Template debe existir");
    console.assert(typeof applyHoja3Template === "function", "applyHoja3Template debe existir");
    console.assert(typeof applyHoja4Template === "function", "applyHoja4Template debe existir");
  }, []);
  return null;
}

/************************* UI ******************************/
export default function App() {
  const initialValues: Values = useMemo(() => {
    const v: Values = {};
    for (const f of FIELDS) {
      if (f.type === "date") {
        v[f.key] = new Date().toISOString().slice(0, 10);
      } else {
        v[f.key] = "";
      }
    }
    return v;
  }, []);

  const [values, setValues] = useState<Values>(initialValues);

  function setValue(key: string, val: string) {
    setValues((s) => ({ ...s, [key]: val }));
  }

  async function onGenerate() {
    await generateWorkbook(values);
  }

return (
  <div className="min-h-screen w-full bg-gray-50">
    <DevChecks />

    <div className="mx-auto max-w-6xl p-4 flex flex-col gap-4">
      <header className="flex items-center justify-between">
        <h1 className="text-lg font-bold text-blue-700">
          Generador de Alerta Temprana. UPRE
        </h1>
      </header>

      {/* FORMULARIO EN 3 COLUMNAS */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {FIELDS.map((f: FieldDef) => (
          <label
            key={f.key}
            className="bg-white border rounded-lg p-2 flex flex-col gap-1"
          >
            <span className="text-xs font-semibold text-gray-700">
              {f.label}
            </span>

            {f.type === "select" ? (
              <select
                className="w-full border rounded-md px-2 py-1 text-sm"
                value={values[f.key]}
                onChange={(e) => setValue(f.key, e.target.value)}
              >
                <option value="">Seleccione…</option>
                {(f.options || []).map((opt: string) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            ) : f.type === "date" ? (
              <input
                type="date"
                className="w-full border rounded-md px-2 py-1 text-sm"
                value={values[f.key]}
                onChange={(e) => setValue(f.key, e.target.value)}
              />
            ) : (
              <input
                className="w-full border rounded-md px-2 py-1 text-sm"
                placeholder={f.placeholder || ""}
                value={values[f.key]}
                onChange={(e) => setValue(f.key, e.target.value)}
              />
            )}

            {MAP[f.key]?.length ? (
              <span className="text-[11px] text-indigo-700 leading-tight">
                {(MAP[f.key] as Target[])
                  .map((t: Target) => `${t.sheet}:${t.addr}`)
                  .join(" · ")}
              </span>
            ) : (
              <span className="text-[11px] text-gray-400">
                (sin destino configurado)
              </span>
            )}
          </label>
        ))}
      </section>

      <div className="pt-2">
        <button
          className="px-3 py-1.5 bg-blue-600 text-white rounded-md text-sm"
          onClick={onGenerate}
        >
          Generar Excel
        </button>
      </div>

      <footer className="mt-6 text-sm text-gray-700">
        <div className="flex flex-col gap-2">
          <a
            href="https://servicioselectorales.tse.go.cr/chc/menu.htm"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-700 underline font-medium"
          >
            🔎 Consulta Registro Civil (TSE): nombre y cédula
          </a>

          <a
            href="#"
            aria-disabled="true"
            className="text-blue-700 underline font-medium opacity-60 cursor-not-allowed"
            title="Se agregará el enlace de descarga cuando el sitio github.io esté publicado"
          >
            ⬇️ Machote oficial de Boletas AT (MEP)
          </a>

          <div className="text-gray-600">
            Contacto:{" "}
            <a
              href="mailto:francini.ramirez.parra@mep.go.cr"
              className="underline"
            >
              francini.ramirez.parra@mep.go.cr
            </a>
          </div>
        </div>
      </footer>
    </div>
  </div>
);


