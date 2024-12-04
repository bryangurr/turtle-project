// Import necessary libraries

let express = require("express");

let app = express();

let path = require("path");

require("dotenv").config();

// Declare environmental variables
const bodyParser = require("body-parser");
const stripe = require("stripe")(
  "sk_test_51QRlsmAe0EglwwiJYbVjdKmn1KRcMSeorCaWrNKRYiB1T0kQslBg6ocayIqDhZQIXnami5kdKLV4miC1DlZYfhLr00hCkegHWZ"
);
const port = process.env.PORT || 5003;

// adding security to login page and authentication
const session = require("express-session");

// Configure session middleware
app.use(
  session({
    secret: "fortnite", // Replace with a strong secret key
    resave: false, // Prevents session being saved on every request if unmodified
    saveUninitialized: false, // Only saves sessions when initialized
    cookie: { secure: false }, // Set to true if using HTTPS
  })
);

// Authentication middleware
function isAuthenticated(req, res, next) {
  if (req.session.user) {
    return next(); // User is authenticated, proceed
  }
  res.redirect("/login"); // Redirect to login if not authenticated
}

//connect to the database

const knex = require("knex")({
  client: "pg",
  connection: {
    host: process.env.RDS_HOSTNAME || "localhost",
    user: process.env.RDS_USERNAME || "postgres",
    password: process.env.RDS_PASSWORD || "Winter12!",
    password: process.env.RDS_PASSWORD || "Never1:3",
    database: process.env.RDS_DB_NAME || "turtletest",
    port: process.env.RDS_PORT || 5432,
    ssl: process.env.DB_SSL ? { rejectUnauthorized: false } : false,
  },
  debug: true,
});

// Setup app to serve static files ejs, css, and image files
app.set("view engine", "ejs");

app.set("views", path.join(__dirname, "views"));

app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "styles")));
app.use("/images", express.static(path.join(__dirname, "images")));

/* ---------------------------------------------------------------------- */
// Application routes

// Home route (root)
app.get("/", (req, res) => {
  res.render("home");
});

// Donation routes
app.get("/donate", (req, res) => {
  res.render("donate");
});

app.post("/pay", async (req, res) => {
  const { payment_method_id, amount } = req.body;

  if (!payment_method_id || !amount || amount <= 0) {
    return res.status(400).json({ error: "Invalid payment details." });
  }

  try {
    // Create a Payment Intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount, // Amount in cents
      currency: "usd",
      payment_method: payment_method_id,
      confirmation_method: "manual",
      confirm: true,
    });

    // Send a success response
    res.json({ success: true, client_secret: paymentIntent.client_secret });
  } catch (err) {
    console.error("Error processing payment:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// About and other info routes

app.get("/about", (req, res) => {
  res.render("about");
});

app.get("/jens_story", (req, res) => {
  res.render("jens_story");
});

app.get("/sponsors", (req, res) => {
  res.render("sponsors");
});

/* ---------------------------------------------------------------------- */
// Login routes

app.get("/login", (req, res) => {
  res.render("login");
});

// POST route to handle login
app.post("/login", (req, res) => {
  const { username, password } = req.body; // Extract username and password

  // Query the database for the user
  knex("admin") // Replace 'admin' with your table name if different
    .where({ username }) // Check if username exists
    .first() // Fetch the first matching record
    .then((admin) => {
      if (!admin) {
        // No matching username found
        console.error("Invalid username");
        return res.status(401).send("Invalid username or password.");
      }

      // Compare the entered plain-text password with the stored password
      if (password === admin.password) {
        console.log("Login successful:", username);

        // Store user info in the session
        req.session.user = { username: admin.username };

        // Redirect to a protected page
        res.redirect("/employee_home");
      } else {
        console.error("Invalid password");
        res.status(401).send("Invalid username or password.");
      }
    })
    .catch((err) => {
      console.error("Error during login:", err);
      res.status(500).send("Internal server error.");
    });
});

app.post("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error("Error during logout:", err);
      return res.status(500).send("Error during logout.");
    }
    res.redirect("/"); // Redirect to home page after logout
  });
});

/*----------------------------------------------------------------------- */
// FORMS

// VOLUNTEERS
// Public facing volunteer form
app.get("/volunteer", (req, res) => {
  res.render("volunteer");
});

// Volunteer Management
app.get("/manage_volunteers", isAuthenticated, (req, res) => {
  knex("volunteers")
    .select()
    .then((volunteers) => {
      res.render("manage_volunteers", { user: req.session.user, volunteers });
    })
    .catch((err) => {
      console.error("Error fetching volunteers:", err);
      res.status(500).send("Internal server error.");
    });
});

