import express from "express"
import os from "os"


const app = express()

app.use(express.json())

app.get("/cluster", (req, res)=>{
    const id = os.hostname()

    
    return res.json({message:`REQUISIÇÃO PROCESSADA COM SUCESSO COM CLUSTER ID: ${id}`})

});

export {app}