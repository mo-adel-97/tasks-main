import React from "react";
import { render, screen, fireEvent, waitFor, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Swal from "sweetalert2";
import P2PAppointments from "./P2PAppointments";
import P2PCenter from "./P2PCenter";

jest.mock("sweetalert2", () => ({ fire: jest.fn() }));

const upcoming = {
  guid: "AAAA-1", employeeGuid: "u1", employeeName: "موظف تجريبي", companyGuid: "c1", companyName: "شركة ألفا",
  title: "اجتماع عرض البرامج", location: "مقر الشركة", appointmentAt: "2099-01-05T10:30", notes: "", status: "scheduled",
  outcome: null, reminders: [1440, 60], overdue: false, isMine: true
};
const overdue = { ...upcoming, guid: "BBBB-2", title: "متابعة عرض السعر", appointmentAt: "2026-10-01T09:00", overdue: true, reminders: [] };

beforeEach(() => {
  localStorage.setItem("user", JSON.stringify({ guid: "u1" }));
  Swal.fire.mockReset();
  Swal.fire.mockImplementation(async () => ({ isConfirmed: true }));
  global.fetch = jest.fn(async (url, options = {}) => {
    const u = String(url);
    const json = u.includes("/api/p2p/appointments") && options.method && options.method !== "GET"
      ? { message: "تم", guid: "new" }
      : u.includes("/api/p2p/appointments")
        ? [upcoming, overdue]
        : u.includes("/api/p2p/companies")
          ? [{ guid: "c1", name: "شركة ألفا", isActive: true }]
          : u.includes("/api/p2p/me")
            ? { userGuid: "u1", name: "موظف تجريبي", today: "2026-10-28", isStaff: true, isManager: false, role: "staff" }
            : [];
    return { ok: true, json: async () => json };
  });
});

const sent = (method) => {
  const call = global.fetch.mock.calls.find((c) => String(c[0]).includes("/api/p2p/appointments") && c[1]?.method === method);
  return call ? { url: String(call[0]), body: JSON.parse(call[1].body) } : null;
};

test("lists upcoming and overdue appointments and saves a new one with chosen reminders", async () => {
  render(<P2PAppointments me={{ role: "staff" }} />);
  expect(await screen.findByText("اجتماع عرض البرامج")).toBeInTheDocument();
  expect(screen.getByText("قبله بيوم، قبله بساعة")).toBeInTheDocument();

  fireEvent.click(screen.getByText(/فات موعدها ولم تُسجَّل/));
  expect(screen.getByText("متابعة عرض السعر")).toBeInTheDocument();

  fireEvent.click(screen.getByRole("button", { name: /موعد جديد/ }));
  fireEvent.change(screen.getByLabelText(/عنوان الموعد/), { target: { value: "زيارة شركة بيتا" } });
  fireEvent.change(screen.getByLabelText(/التاريخ والوقت/), { target: { value: "2099-02-01T11:00" } });
  fireEvent.click(screen.getByLabelText("قبله بساعة")); // إلغاء الافتراضي
  fireEvent.click(screen.getByLabelText("قبله بأسبوع"));
  fireEvent.click(screen.getByRole("button", { name: "حفظ" }));

  await waitFor(() => expect(sent("POST")).not.toBeNull());
  const { body } = sent("POST");
  expect(body).toEqual(expect.objectContaining({ title: "زيارة شركة بيتا", appointmentAt: "2099-02-01T11:00:00" }));
  expect(body.reminders.sort((a, b) => a - b)).toEqual([1440, 10080]);
});

test("marks an appointment as done", async () => {
  render(<P2PAppointments me={{ role: "staff" }} />);
  await screen.findByText("اجتماع عرض البرامج");
  fireEvent.click(screen.getAllByRole("button", { name: "تم" })[0]);
  await waitFor(() => expect(sent("POST")?.url).toContain("/api/p2p/appointments/AAAA-1/status"));
  expect(sent("POST").body.status).toBe("done");
});

test("a reminder link opens the appointments tab on that appointment", async () => {
  render(<MemoryRouter initialEntries={["/dashboard/p2p-marketing?appointment=aaaa-1"]}><P2PCenter mode="staff" /></MemoryRouter>);
  const tab = await screen.findByRole("tab", { name: /مواعيدي/ });
  await waitFor(() => expect(tab).toHaveAttribute("aria-selected", "true"));
  const card = (await screen.findByText("اجتماع عرض البرامج")).closest("[id]");
  expect(card).toHaveAttribute("id", "appt-AAAA-1");
  expect(within(card).getByText("مقر الشركة")).toBeInTheDocument();
});
