import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import CashBoxHistory from "./CashBoxHistory";

const columns = ["date", "docType", "docCode", "maden", "daen", "notes", "studentName", "costCenter", "branch", "vendorName", "vendorTax", "vendorTel", "ref", "collector", "linkedType", "linkedCode", "payDate"];
const rows = [
  ["2026-10-01T09:00:00", "سند قبض", "10", 1000, 0, "قبض رسوم", "أحمد", "مركز 1", "المدينة رجال", null, null, null, null, "محمد", null, null, "2026-10-01T09:00:00"],
  ["2026-10-02T09:00:00", "سند صرف", "11", 0, 300, "صرف مصروفات", null, "مركز 1", "المدينة رجال", "مورد", "300", "0555", "R1", null, null, null, "2026-10-02T09:00:00"]
];

beforeEach(() => {
  localStorage.setItem("user", JSON.stringify({ guid: "F426653A-B389-4036-95F0-907920E7F205" }));
  global.fetch = jest.fn(async (url) => ({
    ok: true,
    json: async () =>
      String(url).includes("/lookups")
        ? { cashBoxes: [{ guid: "a", name: "صندوق المدينة", type: 0 }], branches: [], costCenters: [], docTypes: [], users: [] }
        : { columns, rows, count: 2, truncated: false }
  }));
});

test("loads the cash movement and shows debit/credit totals", async () => {
  render(<CashBoxHistory />);
  await waitFor(() => expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining("/api/cash-box-history/lookups"), expect.anything()));

  fireEvent.click(screen.getByRole("button", { name: "عرض" }));
  await waitFor(() => expect(screen.getByText("العدد: 2")).toBeInTheDocument());

  const search = global.fetch.mock.calls.find((c) => String(c[0]).includes("/search"));
  expect(JSON.parse(search[1].body)).toEqual(expect.objectContaining({ userGuid: "F426653A-B389-4036-95F0-907920E7F205", accountGuid: null }));
  expect(screen.getByText("إجمالي مدين: 1,000.00")).toBeInTheDocument();
  expect(screen.getByText("إجمالي دائن: 300.00")).toBeInTheDocument();
  expect(screen.getByText("الرصيد: 700.00")).toBeInTheDocument();
  // من غير خزينة محددة: تنبيه إن الرصيد التراكمي بيظهر مع اختيار خزينة
  expect(screen.getByText(/الرصيد التراكمي يظهر عند اختيار خزينة/)).toBeInTheDocument();
});
