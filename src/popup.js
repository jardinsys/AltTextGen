// popup.js
document.addEventListener('DOMContentLoaded', function() {
  // Load saved API key
  chrome.storage.sync.get(['apiKey'], function(data) {
    const apiKeyInput = document.getElementById('apiKey');
    if (data.apiKey) {
      // Show only last 4 characters of the API key
      apiKeyInput.value = '•'.repeat(20) + data.apiKey.slice(-4);
      apiKeyInput.dataset.masked = 'true';
    }
  });

  // Handle API key input focus
  document.getElementById('apiKey').addEventListener('focus', function(e) {
    if (e.target.dataset.masked === 'true') {
      e.target.value = '';
      e.target.dataset.masked = 'false';
    }
  });

  // Save API key
  document.getElementById('saveKey').addEventListener('click', function() {
    const apiKey = document.getElementById('apiKey').value;
    chrome.storage.sync.set({ apiKey: apiKey }, function() {
      // Show success feedback
      const button = document.getElementById('saveKey');
      const originalText = button.textContent;
      button.textContent = 'Saved!';
      button.style.backgroundColor = '#059669';
      
      setTimeout(() => {
        button.textContent = originalText;
        button.style.backgroundColor = '';
      }, 2000);
    });
  });
});