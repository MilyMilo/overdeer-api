const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const app = require("../src/app.js");
const config = require("../config");

const request = require("supertest").agent(app.listen());
const { User } = require("./database");

beforeAll(async () => {
  process.env.TEST_SUITE = "users-test";
  // CircleCI is configured to use db without auth on localhost
  if (process.env.NODE_ENV === "circle") {
    try {
      await mongoose.connect(
        `mongodb://localhost:27017/${process.env.TEST_SUITE}`,
        { useNewUrlParser: true }
      );
    } catch (err) {
      throw err;
    }
  } else {
    try {
      await mongoose.connect(
        `${config.MONGO_URI}/${process.env.TEST_SUITE}`,
        { useNewUrlParser: true }
      );
    } catch (err) {
      throw err;
    }
  }
});

beforeEach(() => {
  for (const collection in mongoose.connection.collections) {
    mongoose.connection.collections[collection].deleteMany({});
  }
});

afterAll(() => {
  mongoose.disconnect();
});

describe("POST /api/register", () => {
  test("valid user creation", async () => {
    const response = await request.post("/api/register").send({
      username: "validuser",
      email: "valid@user.com",
      password: "securepassword"
    });

    expect(response.status).toBe(201);
    expect(response.text).toMatchSnapshot("valid user");
  });

  test("user gets persisted to the db", async () => {
    await request.post("/api/register").send({
      username: "validuser",
      email: "valid@user.com",
      password: "securepassword"
    });

    const user = await User.findOne({ email: "valid@user.com" });
    expect(user.username).toContain("validuser");
    expect(user.email).toContain("valid@user.com");

    const isOk = await bcrypt.compare("securepassword", user.password);
    expect(isOk).toBe(true);
  });

  test("email missing user creation", async () => {
    const response = await request.post("/api/register").send({
      username: "validuser",
      password: "securepassword"
    });

    expect(response.status).toBe(400);
    expect(response.body).toMatchSnapshot("email missing");
  });

  test("taken user creation", async () => {
    await request.post("/api/register").send({
      username: "takenuser",
      email: "taken@user.com",
      password: "securepassword"
    });

    const response = await request.post("/api/register").send({
      username: "takenuser",
      email: "taken@user.com",
      password: "securepassword"
    });

    expect(response.status).toEqual(409);
    expect(response.text).toContain("This email is already registered");
  });

  test("username missing user creation", async () => {
    const response = await request.post("/api/register").send({
      email: "valid@user.com",
      password: "securepassword"
    });

    expect(response.status).toBe(400);
    // expect(response.body).toMatchSnapshot("username missing");
  });

  test("password missing user creation", async () => {
    const response = await request.post("/api/register").send({
      username: "validuser",
      email: "valid@user.com"
    });

    expect(response.status).toBe(400);
    // expect(response.body).toMatchSnapshot("password missing");
  });

  test("empty request", async () => {
    const response = await request.post("/api/register").send({});

    expect(response.status).toBe(400);
    // expect(response.body).toMatchSnapshot("empty request");
  });

  test("malformed email user creation", async () => {
    const response = await request.post("/api/register").send({
      username: "takenuser",
      email: "taken@user",
      password: "securepassword"
    });

    expect(response.status).toBe(422);
    expect(response.body).toMatchSnapshot("email invalid");
  });
});

module.exports = {
  "valid user": `{"username":"validuser","email":"valid@user.com"}`,
  "email missing": `{"email":"Email is invalid"}`,
  "email invalid": `{"email":"Email is invalid"}`,
  "email taken": `{"email": "This email is already registered"}`,
  "username missing": `{"username":"Username field is required"}`,
  "username invalid": `{"username":"Username must not contain characters other than alphanumeric or underscores"}`,
  "password missing": `{"password":"Password must be at least 6 characters"}`,
  "empty request": `{"username":"Username field is required","email":"Email is invalid","password":"Password must be at least 6 characters"}`
};

// TODO: Login tests
// TODO: Type assertion tests
