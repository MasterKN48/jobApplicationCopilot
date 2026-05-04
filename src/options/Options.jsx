import React, { useState, useEffect } from 'react';
import { Save, User, Key, Link } from 'lucide-react';

export default function Options() {
  const [formData, setFormData] = useState({
    linkedinUrl: '',
    githubUrl: '',
    portfolioUrl: '',
    resumeText: '',
    resumeFileName: '',
    resumeBase64: '',
    apiKey: '',
    baseURL: 'https://api.openai.com/v1',
    model: 'gpt-4o'
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
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
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

  return (
    <div className="options-container">
      <div className="header">
        <h1>Job Application Copilot Configuration</h1>
        <p>Set up your profile and API keys to automate your job applications.</p>
      </div>

      <div className="section">
        <h2><User size={20} /> Personal Information</h2>
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
