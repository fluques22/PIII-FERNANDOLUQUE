import {Db, MongoClient} from "mongodb";
import "dotenv/config";

const mongo = process.env.MONGO;

if (mongo === undefined) {throw Error ("Direccion no valida para Mongo");}

export const connectMongo = ():Promise<Db> => {
    const client = new MongoClient(mongo);

    return client.connect().then(()=>{
        console.log("Conectado a Mongo");
        return client.db("Clientes")
    }).catch((error)=>{
        console.log("Error al conectar con Mongo");
        console.log(error);
        throw error;
    })

}