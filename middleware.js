export const isLoggedIn = (req, res, next) => {
  // Check our custom session property set in server.js
  if (!req.session.userId) {
    if (req.originalUrl.startsWith("/api")) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    return res.redirect("/auth/login");
  }
  next();
};