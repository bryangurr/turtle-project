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
    knex('pokemon')
      .join('poke_type', 'pokemon.poke_type_id', '=', 'poke_type.id')
      .select(
        'pokemon.id',
        'pokemon.description',
        'pokemon.base_total',
        'pokemon.date_created',
        'pokemon.active_poke',
        'pokemon.gender',
        'pokemon.poke_type_id',
        'poke_type.description as poke_type_description'
      )
      .then(pokemon => {
        // Render the index.ejs template and pass the data
        res.render('index', { pokemon });
      })
      // copy and paste error catching for the test
      .catch(error => {
        console.error('Error querying database:', error);
        res.status(500).send('Internal Server Error');
      });
  });

// should always come last
app.listen(port, () => console.log("Server is listening..."));