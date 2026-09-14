# Typography and Sidebar verification

Typography sizes are maintained in `src/config/designTokens.js` under `typography`.
`src/config/typographySystem.js` maps those sizes to semantic text roles through the existing CssBaseline. The Cairo font family is unchanged. Legacy MUI sx font sizes are overridden by the shared semantic rules without !important; SVG icons and media are not scaled.

Sidebar submenu choices are scoped to the current route and reset on navigation. Home routes do not automatically expand groups. Manual toggling on Home remains available; child routes reveal their active group.

## Browser checks

Verified in the built-in browser against http://localhost:3000 with an authenticated user session:
- Desktop: 1366px; input text measured 13.366px.
- Tablet: 1024px (13.024px input text) and 768px (13px).
- Mobile: 430px, 390px and 375px; 13px input text.
- User Management: screenshots inspected at these widths; document scrollWidth matched clientWidth, with no horizontal page overflow.
- Home: File initially closed; manual expansion works; child page exposes its active group; returning Home closes it again.
- Mobile Home Drawer: File closed when the overlay opens.
- Viewport override cleared after testing.

These checks cover Home and User Management, not every route in the application.

## Automated checks

18 distinct affected tests passed across the typography-tests and typography-sidebar-tests runs. The new SidebarHome regression test covers manual expansion, child navigation and returning Home. Build output is recorded in typography-build.log.
