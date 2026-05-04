chrome.runtime.onInstalled.addListener(() => {
  console.log("Job Application Copilot installed.");
});

// A background service worker can handle external API calls to avoid CORS issues.
chrome.runtime.onConnect.addListener((port) => {
  if (port.name === 'proxy-fetch') {
    port.onMessage.addListener(async (msg) => {
      try {
        const res = await fetch(msg.url, msg.options);
        
        if (!res.ok) {
          const errText = await res.text();
          port.postMessage({ type: 'ERROR', error: `HTTP ${res.status}: ${errText}` });
          return;
        }

        port.postMessage({
          type: 'RESPONSE_START',
          status: res.status,
          statusText: res.statusText,
          headers: Array.from(res.headers.entries())
        });
        
        if (res.body) {
          const reader = res.body.getReader();
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            // Convert Uint8Array to normal array for message passing
            port.postMessage({ type: 'CHUNK', data: Array.from(value) });
          }
        }
        port.postMessage({ type: 'DONE' });
      } catch (err) {
        port.postMessage({ type: 'ERROR', error: err.message });
      }
    });
  }
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === "CALL_OCR_API") {
    sendResponse({ success: true, text: "Dummy OCR Text" });
    return true;
  }
});
