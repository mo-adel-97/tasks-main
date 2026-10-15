import React from "react";
import { render, screen, fireEvent, waitForElementToBeRemoved, within } from "@testing-library/react";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import AssetsBranchPage from "./AssetsBranchPage";
import AssetsReviewPage from "./AssetsReviewPage";
import AssetsCatalogPage from "./AssetsCatalogPage";
import AssetsReportPage from "./AssetsReportPage";
import AssetsPurchasesPage from "./AssetsPurchasesPage";

const BRANCH = "11111111-1111-1111-1111-111111111111";
const OTHER = "22222222-2222-2222-2222-222222222222";

const entry = {
  id: 7, guid: "e1", branchGuid: BRANCH, branchName: "فرع الأندلس", itemId: 1, itemGuid: "i1", itemName: "كرسي محاضرات",
  categoryName: "أثاث", unit: "قطعة", itemHasImage: false, entryType: "Purchase", qty: 480, unitPrice: 170, totalPrice: 81600,
  model: "SHQ22", notes: "", purchaseDate: "2026-07-28T00:00:00", supplierName: "سيناء للتجارة", invoiceNo: "125332021",
  hasInvoice: true, invoiceFileName: "inv.pdf", status: "Pending", createdByGuid: "u", createdBy: "مشرف الفرع",
  createdAt: "2026-10-13T10:00:00", updatedAt: null, reviewedBy: "", reviewedAt: null, reviewNotes: ""
};
const transfer = {
  id: 3, guid: "t1", fromBranchGuid: BRANCH, fromBranchName: "فرع الأندلس", toBranchGuid: OTHER, toBranchName: "فرع جدة",
  itemId: 1, itemGuid: "i1", itemName: "كرسي محاضرات", unit: "قطعة", itemHasImage: false, qty: 10, unitValue: null,
  reason: "زيادة عدد", status: "Pending", requestedByGuid: "u", requestedBy: "مشرف الفرع", requestedAt: "2026-10-13T11:00:00",
  reviewedBy: "", reviewedAt: null, reviewNotes: ""
};
const incoming = { ...transfer, id: 4, guid: "t2", fromBranchGuid: OTHER, fromBranchName: "فرع جدة", toBranchGuid: BRANCH, toBranchName: "فرع الأندلس", qty: 5 };
const received = { ...transfer, id: 5, guid: "t3", status: "Received", receivedBy: "مشرف جدة", receivedAt: "2026-10-13T12:00:00", receiveNotes: "" };
const disposal = {
  id: 9, guid: "d1", branchGuid: BRANCH, branchName: "فرع الأندلس", itemId: 1, itemGuid: "i1", itemName: "كرسي محاضرات", model: "SHQ22",
  unit: "قطعة", categoryName: "أثاث", itemHasImage: false, qty: 3, unitValue: null, reason: "كسر في القاعدة", status: "Pending", attachmentName: "محضر.pdf",
  requestedByGuid: "u", requestedBy: "مشرف الفرع", requestedAt: "2026-10-13T13:00:00", reviewedBy: "", reviewedAt: null, reviewNotes: ""
};
const approvedEntry = { ...entry, id: 8, guid: "e2", status: "Approved", itemName: "طاولة دائرية", qty: 24 };
const editRequest = {
  guid: "r1", entityType: "Entry", notes: "الكمية الصحيحة 20", status: "Pending", requestedAt: "2026-10-13T14:00:00", requestedBy: "مشرف الفرع",
  handledAt: null, handledBy: "", handleNotes: "", branchGuid: BRANCH, branchName: "فرع الأندلس", entityGuid: "e2", qty: 24,
  entityStatus: "Approved", itemName: "طاولة دائرية", itemGuid: "i1", itemHasImage: false, toBranchName: ""
};
const quote = (n, amount, selected = false) => ({ id: n, guid: `q${n}`, supplierName: `مورد ${n}`, totalAmount: amount, notes: "", fileName: `عرض${n}.pdf`, selected });
const purchase = {
  id: 11, guid: "p1", branchGuid: BRANCH, branchName: "فرع الأندلس", itemId: 1, itemGuid: "i1", itemName: "كرسي محاضرات", model: "SHQ22",
  unit: "قطعة", itemHasImage: false, qty: 50, description: "كراسي محاضرات بمخدع خشبي", status: "Pending", selectedQuoteId: null,
  requestedBy: "مشرف الفرع", requestedAt: "2026-10-13T15:00:00", reviewedBy: "", reviewedAt: null, reviewNotes: "",
  entryGuid: null, entryStatus: "", purchasedBy: "", purchasedAt: null,
  quotes: [quote(1, 9000), quote(2, 8500), quote(3, 9900)]
};
const approvedPurchase = { ...purchase, id: 12, guid: "p2", status: "Approved", selectedQuoteId: 2, quotes: [quote(1, 9000), quote(2, 8500, true), quote(3, 9900)] };
const gate = (allow) => ({ allow, until: null });
const open = { open: true, until: null };
const closed = { open: false, until: null };
const holding = {
  itemId: 1, itemGuid: "i1", itemName: "كرسي محاضرات", model: "SHQ22", description: "", unit: "قطعة", categoryName: "أثاث",
  itemHasImage: false, qty: 480, value: 81600, pendingOut: 10, branchGuid: BRANCH, branchName: "فرع الأندلس", categoryId: 1
};

