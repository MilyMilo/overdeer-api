class MockUser {
  constructor(request, data) {
    this.request = request;
    this.token = "";

    // This name is for internal usage only
    // To access user's username use user.data.username
    this._name = this._getName();

    if (!data) {
      this.data = {
        username: this._name,
        email: `${this._name}@example.com`,
        password: this._name
      };
    }

    // Constructors can't be async
    this.login = new Promise(async (resolve, reject) => {
      try {
        await this._register();
        const res = await this._login();
        this.token = res.body.token;
        resolve(this.token);
      } catch (err) {
        reject(err);
      }
    });
  }

  _register() {
    return this.request.post("/api/register").send({
      username: this.data.username,
      email: this.data.email,
      password: this.data.password
    });
  }

  _login() {
    return this.request
      .post("/api/login")
      .send({ email: this.data.email, password: this.data.password });
  }

  _getName() {
    return Math.random()
      .toString(36)
      .substr(2, 10);
  }
}

module.exports = MockUser;
