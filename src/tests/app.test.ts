import request from "supertest"
import os from "os"
import { app } from "../app"

describe("GET /cluster", () => {
    it("retorna 200 com mensagem e clusterId do hostname", async () => {
        const res = await request(app).get("/cluster")

        expect(res.status).toBe(200)
        expect(res.headers["content-type"]).toMatch(/json/)
        expect(res.body).toEqual({
            message: "REQUISIÇÃO PROCESSADA COM SUCESSO, IMPLEMENTAÇÃO TESTE FUNCIONANDO",
            clusterId: os.hostname(),
        })
    })

    it("usa o hostname da máquina como clusterId", async () => {
        jest.spyOn(os, "hostname").mockReturnValue("container-teste")

        const res = await request(app).get("/cluster")

        expect(res.body.clusterId).toBe("container-teste")
    })

    it("retorna 404 para rota inexistente", async () => {
        const res = await request(app).get("/nao-existe")

        expect(res.status).toBe(404)
    })

    it("avaliar se a rota retorna um json", async () => {
        const rest = await request(app).get("/cluster")

        expect(rest.headers["content-type"]).toMatch(/json/)
    })
})