// Create volunteer
app.post("/addVolunteer", (req, res) => {
  const vol_first_name = req.body.vol_first_name;
  const vol_last_name = req.body.vol_last_name;
  const phone = req.body.phone;
  const email = req.body.email;
  const est_vol_hours = req.body.num_vol_hours;
  const how_did_you_hear_id = req.body.how_did_you_hear_id;
  const sewing_level = req.body.sewing_level;
  const city = req.body.city;
  const state = req.body.state;
  const vol_address = req.body.vol_address;
  const teach_sewing = req.body.teach_sewing === "true";
  const lead_event = req.body.lead_event === "true";
  knex("volunteers")
    .insert({
      vol_first_name: vol_first_name,
      vol_last_name: vol_last_name,
      phone: phone,
      email: email,
      est_vol_hours: est_vol_hours,
      how_did_you_hear_id: how_did_you_hear_id,
      sewing_level: sewing_level,
      city: city,
      state: state,
      vol_address: vol_address,
      teach_sewing: teach_sewing,
      lead_event: lead_event,
    })
    .then(() => {
      res.redirect("/");
    })
    .catch((err) => {
      console.error("Error inserting record:", err);
    });
});

// Edit volunteer page
app.get("/edit_volunteer/:id", isAuthenticated, (req, res) => {
  const { id } = req.params;

  knex("volunteers")
    .where({ id })
    .first()
    .then((volunteer) => {
      if (!volunteer) {
        return res.status(404).send("Volunteer not found");
      }

      // Fetch data from the 'sewing_level' table
      knex("sewing_level")
        .select()
        .then((sewing_level) => {
          // Fetch data from the 'how_did_you_hear' table
          knex("how_did_you_hear")
            .select()
            .then((how_did_you_hear) => {
              // Render the page with all the fetched data
              res.render("edit_volunteer", {
                volunteer,
                sewing_level,
                how_did_you_hear,
                user: req.session.user,
              });
            })
            .catch((err) => {
              console.error('Error fetching "how_did_you_hear" data:', err);
              res
                .status(500)
                .send('Error retrieving "How Did You Hear" information');
            });
        })
        .catch((err) => {
          console.error("Error fetching sewing levels:", err);
          res.status(500).send("Error retrieving sewing level information");
        });
    })
    .catch((error) => {
      console.error("Error fetching volunteer:", error);
      res.status(500).send("Error retrieving volunteer information");
    });
});

// Save changes to volunteer
app.post("/edit_volunteer/:id", (req, res) => {
  const { id } = req.params;
  const vol_first_name = req.body.vol_first_name;
  const vol_last_name = req.body.vol_last_name;
  const phone = req.body.phone;
  const email = req.body.email;
  const vol_address = req.body.vol_address;
  const state = req.body.state;
  const city = req.body.city;
  const est_vol_hours = req.body.num_vol_hours;
  const how_did_you_hear_id = req.body.how_did_you_hear_id;
  const sewing_level = req.body.sewing_level;
  const teach_sewing = req.body.teach_sewing === "true";
  const lead_event = req.body.lead_event === "true";

  console.log(req.body);

  knex("volunteers")
    .where({ id })
    .first()
    .update({
      vol_first_name: vol_first_name,
      vol_last_name: vol_last_name,
      phone: phone,
      email: email,
      vol_address: vol_address,
      state: state,
      city: city,
      est_vol_hours: parseInt(est_vol_hours),
      how_did_you_hear_id: how_did_you_hear_id,
      sewing_level: sewing_level,
      teach_sewing: teach_sewing,
      lead_event: lead_event,
    })
    .then(() => {
      res.redirect("/manage_volunteers"); // Redirect to the manage volunteers page
    })
    .catch((err) => {
      console.error("Error updating volunteer:", err);
      //res.status(500).send('Error updating volunteer information');
    });
});

// Delete a volunteer from the database
app.post("/delete_volunteer/:id", (req, res) => {
  const id = req.params.id;

  knex("volunteers")
    .where("id", id)
    .delete()
    .then(() => {
      res.redirect("/manage_volunteers");
    })
    .catch((err) => {
      console.error("Error deleting volunteer:", err);
      res.status(500).send("Error updating volunteer information");
    });
});

// EMPLOYEES

// Protected employee routes
app.get("/employee_home", isAuthenticated, (req, res) => {
  res.render("employee_home", { user: req.session.user });
});

app.get("/manage_employees", isAuthenticated, (req, res) => {
  knex("admin")
    .leftJoin("volunteers", "admin.username", "=", "volunteers.email")
    .select(
      "admin.id as id",
      "admin.username as username",
      "volunteers.vol_first_name as first_name",
      "volunteers.vol_last_name as last_name",
      "volunteers.phone as phone"
    )
    .then((admins) => {
      res.render("manage_employees", { admins, user: req.session.user });
    })
    .catch((error) => {
      console.error("Error querying database:", error);
      res.status(500).send("Internal Server Error");
    });
});

app.get("/edit_employee/:id", isAuthenticated, (req, res) => {
  const id = req.params.id;
  knex("admin")
    .where("admin.id", id)
    .leftJoin("volunteers", "admin.username", "=", "volunteers.email")
    .select(
      "admin.id as id",
      "admin.username as username",
      "admin.password as password",
      "volunteers.vol_first_name as first_name",
      "volunteers.vol_last_name as last_name",
      "volunteers.phone as phone"
    )
    .first()
    .then((admin) => {
      if (admin) {
        res.render("edit_employee", { user: req.session.user, admin });
      } else {
        res.status(404).send("Employee not found");
      }
    })
    .catch((err) => {
      console.error("Error fetching employee:", err);
      res.status(500).send("Internal server error.");
    });
});

