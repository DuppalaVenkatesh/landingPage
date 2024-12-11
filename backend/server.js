const express = require("express");
const path = require("path");
const bodyParser = require('body-parser');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');


const {open} = require("sqlite");
const sqlite3 = require("sqlite3")
const app = express()
app.use(cors());
app.use(bodyParser.json());
app.use(express.json())

const port = process.env.PORT || 5000;

const dbpath = path.join(__dirname,"landingPage.db");
let db = null;


const intializeDBAndServer = async () => {
    try{
        db = await open(
            {
                filename:dbpath,
                driver:sqlite3.Database,
            }
        )
        app.listen(port, () => {
            console.log("Server running at port number 5000");
        })
    }
    catch(e){
        console.log(e.message);
        process.exit(1);
    }
}

intializeDBAndServer()

// API Endpoint: /userRegister
app.post("/userRegister", async (request, response) => {
    try {
      const { username, password, email, currentLocation } = request.body;
      const hashedPassword = await bcrypt.hash(password, 10);

      const selectUserQuery = `SELECT * FROM users WHERE email = ?`;
      const dbUser = await db.get(selectUserQuery, [email]);
  
      if (!dbUser) {
        const createUserQuery = `
          INSERT INTO users (username, email, password, location)
          VALUES (?, ?, ?, ?)
        `;
        const dbResponse = await db.run(createUserQuery, [
          username,
          email,
          hashedPassword,
          currentLocation,
        ]);
  
        response.status(201).json({
          message: `Created new user with ID ${dbResponse.lastID}`,
        });
      } else {
        response.status(400).json({ message: "User already exists" });
      }
    } catch (error) {
      console.error(error);
      response.status(500).json({ message: "Internal server error" });
    }
  });
  
//Technician Register

app.post("/technicianRegister", async (request, response) => {
  try {
    const { technician_id, name, email, password, photo, specialization, rating, description,location} = request.body;
    const hashedPassword = await bcrypt.hash(password, 10);

    const selectUserQuery = `SELECT * FROM users WHERE email = ?`;
    const dbUser = await db.get(selectUserQuery, [email]);
    if (!dbUser) {
      const createUserQuery = `
        INSERT INTO technicians (technician_id, name, email, password, photo, specialization, rating, description,location)
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?,?)
      `;
      const dbResponse = await db.run(createUserQuery, [technician_id, name, email, hashedPassword, photo || null, specialization, rating, description,location]);

      response.status(201).json({
        message: `Created new user with ID ${dbResponse.lastID}`,
      });
    } else {
      response.status(400).json({ message: "User already exists" });
    }
  } catch (error) {
    console.error(error);
    response.status(500).json({ message: "Internal server error" });
  }
});

//User Login 
app.post('/userLogin', async (req, res) => {
  const { email, password } = req.body;

  const selectUserQuery = `SELECT * FROM users WHERE email = '${email}'`;
  const user = await db.get(selectUserQuery);

  if (user === undefined) {
    return res.status(400).json({ error: 'User does not exist' });
  }

  const isPasswordMatch = await bcrypt.compare(password, user.password);

  if (!isPasswordMatch) {
    return res.status(400).json({ error: 'Password doesn’t match' });
  }

  const jwtToken = jwt.sign({ email: user.email }, 'landing_page', { expiresIn: '1h' });
  res.json({ jwtToken });
});

//Technician Login 
app.post('/technicianLogin', async (req, res) => {
  const { email, password } = req.body;

  const selectUserQuery = `SELECT * FROM technicians WHERE email = '${email}'`;
  const user = await db.get(selectUserQuery);

  if (user === undefined) {
    return res.status(400).json({ error: 'Technician does not exist' });
  }

  const isPasswordMatch = await bcrypt.compare(password, user.password);

  if (!isPasswordMatch) {
    return res.status(400).json({ error: 'Password doesn’t match' });
  }

  const jwtToken = jwt.sign({ email: user.email }, 'landing_page', { expiresIn: '30days' });

  res.json({ jwtToken });
});

//get locations data 

app.get("/locations", async (req,res) => {
    const query = `
      SELECT 
        DISTINCT location 
      FROM 
        technicians;
    `
    const rows = await db.all(query);
    const locations = rows.map(row => row.location);
    return res.json(locations)
})

//get appliance details
app.get("/appliances", async (req,res) => {
  const query = `
    SELECT 
      DISTINCT appliance_name 
    FROM 
      appliances;
  `
  const rows = await db.all(query);
  const appliance = rows.map(row => row.appliance_name);
  return res.json(appliance)
})
