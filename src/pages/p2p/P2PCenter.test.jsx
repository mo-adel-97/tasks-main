import React from "react";
import { render as rtlRender, screen, fireEvent, waitFor, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Swal from "sweetalert2";
import P2PCenter from "./P2PCenter";
import P2PThread from "./P2PThread";
import P2PCompanyDialog from "./P2PCompanyDialog";

jest.mock("sweetalert2", () => ({ fire: jest.fn() }));

const today = "2026-10-22";
const company = { guid: "c1", name: "شركة ألفا", isActive: true, contactName: "أحمد", contactTitle: "مدير التدريب", ownerGuid: "u1" };
const draft = {
  guid: "r1",
  employeeName: "موظف تجريبي",
  reportDate: today,
  status: "draft",
  canEdit: true,
  visits: [],
  opportunities: [],
  totals: { companiesVisited: 0, remoteVisits: 0 }
};

const mockFetch = (role) =>
  jest.fn(async (url, options = {}) => {
    const u = String(url);
    const json = (() => {
      if (u.includes("/api/p2p/me")) return { userGuid: "u1", name: "موظف تجريبي", today, isStaff: true, isManager: role === "manager", role };
      if (u.includes("/api/p2p/companies/lookup")) return [];
      if (u.includes("/api/p2p/companies")) return [company];
      if (u.includes("/api/p2p/reports/open")) return { guid: "r1" };
      if (u.includes("/api/p2p/reports/r1") && options.method === "PUT") return { message: "تم" };
      if (u.includes("/api/p2p/reports/r9")) return { ...draft, guid: "r9", employeeName: "سارة", status: "submitted", canEdit: false, canComment: true, comments: [] };
      if (u.includes("/api/p2p/reports/r1")) return draft;
      if (u.includes("/api/p2p/dashboard"))
        return {
          totals: { reports: 3, pendingReview: 2, reviewed: 1, returned: 0, visits: 7, fieldVisits: 4, remoteVisits: 3, companiesVisited: 4, newCompanies: 2, opportunities: 2, pipelineValue: 5000, wonCount: 1, wonValue: 9000, overdueFollowUps: 0 },
          byEmployee: [{ employeeGuid: "u2", employeeName: "سارة", reports: 3, reviewed: 1, visits: 7, fieldVisits: 4, remoteVisits: 3, opportunities: 2, opportunitiesValue: 5000, won: 1, lastReportDate: today }],
          breakdown: { method: { field: 4, phone: 3 }, purpose: {}, result: {} },
          evaluation: {},
          stages: [],
          daily: []
        };
      if (u.includes("/api/p2p/employees")) return [{ guid: "u2", name: "سارة" }];
      return [];
    })();
    return { ok: true, json: async () => json };
  });

const render = (ui, path = "/") => rtlRender(<MemoryRouter initialEntries={[path]}>{ui}</MemoryRouter>);

beforeEach(() => {
  localStorage.setItem("user", JSON.stringify({ guid: "u1" }));
  Swal.fire.mockImplementation(async () => ({ isConfirmed: true }));
});

test("staff sees only the employee part and submits a report with the declaration", async () => {
  global.fetch = mockFetch("staff");
  render(<P2PCenter />);

  expect(await screen.findByRole("tab", { name: /التقرير اليومي/ })).toBeInTheDocument();
  expect(screen.queryByRole("tab", { name: /لوحة الإدارة/ })).not.toBeInTheDocument();

  fireEvent.click(await screen.findByRole("button", { name: /إضافة زيارة/ }));

  const companyInput = screen.getByLabelText(/^الشركة/);
  fireEvent.mouseDown(companyInput);
  fireEvent.click(await screen.findByText("شركة ألفا"));

  fireEvent.mouseDown(screen.getByLabelText(/الغرض من الزيارة/));
  fireEvent.click(within(await screen.findByRole("listbox")).getByText("تعريف بالمعهد وخدماته"));
  fireEvent.mouseDown(screen.getByLabelText(/نتيجة الزيارة/));
  fireEvent.click(within(await screen.findByRole("listbox")).getByText("إيجابية"));

  const send = screen.getByRole("button", { name: /إرسال التقرير/ });
  expect(send).toBeDisabled();
  fireEvent.click(screen.getByLabelText(/أقر بأن البيانات الواردة/));
  fireEvent.click(send);

  await waitFor(() => expect(global.fetch.mock.calls.some((c) => c[1]?.method === "PUT")).toBe(true));
  const body = JSON.parse(global.fetch.mock.calls.find((c) => c[1]?.method === "PUT")[1].body);
  expect(body.submit).toBe(true);
  expect(body.declarationAccepted).toBe(true);
  // من غير طلب مراجعة => "مُرسل" مش "بانتظار المراجعة"
  expect(body.requiresReview).toBe(false);
  expect(body.visits).toHaveLength(1);
  expect(body.visits[0]).toEqual(
    expect.objectContaining({ companyGuid: "c1", contactMethod: "field", purpose: "intro", resultStatus: "positive", personName: "أحمد" })
  );
});

test("manager sees only the management part", async () => {
  global.fetch = mockFetch("manager");
  render(<P2PCenter mode="manager" />);

  expect(await screen.findByRole("tab", { name: /لوحة الإدارة/ })).toBeInTheDocument();
  expect(screen.queryByRole("tab", { name: /التقرير اليومي$/ })).not.toBeInTheDocument();
  expect(screen.queryByRole("tab", { name: /شركاتي/ })).not.toBeInTheDocument();
  expect(await screen.findByText("سارة")).toBeInTheDocument();
  // شاشة التقارير بتطلب بيانات الكل
  expect(global.fetch.mock.calls.some((c) => String(c[0]).includes("/api/p2p/dashboard") && String(c[0]).includes("scope=all"))).toBe(true);
});

test("entry screen requests only my data", async () => {
  global.fetch = mockFetch("staff");
  render(<P2PCenter mode="staff" />);
  await screen.findByRole("tab", { name: /شركاتي/ });
  await waitFor(() =>
    expect(global.fetch.mock.calls.some((c) => String(c[0]).includes("/api/p2p/companies") && String(c[0]).includes("scope=mine"))).toBe(true)
  );
});

test("reports screen shows a lock message for a user without the manager permission", async () => {
  global.fetch = mockFetch("staff");
  render(<P2PCenter mode="manager" />);
  expect(await screen.findByText("ليس لديك صلاحية على هذه الشاشة")).toBeInTheDocument();
});

test("thread shows the conversation and posts a reply", async () => {
  global.fetch = jest.fn(async () => ({ ok: true, json: async () => ({ message: "تم" }) }));
  const onChanged = jest.fn();
  const report = {
    guid: "r1",
    isOwner: true,
    canComment: true,
    comments: [
      { id: 1, authorName: "موظف تجريبي", kind: "submit", body: null, createdAt: "2026-10-24 10:00", isMine: true, fromManager: false },
      { id: 2, authorName: "المدير", kind: "return", body: "أكمل بيانات الزيارة الثانية", createdAt: "2026-10-24 11:00", isMine: false, fromManager: true }
    ]
  };
  rtlRender(<P2PThread report={report} onChanged={onChanged} />);
  expect(screen.getByText("أُعيد للاستكمال")).toBeInTheDocument();
  expect(screen.getByText("أكمل بيانات الزيارة الثانية")).toBeInTheDocument();

  fireEvent.change(screen.getByLabelText("نص الرد"), { target: { value: "تم الاستكمال" } });
  fireEvent.click(screen.getByRole("button", { name: /إرسال/ }));
  await waitFor(() => expect(onChanged).toHaveBeenCalled());
  const [url, options] = global.fetch.mock.calls[0];
  expect(String(url)).toContain("/api/p2p/reports/r1/comments");
  expect(JSON.parse(options.body).body).toBe("تم الاستكمال");
});

test("notification link opens the report for the manager", async () => {
  global.fetch = mockFetch("manager");
  render(<P2PCenter mode="manager" />, "/dashboard/p2p-reports?report=r9");
  expect(await screen.findByText(/المحادثة مع/)).toBeInTheDocument();
});

test("asking for management review sends requiresReview", async () => {
  global.fetch = mockFetch("staff");
  render(<P2PCenter />);
  fireEvent.click(await screen.findByRole("button", { name: /إضافة زيارة/ }));
  fireEvent.mouseDown(screen.getByLabelText(/^الشركة/));
  fireEvent.click(await screen.findByText("شركة ألفا"));
  fireEvent.mouseDown(screen.getByLabelText(/الغرض من الزيارة/));
  fireEvent.click(within(await screen.findByRole("listbox")).getByText("تعريف بالمعهد وخدماته"));
  fireEvent.mouseDown(screen.getByLabelText(/نتيجة الزيارة/));
  fireEvent.click(within(await screen.findByRole("listbox")).getByText("إيجابية"));

  fireEvent.click(screen.getByLabelText(/أقر بأن البيانات الواردة/));
  fireEvent.click(screen.getByLabelText(/يتطلب هذا التقرير مراجعة الإدارة/));
  fireEvent.click(screen.getByRole("button", { name: /إرسال للمراجعة/ }));

  await waitFor(() => expect(global.fetch.mock.calls.some((c) => c[1]?.method === "PUT")).toBe(true));
  const body = JSON.parse(global.fetch.mock.calls.find((c) => c[1]?.method === "PUT")[1].body);
  expect(body.requiresReview).toBe(true);
});

test("company already registered by a colleague cannot be added again and the colleague is not named", async () => {
  global.fetch = jest.fn(async (url) => {
    const u = String(url);
    const json = u.includes("/api/p2p/companies/lookup")
      ? [{ name: "شركة ألفا", sector: "صناعة", city: "الرياض", isMine: false, exact: true }]
      : { message: "تم" };
    return { ok: true, json: async () => json };
  });
  const onSaved = jest.fn();
  rtlRender(<P2PCompanyDialog open company={null} onClose={() => {}} onSaved={onSaved} />);
  fireEvent.change(screen.getByLabelText(/اسم الشركة/), { target: { value: "شركة الفا" } });

  expect(await screen.findByText(/مسجلة بالفعل في النظام لدى أحد الزملاء/)).toBeInTheDocument();
  expect(screen.getByText("مسجلة لدى أحد الزملاء")).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "حفظ" })).toBeDisabled();
  expect(global.fetch.mock.calls.some((c) => c[1]?.method === "POST")).toBe(false);
});
