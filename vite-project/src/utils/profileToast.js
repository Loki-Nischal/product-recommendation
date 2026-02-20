// Lightweight event-based toast utility for "Saved to profile" notifications.
// Components call notifyProfileSaved() after a successful backend write;
// the global <ProfileSaveToast /> component picks up the event and shows UI.

export function notifyProfileSaved(message = 'Saved to profile') {
  window.dispatchEvent(
    new CustomEvent('profile-saved', { detail: { message } })
  );
}
