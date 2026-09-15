# Color modes and modal stability

- `ColorModeProvider` owns the app palette, document color scheme and saved `sstli-color-mode` preference. A sun/moon button is available at the bottom left of every route.
- Page-local themes inherit the outer palette. Portals, dialogs, menus and date pickers use the same mode.
- `themeColors.js` adapts legacy literal colors in Emotion styles and inline styles without changing geometry, images or the light appearance. Prefer semantic MUI colors (`background.paper`, `text.primary`, `divider`) in new UI.
- CSS reserves the document scrollbar gutter. MUI still locks background scrolling and traps focus; its physical right padding does not add a second gutter in browsers supporting `scrollbar-gutter`.
- Print CSS selects the light color scheme and hides the mode button.

## Verification

13 focused Jest tests passed (theme direction, navigation, persistent mode, portal inheritance and legacy color conversion).

`results.json` records browser geometry at 1440px and 390px in both modes. Opening a dialog, opening/closing a nested dialog, and closing the original dialog preserved the content x-position, content width, sidebar position and scroll position.

Screenshots: `light-1440.png`, `dark-1440.png`, `light-390.png`, `dark-390.png`.

To reproduce the isolated fixture, run `node ui-review/theme/server.cjs`, start a disposable Chrome debugging session on port 9226, then run `node ui-review/theme/verify.cjs`. The fixture contains no API requests or production data.
