/**
 * CineSync Helper Utilities
 */

/**
 * Generate a cryptographically secure random room slug
 * @returns {string} 10-character room slug
 */
export function generateRoomSlug() {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  const array = new Uint8Array(10);
  crypto.getRandomValues(array);
  return Array.from(array, byte => chars[byte % chars.length]).join('');
}

/**
 * Sanitize text to prevent XSS attacks
 * @param {string} str Raw text input
 * @returns {string} Sanitized safe string
 */
export function sanitizeHTML(str) {
  if (!str) return '';
  const temp = document.createElement('div');
  temp.textContent = str;
  return temp.innerHTML;
}

/**
 * Format time in seconds to HH:MM:SS or MM:SS
 * @param {number} seconds
 * @returns {string} Formatted timestamp string
 */
export function formatTime(seconds) {
  if (isNaN(seconds) || seconds < 0) return '00:00';
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  
  if (hrs > 0) {
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Copy text to clipboard and trigger optional callback
 * @param {string} text Text to copy
 * @returns {Promise<boolean>} Success boolean
 */
export async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (err) {
    console.error('Clipboard copy failed:', err);
    return false;
  }
}
