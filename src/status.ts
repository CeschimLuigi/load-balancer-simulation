import { Request, Response } from "express"
import os from "os"

function formatarUptime(segundos: number) {
    const horas = Math.floor(segundos / 3600)
    const minutos = Math.floor((segundos % 3600) / 60)
    const resto = Math.floor(segundos % 60)

    return `${horas}h ${minutos}m ${resto}s`
}

function calcularUsoMemoria() {
    const total = os.totalmem()
    const livre = os.freemem()
    const usado = total - livre

    return {
        totalMB: Math.round(total / 1024 / 1024),
        usadoMB: Math.round(usado / 1024 / 1024),
        percentual: Number(((usado / total) * 100).toFixed(1)),
    }
}

function statusDaCarga(percentual: number) {
    if (percentual >= 90) return "CRITICO"
    if (percentual >= 70) return "ALTO"
    return "NORMAL"
}

export function statusHandler(req: Request, res: Response) {
    const memoria = calcularUsoMemoria()

    return res.json({
        clusterId: os.hostname(),
        plataforma: os.platform(),
        cpus: os.cpus().length,
        uptime: formatarUptime(process.uptime()),
        memoria,
        carga: statusDaCarga(memoria.percentual),
    })
}