app.post("/edit_employee/:id", async (req, res) => {
  const id = req.params.id;
  const { username, password, phone, first_name, last_name, old_email } =
    req.body;

  try {
    // Update `admin` table
    await knex("admin").where("id", id).update({
      username,
      password,
    });

    // Update `volunteers` table
    await knex("volunteers")
      .where("email", old_email) // Assuming email in `volunteers` is the join condition
      .update({
        email: username,
        vol_first_name: first_name,
        vol_last_name: last_name,
        phone,
      });

    res.redirect("/manage_employees");
  } catch (error) {
    console.error("Error updating employee:", error);
    res.status(500).send("Internal Server Error");
  }
});

app.get("/create_employee", isAuthenticated, (req, res) => {
  res.render("create_employee", { user: req.session.user });
});

app.post("/create_employee", (req, res) => {
  const username = req.body.username;
  const password = req.body.password;
  knex("admin")
    .insert({
      username: username,
      password: password,
    })
    .then(() => {
      res.redirect("/manage_employees");
    })
    .catch((error) => {
      console.error("Error querying database:", error);
      res.status(500).send("Internal Server Error");
    });
  knex("admin")
    .insert({
      username: username,
      password: password,
    })
    .then(() => {
      res.redirect("/manage_employees");
    })
    .catch((error) => {
      console.error("Error creating employee:", error);
      res.status(500).send("Internal Server Error");
    });
});

// EVENTS

// Event Management
app.get("/manage_events", isAuthenticated, (req, res) => {
  knex("event")
    .select()
    .orderBy("event_date")
    .then((events) => {
      res.render("manage_events", { user: req.session.user, events });
    })
    .catch((err) => {
      console.error("Error fetching events:", err);
      res.status(500).send("Internal server error.");
    });
});

app.get("/schedule_event", (req, res) => {
  res.render("schedule_event");
});

app.post("/schedule_event", (req, res) => {
  knex("event")
    .insert({
      Event_Date: req.body.eventDate,
      Address: req.body.eventAddress,
      Event_City: req.body.eventCity,
      Event_State: req.body.eventState,
      Start_Time: req.body.startTime,
      Run_Time: req.body.duration,
      Num_Attendees: req.body.numberOfAttendees,
      Sewing_Non: req.body.eventType,
      Coordinator_First_Name: req.body.firstName,
      Coordinator_Last_Name: req.body.lastName,
      Coordinator_Phone: req.body.phoneNumber,
      Coordinator_Secondary_Phone: req.body.secondaryPhone,
      Share_Story: req.body.shareStory,
    })
    .then(() => {
      res.redirect("/");
    })
    .catch((err) => {
      console.error("Error adding event:", err);
    });
});

app.get("/edit_event/:id", isAuthenticated, (req, res) => {
  knex("event")
    .where({ id: req.params.id })
    .first()
    .then((event) => {
      if (event) {
        res.render("edit_event", { user: req.session.user, event });
      } else {
        res.status(404).send("Event not found");
      }
    })
    .catch((err) => {
      console.error("Error fetching event:", err);
      res.status(500).send("Internal server error.");
    });
});

app.post("/edit_event/:id", (req, res) => {
  const { id } = req.params;
  const {
    event_date,
    address,
    event_city,
    event_state,
    start_time,
    event_duration,
    child_participants,
    adult_participants,
    sewing_non,
    coordinator_first_name,
    coordinator_last_name,
    coordinator_phone,
    coordinator_secondary_phone,
    share_story,
  } = req.body;

  knex("event")
    .where({ id })
    .update({
      event_date: event_date,
      address: address,
      event_city: event_city,
      event_state: event_state,
      start_time: start_time,
      event_duration: event_duration,
      child_participants: child_participants,
      adult_participants: adult_participants,
      sewing_non: sewing_non,
      coordinator_first_name: coordinator_first_name,
      coordinator_last_name: coordinator_last_name,
      coordinator_phone: coordinator_phone,
      coordinator_secondary_phone: coordinator_secondary_phone,
      share_story: share_story ? true : false,
    })
    .then(() => {
      res.redirect("/manage_events"); // Redirect to manage events page
    })
    .catch((err) => {
      console.error("Error updating event:", err);
      res.status(500).send("Error updating event information");
    });
});

// Event Reporting
app.get("/report_event/:id", isAuthenticated, (req, res) => {
  knex("event")
    .where({ id: req.params.id })
    .first()
    .then((event) => {
      if (event) {
        res.render("report_event", { user: req.session.user, event });
      } else {
        res.status(404).send("Event not found");
      }
    })
    .catch((err) => {
      console.error("Error fetching event:", err);
      res.status(500).send("Internal server error.");
    });
});

app.post("/report_event/:id", (req, res) => {
  //const id = req.params.id;
  //knex('events').update({
  //actual event stats
  //}).where('id', id)
});

// should always come last
app.listen(port, () =>
  console.log(`Server is running at http://localhost:${port}`)
);
