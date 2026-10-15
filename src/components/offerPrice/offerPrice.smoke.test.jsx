/* eslint-disable testing-library/no-container, testing-library/no-node-access -- بنعد صفحات المستند (div) مباشرة */
import React from "react";
import { render } from "@testing-library/react";
import OfferPriceDocument, { OFFER_CONTENT_H, paginateOffer } from "./OfferPriceDocument";
import {
  applyItemEdit,
  applyTraineePrice,
  buildPrintServices,
  buildPrintTrainees,
  computeTotals,
  defaultPrintTexts,
  itemFromService,
  syncItemsFromTrainees
} from "./offerPriceCalc";

jest.mock("qrcode.react", () => ({ QRCodeCanvas: () => null }));

const service = { code: "1", name: "دبلوم إدارة المستشفيات", unit: "متدرب", unitCost: 1000, taxRate: 15, taxValue: 150, total: 1150, guid: "g1" };

test("item math matches desktop PayGrid", () => {
  let item = itemFromService(service);
  item = applyItemEdit(item, "qty", "2");
  expect(item.total).toBe(2300);
  item = applyItemEdit(item, "discountPercent", "10");
  expect(item.priceAfterDiscount).toBe(2070);
  item = applyItemEdit(item, "paidAmount", "500");
  expect(item.remainingAmount).toBe(1570);
  expect(computeTotals([item])).toEqual({ totalCost: 2000, totalTax: 300, totalAfterDiscount: 2070 });
});

test("trainee sync and document render", () => {
  const items = [itemFromService(service)];
  const trainees = [
    applyTraineePrice({ id: "t1", traineeName: "أحمد", specialization: service.name, discountPercent: 10, paidAmount: 100 }, items),
    applyTraineePrice({ id: "t2", traineeName: "محمد", specialization: service.name, discountPercent: 0, paidAmount: 0 }, items)
  ];
  expect(trainees[0].priceAfterDiscount).toBe(900);
  const synced = syncItemsFromTrainees(items, trainees);
  expect(synced[0].qty).toBe(2);
  expect(synced[0].priceAfterDiscount).toBe(1900);

  const doc = {
    code: "15",
    offerMode: 1,
    companyName: "شركة اختبار",
    offerTitle: "عرض سعر",
    texts: defaultPrintTexts("شركة اختبار"),
    services: buildPrintServices(synced),
    trainees: buildPrintTrainees(trainees)
  };
  const { container } = render(<OfferPriceDocument doc={doc} />);
  expect(container.querySelectorAll(".offer-price-page").length).toBe(4);
  expect(container.textContent).toContain("صفحة 1 من 3");
  expect(container.textContent).toContain("كشف أسماء المتدربين");
  expect(container.textContent).toContain("15 /");
});

test("long trainee list splits across pages", () => {
  const items = [itemFromService(service)];
  const trainees = Array.from({ length: 20 }, (_, i) =>
    applyTraineePrice({ id: `t${i}`, traineeName: `متدرب ${i + 1}`, specialization: service.name }, items)
  );
  const doc = {
    code: "16",
    offerMode: 1,
    companyName: "شركة",
    offerTitle: "عرض سعر",
    texts: defaultPrintTexts("شركة"),
    services: buildPrintServices(syncItemsFromTrainees(items, trainees)),
    trainees: buildPrintTrainees(trainees)
  };
  const { container } = render(<OfferPriceDocument doc={doc} />);
  // خطاب + بيان + (16 متدرب) + (4 متدربين + الشروط والتوقيع) + البنك
  expect(container.querySelectorAll(".offer-price-page").length).toBe(5);
  expect(container.textContent).toContain("(تابع)");
  expect(container.textContent).toContain("متدرب 20");
});

