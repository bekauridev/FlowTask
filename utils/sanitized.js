/**
 * Sanitizes user data, stripping out sensitive information.
 * @param {Object} user The user object to sanitize.
 * @returns {Object} The sanitized user object.
 */
exports.sanitizeUserData = (user) => {
  const sanitizedUser = {
    id: user.id,
    role: user.role,
    name: user.name,
    surname: user.surname,
    email: user.email,
    isVerified: user.isVerified,
  };
  return sanitizedUser;
};
