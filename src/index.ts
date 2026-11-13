import express from "express";
import { connectMongo } from "./config/database.js";
import type {Collection} from "mongodb";
import type {ClienteT} from "./models/clientes_model.js"
import type {CuentaT} from "./models/cuentas_model.js"
import type {MovimientoT} from "./models/movimientos_model.js"
import routerCl from "./routes/clientes_route.js";
import { configClientesCollection } from "./controllers/clientes_controller.js";
import { configCuentasCollection } from "./controllers/cuentas_controller.js";
import { configMovimientosCollection } from "./controllers/cuentas_controller.js";
import routerCu from "./routes/cuentas_route.js";

const app = express();
app.use(express.json());

const port = process.env.PORT;

const main = () =>{
    connectMongo().then((db)=>{

            const ClientesCollection:Collection<ClienteT> = db.collection("Clientes");
            const CuentasCollection:Collection<CuentaT> =db.collection("Cuentas");
            const MovimientosCollection: Collection<MovimientoT> = db.collection("Movimientos");

            configClientesCollection(ClientesCollection);
            configCuentasCollection(CuentasCollection);
            configMovimientosCollection(MovimientosCollection);
            
            app.use("/clientes", routerCl);
            app.use("/cuentas", routerCu);
            
            ClientesCollection.createIndex({ email: 1 }, { unique: true }).then(() => ClientesCollection.createIndex({ dni: 1 }, { unique: true })).then(() => 
                CuentasCollection.createIndex({ iban: 1 }, { unique: true })).then(() => {
                    app.listen(3000, () => {console.log("Puerto 3000 funcionando");});}).catch((error) => {console.log("Error al generar los índices:", error);});})
            .catch(()=>{console.log("No se ha podido conectar a Mongo")})
};

main();