export const isLoggedIn = (req, res, next) => {
  if (!req.session.userId) {
    if (req.originalUrl.startsWith("/api")) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    return res.redirect("/auth/login");
  }
  next();
};