// content.js
// Import environment variables set by webpack
const API_KEY = process.env.VISION_API_KEY;

// Rate limiter class to prevent API abuse
class RateLimiter {
  constructor(maxRequests = 10, timeWindow = 60000) {
    this.requests = [];
    this.maxRequests = maxRequests;
    this.timeWindow = timeWindow; // Time window in milliseconds
  }

  canMakeRequest() {
    const now = Date.now();
    // Remove requests older than the time window
    this.requests = this.requests.filter(time => now - time < this.timeWindow);
    if (this.requests.length < this.maxRequests) {
      this.requests.push(now);
      return true;
    }
    return false;
  }
}

// Create a global rate limiter instance
const rateLimiter = new RateLimiter();

// Platform-specific selectors and configurations
const platformConfig = {
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

// Converts an image element to base64 encoded data
async function getImageData(imgElement) {
  return new Promise((resolve, reject) => {
    try {
      const canvas = document.createElement('canvas');
      canvas.width = imgElement.naturalWidth;
      canvas.height = imgElement.naturalHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(imgElement, 0, 0);
      // Extract base64 data, removing the data URL prefix
      resolve(canvas.toDataURL('image/jpeg').split(',')[1]);
    } catch (error) {
      reject(error);
    }
  });
}

// Makes the API call to Google Cloud Vision
async function callVisionAPI(imageData) {
  // Check rate limiting before making request
  if (!rateLimiter.canMakeRequest()) {
    throw new Error('Rate limit exceeded. Please try again later.');
  }

  try {
    const response = await fetch(`https://vision.googleapis.com/v1/images:annotate?key=${API_KEY}`, {
      method: 'POST',
      body: JSON.stringify({
        requests: [{
          image: { content: imageData },
          features: [
            { type: 'LABEL_DETECTION', maxResults: 5 },
            { type: 'OBJECT_LOCALIZATION', maxResults: 5 },
            { type: 'TEXT_DETECTION' },
            { type: 'IMAGE_PROPERTIES' }
          ]
        }]
      })
    });

    if (!response.ok) {
      throw new Error(`API call failed: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Vision API error:', error);
    return null;
  }
}

// Processes the Vision API response into a human-readable description
function processAPIResponse(apiResponse) {
  if (!apiResponse || !apiResponse.responses || !apiResponse.responses[0]) {
    return 'Image description unavailable';
  }

  const response = apiResponse.responses[0];
  const parts = [];

  // Process label annotations
  if (response.labelAnnotations && response.labelAnnotations.length > 0) {
    const labels = response.labelAnnotations
      .slice(0, 3)
      .map(label => label.description)
      .join(', ');
    parts.push(`Contains: ${labels}`);
  }

  // Process object annotations
  if (response.localizedObjectAnnotations && response.localizedObjectAnnotations.length > 0) {
    const objects = response.localizedObjectAnnotations
      .slice(0, 3)
      .map(obj => obj.name.toLowerCase())
      .join(', ');
    parts.push(`Objects detected: ${objects}`);
  }

  // Process text detection
  if (response.textAnnotations && response.textAnnotations[0]) {
    const text = response.textAnnotations[0].description.split('\n')[0];
    if (text && text.length < 100) {  // Only include text if it's reasonably short
      parts.push(`Text visible: "${text}"`);
    }
  }

  // Combine all parts into a single description
  return parts.join('. ') || 'Image description unavailable';
}

// Main function to initialize the alt text generation
async function initAltTextGenerator() {
  // Determine which platform we're on
  const platform = window.location.hostname === 'x.com' ? 'x' : 'bluesky';
  const config = platformConfig[platform];

  // Create mutation observer to watch for image uploads
  const observer = new MutationObserver(async (mutations) => {
    for (const mutation of mutations) {
      const mediaContainer = document.querySelector(config.mediaSelector);
      
      if (mediaContainer) {
        const altTextInput = document.querySelector(config.altTextInputSelector);
        const imageElement = document.querySelector(config.imageSelector);

        // Only proceed if we have both an image and an empty alt text input
        if (altTextInput && imageElement && !altTextInput.value) {
          try {
            // Convert image to base64
            const imageData = await getImageData(imageElement);
            
            // Get description from Vision API
            const apiResponse = await callVisionAPI(imageData);
            if (apiResponse) {
              // Process the response into a readable description
              const description = processAPIResponse(apiResponse);
              
              // Set the alt text value and trigger input event
              altTextInput.value = description;
              altTextInput.dispatchEvent(new Event('input', { bubbles: true }));
            }
          } catch (error) {
            console.error('Error generating alt text:', error);
            // Optionally set a fallback description
            altTextInput.value = 'Error generating description. Please add alt text manually.';
            altTextInput.dispatchEvent(new Event('input', { bubbles: true }));
          }
        }
      }
    }
  });

  // Start observing the document for changes
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
}

// Initialize the alt text generator when the page loads
document.addEventListener('DOMContentLoaded', initAltTextGenerator);
// Also run initialization immediately in case DOM is already loaded
initAltTextGenerator();