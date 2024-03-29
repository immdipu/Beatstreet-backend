const crypto = require("crypto");
const { promisify } = require("util");
const User = require("../models/userModel");
const jwt = require("jsonwebtoken");
const catchAsync = require("./../utils/catchAsync");
const AppError = require("./../utils/appError");
const sendEmail = require("./../utils/email");
const { findOne } = require("../models/userModel");
const axios = require("axios");

const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

////////////////////////////////////////////// CREATE SEND TOKEN /////////////////////////////////////

const createSendToken = (user, statusCode, res) => {
  const token = signToken(user._id);
  user.password = undefined;
  user.passwordConfirm = undefined;
  user.__v = undefined;

  res.status(statusCode).json({
    status: "success",
    token,
    data: {
      user,
    },
  });
};

const validatePassword = (savedPwd, userPwd) => {
  if (savedPwd === userPwd) {
    return true;
  } else {
    return false;
  }
};

////////////////////////////////////  SIGN UP USER /////////////////////////////////////

const signup = catchAsync(async (req, res, next) => {
  // Check if user with email already exist in the database if yes then send error
  const user = await User.findOne({ email: req.body.email });
  if (user) {
    return next(new AppError("The email is already registered", 400));
  }

  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
  });

  const signUpToken = newUser.CreatSignUpToken();
  await newUser.save({ validateBeforeSave: false });

  const message = `<h2>BeatStreet verification code</h2>
  <h3>Hello,</h3> <br>
  <p>Your BeatStreet verification code is <h3> ${signUpToken}</h3> </p>
  <br>
  <p>Thank you!</p>
  `;

  try {
    await sendEmail({
      email: newUser.email,
      subject: "BeatStreet Signup Verification Code",
      message,
    });
    res.status(200).json({
      status: "success",
      message: "verification code sent",
      data: {
        email: newUser.email,
      },
    });
  } catch (error) {
    newUser.signUpToken = undefined;
    newUser.SignUpTokenExpires = undefined;
    return next(
      new AppError("There was an error sending mail. Try again", 500)
    );
  }
});

///////////////////////////////// VERIFICATION CODE SEND /////////////////////////////
const SendVerificationCode = catchAsync(async (req, res, next) => {
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return next(new AppError("The email is not registered", 500));
  }

  if (user.isVerified) {
    return next(new AppError("The user is Already Verified", 500));
  }

  const signUpToken = user.CreatSignUpToken();
  await user.save({ validateBeforeSave: false });

  const message = `<h2>BeatStreet verification code</h2>
  <h3>Hello,</h3> <br>
  <p>Your BeatStreet verification code is <h3> ${signUpToken}</h3> </p>
  <br>
  <p>Thank you!</p>
  `;

  try {
    await sendEmail({
      email: user.email,
      subject: "BeatStreet Signup Verification Code (VALID FOR 10 MINUTES)",
      message,
    });
    res.status(200).json({
      status: "success",
      message: "verification code sent",
    });
  } catch (error) {
    user.signUpToken = undefined;
    user.SignUpTokenExpires = undefined;
    return next(
      new AppError("There was an error sending mail. Try again", 500)
    );
  }
});

////////////////////////////////////////////   USER VERIFY  //////////////////////////////////////

const UserVerify = catchAsync(async (req, res, next) => {
  const user = await User.findOne({
    signUpToken: req.body.token,
    SignUpTokenExpires: { $gt: Date.now() },
  });

  if (!user) {
    return next(new AppError("Verification Code Expired, Try again", 500));
  }

  user.isVerified = true;
  user.signUpToken = undefined;
  user.SignUpTokenExpires = undefined;
  await user.save({ validateBeforeSave: false });

  res.status(200).json({
    status: "success",
    messgage: "Verified Successfully",
  });
});

///////////////////////////////// USER LOGIN /////////////////////////////////////////////////////

