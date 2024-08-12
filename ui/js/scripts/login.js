import { Ripple } from '../modules/ripple.js';
import { WebhookExists } from '../modules/webhook.js';
const { electronAPI } = window;

async function WriteUserData(data) {
  await electronAPI.WriteUserData(data);
}

document.getElementById('enter').addEventListener('click', async function() {
  if (await WebhookExists(document.getElementById('webhook').value) === true) {
    await WriteUserData({ webhook_token: document.getElementById('webhook').value});
    document.getElementById('notfound').innerText = ' ';
    setTimeout(() => {
        electronAPI.openMainWindow();
      }, 330);
  } else {
    document.getElementById('notfound').innerText = 'Webhook not found!';
  }
});

new Ripple('.enter-btn');