test("hidden parts and columns are left out of the document", () => {
  const items = [itemFromService(service)];
  const doc = {
    code: "17",
    offerMode: 0,
    companyName: "شركة",
    offerTitle: "عرض سعر",
    texts: defaultPrintTexts("شركة"),
    services: buildPrintServices(items),
    trainees: [],
    show: { letter: false, summaryTotal: false, detailsTotal: false, bank: false, signature: false },
    hiddenColumns: { details: ["paid", "remaining"] }
  };
  const { container } = render(<OfferPriceDocument doc={doc} />);
  // بيان + تفاصيل بس
  expect(container.querySelectorAll(".offer-price-page").length).toBe(2);
  expect(container.textContent).toContain("صفحة 1 من 2");
  expect(container.textContent).not.toContain("الإجمالي1,150");
  // رأس جدول التفاصيل بيخلص عند "بعد الخصم" (المدفوع والمتبقي مخفيين).
  expect(container.textContent).toContain("الخصمبعد الخصم1دبلوم");
  expect(container.textContent).not.toContain("الختم");
  expect(container.textContent).toContain("بعد الخصم");
});

test("measured pagination never overflows a page and keeps every row in order", () => {
  const many = Array.from({ length: 23 }, (_, i) => ({
    ...service,
    name: i % 3 === 0 ? `دبلوم إدارة المستشفيات والخدمات الصحية والتمريض المتقدم رقم ${i + 1}` : `خدمة ${i + 1}`,
    guid: `g${i}`
  }));
  const doc = {
    code: "20",
    offerMode: 0,
    companyName: "شركة",
    offerTitle: "عرض سعر",
    texts: defaultPrintTexts("شركة"),
    services: buildPrintServices(many.map(itemFromService)),
    trainees: []
  };
  const tailTypes = (key) => pagesNoMetrics.filter((p) => p.sectionKey === key).pop().blocks.map((b) => b.type);
  const tailMetric = (type, termsCount) =>
    type === "terms" ? terms(termsCount) : { height: { info: 120, thanks: 40, signature: 190 }[type] };
  const sec = (rows, termsCount, types) => ({
    title: 62,
    tableHead: 40,
    // الأسماء الطويلة بتلف على سطرين = صف أطول
    rows: rows.map((_, i) => (i % 3 === 0 ? 58 : 34)),
    total: 34,
    tail: types.map((type) => tailMetric(type, termsCount))
  });
  const pagesNoMetrics = paginateOffer(doc, null);
  const terms = (n) => ({ base: 50, items: Array.from({ length: n }, () => 26) });
  const termsOf = (key) =>
    pagesNoMetrics
      .filter((p) => p.sectionKey === key)
      .flatMap((p) => p.blocks)
      .filter((b) => b.type === "terms")
      .reduce((n, b) => n + b.terms.length, 0);
  const summaryTerms = termsOf("summary");
  const detailTerms = termsOf("details");
  const types = { summary: tailTypes("summary"), details: tailTypes("details") };
  const metrics = { note: 22, empty: 60, sections: { summary: sec(many, summaryTerms, types.summary), details: sec(many, detailTerms, types.details) } };

  const pages = paginateOffer(doc, metrics);
  ["summary", "details"].forEach((key) => {
    const sm = metrics.sections[key];
    const list = pages.filter((p) => p.sectionKey === key);
    let seen = 0;
    list.forEach((page) => {
      let used = sm.title + (page.currencyNote ? metrics.note : 0);
      if (page.rows.length || page.showTotal) used += sm.tableHead;
      page.rows.forEach((_, i) => { used += sm.rows[page.startIndex + i]; });
      if (page.showTotal) used += sm.total;
      page.blocks.forEach((b) => {
        const bi = types[key].indexOf(b.type);
        const bm = sm.tail[bi];
        used += b.type === "terms" ? bm.base + b.terms.length * 26 : bm.height;
      });
      expect(used).toBeLessThanOrEqual(OFFER_CONTENT_H);
      if (page.rows.length) expect(page.startIndex).toBe(seen);
      seen += page.rows.length;
    });
    expect(seen).toBe(23);
    // الإجمالي مرة واحدة، والتوقيع في آخر صفحة للقسم
    expect(list.filter((p) => p.showTotal)).toHaveLength(1);
    expect(list[list.length - 1].blocks.some((b) => b.type === "signature")).toBe(true);
    expect(list.length).toBeGreaterThan(1);
  });
});
