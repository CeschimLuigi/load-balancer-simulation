import request from "supertest"
import os from "os"
import { app } from "../app"

const GB = 1024 * 1024 * 1024

function mockMemoria(totalGB: number, livreGB: number) {
    jest.spyOn(os, "totalmem").mockReturnValue(totalGB * GB)
    jest.spyOn(os, "freemem").mockReturnValue(livreGB * GB)
}

describe("GET /status", () => {
    afterEach(() => {
        jest.restoreAllMocks()
    })

    it("retorna 200 com json", async () => {
        const res = await request(app).get("/status")

        expect(res.status).toBe(200)
        expect(res.headers["content-type"]).toMatch(/json/)
    })

    it("retorna as informações da máquina", async () => {
        jest.spyOn(os, "hostname").mockReturnValue("container-teste")
        jest.spyOn(os, "platform").mockReturnValue("linux")

        const res = await request(app).get("/status")

        expect(res.body.clusterId).toBe("container-teste")
        expect(res.body.plataforma).toBe("linux")
        expect(res.body.cpus).toBe(os.cpus().length)
    })

    it("formata o uptime em horas, minutos e segundos", async () => {
        jest.spyOn(process, "uptime").mockReturnValue(3725.9)

        const res = await request(app).get("/status")

        expect(res.body.uptime).toBe("1h 2m 5s")
    })

    it("calcula o uso de memória em MB e percentual", async () => {
        mockMemoria(8, 6)

        const res = await request(app).get("/status")

        expect(res.body.memoria).toEqual({
            totalMB: 8192,
            usadoMB: 2048,
            percentual: 25,
        })
    })

    it.each([
        [10, 5, "NORMAL"],
        [10, 3, "ALTO"],
        [10, 1, "CRITICO"],
    ])("com %iGB total e %iGB livre a carga é %s", async (total, livre, carga) => {
        mockMemoria(total, livre)

        const res = await request(app).get("/status")

        expect(res.body.carga).toBe(carga)
    })
})
