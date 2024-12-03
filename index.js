let express = require("express");

let app = express();

let path = require("path");

let authenticated = false;

const port = process.env.PORT || 5000;

app.set("view engine", "ejs");

app.set("views", path.join(__dirname, "views"));

app.use(express.urlencoded({extended: true}));

//connect to the database

const knex = require("knex") ({
  client: "pg",
  connection: {
      host: process.env.RDS_HOSTNAME || "localhost",
      user: process.env.RDS_USERNAME || "postgres",
      password: process.env.RDS_PASSWORD || "password",
      database: process.env.RDS_DB_NAME || "TurtleShelterProject",
      port: process.env.RDS_PORT || 5432,
      ssl: process.env.DB_SSL ? { rejectUnauthorized: false } : false
    }
});

// Route to display Pokemon records (root)
app.get('/', (req, res) => {
  res.render('home');
});

app.get('/about', (req, res) => {
  res.render('about');
});

app.get('/donate', (req, res) => {
  res.render('donate');
});

app.get('/jens_story', (req, res) => {
  res.render('jens_story');
});

app.get('/sponsors', (req, res) => {
  res.render('sponsors');
});

app.get('/volunteer', (req, res) => {
  res.render('volunteer');
});

app.post('/addVolunteer', (req, res) => {
    //add record to volunteer table
    knex('volunteers').insert({
    // REPLACE WITH ACTUAL COLUMN NAMES
    firstname : req.body.firstName,
    lastname : req.body.lastName,
    phone : req.body.phone,
    email : req.body.email,
    hours : req.body.availableHours,
    hearaboutus : req.body.hearAboutUs,
    sewinglevel : req.body.sewingLevel})
    .then(() => {
        res.redirect('/')
    })
    .catch(err => {
        console.error('Error inserting record:', err);
      })
});

app.get('/schedule_event', (req, res) => {
  res.render('schedule_event');
});

app.get('/login', (req, res) => {
  res.render('login');
});

app.get('/employee_home', (req, res) => {
  res.render('employee_home');
});

app.get('/manage_employees', (req, res) => {
  res.render('manage_employees');
});

app.get('/create_employee', (req, res) => {
  res.render('create_employee');
});

app.get('/edit_employee', (req, res) => {
  res.render('edit_employee');
});

app.get('/manage_volunteers', (req, res) => {
  res.render('manage_volunteers');
});

app.get('/edit_volunteer', (req, res) => {
  res.render('edit_volunteer');
});

app.get('manage_events', (req, res) => {
  res.render('manage_events');
});

app.get('edit_event', (req, res) => {
  res.render('edit_event');
});

app.get('create_event', (req, rew) => {
  res.render('create_event');
});

app.get('report_event', (req, res) => {
  res.render('report_event');
});




// should always come last
app.listen(port, () => console.log(`Server is running at http://localhost:${port}`)); // Start listening