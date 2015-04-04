var express 		= require('express'),
	session			= require('express-session'),
	bodyParser		= require('body-parser'),
	morgan			= require('morgan'),
	compression		= require('compression'),
	mongoose		= require('mongoose'),
	redis 			= require('redis'),
	RedisStore 		= require('connect-redis')(session),
	passport 		= require('passport'),
	
	app				= express(),

	// Passport Strategy
	BearerStrategy	= require('passport-http-bearer').Strategy,
	LocalStrategy	= require('passport-local').Strategy,

	config			= require('./config'),

	User 			= require('./models/UserSchema')
	;

console.log();
console.log('Script executed at ' + (new Date()));
console.log();

/* Connecting app to Redis. */
redis = redis.createClient();

redis.on("error", function (err) {
	console.log("Redis error: " + err);
});

redis.on("ready", function (err) {
	console.log(config.app.name + " successfully connected to Redis.");
});

/* Connecting app to MongoDB. */
mongoose.connect('mongodb://' + config.mongodb.host + '/' + config.mongodb.collection, function(err) {
    if (err) console.log("MongoDB error: " + err);
    else console.log(config.app.name + " successfully connected to MongoDB.");
});

/* Setting Up Passport */
passport.use(new BearerStrategy(
	function(token, done) {
		User.findOne({ "token": token }, function (err, user) {
			if (err) { return done(err, false, {message: "Error."}); }
			if (!user) { return done(null, false, {message: "Unauthorized."}); }
			return done(null, user, { scope: 'all' });
		});
	}
));

app.use(passport.initialize());

/* Set views directory and engine. */
app.set('views', './views');
app.set('view engine', 'jade');

/* Set body parser for request sent to the app. */
app.use(bodyParser.urlencoded({
	extended: true
}));

/* Set up session using RedisStore. */
app.use(session({
	cookie: { maxAge:	config.security.session_timeout },
	secret: config.security.session_secret,
	store: new RedisStore({ host: config.redis.host, port: config.redis.port, client: redis }),
	saveUninitialized: true,
    resave: true
}));

/* Minify output. */
app.use(compression());

/* Set up logger. */
app.use(morgan(config.morgan.mode));

/* Set static file location. */
app.use(express.static(__dirname + '/public'));

/* Boot up! Set up all controllers. */
require('./libs/boot')(app, { verbose: !module.parent });

/* Global function for every controller actions. */
app.all('*', function(req, res, next) {
	if (typeof req.user != 'undefined') {
		res.locals.user = req.user;
	}

	res.locals.current = {
		url: req.protocol + '://' + req.get('host') + req.originalUrl
	};

	next()
});

/* Handle internal server error and render a view. */
app.use(function(err, req, res, next){
	if (!module.parent) console.error(err.stack);
	res.status(500).render('errors/5xx');
});

/* Handle not found error and render a view. */
app.use(function(req, res, next){
	res.status(404).render('errors/404', { url: req.originalUrl });
});

/* Run! */
var server = app.listen(config.app.port, function () {

	var host = server.address().address
	var port = server.address().port

	console.log(config.app.name + ' listening at localhost port ' + port);
	console.log();

});
