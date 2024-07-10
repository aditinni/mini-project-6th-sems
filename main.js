const express = require('express');
const bodyParser = require('body-parser');  
const session = require('express-session'); 
const multer = require('multer');
const app = express();
const fs = require('fs');
const path = require('path');
const {RegBitModel} = require("./mongodb");
const {TeacherModel} = require('./mongodb');
const {AttendanceModel} = require('./mongodb')
const {MarksModel} = require("./mongodb")
const{NoticeModel} =require("./mongodb")
const{NotesModel} = require("./mongodb")
const{ClassAttendanceModel}= require("./mongodb")
const{AssignmentModel}= require("./mongodb")


const port = 3000;
const ejs = require("ejs");
const { es } = require('date-fns/locale');
app.use(bodyParser.json());

app.use(express.static("public"));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/uploadassignment', express.static(path.join(__dirname, 'uploadassignment')));
app.use(bodyParser.urlencoded({ extended: false }));
app.set('view engine','ejs')

// Configure session middleware
app.use(session({
  secret: 'miniproject',  
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false }  
}));




// Define routes



app.get('/', (req, res) => {
  // Destroy the student session
  req.session.destroy(err => {
    if (err) {
      console.log('Error destroying session:', err);
      // Handle error if needed, e.g., render an error page
      res.redirect('/error'); // or res.render("errorPage");
    } else {
      // Render the login page after session is destroyed
      res.render("home");
    }
  });
});



app.get('/success', (req, res) => {
  res.send("<h1>successfully registered</h1><a href=/stulogin>Click below to login </a>");
});
app.get("/register",(req,res)=>{
  res.render("register")
})

app.post('/success', async (req, res) => {  
  const data = {
    usn: req.body.usn,
    password: req.body.password,
    branch: req.body.branch
  };

  await RegBitModel.create(data);
  res.redirect("/success");
});




app.get("/stulogin",(req,res)=>{
  res.render("stulogin")
})

app.get('/teacher_login', (req, res) => {
  req.session.destroy(err => {
    if (err) {
      console.log('Error destroying session:', err);
      // Handle error if needed, e.g., render an error page
      res.redirect('/error'); // or res.render("errorPage");
    } else {
      // Render the login page after session is destroyed
      res.render("TeacherLogin");
    }
  });
});