const login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  // check if user has provided email and password
  if (!email || !password) {
    return next(new AppError("please provide email and password", 400));
  }

  const user = await User.findOne({ email }).select([
    "+password",
    "name",
    "_id",
    "isVerified",
  ]);

  // check if user is found in the database then check if the passowrd is matched
  if (!user || !validatePassword(user.password, password)) {
    return next(new AppError("email or password didnot match", 400));
  }

  // create token that is sent to the frontend and it is stored in the frontend local storage.
  //  whenever user makes an api call its should send with the token stored in the database authenticate user
  createSendToken(user, 201, res);
});

///////////////////////////////////// USER LOGOUT ////////////////////////////////////

const logout = (req, res) => {
  res.cookie("jwt", "loggedoout", {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
    secure: true,
    sameSite: "none",
  });
  res.status(200).json({ status: "success", message: "successfully logout" });
};

/////////////////////////////////// FORGOT PASSWORD //////////////////////////////////////

const forgotPassword = catchAsync(async (req, res, next) => {
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return next(new AppError("No user found with given email address", 404));
  }

  const resetToken = user.createpasswordResetToken();
  await user.save({ validateBeforeSave: false });

  const resetURL = `https://beatstreet.netlify.app/resetpassword/${resetToken}`;

  const message = `<h2>Reset Your Password</h2>
  <h3>Hello,</h3> 
  <p>We received a request to reset your password. To reset your password, please click on the Reset Password</p>

  <h1><a href="${resetURL}">Reset Password</a></h1>

  <p>If you did not request to reset your password, please ignore this email.</p>
  <p>Thank you!</p>
  `;

  try {
    await sendEmail({
      email: user.email,
      subject: "Your password reset token (valid for 10 minutes)",
      message,
    });

    res.status(200).json({
      status: "sucess",
      message: "Token sent to email",
    });
  } catch (err) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });
    return next(
      new AppError("There was an error sending the email. Try again later", 500)
    );
  }
});

//////////////////////////////   RESET PASSWORD /////////////////////////////////////

const resetPassword = catchAsync(async (req, res, next) => {
  const hashedToken = crypto
    .createHash("sha256")
    .update(req.params.token)
    .digest("hex");

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  });

  if (!user) {
    return next(new AppError("Token is invalid or expired", 400));
  }
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();
  createSendToken(user, 200, res);
});

const IsUserLoggedIn = catchAsync(async (req, res, next) => {
  const head = req.headers["authorization"];
  const token = head?.split(" ")[1];

  if (!token) {
    res.status(401);
    throw new Error("Token not found");
  }
  const decode = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

  const user = await User.findById(decode.id).select([
    "_id",
    "name",
    "isVerified",
  ]);
  if (!user) {
    return next();
  }
  if (user.changePasswordAfter(decode.iat)) {
    return next();
  }
  res.status(200).json({
    status: "success",
    data: {
      user,
    },
  });

  next();
});

const Protector = catchAsync(async (req, res, next) => {
  const head = req.headers["authorization"];
  const token = head?.split(" ")[1];

  if (!token) {
    res.status(401);
    throw new Error("Token not found");
  }
  const decode = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

  const user = await User.findById(decode.id).select([
    "_id",
    "name",
    "isVerified",
  ]);
  if (!user) {
    return next(new AppError("The user no longer exist", 500));
  }

  if (user.changePasswordAfter(decode.iat)) {
    new AppError("User recently changed password! Please login again");
  }
  req.user = user;

  next();
});

const CheckToken = catchAsync(async (req, res, next) => {
  const head = req.headers["authorization"];
  const token = head?.split(" ")[1];

  if (!token) {
    next();
    return;
  }
  const decode = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

  const user = await User.findById(decode.id).select([
    "_id",
    "name",
    "isVerified",
  ]);
  if (!user) {
    return next();
  }

  if (user.changePasswordAfter(decode.iat)) {
    new AppError("User recently changed password! Please login again");
  }
  req.user = user;

  next();
});

/////////////////////////////// Recently played song //////////////////

const RecentSongPlayed = catchAsync(async (req, res, next) => {
  const user = await User.findOne({ _id: req.user._id });
  if (!user) {
    return next(new AppError("user doesn't exist", 400));
  }
  const { id } = req.params;
  if (!id) {
    return next(new AppError("Song ID not provided", 400));
  }

  let index = user.songPlayed.indexOf(id);

  if (index !== -1) {
    user.songPlayed.splice(index, 1);
  }

  user.songPlayed.unshift(id);
  await user.save({ validateBeforeSave: false });

  res.status(200).json({
    status: "success",
  });
});

