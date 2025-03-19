// Middleware to filter by logged-in user
exports.setUserFilter = (req, res, next) => {
  // If user is admin all documents will be returned
  if (req.user.role === "admin") req.filter = {};
  else req.filter = { user: req.user.id };
  next();
};
