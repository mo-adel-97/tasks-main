jest.mock('axios', () => ({ interceptors: { request: { use: jest.fn() }, response: { use: jest.fn() } } }));
const nativeFetch = window.fetch;
const transport = jest.fn(async () => ({ status: 200 }));
let shouldAttachAuth;

beforeAll(() => {
  window.fetch = transport;
  ({ shouldAttachAuth } = require('./apiAuth'));
});
afterAll(() => { window.fetch = nativeFetch; });
beforeEach(() => { transport.mockResolvedValue({ status: 200 }); });
afterEach(() => { localStorage.clear(); transport.mockClear(); });

test('management requests to port 5258 carry the session token', async () => {
  localStorage.setItem('token', 'current-token');
  await window.fetch('https://api4.sstli.com/api/user-management/users');
  expect(transport.mock.calls[0][1].headers.get('Authorization')).toBe('Bearer current-token');
  expect(shouldAttachAuth('http://127.0.0.1:5258/api/user-permissions/user')).toBe(true);
});

test('unrelated origins never receive the token', async () => {
  localStorage.setItem('token', 'current-token');
  await window.fetch('https://unrelated.example/api/users');
  expect(transport.mock.calls[0][1].headers).toBeUndefined();
});
