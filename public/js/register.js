import { createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { auth } from "./firebase-init.js";

const registerForm = document.getElementById("registerForm");

if (registerForm) {
  registerForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const username = document.getElementById("username").value;
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    const errorMsg = document.getElementById("error-msg");
    const btn = registerForm.querySelector("button");

    try {
      btn.disabled = true;
      btn.innerText = "Creating Account...";

      // 1. Create user in Firebase
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const idToken = await userCredential.user.getIdToken();

      // 2. Send token + username to backend
      const res = await fetch("/auth/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken, username })
      });

      const data = await res.json();
      if (data.success) {
        window.location.href = data.redirect || "/";
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      console.error(error);
      errorMsg.textContent = "Registration Failed: " + (error.message || "Unknown error");
      errorMsg.classList.remove("hidden");
      btn.disabled = false;
      btn.innerText = "Sign Up";
    }
  });
}