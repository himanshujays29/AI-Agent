import { signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { auth } from "./firebase-init.js";

const loginForm = document.getElementById("loginForm");

if (loginForm) {
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    const errorMsg = document.getElementById("error-msg");
    const btn = loginForm.querySelector("button");

    try {
      btn.disabled = true;
      btn.innerText = "Signing in...";
      
      // 1. Client-side login
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const idToken = await userCredential.user.getIdToken();

      // 2. Send token to backend
      const res = await fetch("/auth/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken })
      });

      const data = await res.json();
      if (data.success) {
        window.location.href = data.redirect || "/";
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      console.error(error);
      errorMsg.textContent = "Login Failed: " + (error.message || "Unknown error");
      errorMsg.classList.remove("hidden");
      btn.disabled = false;
      btn.innerText = "Sign In";
    }
  });
}