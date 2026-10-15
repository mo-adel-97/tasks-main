import React from "react";
import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { DataGrid } from "@mui/x-data-grid";
import useColumnValueFilters from "./useColumnValueFilters";

const ROWS = [
  { id: 1, branch: "الرياض", type: "دبلوم", student: "أحمد" },
  { id: 2, branch: "الرياض", type: "دورة", student: "منى" },
  { id: 3, branch: "الدمام", type: "دبلوم", student: "سارة" },
  { id: 4, branch: "جدة", type: "دبلوم", student: "علي" },
  { id: 5, branch: "الدمام", type: "دورة", student: "خالد" }
];

const COLUMNS = [
  { field: "branch", headerName: "الفرع", width: 140 },
  { field: "type", headerName: "النوع", width: 140 },
  { field: "student", headerName: "الطالب", width: 140 },
  { field: "actions", headerName: "الإجراءات", width: 100 }
];

function Harness({ disableSorting = false }) {
  const filters = useColumnValueFilters({ rows: ROWS, columns: COLUMNS, disableSorting });
  return (
    <div>
      {filters.chips}
      {filters.popover}
      <DataGrid
        rows={filters.rows}
        columns={filters.columns}
        disableColumnFilter
        disableColumnMenu
        disableVirtualization
        autoHeight
        hideFooter
      />
      <div data-testid="count">{filters.rows.length}</div>
    </div>
  );
}

test("Excel-style column filter: list all values, tick several, chips, clear", async () => {
  render(<Harness />);
  expect(screen.getByTestId("count").textContent).toBe("5");

  // open the filter of the "الفرع" column
  await act(async () => { fireEvent.click(screen.getByRole("button", { name: "فلتر الفرع" })); });

  // every distinct value is listed with its count, all ticked
  await screen.findByRole("presentation");
  const boxes = await within(document.body).findAllByRole("checkbox");
  expect(boxes.length).toBe(3);                       // الرياض / الدمام / جدة
  boxes.forEach((box) => expect(box.checked).toBe(true));

  // untick "جدة" => Riyadh + Dammam remain (multi-select)
  await act(async () => { fireEvent.click(screen.getByLabelText(/جدة/)); });
  expect(screen.getByTestId("count").textContent).toBe("4");

  // type a value and use "نتائج البحث فقط" => only Dammam
  await act(async () => { fireEvent.change(screen.getByPlaceholderText("ابحث أو اكتب قيمة…"), { target: { value: "الدمام" } }); });
  await act(async () => { fireEvent.click(screen.getByRole("button", { name: "نتائج البحث فقط" })); });
  expect(screen.getByTestId("count").textContent).toBe("2");

  // close the panel ("تم"); the active filter appears as a chip and can be cleared
  await act(async () => { fireEvent.click(screen.getByRole("button", { name: "تم" })); });
  await waitFor(() => expect(screen.queryByPlaceholderText("ابحث أو اكتب قيمة…")).toBeNull());
  expect(screen.getByText(/الفرع: الدمام/)).toBeTruthy();
  await act(async () => { fireEvent.click(screen.getByRole("button", { name: "مسح كل الفلاتر" })); });
  expect(screen.getByTestId("count").textContent).toBe("5");
});

test("filters of two columns combine, and the actions column has no filter button", async () => {
  render(<Harness />);
  expect(screen.queryByRole("button", { name: "فلتر الإجراءات" })).toBeNull();

  await act(async () => { fireEvent.click(screen.getByRole("button", { name: "فلتر النوع" })); });
  await act(async () => { fireEvent.click(await screen.findByLabelText(/دورة/)); });    // untick "دورة" => only diplomas
  expect(screen.getByTestId("count").textContent).toBe("3");
  await act(async () => { fireEvent.keyDown(document.activeElement || document.body, { key: "Escape" }); });
});

test("with sorting disabled the headers have no sort arrows and no menu icon, only the filter button", () => {
  const { container, unmount } = render(<Harness disableSorting />);
  expect(container.querySelectorAll(".MuiDataGrid-columnHeader .MuiDataGrid-iconButtonContainer").length).toBe(0);
  expect(container.querySelectorAll(".MuiDataGrid-menuIcon").length).toBe(0);
  expect(screen.getByRole("button", { name: "فلتر الفرع" })).toBeTruthy();
  unmount();

  // control: by default the grid does render the sort icon containers
  const normal = render(<Harness />);
  expect(normal.container.querySelectorAll(".MuiDataGrid-columnHeader .MuiDataGrid-iconButtonContainer").length).toBeGreaterThan(0);
});
