var auth = function() {
	var	_ 			= require('underscore'),
		passport	= require('passport')
		;

	var utils		= require('../libs/utils')(),
		API 		= utils.API
		;

	var obj = {}
		;

	obj.check = function(req, res, next) {
		if (!req.isAuthenticated()) {
			passport.authenticate('bearer', {session: false}, function(authenticateError, user, info) {
				if (req.originalUrl.indexOf('/api/') != -1) {
					if (authenticateError) {
						console.log(authenticateError);
						return API.error.json(res, authenticateError);
					}

					if (!user) {
						return API.forbidden.json(res, 'Anda tidak diizinkan untuk mengakses sumber daya ini.');
					}
					else {
						req.user = user;
						next();
					}
				}
				else {
					if (err) { return next(err); }
					if (!user) { return res.redirect('/users/login'); }
					
					req.logIn(user, function(err) {
						if (err) { return next(err); }
						return next();
					});
				}
			})(req, res, next);
		}
		else {
			return next();
		}
	}

	return obj;
};

module.exports = auth;