const GetRecentSongPlayed = catchAsync(async (req, res, next) => {
  const user = await User.findOne({ _id: req.user._id });
  if (!user) {
    return next(new AppError("user doesn't exist", 400));
  }

  res.status(200).json({
    status: "success",
    data: user.songPlayed.slice(0, 20),
  });
});

//////////////////////////////////// USER FAVORITE SONGS    //////////////////////////

const SaveUserFavSong = catchAsync(async (req, res, next) => {
  const user = await User.findOne({ _id: req.user._id });
  if (!user) {
    return next(new AppError("user doesn't exist", 400));
  }
  const songId = req.params.id;
  if (!songId) {
    return next(new AppError("Song ID not provided", 400));
  }

  const index = user.userFavoriteSong.indexOf(songId);
  if (index !== -1) {
    user.userFavoriteSong.splice(index, 1);
  } else {
    user.userFavoriteSong.unshift(songId);
  }
  await user.save({ validateBeforeSave: false });
  res.status(200).json({
    status: "success",
  });
});

const GetUserFavSong = catchAsync(async (req, res, next) => {
  const user = await User.findOne({ _id: req.user._id });
  if (!user) {
    return next(new AppError("user doesn't exist", 400));
  }
  res.status(200).json({
    status: "success",
    data: user.userFavoriteSong.slice(0, 30),
  });
});

////////////////////////////////////// SAVE USER IMPORTED SPOTIFY PLAYLIST     /////////////////////////////////

const addNewPlaylist = catchAsync(async (req, res, next) => {
  const user = await User.findOne({ _id: req.user._id });
  if (!user) {
    return next(new AppError("user doesn't exist", 400));
  }
  const { name, image, songsIds } = req.body;

  let indexx = user.userPlaylist.findIndex((item) => item.name === name);
  if (indexx !== -1) {
    return next(new AppError("Playlist with same name already exist", 400));
  }

  let newImage = null;
  if (image && image.length !== 0) {
    newImage = image[image.length - 1].url;
  }

  let newPlaylist = {
    name: name,
    images: newImage,
    songIds: songsIds,
  };

  user.userPlaylist.unshift(newPlaylist);
  await user.save({ validateBeforeSave: false });
  res.status(200).json({
    status: "success",
    message: `${songsIds.length} songs added to the playlist successfully`,
  });
});

///////////////////////////////////////////////////// SEND ALL PLAYLISTS NAME ////////////////////////

const sendAllPlaylist = catchAsync(async (req, res, next) => {
  const user = await User.findOne({ _id: req.user._id });
  if (!user) {
    return next(new AppError("user doesn't exist", 400));
  }
  if (user.userPlaylist.length == 0) {
    return res.status(200).json({
      status: "success",
      data: [],
    });
  }
  let playlist = user.userPlaylist.map((item) => {
    let newData = {
      playlistId: item.id,
      name: item.name,
      image: item.images,
      songsLength: item.songIds ? item.songIds.length : 0,
    };
    return newData;
  });

  res.status(200).json({
    status: "success",
    data: playlist,
  });
});

//////////////////////////////////  SEND SINGLE PLAYLIST /////////////////////////////////

const singlePlaylist = catchAsync(async (req, res, next) => {
  const user = await User.findOne({ _id: req.user._id });
  if (!user) {
    return next(new AppError("user doesn't exist", 400));
  }

  const playlistId = req.params.id;
  if (!playlistId) {
    return next(new AppError("No Playlist is provided", 400));
  }

  let newPlaylist = user.userPlaylist.find(
    (item) => item._id.toString() === playlistId.toString()
  );
  if (!newPlaylist) {
    return next(new AppError("No Playlist found", 400));
  }
  res.status(200).json({
    status: "success",
    data: newPlaylist,
  });
});

//////////////////////////////// UPDATE PLAYLIST ///////////////////////////////

