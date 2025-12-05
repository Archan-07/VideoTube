import { Router } from "express";
import {
  addVideoToPlaylist,
  createPlaylist,
  deletePlaylist,
  getPlaylistById,
  getUserPlaylists,
  removeVideoFromPlaylist,
  updatePlaylist,
} from "../controllers/playlist.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { playlistValidator } from "../validators/playlist.validator.js";
import { validate } from "../middlewares/validator.middleware.js";
const router = Router();

router
  .route("/create-playlist")
  .post(verifyJWT, playlistValidator(), validate, createPlaylist);

router.route("/get-user-playlists/:userId").get(getUserPlaylists);
router.route("/get-playlist-by-id/:playlistId").get(getPlaylistById);
router
  .route("/add-video-to-playlist/:playlistId/:videoId")
  .post(verifyJWT, addVideoToPlaylist);
router
  .route("/remove-video-from-playlist/:playlistId/:videoId")
  .post(verifyJWT, removeVideoFromPlaylist);
router
  .route("/update-playlist/:playlistId")
  .put(verifyJWT, playlistValidator(), validate, updatePlaylist);
router.route("/delete-playlist/:playlistId").delete(verifyJWT, deletePlaylist);

export default router;
