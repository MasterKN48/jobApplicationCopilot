# AI Job Application Copilot

An automated AI job application Chrome extension built with Alibaba's [PageAgent](https://github.com/alibaba/page-agent), React, and Vite. This extension streamlines the job application process by parsing forms via natural language and automatically populating them with your profile data, leveraging the power of local LLMs.

## 🚀 Features

*   **Intelligent Form Filling:** Uses Alibaba's PageAgent and a local LLM to understand and fill complex job application forms automatically.
*   **Comprehensive Profile Management:** A dedicated Side Panel UI to manage your professional details (LinkedIn, GitHub, Email, Phone, Portfolio, and full Resume text).
*   **Local LLM Integration:** Communicates safely with local LLMs (like LM Studio or Ollama) using a built-in CORS-safe streaming fetch proxy, ensuring your data remains private.
*   **Granular Control:** Toggle options like "Auto-Submit" to decide whether the agent should complete the final step or leave it for your manual review.

## 🛠️ Technology Stack

*   **Framework:** React + Vite
*   **Agentic UI:** Alibaba's `@page-agent/page-controller`
*   **Styling/Icons:** Lucide React
*   **Build Tool:** CRXJS Vite Plugin (for modern Chrome Extension development)

## 📦 Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/MasterKN48/jobApplicationCopilot.git
    cd jobApplicationCopilot
    ```

2.  **Install dependencies:**
    Using `bun` (recommended) or `npm`:
    ```bash
    bun install
    # or npm install
    ```

3.  **Build the extension:**
    ```bash
    bun run build
    # or npm run build
    ```
    This will generate a `dist/` directory containing the built extension and an `extension.zip` package for distribution.

4.  **Load into Chrome:**
    *   Open Chrome and navigate to `chrome://extensions/`.
    *   Enable **"Developer mode"** in the top right corner.
    *   Click **"Load unpacked"** and select the generated `dist/` folder.

## 💡 Usage

1.  **Start your Local LLM:** Ensure you have a local LLM running (e.g., LM Studio serving an OpenAI-compatible API on `http://localhost:1234`).
2.  **Setup Profile:** Click on the extension icon to open the Side Panel. Fill in your personal details, links, and paste your resume text. Save your settings.
3.  **Apply for Jobs:** Navigate to any job application page (e.g., Workday, Greenhouse, Lever).
4.  **Run the Agent:** The background service will process the page, and the PageAgent will automatically start filling out the form based on your profile information. Review the filled fields and hit submit!

## 🤝 Contributing

Contributions, issues, and feature requests are welcome! Feel free to check the [issues page](https://github.com/MasterKN48/jobApplicationCopilot/issues).

## 📝 License

This project is private and for personal use.
