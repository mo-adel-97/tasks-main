// Print only after the document's fonts and images have settled. This helper
// deliberately knows nothing about viewport breakpoints or business data.
export async function printWhenReady(target = window) {
  const doc = target.document;
  if (doc.fonts?.ready) await doc.fonts.ready;
  await Promise.all(Array.from(doc.images || []).map((image) => {
    if (image.complete) return Promise.resolve();
    return new Promise((resolve) => {
      image.addEventListener('load', resolve, { once: true });
      image.addEventListener('error', resolve, { once: true });
    });
  }));
  target.focus();
  target.print();
}

// Standalone print windows do not load the React application bundle.
export const PRINT_READY_SCRIPT = `<script>
async function printWhenReady() {
  if (document.fonts && document.fonts.ready) await document.fonts.ready;
  await Promise.all(Array.from(document.images || []).map(function(image) {
    if (image.complete) return Promise.resolve();
    return new Promise(function(resolve) {
      image.addEventListener('load', resolve, {once:true});
      image.addEventListener('error', resolve, {once:true});
    });
  }));
  window.focus();
  window.print();
}
</script>`;