const responses = {
  "/bootstrap": {
    access: { branch: true, branchAdd: true, review: true, reviewEdit: true, reviewDelete: true, catalog: true, catalogEdit: true, catalogDelete: true, report: true, purchase: true, purchaseAdd: true, purchaseEdit: true },
    userBranchGuid: BRANCH,
    branches: [{ guid: BRANCH, name: "فرع الأندلس" }, { guid: OTHER, name: "فرع جدة" }],
    counts: { pendingEntries: 1, pendingTransfers: 1 }
  },
  "/catalog": {
    categories: [{ id: 1, name: "أثاث", sortOrder: 1, isActive: true, itemsCount: 1 }],
    items: [{ id: 1, guid: "i1", categoryId: 1, categoryName: "أثاث", name: "كرسي محاضرات", model: "SHQ22", description: "مع مخدع خشبي", unit: "قطعة", hasImage: false, isActive: true }]
  },
  "/settings": {
    global: { branchGuid: null, add: gate(true), purchase: gate(false), transfer: gate(true), disposal: gate(false), updatedAt: "2026-10-13T09:00:00", updatedBy: "System Admin" },
    branches: [{ branchGuid: OTHER, add: gate(false), purchase: gate(false), transfer: gate(false), disposal: gate(true), updatedAt: "2026-10-13T09:00:00", updatedBy: "System Admin" }]
  },
  "/branch": {
    branchGuid: BRANCH, canChooseBranch: true,
    windows: { add: open, purchase: closed, transfer: open, disposal: open, branchOverride: false },
    canAddExisting: true, canPurchase: false, canTransfer: true, canDispose: true, canAct: true, adminOverride: false,
    holdings: [holding], entries: [entry, approvedEntry], transfers: [transfer, incoming], disposals: [disposal], editRequests: [editRequest]
  },
  "/review": { entries: [entry], transfers: [transfer, received], disposals: [disposal], editRequests: [editRequest], canDecide: true, canDelete: true },
  "/purchases": { requests: [purchase, approvedPurchase], branchGuid: BRANCH, canChooseBranch: true, canCreate: true, canAct: true, canDecide: true, minQuotes: 3, maxQuotes: 6 },
  "/report": { holdings: [holding], entries: [entry], transfers: [transfer], disposals: [disposal] }
};

