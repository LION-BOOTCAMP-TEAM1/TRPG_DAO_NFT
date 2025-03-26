import express from "express";
import branchPointScenes from "../seed/branchPointScenes.json";

const router = express.Router();

router.get("/branchPointScenes", (req, res) => {
  res.json(branchPointScenes);
});

export default router;

/*bracpoinsecen 뿌리기 api*/
