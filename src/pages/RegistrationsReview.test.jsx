import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import RegistrationsReview from "./RegistrationsReview";

const columns = ["regDate", "code", "regType", "studentName", "studentTel", "nationalId", "diplomName", "batch", "notes", "net", "tax", "total", "branch", "seller", "platform"];
const rows = [
  ["2026-10-15T10:00:00", "1001", "دبلوم", "أحمد علي", "0555", "1111", "دبلوم إدارة", "21/05/1448", "", 1000, 0, 1000, "المدينة رجال", "محمد", "بحث عن معهد"],
  ["2026-10-16T11:00:00", "1002", "دورة تطويرية", "سارة محمد", "0556", "2222", "تنمية الموارد", "2026-10-20", "", 83.48, 12.52, 96, "خميس نسائي", "هيفاء", "بدون"]
];

beforeEach(() => {
  localStorage.setItem("user", JSON.stringify({ guid: "F426653A-B389-4036-95F0-907920E7F205" }));
  global.fetch = jest.fn(async () => ({ ok: true, json: async () => ({ columns, rows, count: 2, truncated: false, maxRows: 50000 }) }));
});

test("loads the registrations for the period and shows totals; search filters", async () => {
  render(<RegistrationsReview />);
  fireEvent.click(screen.getByRole("button", { name: "عرض" }));

  await waitFor(() => expect(screen.getByText("عدد التسجيلات: 2")).toBeInTheDocument());
  expect(global.fetch.mock.calls[0][0]).toContain("/api/registrations-review?");
  expect(global.fetch.mock.calls[0][0]).toContain("userGuid=F426653A");
  expect(screen.getByText("الإجمالي: 1,096.00")).toBeInTheDocument();

  fireEvent.change(screen.getByPlaceholderText(/بحث سريع/), { target: { value: "2222" } });
  await waitFor(() => expect(screen.getByText("عدد التسجيلات: 1")).toBeInTheDocument());
  expect(screen.getByText("الإجمالي: 96.00")).toBeInTheDocument();
});
