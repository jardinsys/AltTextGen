// content.js
function initAltTextHelper() {
  const isPlatform = {
    x: window.location.hostname === 'x.com',
    bluesky: window.location.hostname === 'bsky.app'
  };

  const config = {
    x: {
      mediaSelector: '[data-testid="attachments"]',
      altTextInputSelector: '[aria-label="Image description"]'
    },
    bluesky: {
      mediaSelector: '.composer-media',
      altTextInputSelector: 'textarea[placeholder*="Alt text"]'
    }
  };

  const observer = new MutationObserver((mutations) => {
    mutations.forEach(() => {
      const platform = isPlatform.x ? 'x' : 'bluesky';
      const mediaContainer = document.querySelector(config[platform].mediaSelector);
      
      if (mediaContainer) {
        const altTextInput = document.querySelector(config[platform].altTextInputSelector);
        if (altTextInput && !altTextInput.value) {
          altTextInput.value = "This is alt text";
          altTextInput.dispatchEvent(new Event('input', { bubbles: true }));
        }
      }
    });
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
}

initAltTextHelper();