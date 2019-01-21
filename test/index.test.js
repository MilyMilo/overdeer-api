const app = require("../src/app.js");
const request = require("supertest").agent(app.listen());

describe("Common functionality testing", () => {
  test("get unknown route", async () => {
    const response = await request.get("/api/foo");
    expect(response.status).toEqual(404);
    expect(response.text).toContain("Not Found");
  });
});
