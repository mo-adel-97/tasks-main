// تصدير التقارير كملف Excel حقيقي (.xlsx) بدل CSV.
// التقارير القديمة بتبني نص CSV؛ excelBlobFromCsv بتاخد نفس الأجزاء اللي كانت رايحة لـ new Blob
// وترجع ملف xlsx: الشيت من اليمين للشمال، وعرض الأعمدة على قد المحتوى، والأرقام أرقام (تتجمع في Excel)
// والأرقام اللي بتبدأ بصفر (الجوال مثلًا) بتفضل نص.
import * as XLSX from "xlsx";

export const XLSX_MIME = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

// CSV (RFC 4180): فواصل وعلامات تنصيص وأسطر جوه الخلية
export const parseCsv = (text) => {
  const rows = [];
  let row = [];
  let cell = "";
  let quoted = false;

  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          cell += '"';
          i += 1;
        } else {
          quoted = false;
        }
      } else {
        cell += ch;
      }
    } else if (ch === '"') {
      quoted = true;
    } else if (ch === ",") {
      row.push(cell);
      cell = "";
    } else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && text[i + 1] === "\n") i += 1;
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
    } else {
      cell += ch;
    }
  }
  if (cell !== "" || row.length) {
    row.push(cell);
    rows.push(row);
  }
  return rows;
};

const NUMBER = /^-?(0|[1-9]\d{0,14})(\.\d+)?$/;

const toCell = (value) => {
  let text = String(value ?? "");
  // حماية CSV القديمة من الصيغ ('=...) أو إجبار النص (\t0555...)
  if (text.startsWith("\t")) return text.slice(1);
  if (/^'[=+\-@]/.test(text)) return text.slice(1);
  text = text.trim();
  return NUMBER.test(text) ? Number(text) : text;
};

export const workbookFromRows = (rows, sheetName = "التقرير") => {
  const data = rows.map((r) => r.map(toCell));
  const sheet = XLSX.utils.aoa_to_sheet(data);
  const widths = [];
  data.forEach((r) =>
    r.forEach((v, i) => {
      widths[i] = Math.min(60, Math.max(widths[i] || 8, String(v ?? "").length + 2));
    })
  );
  sheet["!cols"] = widths.map((wch) => ({ wch }));
  if (data.length > 1) sheet["!autofilter"] = { ref: XLSX.utils.encode_range({ s: { r: 0, c: 0 }, e: { r: 0, c: Math.max(0, (data[0] || []).length - 1) } }) };

  const book = XLSX.utils.book_new();
  book.Workbook = { Views: [{ RTL: true }] };
  XLSX.utils.book_append_sheet(book, sheet, sheetName.slice(0, 31));
  return book;
};

/** نفس اللي كان بيتبعت لـ new Blob([...], { type: "text/csv" }) → Blob لملف xlsx */
export const excelBlobFromCsv = (parts, sheetName) => {
  const text = (Array.isArray(parts) ? parts : [parts]).map((p) => String(p ?? "")).join("").replace(/^﻿/, "");
  const book = workbookFromRows(parseCsv(text), sheetName);
  const buffer = XLSX.write(book, { bookType: "xlsx", type: "array" });
  return new Blob([buffer], { type: XLSX_MIME });
};
