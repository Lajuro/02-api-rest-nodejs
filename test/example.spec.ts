import { test, expect, beforeAll, afterAll } from "vitest";
import { app } from "../src/app";
import request from "supertest";

beforeAll(async () => {
  await app.ready();
});

afterAll(async () => {
  await app.close();
});

test("user can create a new transaction", async () => {
  const response = await request(app.server)
    .post("/transactions")
    .send({
      title: "New transaction",
      amount: 5000,
      type: "credit",
    });

  expect(response.status).toBe(201);
});