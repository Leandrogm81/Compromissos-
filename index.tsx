
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Register Service Worker
const registerServiceWorker = () => {
  if ('serviceWorker' in navigator) {
    // Using a timeout to defer registration slightly, which can help avoid race conditions
    // and "invalid state" errors in some browser environments by pushing the call to the
    // end of the event loop queue.
    setTimeout(() => {
        const swUrl = `${window.location.origin}/sw.js`;
        navigator.serviceWorker.register(swUrl)
          .then(registration => {
            console.log('Service Worker registered with scope:', registration.scope);
          })
          .catch(error => {
            console.error('Service Worker registration failed:', error);
          });
    }, 0);
  }
};

// To prevent a race condition where the 'load' event fires before the listener is attached,
// check the document.readyState. If it's already 'complete', register the SW immediately.
// Otherwise, wait for the 'load' event.
if (document.readyState === 'complete') {
  registerServiceWorker();
} else {
  window.addEventListener('load', registerServiceWorker);
}


const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);