// ==========
// BASE SETUP
// ==========

// *****************
// CALL THE PACKAGES
// *****************
var express     = require('express'); // Call express
var app         = express(); // Definde our app using express
var bodyParser  = require('body-parser'); // Get body-parser
var morgan      = require('morgan'); // Used to see requests
var mongoose    = require('mongoose'); // For workingw/ our database
var port        = process.env.PORT || 1337; // Set the port for out app
var User        = require('./app/models/user');
var mongoDB     = require('mongodb');
var ObjectId    = mongoDB.ObjectID;
var jwt         = require('jsonwebtoken');
var superSecret = 'mynameissuneet';

// *****************
// APP CONFIGURATION
// *****************

// Connect to our database
mongoose.connect('mongodb://localhost:27017/api')

// Use body parser so we can grab information from POST requests
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());

// Configure our app to handle CORS requests
app.use(function(req, res, next) {
	res.setHeader('Access-Control-Allow-Origin', '*');
	res.setHeader('Access-Control-Allow-Methods', 'GET, POST');
	res.setHeader('Access-Control-Allow-Header', 'X-Requested-With, content-type, Authorization');
	next();	
});

// Log all requests to the console
app.use(morgan('dev'));

// ==================
// ROUTER FOR OUR API
// ==================

// Basic route for the home page
app.get('/', function(req, res) {
	res.send('Welcome to the home page');
});

// Get an instance of the express router
var apiRouter = express.Router();

// Route for authenticating users
apiRouter.post('/authenticate', function(req, res) {
	// Find the user
	// Select the name username and password explicitly
	User.findOne({ username: req.body.username })
	.select('name username password')
	.exec(function(err, user) {
		if (err) {
			throw err;
		}
		// No user with that username was found
		if (!user) {
			res.json({
				success: false,
				message: 'Authentication failed. User not found.'
			});
		} else if (user) {
			// Check if password matches
			var validPassword = user.comparePassword(req.body.password);
			if (!validPassword) {
				res.json({
					success: false,
					message: 'Authentication failed. Wrong password.'
				});
			} else {
				// If user is found and password is right then create a token
				var token = jwt.sign({
					name: user.name,
					username: user.username
				}, superSecret, {
					expireInMinutes: 1440 // Expire in 24 hpurs
				});
				res.json({
					success: true,
					message: 'Enjoy your token',
					token: token
				});
			}
		}
	});
});

// Middleware to use for all requests
apiRouter.use(function(req, res, next) {
	console.log('Somebody just came to our api!');
	// Make sure we go to the next routes and don't stop here

	// Route middleware to verify a token
	// Check header or irl parameters or post parameters for token
	var token = req.body.token || req.param('token') || req.headers['x-access-token'];

	// Decode token
	if (token) {
		// Verify secret and checks exp
		jwt.verify(token, superSecret, function(err, decoded) {
			if (err) {
				return res.status(403).send({
					success: false,
					message: 'Failed to authenticate token.'
				});
			} else {
				// If everything is good, save to request for use in other routes
				req.decoded = decoded;
				next();
			}
		});
	} else {
		// If thete is no token, return an HTTP response of 403 (access forbidden) and an error message
		return res.status(403).send({
			success: false,
			message: 'No token provided.'
		});
	}
	// next(); // Used to be here
});

// Test route to make sure everything is working
// Accessed at GET http://localhost:1337/api
apiRouter.get('/', function(req, res) {
	res.json({ message: 'Hooray!! Welcome to out API!!' });
});

// On routes that end in /user
apiRouter.route('/users')
	// Create a user (accessed at POST http://localhost:1337/api/users)
	.post(function(req, res) {
		// Create a new instance of the User model
		var user = new User();

		// Set the users information (comes from the request)
		user.name = req.body.name;
		user.username = req.body.username;
		user.password = req.body.password;

		// Save the user and check for errors
		user.save(function(err) {
			if (err) {
				// Duplicate entry
				if (err.code == 11000) {
					return res.json({ success: false, message: 'A user with same username already exists.' });
				}
				else {
					return res.send(err);
				}
			}
			res.json({ message: 'User created!' });
		});		
	})
	// Get all the users (accessed at GET http://localhost:1337/api/users)
	.get(function(req, res) {
		User.find(function(err, users) {
			if (err) {
				res.send(err);
			}
			res.json(users);
		});
	});

apiRouter.route('/users/:user_id')
	// Get the user with that id (accessed at GET http://localhost:1337/api/users/:user_id)
	.get(function(req, res) {
		console.log(req);		
		User.findOne({ "_id": ObjectId(req.params.user_id) }, function(err, user) {
			if (err) {
				res.send(err);
			}
			res.json(user);
		});
	})
	// Update the user with this id (accessed at PUT http://localhost:1337/api/users/:user_id)
	.put(function(req, res) {
		// Use our user model to find the user we want
		User.findOne({ "_id": ObjectId(req.params.user_id) }, function(err, user) {
			if (err) {
				res.send(err);
			}
			// Update the users info only if its new
			if (req.body.name) {
				user.name = req.body.name;
			}
			if (req.body.username) {
				user.username = req.body.username;
			}
			if (req.body.password) {
				user.password = req.body.password;
			}

			// Save the user
			user.save(function(err) {
				if (err) {
					res.send(err);
				}

				// Return a message
				res.json({ message: 'User updated!!' });
			});
		});
	})
	// Delete the user with this id (accessed at DELETE http://localhost:1337/api/users/:user_id)
	.delete(function(req, res) {
		User.remove({ "_id": ObjectId(req.params.user_id) }, function(err, user) {
			if (err) {
				res.send(err);
			}
			res.json({ message: 'Successfully deleted!!' });
		});
	});

// API endpoint to get user information
apiRouter.get('/me', function(req, res) {
	res.send(req.decoded);
});


// More routes for our API will happen here

// *******************
// REGISTER OUR ROUTES
// *******************

// All of our routes will be prefixed with /api
app.use('/api', apiRouter);

// ================
// START THE SERVER
// ================
app.listen(port);
console.log('Magic happens on the port ' + port);