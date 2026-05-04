import { PageAgent } from 'page-agent';

// Intercept fetch calls to bypass CORS via background script BEFORE PageAgent loads
const originalFetch = window.fetch;
window.fetch = async function(resource, config) {
  let urlString = typeof resource === 'string' ? resource : resource?.url;
  
  if (urlString && (urlString.includes('127.0.0.1') || urlString.includes('localhost') || urlString.includes('/v1/chat/completions'))) {
    
    let method = 'GET';
    let headersObj = {};
    let bodyText = undefined;
    
    // Extract from Request object if resource is one
    if (typeof resource !== 'string' && resource instanceof Request) {
      method = resource.method;
      resource.headers.forEach((v, k) => headersObj[k] = v);
      if (method !== 'GET' && method !== 'HEAD') {
        bodyText = await resource.text();
      }
    }
    
    // Override with config if present
    if (config) {
      if (config.method) method = config.method;
      if (config.headers) {
        if (config.headers instanceof Headers) {
          config.headers.forEach((v, k) => headersObj[k] = v);
        } else if (Array.isArray(config.headers)) {
          config.headers.forEach(([k, v]) => headersObj[k] = v);
        } else {
          Object.assign(headersObj, config.headers);
        }
      }
      if (config.body) {
        bodyText = config.body;
      }
    }

    // Fix LM Studio compatibility issue: it doesn't support object tool_choice
    if (bodyText && (urlString.includes('127.0.0.1') || urlString.includes('localhost'))) {
      try {
        const parsedBody = JSON.parse(bodyText);
        if (typeof parsedBody.tool_choice === 'object') {
          parsedBody.tool_choice = 'auto'; // Fallback to 'auto' for local models
          bodyText = JSON.stringify(parsedBody);
        }
      } catch (e) {
        console.error("Failed to parse/fix request body", e);
      }
    }

    const port = chrome.runtime.connect({ name: 'proxy-fetch' });
    port.postMessage({ url: urlString, options: { method, headers: headersObj, body: bodyText } });
    
    return new Promise((resolve, reject) => {
      let streamController = null;
      let responseStarted = false;
      const readable = new ReadableStream({
        start(controller) {
          streamController = controller;
        }
      });
      
      port.onMessage.addListener((msg) => {
        if (msg.type === 'RESPONSE_START') {
          responseStarted = true;
          resolve(new Response(readable, {
            status: msg.status,
            statusText: msg.statusText,
            headers: new Headers(msg.headers)
          }));
        } else if (msg.type === 'CHUNK') {
          if (streamController) streamController.enqueue(new Uint8Array(msg.data));
        } else if (msg.type === 'ERROR') {
          const err = new Error(msg.error);
          if (responseStarted && streamController) {
            streamController.error(err);
          } else {
            reject(err);
          }
        } else if (msg.type === 'DONE') {
          if (streamController) streamController.close();
          port.disconnect();
        }
      });
    });
  }
  return originalFetch.apply(this, arguments);
};

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'START_APPLICATION') {
    startJobApplicationProcess();
  }
});

async function startJobApplicationProcess() {
  chrome.runtime.sendMessage({ type: 'STATUS_UPDATE', payload: 'Loading user profile...' });
  
  // 1. Load user configuration and resume data
  const data = await chrome.storage.local.get(['userProfile']);
  const profile = data.userProfile;

  if (!profile || !profile.apiKey) {
    chrome.runtime.sendMessage({ type: 'STATUS_UPDATE', payload: 'Error: API Key not configured in Options.' });
    chrome.runtime.sendMessage({ type: 'RUN_COMPLETE' });
    return;
  }

  try {
    chrome.runtime.sendMessage({ type: 'STATUS_UPDATE', payload: 'Initializing PageAgent...' });
    
    // 2. Initialize Alibaba PageAgent
    const agent = new PageAgent({
      model: profile.model || 'google/gemma-4-e4b',
      baseURL: profile.baseURL || 'http://127.0.0.1:1234/v1',
      apiKey: profile.apiKey,
      language: 'en-US'
    });

    const instruction = `
      You are an AI Job Application Assistant.
      Please complete the job application form on this page using the following applicant information.
      
      Applicant Details:
      Email: ${profile.emailId || 'Not provided'}
      Phone: ${profile.phoneNo || 'Not provided'}
      LinkedIn: ${profile.linkedinUrl || 'Not provided'}
      GitHub/Website: ${profile.githubUrl || 'Not provided'}
      Portfolio: ${profile.portfolioUrl || 'Not provided'}
      
      Resume Information:
      ${profile.resumeText || 'Not provided'}
      
      Instructions:
      1. Find the application form on this page.
      2. Fill out text inputs, select dropdowns, and answer questions using the Applicant Details and Resume Information provided.
      3. For any fields requesting a resume upload, try to use a file input if possible (this may require manual user intervention for the actual file upload due to browser security, but attempt to interact).
      4. If a field cannot be answered from the provided info, leave it blank or select a neutral option.
      5. ${profile.autoSubmit ? 'When you have filled all possible fields, click the final "Submit" or "Apply" button to complete the application.' : 'Do not click the final "Submit" button automatically unless explicitly instructed. Leave it for the user to review.'}
    `;

    chrome.runtime.sendMessage({ type: 'STATUS_UPDATE', payload: 'Agent is analyzing page...' });
    
    // 3. Execute the agent instruction
    await agent.execute(instruction);
    
    chrome.runtime.sendMessage({ type: 'STATUS_UPDATE', payload: 'Form filling complete. Please review.' });
  } catch (error) {
    console.error("PageAgent Error:", error);
    chrome.runtime.sendMessage({ type: 'STATUS_UPDATE', payload: `Error: ${error.message}` });
  } finally {
    chrome.runtime.sendMessage({ type: 'RUN_COMPLETE' });
  }
}
