const mongoose = require("mongoose");

const app = require("../src/app.js");

const request = require("supertest").agent(app.listen());
const { User, Group } = require("./database");

const MockUser = require("./mocks/User");

beforeAll(async () => {
  process.env.TEST_SUITE = "groups-test";
});

beforeEach(() => {
  for (const collection in mongoose.connection.collections) {
    mongoose.connection.collections[collection].deleteMany({});
  }
});

afterAll(() => {
  mongoose.disconnect();
});

describe("POST /api/groups", () => {
  test("valid group creation", async () => {
    const user = new MockUser(request);
    const token = await user.login;

    p(token);

    const response = await request
      .post("/api/groups")
      .set("Authorization", token)
      .send({
        name: "test",
        description: "test description",
        isPrivate: false
      });

    p(response.headers);
    p(response.status);
    expect(response.status).toBe(201);

    const newGroup = await Group.findOne({
      name: response.body.name
    })
      .populate("owner")
      .populate("members");

    const dbUser = await User.findOne({ username: user.data.username });

    // Group settings test
    expect(newGroup.name).toEqual("test");
    expect(newGroup.description).toEqual("test description");
    expect(newGroup.isPrivate).toBe(false);

    // DB population test
    expect(newGroup.owner.username).toEqual(user.data.username);
    expect(newGroup.members).toContain(dbUser);
  });

  // test("invalid group creation", async () => {
  //   const user = new MockUser(request);
  //   await user.login;

  //   const response = await request
  //     .post("/api/groups")
  //     .set("Authorization", user.token)
  //     .send({
  //       name: "",
  //       description: "test",
  //       isPrivate: false
  //     });

  //   expect(response.status).toBe(422);
  // });

  // test("invalid group create request", async () => {
  //   const user = new MockUser(request);
  //   await user.login;

  //   const response = await request
  //     .post("/api/groups")
  //     .set("Authorization", user.token)
  //     .send({
  //       name: 123,
  //       description: 123,
  //       isPrivate: "false"
  //     });

  //   expect(response.status).toBe(400);
  // });
});

const p = (...text) => {
  console.log(Date.now(), ...text);
};
