import * as XLSX from "xlsx";
import { excelBlobFromCsv, parseCsv, workbookFromRows, XLSX_MIME } from "./excelExport";

test("parses quoted CSV with commas, quotes and new lines", () => {
  const rows = parseCsv('"الاسم","ملاحظة"\r\n"أحمد","قال ""مرحبا"", وخلاص"\r\n"سارة","سطر1\nسطر2"');
  expect(rows).toEqual([
    ["الاسم", "ملاحظة"],
    ["أحمد", 'قال "مرحبا", وخلاص'],
    ["سارة", "سطر1\nسطر2"]
  ]);
});

test("numbers become numbers, leading-zero values stay text, sheet is RTL", () => {
  const book = workbookFromRows([
    ["الاسم", "الجوال", "المبلغ", "رقم الهوية"],
    ["أحمد", "0555123456", "250.50", "1212784134"]
  ]);
  const sheet = book.Sheets[book.SheetNames[0]];
  expect(sheet.B2.v).toBe("0555123456");
  expect(sheet.C2.v).toBe(250.5);
  expect(sheet.D2.t).toBe("n");
  expect(book.Workbook.Views[0].RTL).toBe(true);
});

test("returns an xlsx blob from the same parts that went to the CSV blob", async () => {
  const blob = excelBlobFromCsv(["﻿", '"أ","ب"\r\n"1","2"']);
  expect(blob.type).toBe(XLSX_MIME);
  const buffer = await new Response(blob).arrayBuffer();
  const book = XLSX.read(buffer, { type: "array" });
  const sheet = book.Sheets[book.SheetNames[0]];
  expect(sheet.A1.v).toBe("أ");
  expect(sheet.B2.v).toBe(2);
});
