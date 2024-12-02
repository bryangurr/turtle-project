let express = require("express");

let app = express();

let path = require("path");

const port = 5000;

app.set("view engine", "ejs");

app.set("views", path.join(__dirname, "views"));

app.use(express.urlencoded({extended: true}));

//connect to the database

// const knex = require("knex") ({
//     client : "pg",
//     connection : {
//         host : "",
//         user : "",
//         password : "",
//         database : "",
//         port : 5432
//     }
// });

// Route to display Pokemon records (root)
app.get('/', (req, res) => {
  res.render('home');
});

// should always come last
app.listen(port, () => console.log(`Server is running at http://localhost:${port}`)); // Start listening