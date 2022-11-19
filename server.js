const express = require('express');
const bodyParser = require('body-parser');
const db = require('./models');
const app = express();
const cors = require('cors');
const morgan = require('morgan');
require('dotenv').config();
const notFoundMiddleware = require('./app/middlewares/not-found.js');
const errorMiddleware = require('./app/middlewares/error-handler.js');

// const corsOptions ={
//     origin:'http://127.0.0.1:5000', 
//     credentials:true,            //access-control-allow-credentials:true
//     optionSuccessStatus:200
// }


// app.use(cors(corsOptions));
// app.use(morgan('dev'));
// app.use(express.json());
// app.use((req, res, next) => {
//     const allowedOrigins = ["https://iemmanuel104.github.io", "http://127.0.0.1:5000"];
//     const origin = req.headers.origin;
//     if (allowedOrigins.includes(origin)) {
//         res.setHeader('Access-Control-Allow-Origin', origin);
//     }

//     res.header('Access-Control-Allow-Methods', 'GET, OPTIONS, POST');
//     res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
//     res.header('Access-Control-Allow-Credentials', true);

//     next();
// });
app.use(cors());
app.use(morgan('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Test the db connection
db.sequelize.authenticate()  
    .then(() => {
        console.log('postgres connection has been established successfully.');
    })
    .catch(err => {
        console.error('Unable to connect to the database:', err);
    });

   
// simple route
app.get("/", (req, res) => {
    res.json({ message: "Welcome to SHARETRIBE application." });
    });

// routes
const authRoute = require('./app/routes/authRoute.js');
const host = require('./app/routes/hostRoute.js');
const vehicle = require('./app/routes/vehicleRoute.js');

app.use('/api/v1/auth', authRoute);
app.use('/api/v1/host', host);
app.use('/api/v1/vehicle', vehicle);


app.use(notFoundMiddleware);
app.use(errorMiddleware);

const PORT = process.env.PORT || 8081;

// sdding {force: true} will drop the table if it already exists
db.sequelize.sync().then(() => {
    console.log('Dropped all tables: All models were synchronized successfully');
    // set port, listen for requests
    app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}........`);
        }
    );
});