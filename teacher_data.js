const mongoose = require("mongoose");

// Define the schema for the Teacher model
const TeacherSchema = new mongoose.Schema({
  loginid: { type: String, required: true },
  password: { type: String, required: true }
});

// Create the Teacher model using the defined schema
const TeacherModel = mongoose.models.TeacherBit || mongoose.model("TeacherBit", TeacherSchema);

// Connect to the MongoDB database
mongoose.connect("mongodb://localhost:27017/BitReg", { useNewUrlParser: true, useUnifiedTopology: true })
  .then(async () => {
    console.log("connected");

    const teachers = [
      { loginid: "teacher1", password: "password1" },
      { loginid: "teacher2", password: "password2" },
      { loginid: "teacher3", password: "password3" },
      { loginid: "teacher4", password: "password4" },
      { loginid: "teacher5", password: "password5" },
      { loginid: "teacher6", password: "password6" },
      { loginid: "teacher7", password: "password7" },
      { loginid: "teacher8", password: "password8" },
      { loginid: "teacher9", password: "password9" },
      { loginid: "teacher10", password: "password10" }
    ];

    try {
      const count = await TeacherModel.countDocuments({});
      if (count === 0) {
        await TeacherModel.insertMany(teachers);
        console.log("Teachers inserted");
      } else {
        console.log("Teachers data already exists, no insertion needed");
      }
    } catch (err) {
      console.error("Error inserting or checking teachers:", err);
    } finally {
      mongoose.connection.close();
    }
  })
  .catch((err) => {
    console.error("Failed to connect:", err);
  });

// Export the Teacher model
module.exports = TeacherModel;
