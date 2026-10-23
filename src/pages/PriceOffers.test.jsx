import React from "react";
import { render, screen, fireEvent, waitFor, within } from "@testing-library/react";
import Swal from "sweetalert2";
import PriceOffers from "./PriceOffers";

jest.mock("sweetalert2", () => ({ fire: jest.fn() }));

const lookups = {
  canEdit: true,
  today: "2026-10-19",
  branches: [
    { guid: "b1", name: "فرع الرياض" },
    { guid: "b2", name: "فرع الدمام" }
  ],
  diplomas: [
    { guid: "d1", name: "دبلوم الإدارة المكتبية", regType: 0, regTypeName: "دبلوم", chkNational: 0 },
    { guid: "c1", name: "دورة اللغة الإنجليزية", regType: 2, regTypeName: "دورة تطويرية", chkNational: 3 }
  ]
};
const list = {
  offers: [
    { guid: "o1", name: "عرض الخريف", startDate: "2026-10-01", endDate: "2026-10-31", isActive: true, status: "running", branchesCount: 2, diplomasCount: 3, minPrice: 8000, maxPrice: 9000 }
  ],
  legacy: [{ guid: "l1", code: "30", name: "عرض نهاية العام", regTypeName: "دبلوم", itemsCount: 11, branches: "فرع الرياض", startIn: "19/06/1447" }]
};

beforeEach(() => {
  localStorage.setItem("user", JSON.stringify({ guid: "F426653A-B389-4036-95F0-907920E7F205" }));
  Swal.fire.mockImplementation(async () => ({ isConfirmed: true }));
  global.fetch = jest.fn(async (url, options) => ({
    ok: true,
    json: async () => {
      if (options?.method === "POST") return { message: "تم إنشاء العرض بنجاح", guid: "new" };
      if (String(url).includes("/lookups")) return lookups;
      return list;
    }
  }));
});

test("shows offers with status and legacy count", async () => {
  render(<PriceOffers />);
  await waitFor(() => expect(screen.getByText("عرض الخريف")).toBeInTheDocument());
  expect(screen.getAllByText("ساري الآن").length).toBeGreaterThan(0);
  expect(screen.getByText("8,000 - 9,000")).toBeInTheDocument();
  expect(screen.getByRole("tab", { name: /العروض القديمة \(1\)/ })).toBeInTheDocument();
});

test("creating an offer sends one price per branch and diploma", async () => {
  render(<PriceOffers />);
  await waitFor(() => expect(screen.getByText("عرض الخريف")).toBeInTheDocument());

  fireEvent.click(screen.getByRole("button", { name: /عرض جديد/ }));
  const dialog = await screen.findByRole("dialog");
  fireEvent.change(within(dialog).getByLabelText("اسم العرض"), { target: { value: "عرض اليوم" } });
  fireEvent.click(within(dialog).getByRole("button", { name: "كل الفروع" }));

  const diplomaInput = within(dialog).getByPlaceholderText("اختر الدبلومات أو الدورات");
  fireEvent.mouseDown(diplomaInput);
  fireEvent.click(await screen.findByText("دبلوم الإدارة المكتبية"));

  fireEvent.change(within(dialog).getByLabelText("سعر دبلوم الإدارة المكتبية"), { target: { value: "7500" } });
  fireEvent.click(within(dialog).getByRole("button", { name: /حفظ العرض/ }));

  await waitFor(() => expect(global.fetch.mock.calls.some((c) => c[1]?.method === "POST")).toBe(true));
  const body = JSON.parse(global.fetch.mock.calls.find((c) => c[1]?.method === "POST")[1].body);
  expect(body).toEqual(
    expect.objectContaining({ name: "عرض اليوم", startDate: "2026-10-19", endDate: "2026-10-19", isActive: true })
  );
  expect(body.items).toEqual([
    { branchGuid: "b1", diplomGuid: "d1", price: 7500 },
    { branchGuid: "b2", diplomGuid: "d1", price: 7500 }
  ]);
});

test("legacy offer content: rename to empty and see prices", async () => {
  global.fetch = jest.fn(async (url, options) => ({
    ok: true,
    json: async () => {
      const u = String(url);
      if (options?.method === "PUT") return { message: "تم مسح اسم العرض" };
      if (u.includes("/lookups")) return lookups;
      if (u.includes("/legacy/l1"))
        return {
          info: { guid: "l1", code: "30", name: "عرض نهاية العام", regTypeName: "دبلوم", isUse: true },
          branches: [{ guid: "b1", name: "فرع الرياض" }],
          items: [{ detailGuid: "x1", name: "دبلوم الإدارة المكتبية", cost: 9000, vat: 0, tax: 0, subTotal: 9000 }]
        };
      return list;
    }
  }));
  render(<PriceOffers />);
  fireEvent.click(await screen.findByRole("tab", { name: /العروض القديمة/ }));
  fireEvent.click(await screen.findByRole("button", { name: /المحتوى/ }));
  const dialog = await screen.findByRole("dialog");
  await waitFor(() => expect(within(dialog).getByText("دبلوم الإدارة المكتبية")).toBeInTheDocument());

  fireEvent.change(within(dialog).getByLabelText("اسم العرض (ممكن تسيبه فاضي)"), { target: { value: "" } });
  fireEvent.click(within(dialog).getByRole("button", { name: /حفظ الاسم/ }));
  await waitFor(() => expect(global.fetch.mock.calls.some((c) => c[1]?.method === "PUT")).toBe(true));
  const put = global.fetch.mock.calls.find((c) => c[1]?.method === "PUT");
  expect(String(put[0])).toContain("/api/price-offers/legacy/l1");
  expect(JSON.parse(put[1].body)).toEqual({ userGuid: "F426653A-B389-4036-95F0-907920E7F205", name: "" });
});
