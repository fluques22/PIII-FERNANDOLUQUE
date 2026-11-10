import express from "express";
import { connectMongo } from "./config/database.js";
import type {Collection} from "mongodb";
import type {ClienteT} from "./models/clientes_model.js"
import router from "./routes/clientes_route.js";
import { configClientesCollection } from "./controllers/clientes_controller.js";
const app = express();
app.use(express.json());

const port = process.env.PORT;

app.listen(port, () => {console.log(`Puerto ${port} esta escuchando`);});

const main = () =>{
    connectMongo().then((db)=>{

            const ClientesCollection:Collection<ClienteT> = db.collection("Clientes");
            configClientesCollection(ClientesCollection);
            
            app.use("/clientes", router);
            ClientesCollection.createIndex({ email: 1 },{ unique: true }).then(() => ClientesCollection.createIndex({ dni: 1 },{ unique: true })).then(() => app.listen(3000, ()=>{console.log("Puerto 3000 funcionando")})).catch((error) => console.log("Error al generar los indices"));

        }).catch(()=>{
            console.log("No se ha podido conectar a Mongo")
        })
};

main();