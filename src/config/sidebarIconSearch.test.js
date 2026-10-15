import { normalizeArabic, searchIcons } from "./sidebarIconSearch";

const top = (q, n = 3) => searchIcons(q).slice(0, n);

describe("بحث الأيقونات بالعربي", () => {
  test("توحيد الكتابة العربية", () => {
    expect(normalizeArabic("الإدارة")).toBe("الاداره");
    expect(normalizeArabic("مُدَرِّس")).toBe("مدرس");
  });

  test.each([
    ["الرئيسية", "home"],
    ["الملف الشخصي", "accountcircle"],
    ["موظفين", "badge"],
    ["فلوس", "attachmoney"],
    ["تقارير", "assessment"],
    ["طباعة", "print"],
    ["الإعدادات", "settings"],
    ["فاتورة", "receipt"],
    ["طلاب", "school"],
    ["اجازات", "event"],
    ["كلمة السر", "lock"]
  ])("%s => %s", (query, expected) => {
    expect(top(query, 5)).toContain(expected);
  });

  test("الإنجليزي شغال زي ما هو", () => {
    expect(top("person")[0]).toBe("person");
  });

  test("كلمة مش في القاموس ترجع فاضي", () => {
    expect(searchIcons("كلمةغريبةجدا")).toEqual([]);
  });

  test("البحث الفاضي يرجّع كل الأيقونات", () => {
    expect(searchIcons("").length).toBeGreaterThan(300);
  });
});
