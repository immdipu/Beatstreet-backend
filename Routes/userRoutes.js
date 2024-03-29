const express = require("express");
const router = express.Router();
const {
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
} = require("../controllers/authController");

router.get("/isloggedin", IsUserLoggedIn);
router.post("/signup", signup);
router.post("/verify", UserVerify);
router.post("/login", login);
router.get("/login", logout);
router.post("/verficationtoken", SendVerificationCode);
router.post("/forgotPassword", forgotPassword);
router.patch("/resetPassword/:token", resetPassword);
router.get("/recentsongs/:id", Protector, RecentSongPlayed);
router.get("/recentsongs", Protector, GetRecentSongPlayed);
router.get("/favoritesongs/:id", Protector, SaveUserFavSong);
router.get("/favoritesongs", Protector, GetUserFavSong);
router.post("/addnewplaylist", Protector, addNewPlaylist);
router.get("/allplaylist", Protector, sendAllPlaylist);
router.get("/getsingleplaylist/:id", Protector, singlePlaylist);
router.post("/updateplaylist", Protector, updateName);
router.post("/addsongsplaylist", Protector, AddsongPlaylist);
router.post("/removesongsplaylist/", Protector, RemovesongPlaylist);
router.delete("/removeplaylist/:id", Protector, removePlaylist);

module.exports = router;
