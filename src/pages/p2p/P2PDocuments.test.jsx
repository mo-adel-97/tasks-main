import React from "react";
import { render, screen, fireEvent, waitFor, within } from "@testing-library/react";
import Swal from "sweetalert2";
import P2PThankLetter from "./P2PThankLetter";
import P2PDocuments from "./P2PDocuments";
import { letterVerifyUrl } from "./ThankLetterDocument";

jest.mock("sweetalert2", () => ({ fire: jest.fn() }));
jest.mock("../OfferPricePage", () => () => <div>شاشة عرض السعر</div>);

const company = { guid: "c1", name: "شركة ألفا", isActive: true, contactName: "أحمد", contactTitle: "مدير التدريب" };

beforeEach(() => {
  localStorage.setItem("user", JSON.stringify({ guid: "u1" }));
  Swal.fire.mockReset();
  Swal.fire.mockImplementation(async () => ({ isConfirmed: true }));
  global.fetch = jest.fn(async (url, options = {}) => {
    const u = String(url);
    const json = u.includes("/api/p2p/companies")
      ? [company]
      : u.includes("/api/p2p/letters") && options.method === "POST"
        ? { message: "تم", guid: "l1", serial: "SSTLI-TL-2026-00001", verifyCode: "ABCD2345EF", letterDate: "2026-10-28" }
        : u.includes("/api/p2p/letters")
          ? []
          : {};
    return { ok: true, json: async () => json };
  });
});

const bodyOf = (part, method) => {
  const call = global.fetch.mock.calls.find((c) => String(c[0]).includes(part) && c[1]?.method === method);
  return call ? JSON.parse(call[1].body) : null;
};

test("picking a company fills the letter and issuing saves it with a serial", async () => {
  render(<P2PThankLetter />);
  fireEvent.mouseDown(screen.getByLabelText(/الشركة \(من شركاتي\)/));
  fireEvent.click(await screen.findByText("شركة ألفا"));

  expect(screen.getByLabelText(/اسم الجهة/)).toHaveValue("شركة ألفا");
  expect(screen.getByLabelText(/عناية/)).toHaveValue("أحمد — مدير التدريب");
  expect(screen.getByLabelText(/نص الخطاب/).value).toContain("شركة ألفا");
  expect(screen.getByRole("button", { name: /تحميل PDF/ })).toBeDisabled();

  fireEvent.click(screen.getByRole("button", { name: /إصدار الخطاب/ }));
  await waitFor(() => expect(bodyOf("/api/p2p/letters", "POST")).toEqual(expect.objectContaining({ companyGuid: "c1", recipientName: "شركة ألفا", subject: "شكر وتقدير" })));
  expect(await screen.findByText("صادر برقم SSTLI-TL-2026-00001")).toBeInTheDocument();
  expect(screen.getByRole("button", { name: /تحميل PDF/ })).toBeEnabled();
});

test("documents tab offers the thank-you letter, the price offer and the logos", async () => {
  render(<P2PDocuments />);
  expect(await screen.findByText("خطاب شكر", { selector: "p" })).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: /عرض سعر/ }));
  expect(screen.getByText("شاشة عرض السعر")).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: /شعار المعهد/ }));
  const links = screen.getAllByRole("link", { name: /تحميل/ });
  expect(links.map((a) => a.getAttribute("href"))).toEqual(["/brand/sstli-logo.png", "/brand/sstli-logo.jpg", "/offer-price/header.png"]);
});

test("the QR always points to the fixed verification page on the API, whatever machine issued the letter", () => {
  expect(letterVerifyUrl("ABCD2345EF")).toBe("https://api4.sstli.com/api/p2p/letters/check/ABCD2345EF");
});
