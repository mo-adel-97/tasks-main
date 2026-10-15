import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import UserActionReport from "./UserActionReport";

const columns = ["id", "at", "screen", "action", "code", "reason", "user", "branch", "source", "device", "ip", "deviceId", "page", "program", "agent", "fingerprint"];
const rows = [
  [3, "2026-10-15T15:20:00", "عرض سعر", "جديد", "55", "", "أحمد علي", "المدينة رجال", "Web", "كمبيوتر · Windows 11 · Chrome 129", "94.1.2.3", "d-111", "/dashboard/offer-price", "EFCore/10.0.2", "Mozilla/5.0", "fp-aaa"],
  [4, "2026-10-15T16:00:00", "سند قبض", "جديد", "99", "", "أحمد علي", "المدينة رجال", "Web", "كمبيوتر · Windows 11 · Chrome 129", "94.1.2.3", "d-222", "/dashboard/receipts", "EFCore/10.0.2", "Mozilla/5.0", "fp-aaa"],
  [2, "2026-10-15T14:10:00", "سند قبض", "تعديل", "77", "تصحيح", "سارة محمد", "خميس نسائي", "Desktop", "DESKTOP-6V8U8AL", "10.0.0.5", "", "", ".Net SqlClient Data Provider", "", ""],
  [1, "2026-10-15T09:00:00", "فاتورة", "جديد", "88", "", "أحمد علي", "المدينة رجال", "WebServer", "الويب (قبل تسجيل جهاز المستخدم)", "87.109.232.62", "", "", "EFCore/10.0.2", "", ""]
];

beforeEach(() => {
  localStorage.setItem("user", JSON.stringify({ guid: "F426653A-B389-4036-95F0-907920E7F205" }));
  global.fetch = jest.fn(async () => ({
    ok: true,
    json: async () => ({ data: { columns, rows, count: rows.length, truncated: false, maxRows: 50000, fromDate: "2026-10-15", toDate: "2026-10-15" } })
  }));
});

test("loads the report, counts users/devices and searches by device", async () => {
  render(<UserActionReport />);
  fireEvent.click(screen.getByRole("button", { name: "عرض" }));

  await waitFor(() => expect(screen.getByText("الحركات: 4")).toBeInTheDocument());
  expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining("/api/user-action-report/search"), expect.objectContaining({ method: "POST" }));
  expect(JSON.parse(global.fetch.mock.calls[0][1].body).userGuid).toBe("F426653A-B389-4036-95F0-907920E7F205");
  expect(screen.getByText("المستخدمين: 2")).toBeInTheDocument();
  expect(screen.getByText("الويب: 3")).toBeInTheDocument();
  // نفس البصمة + نفس المتصفح بمعرّفين = اتمسح المعرّف
  expect(screen.getByText("أجهزة اتغيّر معرّفها: 1")).toBeInTheDocument();
  expect(screen.getByText("الديسكتوب: 1")).toBeInTheDocument();

  // البحث بمعرّف الجهاز بيجيب حركات الجهاز ده بس
  fireEvent.change(screen.getByPlaceholderText(/بحث سريع/), { target: { value: "d-111" } });
  await waitFor(() => expect(screen.getByText("الحركات: 1")).toBeInTheDocument());
  // البحث بالبصمة بيجيب حركات الجهاز حتى بعد ما المعرّف اتغير
  fireEvent.change(screen.getByPlaceholderText(/بحث سريع/), { target: { value: "fp-aaa" } });
  await waitFor(() => expect(screen.getByText("الحركات: 2")).toBeInTheDocument());

  // بيانات هذا الجهاز
  fireEvent.click(screen.getByRole("button", { name: "بيانات هذا الجهاز" }));
  expect(await screen.findByText("بصمة الجهاز")).toBeInTheDocument();
});
