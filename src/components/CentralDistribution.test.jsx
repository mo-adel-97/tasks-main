import React from "react";
import { render, screen, fireEvent, waitFor, within } from "@testing-library/react";
import Swal from "sweetalert2";
import { CentralDistributionDialog } from "./CentralDistribution";

jest.mock("sweetalert2", () => ({ fire: jest.fn() }));

const branches = [
  { guid: "b1", name: "فرع الدمام حي الزهور", primaryCount: 2, collaboratorCount: 1, trainerCount: 3, updatedBy: "مشرف الزهور", updatedAt: "2026-10-26T10:00:00", executed: false },
  { guid: "b2", name: "فرع سكاكا", primaryCount: 0, collaboratorCount: 0, trainerCount: 0, executed: false },
  { guid: "b3", name: "فرع المصيف", primaryCount: 1, collaboratorCount: 0, trainerCount: 1, executed: true }
];

const preview = {
  periodLabel: "2026-10",
  totalStudents: 3,
  fixedAssignmentCount: 0,
  pinnedCount: 1,
  excludedCount: 0,
  categories: [
    { key: "committed", label: "ملتزم بالسداد", totalStudents: 2 },
    { key: "none", label: "غير ملتزم", totalStudents: 1 }
  ],
  trainers: [
    { guid: "t1", name: "أحمد", role: "primary", roleLabel: "أساسي", studentCount: 2 },
    { guid: "t2", name: "سارة", role: "collaborator", roleLabel: "متعاون", studentCount: 1 }
  ],
  facets: {
    batches: [{ name: "1446", count: 2 }, { name: "1447", count: 1 }],
    diploms: [{ name: "دبلوم القانون", count: 3 }]
  },
  students: [
    { id: "s1", name: "طالب أول", nationalId: "111", diploma: "دبلوم القانون", batch: "1446", category: "committed", currentTrainerGuid: "t2", currentTrainerName: "سارة", trainerGuid: "t1", overridden: false },
    { id: "s2", name: "طالب ثان", nationalId: "222", diploma: "دبلوم القانون", batch: "1446", category: "committed", currentTrainerGuid: "t1", currentTrainerName: "أحمد", trainerGuid: "t1", overridden: false },
    { id: "s3", name: "طالب ثالث", nationalId: "333", diploma: "دبلوم القانون", batch: "1447", category: "none", currentTrainerGuid: "00000000-0000-0000-0000-000000000000", currentTrainerName: "", trainerGuid: "t2", overridden: false }
  ],
  pinned: [{ id: "p1", name: "طالب مثبت", nationalId: "999", diploma: "دبلوم القانون", trainerName: "أحمد", until: "2026-12-31" }],
  fixedAssignments: []
};

const bodyOf = (part) => {
  const call = [...global.fetch.mock.calls].reverse().find((c) => String(c[0]).includes(part));
  return call ? JSON.parse(call[1].body) : null;
};

beforeEach(() => {
  Swal.fire.mockReset();
  Swal.fire.mockImplementation(async () => ({ isConfirmed: true }));
  global.fetch = jest.fn(async (url) => {
    const u = String(url);
    const json = u.includes("/central/branches")
      ? { periodLabel: "2026-10", enabled: true, data: branches }
      : u.includes("/central/preview")
        ? { data: preview }
        : { message: "تم" };
    return { ok: true, json: async () => json };
  });
});

const openReadyBranch = async () => {
  const ready = (await screen.findByText("فرع الدمام حي الزهور")).closest("tr");
  fireEvent.click(within(ready).getByRole("button", { name: /معاينة/ }));
  await screen.findByText("طالب أول");
};

test("lists branches with their status and only ready branches can be previewed", async () => {
  render(<CentralDistributionDialog open onClose={() => {}} apiBase="" userGuid="u1" />);
  const ready = (await screen.findByText("فرع الدمام حي الزهور")).closest("tr");
  expect(within(ready).getByText("جاهز للتوزيع")).toBeInTheDocument();
  expect(within(ready).getByRole("button", { name: /معاينة/ })).toBeEnabled();
  const empty = screen.getByText("فرع سكاكا").closest("tr");
  expect(within(empty).getByRole("button", { name: /معاينة/ })).toBeDisabled();
  const done = screen.getByText("فرع المصيف").closest("tr");
  expect(within(done).getByText("تم التوزيع هذا الشهر")).toBeInTheDocument();
  // الفرع اللي اتوزع الشهر ده ينفع يتعاد توزيعه
  expect(within(done).getByRole("button", { name: /إعادة التوزيع/ })).toBeEnabled();
});

test("redistributing an already distributed branch sends redistribute", async () => {
  render(<CentralDistributionDialog open onClose={() => {}} apiBase="" userGuid="u1" />);
  const done = (await screen.findByText("فرع المصيف")).closest("tr");
  fireEvent.click(within(done).getByRole("button", { name: /إعادة التوزيع/ }));
  await screen.findByText("طالب أول");
  fireEvent.click(screen.getByRole("button", { name: /^إعادة التوزيع$/ }));
  await waitFor(() => expect(bodyOf("/central/execute")).toEqual(expect.objectContaining({ branchGuid: "b3", redistribute: true })));
});

test("preview shows categories, pinned students, and executes with manual moves", async () => {
  const onExecuted = jest.fn();
  render(<CentralDistributionDialog open onClose={() => {}} apiBase="" userGuid="u1" onExecuted={onExecuted} />);
  await openReadyBranch();
  expect(screen.getByText("ملتزم بالسداد: 2")).toBeInTheDocument();
  expect(screen.getByText("طالب مثبت")).toBeInTheDocument();

  // نقل الطالب الأول لسارة
  fireEvent.click(screen.getByLabelText("تحديد طالب أول"));
  fireEvent.mouseDown(screen.getByLabelText("نقل المحددين إلى"));
  fireEvent.click(within(await screen.findByRole("listbox")).getByText("سارة"));
  fireEvent.click(screen.getByRole("button", { name: /^نقل$/ }));
  expect(screen.getByText("تعديل يدوي: 1")).toBeInTheDocument();

  fireEvent.click(screen.getByRole("button", { name: /تنفيذ التوزيع/ }));
  await waitFor(() => expect(onExecuted).toHaveBeenCalled());
  expect(bodyOf("/central/execute")).toEqual(
    expect.objectContaining({ branchGuid: "b1", overrides: { s1: "t2" }, excludedBatches: [], excludedDiploms: [] })
  );
});

test("excluding a batch re-previews immediately with the exclusion", async () => {
  render(<CentralDistributionDialog open onClose={() => {}} apiBase="" userGuid="u1" />);
  await openReadyBranch();
  fireEvent.mouseDown(screen.getByLabelText("الدفعات المستثناة"));
  fireEvent.click(await screen.findByText("1447 (1)"));
  // من غير ما يدوس "تحديث المعاينة"
  await waitFor(() => expect(bodyOf("/central/preview").excludedBatches).toEqual(["1447"]));
});

test("pins selected students until a date", async () => {
  render(<CentralDistributionDialog open onClose={() => {}} apiBase="" userGuid="u1" />);
  await openReadyBranch();
  fireEvent.click(screen.getByLabelText("تحديد طالب ثان"));
  fireEvent.change(screen.getByLabelText("تثبيت حتى"), { target: { value: "2026-12-31" } });
  fireEvent.click(screen.getByRole("button", { name: /تثبيت على المسؤول الحالي/ }));
  await waitFor(() => expect(bodyOf("/central/pins")).toEqual({ userGuid: "u1", branchGuid: "b1", studentLevelGuids: ["s2"], until: "2026-12-31" }));
});
