import type {Request, Response} from "express";
import {ObjectId} from "mongodb";
import type {Collection, Filter} from "mongodb";
import type {ClienteT} from "../models/clientes_model.js"
import type {CuentaT} from "../models/cuentas_model.js"
import type {MovimientoT} from "../models/movimientos_model.js"

let ClientesCollection: Collection<ClienteT>;
let CuentasCollection : Collection<CuentaT>;
let MovimientosCollection: Collection<MovimientoT>;


export const configClientesCollection = (collection: Collection<ClienteT>) => {ClientesCollection = collection};
export const configCuentasCollection = (collection: Collection<CuentaT>) => {CuentasCollection = collection}
export const configMovimientosCollection = (collection: Collection<MovimientoT>) => {MovimientosCollection = collection}

export const postCuentas = (req: Request, res : Response) => {

    //COMPROBACIONES
    if(!req.body.clienteId || !req.body.tipo){res.status(400).json({error: "Faltan argumentos"}); return;}
    if(!ObjectId.isValid(req.body.clienteId )){res.status(400).json("ID no valido"); return;}
    if(req.body.tipo != "ahorro" && req.body.tipo != "corriente"){res.status(400).json({error: "Faltan argumentos"}); return;}
    ClientesCollection.findOne({_id: new ObjectId(req.body.clienteId)}).then((cliente) => {
        if(cliente === null){res.status(400).json({ error: "Cliente no encontrado" }); return;}
    })
    CuentasCollection.countDocuments({clienteId: new ObjectId(req.body.clienteId), estado: "cerrada"}).then((numero) => {if(numero >= 3){res.status(409).json({error: "Mas de 3 cuentas canceladas"})}})
    
    //NORMALIZACION Y FORMATOS VALIDOS
    let BBAN = "";
    for(let i = 0; i < 20; i++){BBAN += Math.floor(Math.random() * 10);}
    const cadena = BBAN + "142800";
    let resto = 0;
    for(let c of cadena){(resto = (resto*10 + Number(c)) % 97);}
    const control = 98 - resto;
    let txtcontrol;
    control < 10 ? txtcontrol = "0" + String(control) : String(control);
    const IBAN = "ES" + txtcontrol + BBAN;
    const Validacion = IBAN.slice(4) + IBAN.slice(0, 4);
    const cadenaNumerica = Validacion.replace("ES", "1428");
    let restoValidacion = 0;
    for(let c of cadenaNumerica){(restoValidacion = (restoValidacion*10 + Number(c)) % 97);}
    if(restoValidacion !== 1){res.status(400).json("IBAN no valido"); return;}

    //CREAR CUENTA
    const Cuenta : CuentaT = {clienteId: new ObjectId(req.body.clienteId), tipo: req.body.tipo, saldo: 0, estado: "activa", iban: IBAN, descubiertoMax: req.body.tipo === "ahorro" ? 0: 50000 ,creadoEn: new Date()}
    CuentasCollection.insertOne(Cuenta).then((result)=>{res.status(201).json({ message: `Cuenta tipo ${Cuenta.tipo} y id ${String(result.insertedId)} ha sido creada`})}).catch((error) => {res.status(500).json({error: "Error al crear el cliente"}); console.log(error);});
};  

export const getCuentas = (req: Request, res : Response) => {CuentasCollection.find().toArray().then((result) => {res.status(200).json(result)}).catch(() => res.status(500).json({error: "Error inesperado"}));};  

export const getCuentasId = (req: Request, res : Response) => {
    const id = String(req.params.id);
    if(!ObjectId.isValid(id)){res.status(400).json("ID no valido"); return;}
    CuentasCollection.findOne({_id: new Object(id)}).then((result) => {(!result) ? res.status(404).json({message: "No encontrado"})  : res.status(200).json({...result, _id: String(result._id), clienteId: result.clienteId.toString()}); return;})
};

export const patchClientesIdEstado = (req: Request, res : Response) => {
    const idBuscado = String(req.params.id);
    const estado = req.body.estado;
    if(!ObjectId.isValid(idBuscado) || (estado != "activa" && estado != "bloqueada" && estado != "cerrada")){res.status(400).json("ID no valido"); return;}

    CuentasCollection.findOne({_id: new ObjectId(idBuscado)}).then((cuenta) => {
        if(cuenta === null){res.status(404).json({ error: "Cuenta no encontrada" }); return;}
        else {
            if(cuenta.estado === estado || cuenta.estado === "cerrada"  || 	estado === "cerrada" && cuenta.saldo !== 0){res.status(409).json({ error: "Estado no valido" }); return;}
            let CuentaActualizada : CuentaT ={...cuenta, estado: estado}

            res.status(201).json({ message: `Cliente modificado`});
            CuentasCollection.replaceOne({ _id: new ObjectId(cuenta._id) }, CuentaActualizada);
        }
    }).catch((error) => {res.status(500).json({error: "Error al modificar la cuenta"}); console.log(error);});
}

