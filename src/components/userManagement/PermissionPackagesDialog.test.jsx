import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import PermissionPackagesDialog from "./PermissionPackagesDialog";

const forms = Array.from({ length: 400 }, (_, i) => ({ guid: `f-${i}`, name: `شاشة ${i}`, code: String(i), platform: i % 2 ? "web" : "desktop" }));
const menus = [{ guid: "m-1", name: "ملف" }];

beforeEach(() => {
  global.fetch = jest.fn(() => Promise.resolve({ ok: true, json: () => Promise.resolve({ data: [] }) }));
});

test("package editor stays responsive with many screens", async () => {
  render(
    <PermissionPackagesDialog mode="manage" onClose={() => {}} apiBaseUrl="" userGuid="u" menus={menus} forms={forms} currentState={{ menus: [], permissions: [] }} />
  );

  fireEvent.click(await screen.findByText("باكدج جديد"));
  const nameInput = await screen.findByPlaceholderText("مثلاً: باكدج مدرب");

  const start = performance.now();
  "باكدج مدرب للفرع".split("").forEach((_, i, arr) => {
    fireEvent.change(nameInput, { target: { value: arr.slice(0, i + 1).join("") } });
  });
  const typingMs = performance.now() - start;

  expect(nameInput.value).toBe("باكدج مدرب للفرع");
  expect(screen.getByText("شاشة 399")).toBeInTheDocument();
  // 16 حرف: كل حرف لازم يبقى سريع لأن الجدول ما بيترسمش.
  expect(typingMs).toBeLessThan(1500);

  const checkboxes = screen.getAllByRole("checkbox");
  fireEvent.click(checkboxes[checkboxes.length - 1]);
  expect(screen.getByText("1 شاشة")).toBeInTheDocument();
});
