const mongoose = require("mongoose");
const config = require("../../config");

mongoose
  .connect(
    `${config.MONGO_URI}/overdeer`,
    { useNewUrlParser: true }
  )
  .then(() => console.log("MongoDB successfully connected!"))
  .catch(err => {
    throw err;
  });

require("../models/User");
require("../models/Group");
