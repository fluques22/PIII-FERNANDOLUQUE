import {Router} from "express";
import {getClientes, getClientesId, postClientes, patchClientesId} from "../controllers/clientes_controller.js"

const routerCl = Router();

routerCl.post("/", postClientes);
routerCl.get("/", getClientes);
routerCl.get("/:id", getClientesId);
routerCl.patch("/:id", patchClientesId);

export default routerCl;