document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('shortenForm');
  const urlInput = document.getElementById('urlInput');
  const submitBtn = document.getElementById('submitBtn');
  const btnLoader = submitBtn.querySelector('.btn-loader');
  const btnText = submitBtn.querySelector('.btn-text');
  const errorMessage = document.getElementById('errorMessage');

  const resultSection = document.getElementById('resultSection');
  const shortUrlOutput = document.getElementById('shortUrlOutput');
  const originalUrlDisplay = document.getElementById('originalUrlDisplay');
  const copyBtn = document.getElementById('copyBtn');
  const copyBtnText = document.getElementById('copyBtnText');
  const testLinkBtn = document.getElementById('testLinkBtn');
  const clickCount = document.getElementById('clickCount');
  const refreshStatsBtn = document.getElementById('refreshStatsBtn');

  const recentSection = document.getElementById('recentSection');
  const recentList = document.getElementById('recentList');
  const clearRecentBtn = document.getElementById('clearRecentBtn');

  const STORAGE_KEY = 'shortened_urls_history';
  let currentShortCode = null;

  function getStoredUrls() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    } catch {
      return [];
    }
  }

  function saveStoredUrls(urls) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(urls.slice(0, 15)));
    } catch (e) {
      console.warn('LocalStorage save failed:', e);
    }
  }

  function renderRecentUrls() {
    const urls = getStoredUrls();
    if (!urls || urls.length === 0) {
      recentSection.style.display = 'none';
      recentList.innerHTML = '';
      return;
    }

    recentSection.style.display = 'flex';
    recentList.innerHTML = '';

    urls.forEach((item) => {
      const card = document.createElement('div');
      card.className = 'recent-item';
      card.dataset.code = item.shortCode;

      card.innerHTML = `
        <div class="recent-item-top">
          <a href="${item.shortUrl}" target="_blank" rel="noopener noreferrer" class="recent-short-link" title="Open ${item.shortUrl}">
            ${item.shortUrl}
          </a>
          <div class="recent-actions">
            <button type="button" class="recent-btn-copy" data-url="${item.shortUrl}">Copy</button>
            <a href="${item.shortUrl}" target="_blank" rel="noopener noreferrer" class="btn-visit" style="padding: 4px 10px; font-size: 0.75rem;">Visit ↗</a>
          </div>
        </div>
        <div class="recent-item-bottom">
          <span class="recent-original" title="${item.originalUrl}">Original: ${item.originalUrl}</span>
          <span class="recent-clicks" id="clicks-${item.shortCode}">Clicks: ${item.clicks ?? 0}</span>
        </div>
      `;

      recentList.appendChild(card);

      // Async fetch latest stats from backend MongoDB
      fetch(`/api/stats/${item.shortCode}`)
        .then((r) => r.json())
        .then((res) => {
          if (res.success && res.data) {
            const clickSpan = document.getElementById(`clicks-${item.shortCode}`);
            if (clickSpan) clickSpan.textContent = `Clicks: ${res.data.clicks}`;
          }
        })
        .catch(() => {});
    });

    // Wire copy buttons inside recent list
    recentList.querySelectorAll('.recent-btn-copy').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const url = btn.dataset.url;
        if (!url) return;
        try {
          if (navigator.clipboard && window.isSecureContext) {
            await navigator.clipboard.writeText(url);
          } else {
            const input = document.createElement('input');
            input.value = url;
            document.body.appendChild(input);
            input.select();
            document.execCommand('copy');
            document.body.removeChild(input);
          }
          btn.classList.add('copied');
          btn.textContent = 'Copied!';
          setTimeout(() => {
            btn.classList.remove('copied');
            btn.textContent = 'Copy';
          }, 2000);
        } catch {
          showError('Could not copy link to clipboard');
        }
      });
    });
  }

  function addUrlToStorage(newRecord) {
    const list = getStoredUrls().filter((u) => u.shortCode !== newRecord.shortCode);
    list.unshift(newRecord);
    saveStoredUrls(list);
    renderRecentUrls();
  }

  function showError(msg) {
    errorMessage.textContent = msg;
    errorMessage.style.display = 'block';
  }

  function clearError() {
    errorMessage.textContent = '';
    errorMessage.style.display = 'none';
  }

  function setLoading(isLoading) {
    if (isLoading) {
      submitBtn.disabled = true;
      btnLoader.style.display = 'inline-block';
      btnText.textContent = 'Shortening...';
    } else {
      submitBtn.disabled = false;
      btnLoader.style.display = 'none';
      btnText.textContent = 'Shorten URL';
    }
  }

  async function refreshStats() {
    if (!currentShortCode) return;
    try {
      refreshStatsBtn.style.opacity = '0.5';
      const res = await fetch(`/api/stats/${currentShortCode}`);
      const data = await res.json();
      if (data.success && data.data) {
        clickCount.textContent = data.data.clicks;
        const recentSpan = document.getElementById(`clicks-${currentShortCode}`);
        if (recentSpan) recentSpan.textContent = `Clicks: ${data.data.clicks}`;
      }
    } catch (err) {
      console.error('Stats fetch failed:', err);
    } finally {
      refreshStatsBtn.style.opacity = '1';
    }
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearError();

    const rawUrl = urlInput.value.trim();

    if (!rawUrl) {
      showError('Please enter a URL to shorten');
      urlInput.focus();
      return;
    }

    try {
      const parsed = new URL(rawUrl);
      if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
        showError('Please enter a valid URL starting with http:// or https://');
        return;
      }
    } catch {
      showError('Please enter a valid URL (e.g., https://example.com)');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/shorten', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: rawUrl })
      });

      const result = await res.json();

      if (!res.ok || !result.success) {
        showError(result.error || 'Failed to shorten URL');
        return;
      }

      currentShortCode = result.data.shortCode;
      shortUrlOutput.value = result.data.shortUrl;
      originalUrlDisplay.textContent = result.data.originalUrl;
      originalUrlDisplay.title = result.data.originalUrl;
      testLinkBtn.href = result.data.shortUrl;
      clickCount.textContent = result.data.clicks;

      resultSection.style.display = 'flex';
      copyBtn.classList.remove('copied');
      copyBtnText.textContent = 'Copy';
      urlInput.value = '';

      addUrlToStorage(result.data);
    } catch (err) {
      showError('Network error: Unable to reach the server.');
    } finally {
      setLoading(false);
    }
  });

  copyBtn.addEventListener('click', async () => {
    if (!shortUrlOutput.value) return;

    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(shortUrlOutput.value);
      } else {
        shortUrlOutput.select();
        document.execCommand('copy');
      }

      copyBtn.classList.add('copied');
      copyBtnText.textContent = 'Copied!';

      setTimeout(() => {
        copyBtn.classList.remove('copied');
        copyBtnText.textContent = 'Copy';
      }, 2500);
    } catch (err) {
      showError('Could not copy to clipboard.');
    }
  });

  refreshStatsBtn.addEventListener('click', (e) => {
    e.preventDefault();
    refreshStats();
  });

  clearRecentBtn.addEventListener('click', () => {
    localStorage.removeItem(STORAGE_KEY);
    renderRecentUrls();
  });

  window.addEventListener('focus', () => {
    if (currentShortCode && resultSection.style.display !== 'none') {
      refreshStats();
    }
    renderRecentUrls();
  });

  // Initial render on page load
  renderRecentUrls();
});
