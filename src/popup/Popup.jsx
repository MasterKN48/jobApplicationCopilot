import React, { useState, useEffect } from "react";
import { Play, Settings } from "lucide-react";

export default function Popup() {
  const [status, setStatus] = useState("Ready to apply");
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    // Listen for status updates from the content script
    chrome.runtime.onMessage.addListener((message) => {
      if (message.type === "STATUS_UPDATE") {
        setStatus(message.payload);
      }
      if (message.type === "RUN_COMPLETE") {
        setIsRunning(false);
      }
    });
  }, []);

  const handleStart = async () => {
    setIsRunning(true);
    setStatus("Initializing PageAgent...");

    // Get the active tab
    const [tab] = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });

    if (tab) {
      // Send message to content script to start
      chrome.tabs.sendMessage(tab.id, { type: "START_APPLICATION" });
    } else {
      setStatus("No active tab found.");
      setIsRunning(false);
    }
  };

  const openOptions = async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab) {
      // Open the side panel for the current window
      chrome.sidePanel.open({ windowId: tab.windowId });
      window.close(); // Close the popup
    }
  };

  return (
    <div className="popup-container">
      <div className="header">
        <h1>Job Copilot</h1>
      </div>

      <div className="status-section">
        <span className="status-label">Current Status</span>
        <div className="status-value">{status}</div>
      </div>

      <div className="actions">
        <button
          className="btn btn-primary"
          onClick={handleStart}
          disabled={isRunning}
        >
          <Play size={18} />
          {isRunning ? "Applying..." : "Auto-Fill Application"}
        </button>

        <button className="btn btn-secondary" onClick={openOptions}>
          <Settings size={18} />
          Configure Profile
        </button>
      </div>
    </div>
  );
}
