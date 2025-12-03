import User from "../models/User.js";
import { getAuth } from "firebase-admin/auth";

export const renderRegister = (req, res) => {
  res.render("auth/register.ejs");
};

export const renderLogin = (req, res) => {
  res.render("auth/login.ejs");
};

// Handle Login/Register via Token Verification
export const verifySession = async (req, res) => {
  const { idToken, username } = req.body;

  if (!idToken) {
    return res.status(400).json({ error: "No token provided" });
  }

  try {
    // 1. Verify Firebase Token using Admin SDK
    const decodedToken = await getAuth().verifyIdToken(idToken);
    const { uid, email } = decodedToken;

    // 2. Find or Create User in MongoDB
    let user = await User.findOne({ firebaseUid: uid });

    if (!user) {
      // Logic for new user (Registration)
      console.log("🆕 Creating new user for Firebase UID:", uid);
      user = new User({
        email,
        firebaseUid: uid,
        username: username || email.split("@")[0], // Fallback username
      });
      await user.save();
    }

    // 3. Create Session
    req.session.userId = user._id;
    await req.session.save();

    console.log(`✅ Logged in as: ${user.username}`);
    return res.json({ success: true, redirect: "/" });

  } catch (error) {
    console.error("Verify Session Error:", error);
    return res.status(401).json({ error: "Invalid token or authentication failed" });
  }
};

export const logoutUser = (req, res) => {
  req.session.destroy((err) => {
    if (err) console.error("Logout error:", err);
    res.redirect("/auth/login");
  });
};