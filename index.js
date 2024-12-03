let express = require("express");

let app = express();

let path = require("path");

const bodyParser = require('body-parser');
const stripe = require('stripe')('sk_test_51QRlsmAe0EglwwiJYbVjdKmn1KRcMSeorCaWrNKRYiB1T0kQslBg6ocayIqDhZQIXnami5kdKLV4miC1DlZYfhLr00hCkegHWZ');


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
      database: process.env.RDS_DB_NAME || "ebdb",
      port: process.env.RDS_PORT || 5432,
      ssl: process.env.DB_SSL ? { rejectUnauthorized: false } : false
    }
});

app.get('/donate', (req, res) => {
  res.render('donate');
});

app.post('/pay', async (req, res) => {
  const { payment_method_id, amount } = req.body;

  if (!payment_method_id || !amount || amount <= 0) {
      return res.status(400).json({ error: 'Invalid payment details.' });
  }

  try {
      // Create a Payment Intent
      const paymentIntent = await stripe.paymentIntents.create({
          amount, // Amount in cents
          currency: 'usd',
          payment_method: payment_method_id,
          confirmation_method: 'manual',
          confirm: true,
      });

      // Send a success response
      res.json({ success: true, client_secret: paymentIntent.client_secret });
  } catch (err) {
      console.error('Error processing payment:', err.message);
      res.status(500).json({ error: err.message });
  }
});


// Route to display Pokemon records (root)
app.get('/', (req, res) => {
  res.render('home');
});

app.get('/about', (req, res) => {
  res.render('about');
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

app.post('/schedule_event', (req, res) =>{
  knex('events').insert({
    Event_Date : req.body.eventDate,
    Address : req.body.eventAddress,
    Event_City : req.body.eventCity,
    Event_State : req.body.eventState,
    Start_Time : req.body.startTime,
    Run_Time : req.body.duration,
    Num_Attendees : req.body.numberOfAttendees,
    Sewing_Non : req.body.eventType,
    Coordinator_First_Name : req.body.firstName,
    Coordinator_Last_Name : req.body.lastName,
    Coordinator_Phone : req.body.phoneNumber,
    Coordinator_Secondary_Phone : req.body.secondaryPhone,
    Share_Story : req.body.shareStory
  })
  .then(() =>{
    res.redirect('/')
  })
  .catch(err => {
    console.error('Error adding event:', err);
  })
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

app.get('/manage_events', (req, res) => {
  knex('events').select().orderBy('Event_Date', 'desc')
  .then((events) => {
    res.render('manage_events', {events : events});
  })

});

app.get('/edit_event', (req, res) => {
  res.render('edit_event');
});

app.get('/create_event', (req, rew) => {
  res.render('create_event');
});

app.get('/report_event', (req, res) => {
  res.render('report_event');
});

app.post('/report_event/:id', (req, res) => {
  //const id = req.params.id;
  //knex('events').update({
    //actual event stats
//}).where('id', id)
})

app.get('/edit_volunteer/:id', (req, res) => {
  const { id } = req.params;

  knex('volunteers')
    .where({ id })
    .first()
    .then(volunteer => {
      if (volunteer) {
        res.render('edit_volunteer', { volunteer });
      } else {
        res.status(404).send('Volunteer not found');
      }
    })
    .catch(err => {
      console.error('Error fetching volunteer:', err);
      res.status(500).send('Error retrieving volunteer information');
    });
});


app.post('/edit_volunteer/:id', (req, res) => {
  const { id } = req.params;
  const { firstName, lastName, phone, email, availableHours, hearAboutUs, sewingLevel } = req.body;

  knex('volunteers')
    .where({ id })
    .update({
      firstname: firstName,
      lastname: lastName,
      phone,
      email,
      hours: availableHours,
      hearaboutus: hearAboutUs,
      sewinglevel: sewingLevel
    })
    .then(() => {
      res.redirect('/manage_volunteers'); // Redirect to the manage volunteers page
    })
    .catch(err => {
      console.error('Error updating volunteer:', err);
      res.status(500).send('Error updating volunteer information');
    });
});

app.get('/edit_event/:id', (req, res) => {
  const { id } = req.params;

  knex('events')
    .where({ id })
    .first()
    .then(event => {
      if (event) {
        res.render('edit_event', { event });
      } else {
        res.status(404).send('Event not found');
      }
    })
    .catch(err => {
      console.error('Error fetching event:', err);
      res.status(500).send('Error retrieving event information');
    });
});

app.post('/edit_event/:id', (req, res) => {
  const { id } = req.params;
  const { eventDate, eventAddress, eventCity, eventState, startTime, duration, numberOfAttendees, eventType, firstName, lastName, phoneNumber, secondaryPhone, shareStory } = req.body;

  knex('events')
    .where({ id })
    .update({
      event_date: eventDate, event_address: eventAddress, event_city: eventCity,
      event_state: eventState, start_time: startTime, run_time: duration,
      num_attendees: numberOfAttendees, sewing_non: eventType, 
      coordinator_first_name: firstName, coordinator_last_name: lastName,
      coordinator_phone: phoneNumber, coordinator_secondary_phone: secondaryPhone,
      share_story: shareStory ? true : false
    })
    .then(() => {
      res.redirect('/manage_events'); // Redirect to manage events page
    })
    .catch(err => {
      console.error('Error updating event:', err);
      res.status(500).send('Error updating event information');
    });
});




// should always come last
app.listen(port, () => console.log(`Server is running at http://localhost:${port}`)); // Start listening