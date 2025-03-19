const { sanitizeUserData } = require("./sanitized");

// Send jwt token and cookie to user
const sendTokenResponse = (user, statusCode, res) => {
  const token = user.getSignedJwt();

  const cookieOptions = {
    maxAge: +process.env.JWT_COOKIE_EXPIRESIN_IN * 24 * 60 * 60 * 1000,
    // httpOnly: true,
  };

  if (process.env.NODE_ENV === "production") cookieOptions.secure = true;

  res.cookie("jwt", token, cookieOptions);

  res.status(statusCode).json({
    status: "success",
    // TEMP - for postman
    token,
    data: { user: sanitizeUserData(user) },
  });
};

module.exports = sendTokenResponse;
