const mongoose = require("mongoose");

// Connect to MongoDB
mongoose.connect("mongodb://localhost:27017/BitReg", {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
  .then(() => {
    console.log("connected");
    initializeTeacherData(); // Call the function to insert teacher data only once
  })
  .catch((error) => {
    console.error("failed to connect", error);
  });



// Define RegBit schema and model
const RegBitSchema = new mongoose.Schema({
  usn: { type: String, required: true },
  password: { type: String, required: true },
  branch: { type: String, required: true }
});

const RegBitModel = mongoose.model("RegBit", RegBitSchema);

// Define Teacher schema and model
const TeacherSchema = new mongoose.Schema({
  teacher_name:{type:String,reqiured:true},
  loginId: { type: String, required: true },
  password: { type: String, required: true },
  subject:{type:String, required:true},
  subject_code:{type:String,required:true},
  sub_credit:{type:String,required:true}
});

const TeacherModel = mongoose.model("Teacher", TeacherSchema);

//Define student Attendance schema and model

const AttendanceSchema = new mongoose.Schema({
  name:{type:String,required:true},
  usn:{type:String, required:true},
  sem:{type:Number,required:true},
  sec:{type:String,required:true}
})
const AttendanceModel = mongoose.model("Attendance", AttendanceSchema, "cse");

// Function to insert multiple teacher data only once
async function initializeTeacherData() {
  try {
    const existingTeachers = await TeacherModel.find();
    if (existingTeachers.length === 0) {
      const teachers = [
        { teacher_name:"Netravati",loginId: 'teacher1', password: 'password1',subject:"DSV", subject_code:"21CS64",sub_credit:"3" },
        { teacher_name:"Bhanushree",loginId: 'teacher2', password: 'password2',subject:"CGV",subject_code:"21CS63",sub_credit:"3" },
        { teacher_name:"Pransant KN",loginId: 'teacher3', password: 'password3',subject:"FSD", subject_code:"21CS62",sub_credit:"3" },
        { teacher_name:"Mahaklakshmi",loginId: 'teacher4', password: 'password4',subject:"SE",subject_code:"21CS61",sub_credit:"3"},
       
      ];
      await TeacherModel.insertMany(teachers);
      console.log("Teacher data inserted");
    } else {
      console.log("Teacher data already exists");
    }
  } catch (error) {
    console.error("Error initializing teacher data:", error);
  }
}

//marks model

const MarksSchema = new mongoose.Schema({
  usn:{type:String,required:true},
  test:{type:String,required:true},
  marks:{type:Number,required:true},
  subject:{type:String,required:true}
})

const MarksModel = mongoose.model("testmarks",MarksSchema)


//notice model
const NoticeSchema = new mongoose.Schema({
  teacher_name:{type:String,required:true},
  subject:{type:String,required:true},
  notice:{type:String,required:true},
  date:{type:Date,required:true}
})

const NoticeModel = mongoose.model("notices",NoticeSchema)

//notes model
const NoteSchema = new mongoose.Schema({
  teacher_name:{type:String,required:true},
  module: { type: String, required: true },
  filePath: { type: String, required: true }
});






// Create a model based on the schema
const NotesModel = mongoose.model('Note', NoteSchema);

//assignment model


const AssignmentSchema = new mongoose.Schema({
  teacher_name:{type:String,required:true},
  assignment: { type: String, required: true },
  filePath: { type: String, required: true }
});






// Create a model based on the schema
const AssignmentModel = mongoose.model('assignment', AssignmentSchema);


//student present 

const ClassAttendanceSchema = new mongoose.Schema({
  name: { type: String, required: true },
  usn: { type: String, required: true },
  subject: { type: String, required: true },
  totalClasses: { type: Number, required: true },
  classesAttended: { type: Number, required: true },
  attendancePercentage: { type: Number, default: 0 }
});

// Calculate attendance percentage before saving
ClassAttendanceSchema.pre('save', function(next) {
  this.attendancePercentage = (this.classesAttended / this.totalClasses) * 100;
  next();
});

const ClassAttendanceModel = mongoose.model('ClassAttendance', ClassAttendanceSchema, 'class_attendance');

// Export both models
module.exports = {
  RegBitModel,
  TeacherModel,
  AttendanceModel,
  MarksModel,
  NoticeModel,
  NotesModel,
  ClassAttendanceModel,
  AssignmentModel
  
};