beforeEach(() => {
  localStorage.setItem("user", JSON.stringify({ guid: "F426653A-B389-4036-95F0-907920E7F205" }));
  global.fetch = jest.fn(async (url) => {
    const path = new URL(String(url)).pathname.replace("/api/assets", "");
    const body = responses[path] || { rows: [] };
    return { ok: true, status: 200, json: async () => body, blob: async () => new Blob() };
  });
});

const wrap = (ui) => render(<ThemeProvider theme={createTheme({ direction: "rtl" })}>{ui}</ThemeProvider>);

test("branch page shows holdings, entries and transfers", async () => {
  wrap(<AssetsBranchPage />);
  expect(await screen.findByText("كرسي محاضرات")).toBeInTheDocument();
  expect(screen.getAllByText("81,600.00").length).toBe(2);
  expect(screen.getByText(/10 محجوزة في طلبات/)).toBeInTheDocument();
  // زر طلب النقل في أعلى الصفحة + زر إضافة صنف
  expect(screen.getByRole("button", { name: "إضافة صنف" })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "طلب تكهين" })).toBeEnabled();
  fireEvent.click(screen.getByRole("button", { name: "طلب نقل عهدة" }));
  expect(await screen.findByText("طلب نقل عهدة إلى فرع آخر")).toBeInTheDocument();
  expect(screen.getByLabelText("الصنف المراد نقله *")).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "إلغاء" }));
  await waitForElementToBeRemoved(() => screen.queryByText("طلب نقل عهدة إلى فرع آخر"));
  fireEvent.click(screen.getByRole("tab", { name: /طلبات الإضافة/ }));
  expect(await screen.findByText("طاولة دائرية")).toBeInTheDocument();
  // الإضافة المعتمدة عليها طلب تعديل لسه عند المراجع ← شارة بدل الزر
  expect(screen.getAllByText("قيد المراجعة").length).toBeGreaterThan(1);
  fireEvent.click(screen.getByRole("tab", { name: /طلبات التعديل/ }));
  expect(await screen.findByText("الكمية الصحيحة 20")).toBeInTheDocument();
  expect(screen.getByText("بانتظار المراجع")).toBeInTheDocument();
  // طلبات الشراء تبويب جوه أصول الفرع
  fireEvent.click(screen.getByRole("tab", { name: /طلبات الشراء/ }));
  expect(await screen.findByText("3 عروض — من 8,500.00")).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "طلب شراء جديد" })).toBeInTheDocument();
  fireEvent.click(screen.getByRole("tab", { name: /نقل العهدة/ }));
  expect(await screen.findByText("إلى فرع جدة")).toBeInTheDocument();
  // الفرع المستلم بس اللي بيأكد الاستلام، والمرسل يقدر يلغي قبل الاستلام
  expect(screen.getByText(/بانتظار تأكيد الاستلام —/)).toBeInTheDocument();
  expect(screen.getAllByRole("button", { name: "تأكيد الاستلام" })).toHaveLength(1);
  expect(screen.getAllByRole("button", { name: "إلغاء" })).toHaveLength(1);
  // حالة العمليات + تبويب التكهين
  expect(screen.getByText("طلبات الشراء: مغلقة")).toBeInTheDocument();
  fireEvent.click(screen.getByRole("tab", { name: /التكهين/ }));
  expect(await screen.findByText("كسر في القاعدة")).toBeInTheDocument();
});

