import React, { useState, useEffect } from 'react';
import { Save, User, Key, Link, Settings } from 'lucide-react';

export default function Options() {
  const [formData, setFormData] = useState({
    emailId: '',
    phoneNo: '',
    linkedinUrl: '',
    githubUrl: '',
    portfolioUrl: '',
    resumeText: '',
    resumeFileName: '',
    resumeBase64: '',
    autoSubmit: false,
    apiKey: '',
    baseURL: 'http://127.0.0.1:1234/v1',
    model: 'google/gemma-4-e4b'
  });
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    chrome.storage.local.get(['userProfile'], (result) => {
      if (result.userProfile) {
        setFormData(result.userProfile);
      }
    });
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({
          ...prev,
          resumeFileName: file.name,
          resumeBase64: reader.result
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = () => {
    chrome.storage.local.set({ userProfile: formData }, () => {
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    });
  };

  const handleStart = async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab) {
      chrome.tabs.sendMessage(tab.id, { type: 'START_APPLICATION' });
    } else {
      alert("No active tab found");
    }
  };

  return (
    <div className="options-container">
      <div className="header">
        <h1>Job Application Copilot</h1>
        <p>Set up your profile and click Auto-Fill on a job application page.</p>
        <button 
          className="btn" 
          onClick={handleStart} 
          style={{ marginTop: '16px', background: 'linear-gradient(135deg, #10b981, #059669)', width: '100%', justifyContent: 'center' }}
        >
          Auto-Fill Application
        </button>
      </div>

      <div className="section">
        <h2><User size={20} /> Personal Information</h2>
        <div className="form-group">
          <label>Email ID</label>
          <input 
            type="email" 
            name="emailId"
            value={formData.emailId}
            onChange={handleChange}
            placeholder="you@example.com" 
          />
        </div>
        <div className="form-group">
          <label>Phone Number</label>
          <input 
            type="tel" 
            name="phoneNo"
            value={formData.phoneNo}
            onChange={handleChange}
            placeholder="+1 555-000-0000" 
          />
        </div>
        <div className="form-group">
          <label>LinkedIn URL</label>
          <input 
            type="text" 
            name="linkedinUrl"
            value={formData.linkedinUrl}
            onChange={handleChange}
            placeholder="https://linkedin.com/in/yourprofile" 
          />
        </div>
        <div className="form-group">
          <label>GitHub / Website URL</label>
          <input 
            type="text" 
            name="githubUrl"
            value={formData.githubUrl}
            onChange={handleChange}
            placeholder="https://github.com/yourusername" 
          />
        </div>
        <div className="form-group">
          <label>Portfolio URL</label>
          <input 
            type="text" 
            name="portfolioUrl"
            value={formData.portfolioUrl}
            onChange={handleChange}
            placeholder="https://yourportfolio.com" 
          />
        </div>
        <div className="form-group">
          <label>Upload Resume (PDF/Word)</label>
          <input 
            type="file" 
            accept=".pdf,.doc,.docx"
            onChange={handleFileUpload}
          />
          {formData.resumeFileName && (
            <small style={{ color: '#059669', marginTop: '4px' }}>
              Selected: {formData.resumeFileName}
            </small>
          )}
        </div>
        <div className="form-group">
          <label>Resume Data (Plain Text for OCR fallback)</label>
          <textarea 
            name="resumeText"
            value={formData.resumeText}
            onChange={handleChange}
            placeholder="Paste your resume text here. This will be used by the agent to answer form questions."
          />
        </div>
      </div>

      <div className="section">
        <h2><Settings size={20} /> Automation Settings</h2>
        <div className="form-group" style={{ flexDirection: 'row', alignItems: 'center' }}>
          <input 
            type="checkbox" 
            name="autoSubmit"
            checked={formData.autoSubmit}
            onChange={handleChange}
            style={{ width: '20px', height: '20px', margin: 0, cursor: 'pointer' }}
          />
          <label style={{ margin: 0, marginLeft: '12px', cursor: 'pointer', lineHeight: '1.4' }}>
            Automatically click the final <b>Submit</b> or <b>Apply</b> button when finished
          </label>
        </div>
      </div>

      <div className="section">
        <h2><Key size={20} /> LLM Configuration</h2>
        <div className="form-group">
          <label>API Base URL</label>
          <input 
            type="text" 
            name="baseURL"
            value={formData.baseURL}
            onChange={handleChange}
            placeholder="https://api.openai.com/v1" 
          />
        </div>
        <div className="form-group">
          <label>API Key</label>
          <input 
            type="password" 
            name="apiKey"
            value={formData.apiKey}
            onChange={handleChange}
            placeholder="sk-..." 
          />
        </div>
        <div className="form-group">
          <label>Model</label>
          <input 
            type="text" 
            name="model"
            value={formData.model}
            onChange={handleChange}
            placeholder="gpt-4o" 
          />
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center' }}>
        <button className="btn" onClick={handleSave}>
          <Save size={18} /> Save Configuration
        </button>
        {saved && <span className="save-message">Settings saved successfully!</span>}
      </div>
    </div>
  );
}
