// popup.js
document.addEventListener('DOMContentLoaded', function() {
  // Load saved API key
  chrome.storage.sync.get(['apiKey'], function(data) {
    document.getElementById('apiKey').value = data.apiKey || '';
  });

  // Save API key
  document.getElementById('saveKey').addEventListener('click', function() {
    const apiKey = document.getElementById('apiKey').value;
    chrome.storage.sync.set({ apiKey: apiKey });
  });
});