app.get('/attendance', async (req, res) => {
  try {
    const attendanceRecords = await AttendanceModel.find().sort({name: 1});

    console.log('Attendance Records:', attendanceRecords);
    console.log(AttendanceModel.collection.name);

    res.render('attendance', {
      title: "Attendance",
      attendanceRecords: attendanceRecords
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
});

app.get("/teacherdashboard", (req, res) => {
  if (req.session.teacher) {
    res.render('teacherdash', {
      title: "Teacher Dashboard",
      teachername: req.session.teacher.teacher_name
    });
  } else {
    res.redirect('/login_teacher');
  }
});


app.post('/teacherdashboard', async (req, res) => {
  const { loginId, password } = req.body;

  try {
    const teacher = await TeacherModel.findOne({ loginId });

    if (teacher && teacher.password === password) {
      req.session.teacher = teacher;  // Store teacher information in session
      res.render("teacherdash", { teachername: teacher.teacher_name });
    } else {
      res.status(401).send("Invalid login credentials");
    }
  } catch (error) {
    console.error("Error validating teacher login:", error);
    res.status(500).send("Internal Server Error");
  }
});

app.get('/studentdash', (req, res) => {
  if (req.session.student) {
    res.render('studentdash', {
      title: "Student Dashboard",
      usn: req.session.student.usn
    });
  } else {
    res.redirect('/studentlogin');
  }
});



app.post("/studentdash", async (req, res) => {
  const { usn, password } = req.body;
  const verifiedusn = await RegBitModel.findOne({ usn });

  if (!verifiedusn) {
    res.send("No user found");
  } else if (usn === verifiedusn.usn && password === verifiedusn.password) {
    req.session.student = verifiedusn;  // Store student information in session
    res.render('studentdash', { usn: usn });
  } else {
    res.send("Wrong credentials");
  }
});

// marks-update page

app.get("/updatemarks", async (req, res) => {
  try {
    if (req.session.teacher) {
      const usnRecords = await AttendanceModel.find().sort({ usn: 1 }); // Sort by usn in ascending order
      res.render('marksupdate', { usn: usnRecords });
    } else {
      res.redirect('/login_teacher');
    }
  } catch (error) {
    console.error("Error fetching attendance:", error);
    res.status(500).send("Internal Server Error");
  }
});
//submiting marks


app.post("/submitmarks", async (req, res) => {
  try {
    if (req.session.teacher) {
      const { usn, test, marks } = req.body;
      const subject = req.session.teacher.subject;

      // Create a new marks document
      const internalmarks = new MarksModel({
        usn: usn,
        test: test,
        marks: marks,
        subject: subject
      });

      // Save the document to the database
      await internalmarks.save();

      res.send(`Marks submitted for ${usn}: Test ${test} - ${marks}`);
    } else {
      res.redirect('/login_teacher');
    }
  } catch (error) {
    console.error("Error submitting marks:", error);
    res.status(500).send("Internal Server Error");
  }
});




//internal marks

app.get("/internalmarks", async (req,res)=>{
 
if(req.session.student)
  {
    const usn = req.session.student.usn
    const findusn = await MarksModel({usn})
    res.render('internal_marks',{findusn:findusn})
  }  
})

//post internal marks
app.post("/internals", async (req, res) => {
  try {
    if (req.session.student) {
      const test = req.body.test;
      const usn = req.session.student.usn;

      const findtest = await MarksModel.find({ usn, test });

      if (findtest.length > 0) {
        res.render('display_marks', { findtest });
      } else {
        res.send("Marks not uploaded");
      }
    } else {
      res.redirect('/login'); // Redirect to login if no session exists
    }
  } catch (error) {
    console.error("Error showing marks:", error);
    res.status(500).send("Internal server error");
  }
});


//question paper generator
app.get("/question-paper",  (req,res)=>{
  if(req.session.teacher)
  {
    res.render('question_paper')
  }
  else{
    res.send("Login to access")
  }
})


//adding notice
app.get("/add_notice",(req,res)=>{
  return res.render("add_notice")
})

// notice post request

app.post("/add_notice", async(req,res)=>{
  try{
    if(req.session.teacher){
      const teacher_name = req.session.teacher.teacher_name;
      const subject = req.body.subject;
      const notice = req.body.notice;
      const date = req.body.date;

      const notices = new NoticeModel({
        teacher_name:teacher_name,
        subject:subject,
        notice:notice,
        date:date

      })

      await notices.save();
      res.redirect("/ud_notice");
    }
    else{
      res.redirect('/login_teacher');
    }

  }
  catch(error)
  {
    res.send("Error in adding notice "+error);
  }
  
})



//notice display
app.get("/ud_notice",async(req,res)=>{
  try{
    if(req.session.teacher)
    {
      const teacher_name = req.session.teacher.teacher_name
      const find_notice = await NoticeModel.find({teacher_name})
      return res.render("ud_notice",{find_notice})
    }
    else{
      res.send("Login to update or delete notice");
    }
  }
  catch(error)
  {
    res.send("Error in accesing the url: "+error)
  }
})


//notice update

app.get("/update_notice/:id", async (req, res) => {
  try {
    if (req.session.teacher) {
      const noticeId = req.params.id;
      const notice = await NoticeModel.findById(noticeId);
      if (notice) {
        return res.render("update_notice", { notice });
      } else {
        res.send("Notice not found");
      }
    } else {
      res.send("Please log in to update notices.");
    }
  } catch (error) {
    res.send("Error accessing the page: " + error);
  }
});


app.post("/update_notice", async (req, res) => {
  try {


    const noticeId = req.body.id;
    const updatedNotice = {
      subject: req.body.subject,
      notice: req.body.notice,
    };
    await NoticeModel.findByIdAndUpdate(noticeId, updatedNotice);
    res.redirect("/ud_notice");
  } catch (error) {
    res.send(error);
  }
});

//deleting a notice

app.post("/delete_notice/:id", async (req, res) => {
  try {
    const noticeId = req.params.id;
    await NoticeModel.findByIdAndDelete(noticeId);
    res.redirect("/ud_notice");
  } catch (error) {
    res.send("Error deleting the notice: " + error);
  }
});
// view notice

app.get('/viewnotice', async (req, res) => {
  try {
      // Fetch all notices from the database
      const notices = await NoticeModel.find();

      // Render the viewnotice.ejs template with the notices data
      res.render('viewnotice', { notices: notices });
  } catch (err) {
      console.error(err);
      res.status(500).send('Internal Server Error');
  }
});
//upload notes
// Multer configuration for file upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
      cb(null, './uploads'); // Uploads folder (create if not exists)
  },
  filename: function (req, file, cb) {
      cb(null, file.originalname); // Keep original file name
  }
});
const upload = multer({ storage: storage });

