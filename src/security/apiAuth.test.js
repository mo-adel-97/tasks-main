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

test('expired session (401 with token) clears it and goes to login once', async () => {
  const assign = jest.fn();
  const originalLocation = window.location;
  delete window.location;
  window.location = { ...originalLocation, pathname: '/dashboard', assign };

  try {
    // public call without a token: 401 must not redirect
    transport.mockResolvedValue({ status: 401 });
    await window.fetch('https://api4.sstli.com/api/admission-requests');
    expect(assign).not.toHaveBeenCalled();

    localStorage.setItem('token', 'old-token');
    localStorage.setItem('user', '{"guid":"x"}');
    await window.fetch('https://api4.sstli.com/api/admission-requests');
    localStorage.setItem('token', 'old-token');
    await window.fetch('https://api4.sstli.com/api/payment-requests');

    expect(localStorage.getItem('user')).toBeNull();
    expect(assign).toHaveBeenCalledTimes(1);
    expect(assign).toHaveBeenCalledWith('/login?expired=1');
  } finally {
    window.location = originalLocation;
  }
});

test('writes to api4 carry the real device info; api1 and reads do not', async () => {
  localStorage.setItem('token', 'current-token');
  await window.fetch('https://api4.sstli.com/api/offer-price', { method: 'POST', body: '{}' });
  const api4 = transport.mock.calls[0][1].headers;
  expect(api4.get('X-Client-Device-Id')).toBeTruthy();
  expect(api4.get('X-Client-Page')).toBeTruthy();
  // نفس الجهاز = نفس المعرّف
  const id = api4.get('X-Client-Device-Id');
  await window.fetch('https://api4.sstli.com/api/offer-price', { method: 'POST', body: '{}' });
  expect(transport.mock.calls[1][1].headers.get('X-Client-Device-Id')).toBe(id);

  await window.fetch('https://api1.sstli.com/api/userinfo/login-secure', { method: 'POST', body: '{}' });
  expect(transport.mock.calls[2][1].headers.get('X-Client-Device-Id')).toBeNull();

  // القراءة: معرّف الجهاز بس (للحظر)، من غير باقي البيانات
  await window.fetch('https://api4.sstli.com/api/user-management/users');
  expect(transport.mock.calls[3][1].headers.get('X-Client-Device-Id')).toBe(id);
  expect(transport.mock.calls[3][1].headers.get('X-Client-Page')).toBeNull();
});

test('a blocked device (403 blocked) raises the blocked event', async () => {
  const listener = jest.fn();
  window.addEventListener('sstli-device-blocked', listener);
  transport.mockResolvedValue({ status: 403, clone: () => ({ json: async () => ({ blocked: true, message: 'محظور' }) }) });
  await window.fetch('https://api4.sstli.com/api/anything');
  await new Promise((r) => setTimeout(r, 0));
  expect(listener).toHaveBeenCalledTimes(1);
  expect(listener.mock.calls[0][0].detail).toBe('محظور');
  window.removeEventListener('sstli-device-blocked', listener);
});
