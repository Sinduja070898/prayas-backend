const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
require("dotenv").config();

const User = require("./src/models/User");

async function seed() {
    await mongoose.connect(process.env.MONGODB_URI);

    const hash = await bcrypt.hash("Admin@123", 10);

    await User.create({
        name: "Admin",
        email: "admin@gmail.com",
        password: hash,
        role: "admin"
    });

    console.log("Admin created");
    process.exit();
}

seed();