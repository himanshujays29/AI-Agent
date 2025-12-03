export const isLoggedIn = (req, res, next) => {
  // Check our custom session property set in server.js
  if (!req.session.userId) {
    // Determine return URL
    // If this is an API call, return 401 instead of redirecting
    if (req.originalUrl.startsWith("/api")) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // Otherwise redirect to login
    return res.redirect("/auth/login");
  }
  next();
};