// Route to handle file upload and form submission
app.post('/add_notes', upload.single('notesFile'), async (req, res) => {
    try {
        // Ensure teacher is logged in and retrieve teacher_name from session
        if (!req.session.teacher) {
            return res.status(401).send('Unauthorized');
        }

        const teacher_name = req.session.teacher.teacher_name;

        // Extract data from the request
        const { module } = req.body;
        const filePath = req.file.path;

        // Save to database using Mongoose model
        const newNote = new NotesModel({
            teacher_name,
            module,
            filePath
        });

        await newNote.save();

        // Redirect to the upload_notes page
        res.redirect('/upload_notes');
    } catch (err) {
        console.error(err);
        res.status(500).send('Internal Server Error');
    }
});

//get request
app.get('/upload_notes', async (req, res) => {
  try {
      // Ensure that the teacher is signed in
      if (!req.session.teacher) {
          return res.status(401).send('Unauthorized');
      }

      // Fetch notes uploaded by the signed-in teacher from the database
      const teacherName = req.session.teacher.teacher_name;
      const notes = await NotesModel.find({ teacher_name: teacherName });

      // Render the upload_notes.ejs template with notes data
      res.render('upload_notes', { notes: notes, teacher: req.session.teacher });
  } catch (err) {
      console.error(err);
      res.status(500).send('Internal Server Error');
  }
});

//adding assignment

const storage_assignment = multer.diskStorage({
  destination: function (req, file, cb) {
      cb(null, './uploadassignment'); // Uploads folder (create if not exists)
  },
  filename: function (req, file, cb) {
      cb(null, file.originalname); // Keep original file name
  }
});
const upload_assignment = multer({ storage: storage_assignment });

// Route to handle file upload and form submission
app.post('/add_assignment', upload_assignment.single('notesFile'), async (req, res) => {
    try {
        // Ensure teacher is logged in and retrieve teacher_name from session
        if (!req.session.teacher) {
            return res.status(401).send('Unauthorized');
        }

        const teacher_name = req.session.teacher.teacher_name;

        // Extract data from the request
        const { assignment } = req.body;
        const filePath = req.file.path;

        // Save to database using Mongoose model
        const newAssignment = new AssignmentModel({
            teacher_name,
            assignment,
            filePath
        })

        await newAssignment.save();

        // Redirect to the upload_assignment page
        res.redirect('/assignments');
    } catch (err) {
        console.error(err);
        res.status(500).send('Internal Server Error');
    }
});


app.get('/assignments', async (req, res) => {
  try {
      // Ensure that the teacher is signed in
      if (!req.session.teacher) {
          return res.status(401).send('Unauthorized');
      }

      // Fetch notes uploaded by the signed-in teacher from the database
      const teacherName = req.session.teacher.teacher_name;
      const assign = await AssignmentModel.find({ teacher_name: teacherName });

      // Render the upload_notes.ejs template with notes data
      res.render('add_assignments', { assign: assign, teacher: req.session.teacher });
  } catch (err) {
      console.error(err);
      res.status(500).send('Internal Server Error');
  }
});

//downloading of assignment

app.get('/download_assignment', async (req, res) => {
  try {
      const subjects = await TeacherModel.distinct('subject');
      res.render('download_assignment', { subjects, assignment: [] });
  } catch (error) {
      console.error('Error fetching subjects:', error);
      res.status(500).send('Internal Server Error');
  }
});

