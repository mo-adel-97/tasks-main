import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import SecurityMonitorPage from "./SecurityMonitorPage";

const json = (status, body) => ({ ok: status >= 200 && status < 300, status, json: async () => body });

const overview = {
  hours: 24,
  sql: { total: 1500, ips: 3, logins: 4 },
  series: [{ at: "2026-10-15T22:00:00", count: 1500 }],
  topIps: [
    { ip: "185.93.89.154", count: 1400, logins: "sa، server", hosts: "azure-ag32nd / go-mssqldb", users: null, origin: "external", lastAt: "2026-10-15T22:58:00" },
    { ip: "87.109.232.62", count: 100, logins: "sa", hosts: "DESKTOP-27P5UHT / .Net SqlClient Data Provider", users: "مصطفى محمد", origin: "internal", lastAt: "2026-10-15T22:29:00" }
  ],
  web: { visits: 40, denied: 2, unauth: 1, monitorFail: 1, users: 5 },
  online: 3,
  actions: 12,
  changes: { changes: 7, security: 1 },
  collector: { xe: "2026-10-15T23:00:00" }
};
const status = { warnings: [{ level: "high", text: "منفذ قاعدة البيانات (1433) مفتوح على الإنترنت" }], logins: [], config: [], version: "17", edition: "Express", xeRunning: true, tokenMode: "Report" };

afterEach(() => {
  delete global.fetch;
});

test("non-admin sees only the denial message", async () => {
  global.fetch = jest.fn(async () => json(403, { message: "هذه الشاشة مخصصة لمدير النظام فقط" }));
  render(<SecurityMonitorPage />);
  expect(await screen.findByText("هذه الشاشة مخصصة لمدير النظام فقط")).toBeInTheDocument();
  expect(screen.queryByLabelText("كلمة مرور الشاشة")).not.toBeInTheDocument();
});

test("admin must enter the screen password, then sees the overview", async () => {
  const calls = [];
  global.fetch = jest.fn(async (url, init = {}) => {
    calls.push({ url, init });
    if (url.endsWith("/gate")) return json(200, { configured: true, lockedUntil: null, unlocked: false });
    if (url.endsWith("/unlock")) {
      const { password } = JSON.parse(init.body);
      return password === "right"
        ? json(200, { token: "session-token-123456789012345", expiresAt: "2099-01-01T00:00:00" })
        : json(400, { message: "كلمة المرور غير صحيحة — متبقٍ 4 محاولات" });
    }
    if (url.includes("/overview")) return json(200, overview);
    if (url.endsWith("/server-status")) return json(200, status);
    return json(404, {});
  });

  render(<SecurityMonitorPage />);
  const input = await screen.findByLabelText("كلمة مرور الشاشة");

  fireEvent.change(input, { target: { value: "wrong" } });
  fireEvent.click(screen.getByRole("button", { name: "دخول" }));
  expect(await screen.findByText("كلمة المرور غير صحيحة — متبقٍ 4 محاولات")).toBeInTheDocument();

  fireEvent.change(screen.getByLabelText("كلمة مرور الشاشة"), { target: { value: "right" } });
  fireEvent.click(screen.getByRole("button", { name: "دخول" }));

  expect(await screen.findByText("منفذ قاعدة البيانات (1433) مفتوح على الإنترنت")).toBeInTheDocument();
  expect(screen.getByText("1,500")).toBeInTheDocument();

  // كل طلبات البيانات بعد الدخول بتبعت جلسة الشاشة
  await waitFor(() => expect(calls.some((c) => c.url.includes("/overview"))).toBe(true));
  const overviewCall = calls.find((c) => c.url.includes("/overview"));
  expect(overviewCall.init.headers["X-Monitor-Session"]).toBe("session-token-123456789012345");
});

