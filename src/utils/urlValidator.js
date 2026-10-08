const MAX_URL_LENGTH = 2048;

function validateUrl(inputUrl) {
  if (!inputUrl || typeof inputUrl !== 'string' || inputUrl.trim() === '') {
    return { isValid: false, error: 'URL cannot be empty' };
  }

  const trimmed = inputUrl.trim();

  if (trimmed.length > MAX_URL_LENGTH) {
    return { isValid: false, error: `URL exceeds maximum allowed length of ${MAX_URL_LENGTH} characters` };
  }

  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return { isValid: false, error: 'Unsupported protocol. Only http:// and https:// URLs are supported.' };
    }
    if (!parsed.hostname || !parsed.hostname.includes('.')) {
      return { isValid: false, error: 'Invalid URL hostname.' };
    }
    return { isValid: true, normalizedUrl: parsed.toString() };
  } catch {
    return { isValid: false, error: 'Invalid URL format. Please provide a valid HTTP/HTTPS URL.' };
  }
}

module.exports = { validateUrl };