export const getMovimientosCuentasId = (req: Request, res : Response) => {
    const pagina = Number(req.query.pagina ?? 1);
    const limite = Number(req.query.limite ?? 20);
    const n = (pagina - 1) * limite;

    ClientesCollection.find().skip(n).limit(limite).toArray().then((result) => {res.status(200).json(result)}).catch(() => res.status(500).json({error: "Error inesperado"}));
};  

export const getMovimientosCuenta = (req: Request, res : Response) => {
    const idBuscado = String(req.params.id);
    if(!ObjectId.isValid(idBuscado)){res.status(400).json("ID no valido"); return;}

    const pagina = Number(req.query.pagina ?? 1);
    const limite = Number(req.query.limite ?? 20);

    CuentasCollection.findOne({_id: new ObjectId(idBuscado)}).then((result) => {if(result === null){res.status(404).json({message: "No encontrado"})}});
    const filtro: Filter<MovimientoT> = {cuentaId: new ObjectId(idBuscado)}
    const totalElementos = Number(MovimientosCollection.countDocuments(filtro));
    const totalPaginas = Math.ceil(totalElementos / limite);

    MovimientosCollection.find(filtro).sort({ fecha: -1 }).skip((pagina - 1) * limite).limit(limite).toArray().then((movimientos) => {res.status(200).json({datos: movimientos, pagina, limite, totalElementos, totalPaginas})}).catch(() => res.status(500).json({error: "Error inesperado"}));;
};  

export const postCuentasIngresos = (req: Request, res : Response) => {
    const id = String(req.params.id);
    if(!ObjectId.isValid(id)){res.status(400).json("ID no valido"); return;}
    CuentasCollection.findOne({_id: new Object(id)}).then((result) => {

        if(!result){res.status(404).json({message: "No encontrado"}); return;}
        else if(result.estado === "cerrada"){res.status(409).json({message: "No encontrado"}); return;}

        let nuevoSaldo = result.saldo + req.body.importe;
        const movimiento: MovimientoT = {cuentaId: new ObjectId(id), tipo: "ingreso", importe: req.body.importe, saldoResultante: nuevoSaldo, concepto: req.body.concepto, categoria: req.body.categoria ?? "otros", fecha: new Date()};
        CuentasCollection.replaceOne({ _id: new ObjectId(id) },{...result, saldo: nuevoSaldo}).then((resultado) => {
            if (resultado.matchedCount === 0) {res.status(404).json({ error: "Cuenta no encontrada" });return;}
            MovimientosCollection.insertOne(movimiento).then((result) => {res.status(201).json({...movimiento,_id: result.insertedId.toString(), cuentaId: id});}).catch(() => {res.status(500).json({ error: "Error al registrar el movimiento" });});
        }).catch(() => {res.status(500).json({ error: "Error al actualizar el saldo" });});
    })
}

export const postCuentasRetirada = (req: Request, res : Response) => {
    const id = String(req.params.id);
    if(!ObjectId.isValid(id)){res.status(400).json("ID no valido"); return;}
    CuentasCollection.findOne({_id: new Object(id)}).then((result) => {

        if(!result){res.status(404).json({message: "No encontrado"}); return;}
        else if(result.estado === "cerrada"){res.status(409).json({message: "No encontrado"}); return;}

        const nuevoSaldo = result.saldo - req.body.importe;
        if (nuevoSaldo < -result.descubiertoMax) {res.status(409).json({ error: "Saldo insuficiente" });return;}
        const movimiento: MovimientoT = {cuentaId: new ObjectId(id), tipo: "retirada", importe: -req.body.importe, saldoResultante: nuevoSaldo, concepto: req.body.concepto, categoria: req.body.categoria ?? "otros", fecha: new Date()};
        MovimientosCollection.find({cuentaId: new ObjectId(id),tipo: "retirada"}).toArray().then((movimientos) => {
            let totalHoy = 0;
            const hoy = new Date().toDateString();
            for (let movimiento of movimientos) {
                 if (movimiento.fecha.toDateString() === hoy) {totalHoy += -movimiento.importe;}
            }
            if (totalHoy + req.body.importe > 100000) {res.status(409).json({ error: "Límite diario superado" });return;}
        });
        
        CuentasCollection.replaceOne({ _id: new ObjectId(id) },{...result, saldo: nuevoSaldo}).then((resultado) => {
            if (resultado.matchedCount === 0) {res.status(404).json({ error: "Cuenta no encontrada" });return;}
            MovimientosCollection.insertOne(movimiento).then((result) => {res.status(201).json({...movimiento, _id: result.insertedId.toString(), cuentaId: id});}).catch(() => {res.status(500).json({ error: "Error al registrar el movimiento" });});
        }).catch(() => {res.status(500).json({ error: "Error al actualizar el saldo" });});
    })
}