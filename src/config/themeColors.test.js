import { adaptiveColor, adaptiveInlineStyle } from './themeColors';

test('legacy surfaces and text retain light colors with a dark alternative', () => {
  expect(adaptiveColor('#fff', 'background-color')).toContain('light-dark(#fff,');
  expect(adaptiveColor('#203b30', 'color')).toContain('light-dark(#203b30,');
  expect(adaptiveColor('rgba(0, 0, 0, 0.6)', 'color')).toContain('0.6)');
  expect(adaptiveColor('#034d31', 'background')).toBe('#034d31');
  expect(adaptiveColor('white', 'color')).toBe('white');
});

test('inline conversion preserves layout, images, transparency and semantic variables', () => {
  const style = { width: 300, backgroundColor: '#ffffff', color: 'var(--custom)', border: '1px solid #eee', backgroundImage: 'url(/white.png)' };
  const converted = adaptiveInlineStyle(style);
  expect(converted.width).toBe(300);
  expect(converted.backgroundColor).toContain('light-dark');
  expect(converted.border).toMatch(/^1px solid light-dark/);
  expect(converted.color).toBe(style.color);
  expect(converted.backgroundImage).toBe(style.backgroundImage);
  expect(style.backgroundColor).toBe('#ffffff');
  expect(adaptiveColor('rgba(255,255,255,0)', 'background')).toBe('rgba(255,255,255,0)');
});
