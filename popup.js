// popup.js
document.addEventListener('DOMContentLoaded', function() {
    // Load saved settings
    chrome.storage.sync.get(['feature1'], function(data) {
      document.getElementById('feature1').checked = data.feature1 || false;
    });
  
    // Save settings when changed
    document.getElementById('feature1').addEventListener('change', function(e) {
      chrome.storage.sync.set({
        feature1: e.target.checked
      });
    });
  });