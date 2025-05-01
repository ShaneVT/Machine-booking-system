// Utility to clear element children
export function clearElement(el) {
  while (el.firstChild) el.removeChild(el.firstChild);
}

// Format Firestore Timestamp or Date
export function formatDateTime(ts) {
  const date = ts.toDate ? ts.toDate() : new Date(ts);
  return date.toLocaleString();
}

// Create and show a simple modal
export function showModal(contentHTML) {
  const modal = document.getElementById('modal-root');
  const content = document.getElementById('detail-content');
  content.innerHTML = contentHTML;
  modal.hidden = false;
}

export function closeModal() {
  document.getElementById('modal-root').hidden = true;
}