const updateName = catchAsync(async (req, res, next) => {
  const user = await User.findOne({ _id: req.user._id });
  if (!user) {
    return next(new AppError("user doesn't exist", 400));
  }
  const { name, playlistId } = req.body;
  if (!name || !playlistId) {
    return next(new AppError("name or playlistId is not provided", 400));
  }

  let indexx = user.userPlaylist.findIndex(
    (item) => item.id.toString() === playlistId.toString()
  );

  if (indexx === -1) {
    return next(new AppError("NO playlist is found with the given id", 400));
  }

  await User.findOneAndUpdate(
    { _id: req.user._id, "userPlaylist._id": playlistId },
    { $set: { "userPlaylist.$.name": name } }
  );
  res.status(200).json({
    status: "success",
  });
});

/////////////////////////////////// ADD SONGS IN PLAYLIST /////////////////////

const AddsongPlaylist = catchAsync(async (req, res, next) => {
  const user = await User.findOne({ _id: req.user._id });
  if (!user) {
    return next(new AppError("user doesn't exist", 400));
  }
  const { playlistId, songId } = req.body;
  if (!playlistId || !songId) {
    return next(new AppError("name or playlistId is not provided", 400));
  }

  let indexx = user.userPlaylist.findIndex(
    (item) => item.id.toString() === playlistId.toString()
  );

  if (indexx === -1) {
    return next(new AppError("NO playlist is found with the given id", 400));
  }

  let songIndex = user.userPlaylist[indexx].songIds.indexOf(songId);

  if (songIndex !== -1) {
    return next(new AppError("Song is already added to the playlist", 400));
  }

  await User.findOneAndUpdate(
    {
      _id: req.user._id,
      "userPlaylist._id": playlistId,
    },
    { $push: { "userPlaylist.$.songIds": { $each: [songId], $position: 0 } } }
  );
  res.status(200).json({
    status: "success",
  });
});

const RemovesongPlaylist = catchAsync(async (req, res, next) => {
  const user = await User.findOne({ _id: req.user._id });
  if (!user) {
    return next(new AppError("user doesn't exist", 400));
  }
  const { playlistId, songId } = req.body;
  if (!playlistId || !songId) {
    return next(new AppError("name or playlistId is not provided", 400));
  }

  let indexx = user.userPlaylist.findIndex(
    (item) => item.id.toString() === playlistId.toString()
  );

  if (indexx === -1) {
    return next(new AppError("NO playlist is found with the given id", 400));
  }

  let songIndex = user.userPlaylist[indexx].songIds.indexOf(songId);

  if (songIndex === -1) {
    return next(new AppError("songs not found", 400));
  }

  await User.findOneAndUpdate(
    {
      _id: req.user._id,
      "userPlaylist._id": playlistId,
    },
    { $pull: { "userPlaylist.$.songIds": songId } }
  );
  res.status(200).json({
    status: "success",
  });
});

const removePlaylist = catchAsync(async (req, res, next) => {
  const user = await User.findOne({ _id: req.user._id });
  if (!user) {
    return next(new AppError("user doesn't exist", 400));
  }
  const playlistId = req.params.id;
  if (!playlistId) {
    return next(new AppError("playlistId is not provided", 400));
  }
  let indexx = user.userPlaylist.findIndex(
    (item) => item.id.toString() === playlistId.toString()
  );

  if (indexx === -1) {
    return next(new AppError("NO playlist is found with the given id", 400));
  }

  user.userPlaylist.splice(indexx, 1);
  await user.save({ validateBeforeSave: false });
  res.status(200).json({
    status: "success",
  });
});

module.exports = {
  signup,
  login,
  forgotPassword,
  resetPassword,
  UserVerify,
  SendVerificationCode,
  Protector,
  IsUserLoggedIn,
  logout,
  RecentSongPlayed,
  GetRecentSongPlayed,
  SaveUserFavSong,
  GetUserFavSong,
  addNewPlaylist,
  sendAllPlaylist,
  singlePlaylist,
  updateName,
  AddsongPlaylist,
  RemovesongPlaylist,
  removePlaylist,
  CheckToken,
};
