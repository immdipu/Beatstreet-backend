const crypto = require("crypto");
const mongoose = require("mongoose");
const validator = require("validator");

const UserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "name is required"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      validate: [validator.isEmail, "please provide a valid email"],
    },
    password: {
      type: String,
      required: [true, "password is required"],
      minlength: 4,
      select: false,
    },
    passwordConfirm: {
      type: String,
      required: [true, "confirm password is required"],
      validate: {
        validator: function (el) {
          return el === this.password;
        },
        message: "password didnot match",
      },
    },
    passwordChangedAt: Date,
    passwordResetToken: String,
    passwordResetExpires: Date,
    signUpToken: Number,
    SignUpTokenExpires: Date,
    isVerified: {
      type: Boolean,
      default: false,
    },
    songPlayed: [String],
    userFavoriteSong: [String],
    userPlaylist: [
      {
        name: {
          type: String,
          required: [true, "playlist name required"],
        },
        images: String,
        songIds: [String],
      },
    ],
  },
  {
    timestamps: true,
  }
);

UserSchema.pre("save", function (next) {
  this.passwordConfirm = undefined;
  if (!this.isModified("password") || this.isNew) return next();

  this.passwordChangedAt = Date.now() - 1000;

  next();
});

UserSchema.methods.createpasswordResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString("hex");
  this.passwordResetToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");
  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;
  return resetToken;
};

UserSchema.methods.CreatSignUpToken = function () {
  const token = Math.floor(Math.random() * 9000) + 1000;
  this.signUpToken = token;
  this.SignUpTokenExpires = Date.now() + 10 * 60 * 1000;
  return token;
};

UserSchema.methods.changePasswordAfter = function (JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10
    );
    return JWTTimestamp < changedTimestamp;
  }

  return false;
};

const User = mongoose.model("User", UserSchema);

module.exports = User;
