// content.js
async function initVisionAltText() {
  const isPlatform = {
    x: window.location.hostname === 'x.com',
    bluesky: window.location.hostname === 'bsky.app'
  };

  const config = {
    x: {
      mediaSelector: '[data-testid="attachments"]',
      altTextInputSelector: '[aria-label="Image description"]',
      imageSelector: 'img[src*="media"]'
    },
    bluesky: {
      mediaSelector: '.composer-media',
      altTextInputSelector: 'textarea[placeholder*="Alt text"]',
      imageSelector: 'img[src*="cdn"]'
    }
  };

  // Function to get image data as base64
  async function getImageData(imgElement) {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      canvas.width = imgElement.naturalWidth;
      canvas.height = imgElement.naturalHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(imgElement, 0, 0);
      resolve(canvas.toDataURL('image/jpeg').split(',')[1]);
    });
  }

  // Function to call Google Cloud Vision API
  async function getImageDescription(imageData) {
    // Get API key from storage
    const { apiKey } = await chrome.storage.sync.get(['apiKey']);
    if (!apiKey) {
      console.error('No API key found');
      return null;
    }

    const response = await fetch(`https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`, {
      method: 'POST',
      body: JSON.stringify({
        requests: [{
          image: {
            content: imageData
          },
          features: [
            { type: 'LABEL_DETECTION' },
            { type: 'OBJECT_LOCALIZATION' },
            { type: 'TEXT_DETECTION' }
          ]
        }]
      })
    });

    const data = await response.json();
    
    // Process the API response to create a meaningful description
    let description = 'Image contains: ';
    
    // Add detected labels
    if (data.responses[0].labelAnnotations) {
      const labels = data.responses[0].labelAnnotations
        .slice(0, 3)
        .map(label => label.description)
        .join(', ');
      description += labels;
    }

    // Add detected objects
    if (data.responses[0].localizedObjectAnnotations) {
      const objects = data.responses[0].localizedObjectAnnotations
        .slice(0, 3)
        .map(obj => obj.name)
        .join(', ');
      if (objects) {
        description += `. Notable objects: ${objects}`;
      }
    }

    // Add any detected text
    if (data.responses[0].textAnnotations?.[0]?.description) {
      const text = data.responses[0].textAnnotations[0].description.split('\n')[0];
      if (text) {
        description += `. Contains text: "${text}"`;
      }
    }

    return description;
  }

  const observer = new MutationObserver(async (mutations) => {
    mutations.forEach(async () => {
      const platform = isPlatform.x ? 'x' : 'bluesky';
      const mediaContainer = document.querySelector(config[platform].mediaSelector);
      
      if (mediaContainer) {
        const altTextInput = document.querySelector(config[platform].altTextInputSelector);
        const imageElement = document.querySelector(config[platform].imageSelector);
        
        if (altTextInput && imageElement && !altTextInput.value) {
          try {
            const imageData = await getImageData(imageElement);
            const description = await getImageDescription(imageData);
            
            if (description) {
              altTextInput.value = description;
              altTextInput.dispatchEvent(new Event('input', { bubbles: true }));
            }
          } catch (error) {
            console.error('Error generating alt text:', error);
          }
        }
      }
    });
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
}

initVisionAltText();