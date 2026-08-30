# 🎨 KSP SENTINEL AI CHATBOT — STANDALONE REACT UI MODULE

> **UI-Only React Module (`Chatbot.jsx`)**  
> *Contains the complete Chatbot frontend component, glassmorphic styling, chart visualizers, PDF generation, OSINT terminal, e-Complaint wizard, and database modal.*

---

## 📁 Standalone UI Directory Layout

```
chatbot-ui-standalone/
├── src/
│   ├── components/
│   │   ├── Chatbot.jsx                 # Primary Chatbot UI Component
│   │   ├── ChartAnalysisModal.jsx      # Full-Screen Interactive Chart & Sec 65B Modal
│   │   ├── ComplaintPortal.jsx         # Citizen e-Complaint Registration Wizard
│   │   ├── DatabaseConnectorModal.jsx  # Database Integration Portal
│   │   └── ErrorBoundary.jsx           # React Error Safeguard
│   ├── App.jsx                         # Standalone Wrapper App
│   ├── main.jsx                        # React Root Entry Point
│   └── index.css                       # Complete CSS Design Tokens & Glassmorphic Styles
├── public/                             # Logos, Assets & Map Markers
├── package.json                        # React 18, Vite, Chart.js, Lucide, Leaflet, jsPDF
├── vite.config.js                      # Vite Config
├── run_ui.bat                          # 1-Click Windows UI Launcher
└── README.md                           # Documentation
```

---

## 🚀 How to Run the Chatbot UI Standalone

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Launch Dev Server**:
   ```bash
   npm run dev
   ```
   *UI will open at `http://localhost:5173`*

---

## 🧩 How to Embed `Chatbot.jsx` in Your Own React Application

To use `Chatbot.jsx` in any existing React project:

1. **Copy the `components` folder**:
   Copy `Chatbot.jsx`, `ChartAnalysisModal.jsx`, `ComplaintPortal.jsx`, `DatabaseConnectorModal.jsx`, and `ErrorBoundary.jsx` into your React project's `src/components/` directory.

2. **Copy `index.css` or import styles**:
   Import `index.css` in your project's `main.jsx` or `App.jsx`.

3. **Required NPM Packages**:
   ```bash
   npm install lucide-react chart.js react-chartjs-2 leaflet react-leaflet jspdf
   ```

4. **Import & Render Component**:
   ```jsx
   import Chatbot from './components/Chatbot';

   function MyScreen() {
     return (
       <div style={{ height: '100vh', width: '100vw' }}>
         <Chatbot 
           divisionName="Bengaluru Division" 
           onAddDocument={(doc) => console.log("Added doc:", doc)} 
         />
       </div>
     );
   }
   ```
