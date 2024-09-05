import { expect, beforeAll, afterAll, describe, it, beforeEach } from "vitest";
import { execSync } from "node:child_process";
import { app } from "../src/app";
import request from "supertest";

describe("Transactions routes", () => {
  const createTransaction = async (title: string, amount: number, type: 'credit' | 'debit', cookies: string[] = []) => {
    return request(app.server)
      .post("/transactions")
      .send({ title, amount, type })
      .set("Cookie", cookies);
  };

  const getTransactions = async (cookies: string[]) => {
    return request(app.server)
      .get("/transactions")
      .set("Cookie", cookies);
  };

  const getTransactionById = async (id: string, cookies: string[]) => {
    return request(app.server)
      .get(`/transactions/${id}`)
      .set("Cookie", cookies);
  };

  const getSummary = async (cookies: string[]) => {
    return request(app.server)
      .get("/transactions/summary")
      .set("Cookie", cookies);
  };

  beforeAll(async () => {
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    execSync("npm run knex migrate:rollback --all");
    execSync("npm run knex migrate:latest");
  });

  it("should be able to create a new transaction", async () => {
    const response = await createTransaction("New transaction", 5000, "credit");
    expect(response.status).toBe(201);
  });

  it("should be able to list all transactions", async () => {
    const createResponse = await createTransaction("New transaction", 5000, "credit");
    const cookies = createResponse.get("Set-Cookie") || [];

    const listResponse = await getTransactions(cookies);
    expect(listResponse.status).toBe(200);
    expect(listResponse.body.transactions).toEqual([
      expect.objectContaining({
        title: "New transaction",
        amount: 5000,
      }),
    ]);
  });

  it("should be able to get a specific transaction", async () => {
    const createResponse = await createTransaction("New transaction", 5000, "credit");
    const cookies = createResponse.get("Set-Cookie") || [];

    const listResponse = await getTransactions(cookies);
    const transactionId = listResponse.body.transactions[0].id;

    const getResponse = await getTransactionById(transactionId, cookies);
    expect(getResponse.status).toBe(200);
    expect(getResponse.body.transaction).toEqual(
      expect.objectContaining({
        title: "New transaction",
        amount: 5000,
      }),
    );
  });

  it("should be able to get the summary", async () => {
    const createCreditResponse = await createTransaction("Credit transaction", 5000, "credit");
    const cookies = createCreditResponse.get("Set-Cookie") || [];

    await createTransaction("Debit transaction", 2000, "debit", cookies);

    const summaryResponse = await getSummary(cookies);
    expect(summaryResponse.status).toBe(200);
    expect(summaryResponse.body.summary).toEqual({
      amount: 3000,
    });
  });
});