test("control tab: manual block asks for the screen password; sa cannot be disabled", async () => {
  const calls = [];
  global.fetch = jest.fn(async (url, init = {}) => {
    calls.push({ url, init });
    if (url.endsWith("/gate")) return json(200, { configured: true, lockedUntil: null, unlocked: false });
    if (url.endsWith("/unlock")) return json(200, { token: "session-token-123456789012345", expiresAt: "2099-01-01T00:00:00" });
    if (url.includes("/overview")) return json(200, overview);
    if (url.endsWith("/server-status")) return json(200, status);
    if (url.endsWith("/blocks") && (!init.method || init.method === "GET")) return json(200, { rows: [], triggerInstalled: false, me: { ip: "1.2.3.4" } });
    if (url.endsWith("/blocks")) return json(200, { message: "تم الحظر" });
    if (url.endsWith("/sql-logins"))
      return json(200, {
        logins: [
          { name: "sa", disabled: false, weak: false, roles: "sysadmin", databases: [], protectedLogin: true },
          { name: "geel", disabled: false, weak: false, roles: null, databases: [{ db: "GeelElNasr", user: "geel", roles: "db_owner" }], protectedLogin: false }
        ],
        databases: ["DATASSTLI", "GeelElNasr"],
        dbRoles: ["db_datareader"]
      });
    return json(404, {});
  });

  render(<SecurityMonitorPage />);
  fireEvent.change(await screen.findByLabelText("كلمة مرور الشاشة"), { target: { value: "right" } });
  fireEvent.click(screen.getByRole("button", { name: "دخول" }));
  fireEvent.click(await screen.findByRole("tab", { name: "التحكم والحظر" }));

  expect(await screen.findByText("GeelElNasr: db_owner")).toBeInTheDocument();
  const disableButtons = screen.getAllByRole("button", { name: "تعطيل" });
  expect(disableButtons[0]).toBeDisabled(); // sa
  expect(disableButtons[1]).toBeEnabled();

  fireEvent.click(screen.getByRole("button", { name: "حظر يدوي" }));
  fireEvent.change(screen.getByLabelText("القيمة"), { target: { value: "185.93.89.154" } });
  const submit = screen.getByRole("button", { name: "حظر" });
  expect(submit).toBeDisabled(); // لازم كلمة مرور الشاشة
  fireEvent.change(screen.getByLabelText("كلمة مرور الشاشة للتأكيد"), { target: { value: "right" } });
  fireEvent.click(submit);

  await waitFor(() => expect(calls.some((c) => c.url.endsWith("/blocks") && c.init.method === "POST")).toBe(true));
  const post = calls.find((c) => c.url.endsWith("/blocks") && c.init.method === "POST");
  expect(JSON.parse(post.init.body)).toEqual(expect.objectContaining({ kind: "ip", value: "185.93.89.154", password: "right" }));
  expect(await screen.findByText("تم الحظر")).toBeInTheDocument();
});

test("API users tab: create a key limited to one endpoint and show it once", async () => {
  const calls = [];
  global.fetch = jest.fn(async (url, init = {}) => {
    calls.push({ url, init });
    if (url.endsWith("/gate")) return json(200, { configured: true, lockedUntil: null, unlocked: false });
    if (url.endsWith("/unlock")) return json(200, { token: "session-token-123456789012345", expiresAt: "2099-01-01T00:00:00" });
    if (url.includes("/overview")) return json(200, overview);
    if (url.endsWith("/server-status")) return json(200, status);
    if (url.endsWith("/api-clients/endpoints"))
      return json(200, [
        { controller: "InstituteDirectory", method: "GET", route: "/api/institute-directory/students/national-id/{nationalId}/latest-payment-order", action: "LatestPaymentOrderByNationalId" },
        { controller: "InstituteDirectory", method: "GET", route: "/api/institute-directory/branches", action: "Branches" }
      ]);
    if (url.endsWith("/api-clients") && init.method === "POST") return json(200, { id: 1, key: "sk_ABCDEFGHIJ_secret-value" });
    if (url.endsWith("/api-clients")) return json(200, []);
    return json(404, {});
  });

  render(<SecurityMonitorPage />);
  fireEvent.change(await screen.findByLabelText("كلمة مرور الشاشة"), { target: { value: "right" } });
  fireEvent.click(screen.getByRole("button", { name: "دخول" }));
  fireEvent.click(await screen.findByRole("tab", { name: "مستخدمو الـ API" }));

  expect(await screen.findByText("عدد الـ endpoints المتاحة: 2")).toBeInTheDocument();
  fireEvent.click(await screen.findByRole("button", { name: "مستخدم API جديد" }));
  fireEvent.change(screen.getByLabelText("الاسم (الجهة أو المبرمج)"), { target: { value: "تطبيق الدفع" } });
  fireEvent.change(screen.getByPlaceholderText(/ابحث في الـ endpoints/), { target: { value: "latest-payment" } });
  fireEvent.click(screen.getByText(/latest-payment-order/));
  expect(screen.getByText("المحدد: 1")).toBeInTheDocument();
  fireEvent.change(screen.getByLabelText("كلمة مرور الشاشة للتأكيد"), { target: { value: "right" } });
  fireEvent.click(screen.getByRole("button", { name: "إنشاء وإظهار المفتاح" }));

  expect(await screen.findByDisplayValue("sk_ABCDEFGHIJ_secret-value")).toBeInTheDocument();
  const post = calls.find((c) => c.url.endsWith("/api-clients") && c.init.method === "POST");
  expect(JSON.parse(post.init.body)).toEqual(
    expect.objectContaining({
      name: "تطبيق الدفع",
      endpoints: ["GET /api/institute-directory/students/national-id/{nationalId}/latest-payment-order"],
      password: "right"
    })
  );
});

test("password not configured shows a notice instead of the form", async () => {
  global.fetch = jest.fn(async () => json(200, { configured: false, lockedUntil: null, unlocked: false }));
  render(<SecurityMonitorPage />);
  expect(await screen.findByText("لم يتم ضبط كلمة مرور الشاشة بعد في إعدادات الخادم.")).toBeInTheDocument();
});
