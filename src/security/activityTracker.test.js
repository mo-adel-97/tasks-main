import { markGuarded, trackIfUnguarded, trackPage } from "./activityTracker";

beforeEach(() => {
  jest.useFakeTimers();
  localStorage.setItem("token", "t");
  global.fetch = jest.fn(() => Promise.resolve({ ok: true }));
});

afterEach(() => {
  jest.useRealTimers();
  delete global.fetch;
});

const sentPaths = () => global.fetch.mock.calls.map(([, init]) => JSON.parse(init.body).path);

test("unguarded pages are tracked, guarded ones are left to PrivateRoute", () => {
  window.history.pushState({}, "", "/dashboard/after-sales-follow");
  trackIfUnguarded("/dashboard/after-sales-follow");
  jest.advanceTimersByTime(2000);
  expect(sentPaths()).toEqual(["/dashboard/after-sales-follow"]);

  window.history.pushState({}, "", "/dashboard/assets/branch");
  markGuarded("/dashboard/assets/branch");
  trackIfUnguarded("/dashboard/assets/branch");
  jest.advanceTimersByTime(2000);
  expect(sentPaths()).toEqual(["/dashboard/after-sales-follow"]);
});

test("same page within 5 seconds is sent once", () => {
  trackPage("/dashboard/x");
  trackPage("/dashboard/x");
  trackPage("/dashboard/x", "denied");
  expect(global.fetch).toHaveBeenCalledTimes(2);
});

test("visits carry the Arabic screen title from the sidebar", () => {
  localStorage.setItem("sstli_sidebar_config_v4", JSON.stringify({ items: [{ route: "/dashboard/assets", title: "الأصول" }, { route: "/dashboard/assets/branch", title: "أصول الفرع" }] }));
  trackPage("/dashboard/assets/branch?tab=purchases");
  expect(JSON.parse(global.fetch.mock.calls[0][1].body).detail).toBe("أصول الفرع");
});
