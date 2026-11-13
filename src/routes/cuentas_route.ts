import {Router} from "express";
import {getCuentas, getCuentasId, postCuentas, patchClientesIdEstado, getMovimientosCuentasId, postCuentasIngresos, postCuentasRetirada} from "../controllers/cuentas_controller.js"

const routerCu = Router();

routerCu.post("/", postCuentas);
routerCu.get("/", getCuentas);
routerCu.get("/:id", getCuentasId);
routerCu.patch("/:id/estado", patchClientesIdEstado);
routerCu.get("/:id/movimientos", getMovimientosCuentasId);
routerCu.post("/:id/ingresos", postCuentasIngresos)
routerCu.post("/:id/retiradas", postCuentasRetirada)

export default routerCu;