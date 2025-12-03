import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

// Read the config we injected in layout.ejs
const config = window.FIREBASE_CONFIG;

if (!config || !config.apiKey) {
  console.error("Firebase Config missing! Check your .env file and server.js middleware.");
}

const app = initializeApp(config);
export const auth = getAuth(app);