test("review page lists pending requests with decisions", async () => {
  wrap(<AssetsReviewPage />);
  expect(await screen.findByText("كرسي محاضرات")).toBeInTheDocument();
  expect(screen.getByText("81,600.00")).toBeInTheDocument();
  expect(screen.getAllByLabelText("موافقة").length).toBeGreaterThan(0);
  fireEvent.click(screen.getByRole("tab", { name: /نقل العهدة/ }));
  // الحسابات بتقرر بس على النقل اللي الفرع أكد استلامه
  expect(await screen.findByText(/استلمها مشرف جدة/)).toBeInTheDocument();
  expect(screen.getByText("لم يؤكد الفرع المستلم الاستلام بعد")).toBeInTheDocument();
  expect(screen.getAllByLabelText("موافقة")).toHaveLength(1);
  fireEvent.click(screen.getByRole("tab", { name: /التكهين/ }));
  expect(await screen.findByText("كسر في القاعدة")).toBeInTheDocument();
  expect(screen.getAllByLabelText("موافقة")).toHaveLength(1);
  fireEvent.click(screen.getByRole("tab", { name: /طلبات التعديل/ }));
  expect(await screen.findByText("الكمية الصحيحة 20")).toBeInTheDocument();
  expect(screen.getByLabelText("تعديل مباشر")).toBeInTheDocument();
  expect(screen.getByLabelText("فتح للفرع ليعدّله")).toBeInTheDocument();
  // طلبات الشراء تبويب جوه المراجعة
  fireEvent.click(screen.getByRole("tab", { name: /طلبات الشراء/ }));
  expect(await screen.findByRole("button", { name: "مراجعة العروض" })).toBeInTheDocument();
  fireEvent.click(screen.getByRole("tab", { name: /طلبات التعديل/ }));
  expect(await screen.findByLabelText("فتح للفرع ليعدّله")).toBeInTheDocument();
  fireEvent.click(within(screen.getByLabelText("فتح للفرع ليعدّله")).getByRole("button"));
  expect(await screen.findByText(/فتح للفرع للتعديل: طاولة دائرية/)).toBeInTheDocument();
  expect(screen.getByDisplayValue("الكمية الصحيحة 20")).toBeInTheDocument();
});

test("catalog page shows items and the add window", async () => {
  wrap(<AssetsCatalogPage />);
  expect(await screen.findByText("كرسي محاضرات")).toBeInTheDocument();
  fireEvent.click(screen.getByRole("tab", { name: "فتح العمليات وإغلاقها" }));
  expect(await screen.findByText("جميع الفروع")).toBeInTheDocument();
  expect(screen.getByText("فرع جدة")).toBeInTheDocument();
  expect(screen.getByText("إعداد خاص بالفرع")).toBeInTheDocument();
  expect(screen.getAllByText("يتبع إعداد جميع الفروع").length).toBe(1);
});

test("report page summarizes branches", async () => {
  wrap(<AssetsReportPage />);
  expect(await screen.findByText("فرع الأندلس", { selector: "p" })).toBeInTheDocument();
  expect(screen.getByText(/أضاف: مشرف الفرع/)).toBeInTheDocument();
});

test("purchases page: three quotes, pick one, then register the purchase", async () => {
  wrap(<AssetsPurchasesPage />);
  expect(await screen.findByText("3 عروض — من 8,500.00")).toBeInTheDocument();
  expect(screen.getByText("مورد 2 — 8,500.00")).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "تم الشراء" })).toBeInTheDocument();

  // مراجعة العروض: الأقل سعرًا متعلّم، والاعتماد مقفول لحد ما يختار عرض
  fireEvent.click(screen.getByRole("button", { name: "مراجعة العروض" }));
  expect(await screen.findByText(/طلب شراء رقم 11/)).toBeInTheDocument();
  expect(screen.getByText("الأقل سعرًا")).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "اعتماد العرض المختار" })).toBeDisabled();
  fireEvent.click(screen.getByText("مورد 3"));
  expect(screen.getByRole("button", { name: "اعتماد العرض المختار" })).toBeEnabled();
});

test("new purchase dialog starts with three required quotes", async () => {
  wrap(<AssetsPurchasesPage />);
  fireEvent.click(await screen.findByRole("button", { name: "طلب شراء جديد" }));
  expect(await screen.findByText("العرض 3")).toBeInTheDocument();
  expect(screen.queryByText("العرض 4")).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "إضافة عرض" }));
  expect(screen.getByText("العرض 4")).toBeInTheDocument();
});
