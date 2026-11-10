import type {Request, Response} from "express";
import {ObjectId} from "mongodb";
import type {Collection} from "mongodb";

import type {ClienteT} from "../models/clientes_model.js"

let ClientesCollection : Collection<ClienteT>;

export const configClientesCollection = (collection: Collection<ClienteT>) => {ClientesCollection = collection}

export const getClientesId = (req: Request, res : Response) => {
    const id = String(req.params.id);
    if(!ObjectId.isValid(id)){res.status(400).json("ID no valido"); return;}
    ClientesCollection.findOne({_id: new Object(id)}).then((result) => {(!result) ? res.status(404).json({message: "No encontrado"}) : res.json(result); return;})
};

export const getClientes = (req: Request, res : Response) => {
    const pagina = Number(req.query.pagina ?? 1);
    const limite = Number(req.query.limite ?? 20);
    const n = (pagina - 1) * limite;

    ClientesCollection.find().skip(n).limit(limite).toArray().then((result) => {res.json(result)}).catch(() => res.status(500).json({error: "Error inesperado"}));
};  

export const postClientes = (req: Request, res : Response) => {
    const Cliente : ClienteT = {nombre: req.body.nombre, email: req.body.email, dni: req.body.dni, creadoEn: new Date()}

    if(!Cliente.nombre || !Cliente.dni || !Cliente.email){res.status(400).json({error: "Faltan argumentos"}); return;}
    
    //FORMATO EMAIL
    if(typeof Cliente.email != "string"){res.status(400).json({ error: "El email debe ser texto" }); return;}
    Cliente.email = Cliente.email.toLocaleLowerCase();
    if((Cliente.email.split('@')).length != 2 || !((Cliente.email.split('@')))[0] || !((Cliente.email.split('@')))[1]){res.status(400).json({ error: "Email inválido" }); return;}
    const finalemail = (Cliente.email.split('@'))[1]??"".split(".");
    for (let i = 0; i < finalemail.length; i++) {
        if (finalemail[i] === ""){res.status(400).json({ error: "El email incompleto"}) ; return;}
    }   

    //FORMATO DNI
    if (typeof Cliente.dni !== "string" || Cliente.dni.length !== 9) {res.status(400).json({ error: "DNI inválido" }); return;}
    let cont = 1;
    for(let caracter of Cliente.dni){
        if(cont === 9 && typeof caracter != "string"){break;}
        else{res.status(400).json({ error: "DNI inválido" }); return;}

        if(caracter >= "0" && caracter <= "9"){cont++;}
        else{res.status(400).json({ error: "DNI inválido" }); return;}
    }

    ClientesCollection.insertOne(Cliente).then((result)=>{res.status(201).json({ message: `Cliente con nombre ${Cliente.nombre} y id ${result.insertedId} ha sido insertado`})}).catch((error) => {res.status(500).json({error: "Error al crear el cliente"})});
};  

export const patchClientesId = (req: Request, res : Response) => {
    const idBuscado = String(req.params.id);
    if(!ObjectId.isValid(idBuscado)){res.status(400).json("ID no valido"); return;}

    ClientesCollection.findOne({_id: new ObjectId(idBuscado)}).then((cliente) => {
        if(cliente === null){res.status(400).json({ error: "Cliente no encontrado" }); return;}
        else {
            let ClienteActualizado : ClienteT = {nombre: req.body.nombre ?? cliente.nombre, email: req.body.email ?? cliente.email, dni: cliente.dni, creadoEn: cliente.creadoEn}; 
            res.status(201).json({ message: `Cliente modificado`});
            ClientesCollection.replaceOne({ _id: new ObjectId(idBuscado) }, ClienteActualizado);
        }
    }).catch((error) => {res.status(500).json({error: "Error al modificar el cliente"})});
}