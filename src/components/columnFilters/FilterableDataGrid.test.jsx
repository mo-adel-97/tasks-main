import React from "react";
import { act, fireEvent, render, screen, within } from "@testing-library/react";
import FilterableDataGrid from "./FilterableDataGrid";

const ROWS = [
  { id: 1, branch: { name: "الرياض" }, paid: 100 },
  { id: 2, branch: { name: "الدمام" }, paid: 200 },
  { id: 3, branch: { name: "الرياض" }, paid: 300 }
];

const COLUMNS = [
  { field: "branch", headerName: "الفرع", width: 140, valueGetter: (params) => params.row.branch.name },
  { field: "paid", headerName: "المدفوع", width: 140, valueFormatter: (params) => `${params.value} ر.س` },
  { field: "actions", type: "actions", headerName: "الإجراءات", width: 100 }
];

test("FilterableDataGrid filters by the value the column shows (valueGetter / valueFormatter)", async () => {
  const onFiltered = jest.fn();
  render(
    <div style={{ height: 400 }}>
      <FilterableDataGrid
        rows={ROWS}
        columns={COLUMNS}
        onFilteredRowsChange={onFiltered}
        disableVirtualization
        autoHeight
        hideFooter
      />
    </div>
  );

  expect(screen.queryByRole("button", { name: "فلتر الإجراءات" })).toBeNull();

  await act(async () => { fireEvent.click(screen.getByRole("button", { name: "فلتر الفرع" })); });
  await screen.findByRole("presentation");
  expect((await within(document.body).findAllByRole("checkbox")).length).toBe(2);

  await act(async () => { fireEvent.click(await screen.findByLabelText(/الدمام/)); });
  expect(onFiltered).toHaveBeenLastCalledWith([ROWS[0], ROWS[2]]);
  expect(screen.getByText("الفلاتر: 2 من 3")).toBeTruthy();

  await act(async () => { fireEvent.click(screen.getByRole("button", { name: "فلتر المدفوع" })); });
  expect(await screen.findByLabelText(/300 ر.س/)).toBeTruthy();
});
