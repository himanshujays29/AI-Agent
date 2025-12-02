// controllers/auth.js
import User from "../models/User.js";

/**
 * GET /auth/register
 */
export const renderRegister = (req, res) => {
  res.render("auth/register.ejs");
};

/**
 * POST /auth/register
 */
export const registerUser = async (req, res, next) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).send("All fields are required.");
    }

    const user = new User({ username, email });

    // passport-local-mongoose helper
    const registeredUser = await User.register(user, password);

    console.log("✅ Registered user:", registeredUser.username);

    // Auto-login after registration
    req.login(registeredUser, (err) => {
      if (err) {
        console.error("Login after register error:", err);
        return next(err);
      }
      console.log("✅ Auto-login after register OK, user:", req.user?.username);
      return res.redirect("/");
    });
  } catch (err) {
    console.error("Register error:", err);
    return res.status(500).send("Registration failed: " + err.message);
  }
};

/**
 * GET /auth/login
 */
export const renderLogin = (req, res) => {
  res.render("auth/login.ejs");
};

/**
 * POST /auth/login
 * Manual authentication using User.authenticate()
 */
export const loginUser = (req, res, next) => {
  console.log("🔐 loginUser called with body:", req.body);

  const { username, password } = req.body;
  const authenticate = User.authenticate(); // From passport-local-mongoose

  authenticate(username, password, (err, user, info) => {
    console.log("📌 AUTH CALLBACK REACHED");
    console.log("   err  =", err);
    console.log("   user =", user);
    console.log("   info =", info);

    if (err) {
      console.log("❌ Error during authentication:", err);
      return next(err);
    }

    if (!user) {
      console.log("❌ User not found or password invalid");
      return res.status(401).send(info?.message || "Invalid username/password");
    }

    console.log("✅ User authenticated:", user.username);

    req.login(user, (err2) => {
      console.log("📌 INSIDE req.login callback");
      console.log("   err2 =", err2);

      if (err2) {
        console.log("❌ Error in req.login:", err2);
        return next(err2);
      }

      console.log("🎉 LOGIN SUCCESS! req.user =", req.user);
      return res.redirect("/");
    });
  });
};


/**
 * GET /auth/logout
 */
export const logoutUser = (req, res, next) => {
  req.logout(function (err) {
    if (err) {
      console.error("Logout error:", err);
      return next(err);
    }
    res.redirect("/auth/login");
  });
};
