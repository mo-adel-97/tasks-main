import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import Swal from "sweetalert2";
import RegDownPayment from "./RegDownPayment";

jest.mock("sweetalert2", () => ({ fire: jest.fn() }));

const items = [
  { id: 9, docName: "تسجيل دبلوم حفر الباطن", branchName: "فرع حفر الباطن", isUse: true, amountPay: 250 },
  { id: 21, docName: "تسجيل دبلوم الرياض", branchName: "فرع الرياض", isUse: true, amountPay: 500 }
];

beforeEach(() => {
  Swal.fire.mockImplementation(async () => ({ isConfirmed: true }));
  localStorage.setItem("user", JSON.stringify({ guid: "F426653A-B389-4036-95F0-907920E7F205" }));
  global.fetch = jest.fn(async (url, options) => ({
    ok: true,
    json: async () => (options?.method === "PUT" ? { message: "تم", count: 2 } : { items, canEdit: true })
  }));
});

test("applies one amount to all branches", async () => {
  render(<RegDownPayment />);
  await waitFor(() => expect(screen.getByText("فرع حفر الباطن")).toBeInTheDocument());
  expect(screen.getByText("250 ريال: 1 فرع")).toBeInTheDocument();

  fireEvent.change(screen.getByLabelText("قيمة المقدم"), { target: { value: "500" } });
  fireEvent.click(screen.getByRole("button", { name: /تطبيق على كل الفروع/ }));

  await waitFor(() => expect(global.fetch.mock.calls.some((c) => c[1]?.method === "PUT")).toBe(true));
  const put = global.fetch.mock.calls.find((c) => c[1]?.method === "PUT");
  expect(JSON.parse(put[1].body)).toEqual({ userGuid: "F426653A-B389-4036-95F0-907920E7F205", amount: 500, all: true, ids: [] });
  expect(Swal.fire).toHaveBeenCalled();
});
