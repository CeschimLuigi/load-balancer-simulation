import express from "express"
import os from "os"
import { statusHandler } from "./status"


const app = express()

app.use(express.json())

app.get("/cluster", (req, res)=>{
    const id = os.hostname()

    
    return res.json({message:`REQUISIÇÃO PROCESSADA COM SUCESSO, IMPLEMENTAÇÃO TESTE FUNCIONANDO`, clusterId: id})

});

app.get("/status", statusHandler)

export {app}