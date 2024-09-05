import { knex } from "../database";
import { FastifyInstance } from 'fastify';
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { checkSessionIdExists } from "../middleware/check-session-id-exists";

export async function transactionsRoutes(app: FastifyInstance) {

  app.get("/", { preHandler: [checkSessionIdExists] }, async (request) => {
    const sessionId = request.cookies.sessionId;

    const transactions = await knex("transactions").where("session_id", sessionId).select();

    return { transactions };
  });

  app.get("/:id", { preHandler: [checkSessionIdExists] }, async (request) => {
    const getTransactionParamsSchema = z.object({
      id: z.string().uuid(),
    });

    const { id } = getTransactionParamsSchema.parse(request.params);

    const sessionId = request.cookies.sessionId;

    const transaction = await knex("transactions").where({
      id,
      session_id: sessionId,
    }).first();

    return { transaction };
  });

  app.get("/summary", { preHandler: [checkSessionIdExists] }, async (request) => {
    const sessionId = request.cookies.sessionId;

    const summary = await knex("transactions")
      .where("session_id", sessionId)
      .sum("amount", { as: "amount" })
      .first();

    return { summary };
  });

  app.post("/", async (request, reply) => {
    const createTransactionBodySchema = z.object({
      title: z.string(),
      amount: z.number(),
      type: z.enum(["credit", "debit"]),
    });

    const { title, amount, type } = createTransactionBodySchema.parse(request.body);

    let sessionId = request.cookies.sessionId;

    if (!sessionId) {
      sessionId = randomUUID();

      reply.cookie("sessionId", sessionId, {
        path: "/",
        maxAge: 60 * 60 * 24 * 7, // 7 days
      });
    }

    const transaction = await knex("transactions").insert({
      id: randomUUID(),
      title,
      amount: type === "credit" ? amount : amount * -1,
      type,
      session_id: sessionId,
    }).returning("*");

    return reply.status(201).send(transaction);
  });

  app.delete("/clear", async (request, reply) => {
    const confirmationSchema = z.object({
      confirmation: z.boolean(),
    });

    const { confirmation } = confirmationSchema.parse(request.body);

    if (!confirmation) {
      return reply.status(400).send({ error: "Confirmation is required" });
    }

    await knex("transactions").delete();

    return reply.status(204).send();
  });
}