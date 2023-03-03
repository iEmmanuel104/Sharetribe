const express = require('express');
// const session = require('express-session');
const bodyParser = require('body-parser');
const db = require('./models');
const app = express();
const cors = require('cors');
// const csrf = require('csurf');
const xss = require('xss-clean');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const morgan = require('morgan');
require('dotenv').config();
const notFoundMiddleware = require('./app/middlewares/not-found.js');
const errorMiddleware = require('./app/middlewares/error-handler.js');
require('express-async-errors');
const uploadHandler = require('./app/middlewares/uploadHandler.js');
const env = process.env.NODE_ENV 



let whitelist = ['https://taximania-main.onrender.com', 'http://127.0.0.1:5500' ]

var corsOptions = {
    origin: (origin, callback) => {
        if (whitelist.indexOf(origin) !== -1) {
            callback(null, true)
        } else {
            callback(new Error('Not allowed by CORS'))
        }
    },
    optionsSuccessStatus: 200,
    credentials: true // add this line to enable credentials support
}

app.use(cors(corsOptions));
// app.use(cors())
app.use(morgan('dev'));
app.use(helmet());
app.use(xss());
app.use(mongoSanitize());
// app.use(csrf({ cookie: true}));
app.use(express.json());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
// app.use(session({
//     secret: process.env.SESSION_SECRET,
//     resave: false,
//     saveUninitialized: true,
//     cookie: { secure: false }
//     // cookie: {
//     //     httpOnly: true, // Set the cookie to be HTTP-only to prevent client-side access
//     //     secure: true, // Set the cookie to be sent over HTTPS only
//     // },
// }));

// Test the db connection
db.sequelize.authenticate()  
    .then(() => {
        console.log('postgres connection has been established successfully.' + env );
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
const bookings = require('./app/routes/bookingsRoute.js');
const payments = require('./app/routes/paymentsRoute.js');
const adminauth = require('./app/routes/admin/adminauthRoute.js');
const adminactions = require('./app/routes/admin/adminActionRoutes.js');

app.use('/api/v1/auth', authRoute);
app.use('/api/v1/host', host);
app.use('/api/v1/vehicle', vehicle);
app.use('/api/v1/bookings', bookings);
app.use('/api/v1/payments', payments);
app.use('/api/v1/admin_auth', adminauth);
app.use('/api/v1/admin_actions', adminactions);


app.use(notFoundMiddleware);
app.use(errorMiddleware);
app.use((req, res, next) => {
    res.status(404).json({
        status: 'fail',
        message: `Can't find ${req.originalUrl} on this server!`,
    });
});
app.use(uploadHandler);

    
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