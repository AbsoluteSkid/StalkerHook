export async function WebhookExists(url) {
  /**
  * @param {string} url
  * @returns {<Promise>boolean} 
  */
  try {
      if (!url.trim() || !url.startsWith('https://discord.com/api/webhooks/')) {
          return false;
      }
      const response = await fetch(url);
      if (response.status === 200) {
          return true;
      }
      return false;
  } catch {
      return false;
  }
}
