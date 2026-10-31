import React from "react";
import { render, screen, within, waitFor, act } from "@testing-library/react";
import IncomeLive from "./IncomeLive";

const snapshot = {
  now: "2026-10-26T20:44:29",
  date: "2026-10-26",
  isToday: true,
  totals: { total: 90331, count: 149, confirmed: 25930, pending: 64401, students: 146, compareTotal: 176287, compareCount: 163, yesterdayFull: 198157, monthToDate: 5911330, previousMonthToDate: 6113608, bestHour: 15 },
  hourly: Array.from({ length: 24 }, (_, hour) => ({ hour, today: hour === 9 ? 20913 : 0, yesterday: hour === 15 ? 93685 : 0, count: 0 })),
  types: [
    { key: "monthly", label: "قسط شهري", count: 105, total: 63794, compareTotal: 160237 },
    { key: "advance", label: "دفعة مقدمة (طلب التحاق)", count: 42, total: 26087, compareTotal: 14500 }
  ],
  branches: [
    { guid: "b1", name: "فرع الدمام حي الزهور مدينة الأعمال2 (نساء)", total: 19893, count: 23, compareTotal: 13176, lastAt: "2026-10-26T15:26:15", last14: Array(14).fill(1000) },
    { guid: "b2", name: "فرع خميس مشيط سكوير (رجال)", total: 1850, count: 6, compareTotal: 92550, lastAt: "2026-10-26T15:10:13", last14: Array(14).fill(500) }
  ],
  daily: Array.from({ length: 14 }, (_, i) => ({ date: `2026-10-${String(13 + i).padStart(2, "0")}`, total: 1000 * (i + 1) })),
  feed: [
    { id: 153086, code: "153086", at: "2026-10-26T20:35:11", total: 250, type: "monthly", typeLabel: "قسط شهري", docName: "", branch: "فرع المدينة المنورة (نساء)", student: "سيد علي بخيت", user: "موظف", confirmed: false }
  ]
};

// الرسوم بتحتاج ResizeObserver ومش موجود في بيئة الاختبار
global.ResizeObserver = class {
  observe() {}
  unobserve() {}
  disconnect() {}
};

beforeEach(() => {
  localStorage.setItem("user", JSON.stringify({ guid: "u1" }));
  global.fetch = jest.fn(async (url) => ({ ok: true, json: async () => (String(url).includes("/version") ? { version: "1|1|0" } : snapshot) }));
});

test("shows today's income against yesterday, branches, and the live feed", async () => {
  render(<IncomeLive />);
  expect(await screen.findByText("90,331 ر.س")).toBeInTheDocument();
  // 90,331 مقابل 176,287 أمس لنفس الساعة = هبوط 48.8%
  expect(screen.getByText("-48.8%")).toBeInTheDocument();

  const up = screen.getByText("فرع الدمام حي الزهور مدينة الأعمال2 (نساء)").closest("tr");
  expect(within(up).getByText("+51.0%")).toBeInTheDocument();
  const down = screen.getByText("فرع خميس مشيط سكوير (رجال)").closest("tr");
  expect(within(down).getByText("-98.0%")).toBeInTheDocument();

  expect(screen.getAllByText("سيد علي بخيت").length).toBeGreaterThan(0);
  expect(screen.getByText("بانتظار التأكيد")).toBeInTheDocument();
  await waitFor(() => expect(String(global.fetch.mock.calls[0][0])).toContain("/api/income-live/snapshot?userGuid=u1"));
});

test("checks for new requests every 5 seconds and reloads only when something changed", async () => {
  jest.useFakeTimers();
  let version = "153086|149|41";
  global.fetch = jest.fn(async (url) => ({ ok: true, json: async () => (String(url).includes("/version") ? { version } : snapshot) }));
  render(<IncomeLive />);
  await screen.findByText("90,331 ر.س");
  const snapshots = () => global.fetch.mock.calls.filter((c) => String(c[0]).includes("/snapshot")).length;
  const before = snapshots();

  await act(async () => { jest.advanceTimersByTime(5000); });
  await act(async () => { jest.advanceTimersByTime(5000); });
  expect(snapshots()).toBe(before);

  version = "153087|150|41";
  await act(async () => { jest.advanceTimersByTime(5000); });
  await waitFor(() => expect(snapshots()).toBe(before + 1));
  jest.useRealTimers();
});
