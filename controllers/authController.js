const { promisify } = require("util");
const jwt = require("jsonwebtoken");
const User = require("../models/userModel");
const asyncMiddleware = require("../middlewares/asyncMiddleware");
const AppError = require("../utils/AppError");
const sendTokenResponse = require("../utils/sendTokenResponse");
const sendEmail = require("../services/emailService");
const hashToken = require("../utils/hashToken");

// @desc   User registration
// @route  POST /api/v1/auth/signup
// @access Public
exports.signup = asyncMiddleware(async (req, res, next) => {
  // Validate Input
  let userObj = {
    name: req.body.name,
    surname: req.body.surname,
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
  };

  if (req.body.phone) {
    userObj.phone = req.body.phone;
  }
  // Create unverified user
  const newUser = await User.create(userObj);

  // Remove the verification code and expiration date before sending the response
  newUser.verificationCode = undefined;
  newUser.verificationCodeExpires = undefined;

  // Generate Token
  sendTokenResponse(newUser, 201, res);
});

// @desc   User login
// @route  POST /api/v1/auth/login
// @access Public
exports.login = asyncMiddleware(async (req, res, next) => {
  // Accept user credentials
  const { email, phone, password } = req.body;

  // Check credentials
  if ((!email && !phone) || !password)
    return next(
      new AppError(
        "Please provide either an email or phone number, and a password to login."
      ),
      400
    );

  let query = {};
  if (email) query = { ...query, email: email };
  if (phone) query = { ...query, phone: phone };

  // Check if user exists
  const user = await User.findOne(query).select("+password");

  // check user existence and Compare provided pass to the user's hashed one
  if (!user || !(await user.matchHashedField(password, user.password))) {
    return next(new AppError("Invalid credentials", 401));
  }

  // Generate Token
  sendTokenResponse(user, 201, res);
});

// controllers/authController.js

exports.logout = asyncMiddleware(async (req, res, next) => {
  // Clear the jwt cookie
  res.cookie("jwt", "", {
    httpOnly: true, // Prevent client-side JS from accessing the cookie
    secure: true, // Use HTTPS in production
    sameSite: "Strict", // Helps with CSRF attacks
    expires: new Date(0), // Immediately expire the cookie
  });

  res.status(200).json({ status: "success", message: "Logged out successfully." });
});

// @desc   Send password reset email
// @route  POST /api/v1/auth/forgotPassword
// @access Public
exports.forgotPassword = asyncMiddleware(async (req, res, next) => {
  const user = await User.findOne({ email: req.body.email });

  if (!user) return next(new AppError("There is no user with email adress", 404));
  // Generate Reset Token
  const resetToken = user.getPasswordResetToken();
  // Used for avoid schema validations
  await user.save({ validateBeforeSave: false });
  //Reset URL
  const resetUrl = `${req.protocol}://${req.get(
    "host"
  )}/api/v1/auth/resetPassword/${resetToken}`;

  const message = `Forgot your password? Submit a PATCH request with your new password and passwordConfirm to: ${resetUrl}. valid(10min) \nIf you didn't forget your password, please ignore this email!`;

  // Send Email
  try {
    await sendEmail({
      email: user.email,
      subject: "Your password reset token",
      message,
    });
  } catch (err) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });

    return next(
      new AppError("There was an error sending the email. Try again later!", 500)
    );
  }
  // Send Response
  res.status(200).json({
    status: "success",
    message: "Token send to email!",
  });
});

// @desc   Reset user password
// @route  PATCH /api/v1/auth/resetPassword/:token
// @access Public
exports.resetPassword = asyncMiddleware(async (req, res, next) => {
  // Hash Token
  const hashedToken = hashToken(req.params.token);

  // Find user based on token and date
  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  });

  if (!user) return next(new AppError("Token is invalid or has expired", 400));

  // Update Password
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;

  // Clear Token related Data
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;

  // Save the updated user
  await user.save();

  // Response
  res.status(200).json({
    status: "success",
    message:
      "Your password has been successfully reset. Please log in with your new password.",
  });
});

// @desc   Update user password
// @route  PATCH /api/v1/auth/updatePassword
// @access Private
exports.updatePassword = asyncMiddleware(async (req, res, next) => {
  const { currentPassword, password, passwordConfirm } = req.body;

  // Validate Input
  if (!password || !passwordConfirm) {
    return next(
      new AppError("Please provide both password and password confirmation", 400)
    );
  }
  // Find User
  const user = await User.findById(req.user.id).select("+password");

  // Verify Current Password
  if (!(await user.matchHashedField(currentPassword, user.password))) {
    return next(new AppError("Current password is not valid", 401));
  }

  // Update Password
  user.password = password;
  user.passwordConfirm = passwordConfirm;
  // Save Changes
  await user.save();

  // Send Response
  sendTokenResponse(user, 200, res);
});

// Middlewares

// @desc   Protect routes
// @route  Protect middleware
exports.protect = asyncMiddleware(async (req, res, next) => {
  // Check if token exists
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.toLowerCase().startsWith("bearer ")
  ) {
    const tokenParts = req.headers.authorization.split(" ");
    if (tokenParts.length === 2) token = tokenParts[1];
  }

  if (!token) {
    return next(
      new AppError("Access denied! Please log in or sign up to continue.", 401)
    );
  }
  // Token validation (get user id from it )
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

  const user = await User.findById(decoded.id);
  if (!user) {
    return next(
      new AppError(
        "This account no longer exists. Please contact support for assistance.",
        401
      )
    );
  }

  //  Check if user changed password after the token was issued
  if (user.changedPasswordAfter(decoded.iat)) {
    return next(new AppError("Your password has been changed. Please log in again", 401));
  }

  req.user = user;
  next();
});

// @desc Check user Verification
exports.checkVerification = (req, res, next) => {
  if (!req.user.isVerified) {
    return next(new AppError("Please verify your account", 401));
  }
  next();
};

// @desc   Middleware for role checking
exports.checkRole = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(new AppError("You do not have permission to perform this action", 403));
    }
    next();
  };
};
