
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

console.log("TimeShare App Initializing...");

const rootElement = document.getElementById('root');
if (!rootElement) {
 console.error("Critical Error: Could not find root element. Check your index.html.");
 } else {

    const root = ReactDOM.createRoot(rootElement);
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
console.log("TimeShare App Rendered.");
}

