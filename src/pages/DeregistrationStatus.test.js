import { STATUS_META, statusKeyOf } from "./DeregistrationRequestsReport";

jest.mock("../components/common/PageContainer", () => () => null);
jest.mock("../components/NavigationShell", () => () => null);
jest.mock("./StudentStatementDialog2", () => () => null, { virtual: true });

test("maps request status to its color group", () => {
  expect(statusKeyOf({ statusCode: 1, requestStatus: "مؤكد" })).toBe("confirmed");
  expect(statusKeyOf({ statusCode: 0, requestStatus: "غير مؤكد" })).toBe("pending");
  expect(statusKeyOf({ statusCode: 2, requestStatus: "مرفوض" })).toBe("rejected");
  expect(statusKeyOf({})).toBe("pending");
  expect(new Set(Object.values(STATUS_META).map((m) => m.color)).size).toBe(3);
});
