import { Router } from "express";
import { presentationController } from "../controllers/presentationController";

const router = Router();

router.get("/", presentationController.getAllPresentations);
router.post("/", presentationController.createPresentation);
router.get("/:id", presentationController.getPresentationById);
router.put("/:id", presentationController.updatePresentation);

export default router;
