import { PageAgent } from 'page-agent';

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

    // Intercept fetch calls to bypass CORS via background script
    const originalFetch = window.fetch;
    window.fetch = async function(resource, config) {
      const urlString = typeof resource === 'string' ? resource : resource?.url;
      if (urlString && urlString.includes(profile.baseURL)) {
        const port = chrome.runtime.connect({ name: 'proxy-fetch' });
        port.postMessage({ url: urlString, options: config });
        
        return new Promise((resolve) => {
          let streamController = null;
          const readable = new ReadableStream({
            start(controller) {
              streamController = controller;
            }
          });
          
          port.onMessage.addListener((msg) => {
            if (msg.type === 'RESPONSE_START') {
              resolve(new Response(readable, {
                status: msg.status,
                statusText: msg.statusText,
                headers: new Headers(msg.headers)
              }));
            } else if (msg.type === 'CHUNK') {
              streamController.enqueue(new Uint8Array(msg.data));
            } else if (msg.type === 'ERROR') {
              streamController.error(new Error(msg.error));
            } else if (msg.type === 'DONE') {
              streamController.close();
              port.disconnect();
            }
          });
        });
      }
      return originalFetch.apply(this, arguments);
    };
    
    // 2. Initialize Alibaba PageAgent
    const agent = new PageAgent({
      model: profile.model || 'gpt-4o',
      baseURL: profile.baseURL || 'https://api.openai.com/v1',
      apiKey: profile.apiKey,
      language: 'en-US'
    });

    const instruction = `
      You are an AI Job Application Assistant.
      Please complete the job application form on this page using the following applicant information.
      
      Applicant Details:
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
      5. Do not click the final "Submit" button automatically unless explicitly instructed.
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
