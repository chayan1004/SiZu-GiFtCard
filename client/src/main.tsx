import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Extend Window interface for Eruda
declare global {
  interface Window {
    eruda?: { destroy: () => void };
    REPLIT_DISABLE_DEVTOOLS?: boolean;
  }
}

// Disable Eruda development tools to prevent DOMException errors
if (typeof window !== 'undefined' && window.eruda) {
  window.eruda.destroy();
}

// Add global error handling to prevent unhandled promise rejections
window.addEventListener('unhandledrejection', (event) => {
  console.warn('Unhandled promise rejection:', event.reason);
  event.preventDefault();
});

// Add global error handling for general errors
window.addEventListener('error', (event) => {
  console.warn('Global error:', event.error);
});

const root = document.getElementById("root");
if (root) {
  createRoot(root).render(<App />);
} else {
  console.error("Root element not found");
}