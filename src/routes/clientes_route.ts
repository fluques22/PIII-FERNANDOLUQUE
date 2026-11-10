import {Router} from "express";
import {getClientes, getClientesId, postClientes, patchClientesId} from "../controllers/clientes_controller.js"

const router = Router();

router.post("/", postClientes);
router.get("/", getClientes);
router.get("/:id", getClientesId);
router.patch("/:id", patchClientesId);

export default router;