// Route to handle form submission and fetch notes based on selected subject
app.post('/download_assignment', async (req, res) => {
  try {
      const selectedSubject = req.body.subject;
      const subjects = await TeacherModel.distinct('subject'); // Fetch subjects again

      const teacher = await TeacherModel.findOne({ subject: selectedSubject });

      if (!teacher) {
          return res.render('download_notes', { subjects,assignment: [] });
      }

      const assignment = await AssignmentModel.find({ teacher_name: teacher.teacher_name });
      res.render('download_assignment', { subjects, assignment });
  } catch (error) {
      console.error('Error fetching notes:', error);
      res.status(500).send('Internal Server Error');
  }
});


//downloading of notes 
app.get('/download', async (req, res) => {
  try {
      const subjects = await TeacherModel.distinct('subject');
      res.render('download_notes', { subjects, notes: [] });
  } catch (error) {
      console.error('Error fetching subjects:', error);
      res.status(500).send('Internal Server Error');
  }
});

// Route to handle form submission and fetch notes based on selected subject
app.post('/download', async (req, res) => {
  try {
      const selectedSubject = req.body.subject;
      const subjects = await TeacherModel.distinct('subject'); // Fetch subjects again

      const teacher = await TeacherModel.findOne({ subject: selectedSubject });

      if (!teacher) {
          return res.render('download_notes', { subjects, notes: [] });
      }

      const notes = await NotesModel.find({ teacher_name: teacher.teacher_name });
      res.render('download_notes', { subjects, notes });
  } catch (error) {
      console.error('Error fetching notes:', error);
      res.status(500).send('Internal Server Error');
  }
});

app.get('/update_attendance', async (req, res) => {
  try {
      // Fetch all attendance records from MongoDB
      if(req.session.teacher)
      {
        const attendanceRecords = await AttendanceModel.find().lean().sort({usn:1});

        // Render update_attendance.ejs with attendanceRecords data
        res.render('update_attendance', { attendanceRecords });
      }
      else{
        res.send("please login")
      }
 
  } catch (err) {
      console.error('Error fetching attendance records:', err);
      res.status(500).send('Error fetching attendance records');
  }
});


app.post('/update_attendance', async (req, res) => {
  try {
      // Ensure teacher is logged in and retrieve teacher_name from session
      if (!req.session.teacher) {
          return res.status(401).send('Unauthorized');
      }

      const teacherName = req.session.teacher.teacher_name;

      // Find the teacher in TeacherModel to get the subject
      const teacher = await TeacherModel.findOne({ teacher_name: teacherName });
      if (!teacher) {
          return res.status(404).send('Teacher not found');
      }

      const subject = teacher.subject;

      // Extract data from the request
      const { usn, attended, totalClasses } = req.body;

      // Find the student in StudentModel using usn
      const student = await AttendanceModel.findOne({ usn });
      if (!student) {
          return res.status(404).send('Student not found');
      }

      // Create or update attendance record
      let attendanceRecord = await ClassAttendanceModel.findOne({ usn, subject });

      if (!attendanceRecord) {
          // Create new attendance record if not exists
          attendanceRecord = new ClassAttendanceModel({
              name: student.name,
              usn,
              subject,
              totalClasses,
              classesAttended: attended
          });
      } else {
          // Update existing attendance record
          attendanceRecord.totalClasses = totalClasses;
          attendanceRecord.classesAttended = attended;
      }

      // Save the attendance record
      await attendanceRecord.save();

      res.send('Attendance updated successfully');
  } catch (error) {
      console.error('Error updating attendance:', error);
      res.status(500).send('Internal Server Error');
  }
});

//showing attendance to student


app.get('/show_attendance', async (req, res) => {
  try {

    if(req.session.student)
    {
     const usn = req.session.student.usn // Assuming student session is stored

      const attendanceRecords = await ClassAttendanceModel.find({ usn: usn});

      res.render('show_attendance', { attendanceRecords });
    }
    else{
      res.send("Login first")
    }
     
     
  } catch (error) {
      console.error('Error fetching attendance:', error);
      res.status(500).send('Internal Server Error');
  }
});



app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});

