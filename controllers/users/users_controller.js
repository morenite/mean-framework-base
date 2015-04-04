var controller = function() {
	var	_ 			= require('underscore'),
		async		= require('async'),
		passport	= require('passport'),
		mongoose	= require('mongoose'),
		ObjectId	= mongoose.Types.ObjectId
		;

	var	User 		= require('../../models/UserSchema')
		;

	var auth 		= require('../../libs/auth')(),
		utils		= require('../../libs/utils')(),
		API 		= utils.API
		;

	var actions = {};

	/* Pages */

	actions.add = [
		{
			path 	: '/add',
			method	: 'get',
			handler	: function(req, res, next) {
				async.parallel(
					[
						function(callback) {
							Major.find().exec(callback);
						}
					], 
					function(asyncError, results) {
						res.render('add', {
							title: 'Add New User',
							majors: results[0]
						});
					}
				);
			}
		},
		{
			path 	: '/add',
			method	: 'post',
			// before	: passport.authenticate('bearer', { session: false }),
			handler	: function(req, res, next) {
				var user = new User();

				_.each(req.body, function(v, k) {
					user[k] = v;
				});

				user.provider = 'local';

				user.save(function(saveError, savedUser) {
					if (saveError) {
						console.log(saveError);
						return res.status(500).render('../../../views/errors/5xx');
					}
					else {
						res.redirect('/users/add');
					}
				});
			}
		}
	];

	/* API Functions */

	actions.api_index = [
		{
			path 	: '/',
			prefix	: 'api',
			method	: 'get',
			before	: passport.authenticate('bearer', { session: false }),
			handler	: function(req, res, next) {
				User.find().exec(function(findError, users) {
					if (findError) {
						return res.status(500).json({
							success: false,
							message: "",
							system_error: {
								message: "",
								error: findError
							}
						});
					}
					else {
						return res.status(200).json({
							success: true,
							message: "",
							results: users
						});
					}
				});
			}
		},
		{
			path 	: '/',
			prefix	: 'api',
			method	: 'post',
			before	: passport.authenticate('bearer', { session: false }),
			handler	: function(req, res, next) {
				
			}
		}
	];

	actions.api_authentication = {
		path 	: '/authentication',
		prefix	: 'api',
		method	: 'post',
		handler	: function(req, res, next) {
			var conditions = {};

			if (typeof req.body.email != "undefined" && typeof req.body.password != "undefined") {
				conditions.email = req.body.email;
			}
			else if (typeof req.body.identifier != "undefined") {
				conditions.identifier = req.body.identifier;
			}
			else {
				return res.status(400).json({
					message: "Permintaan data tidak valid."
				});
			}

			User.findOne(conditions).exec(function(err, user) {
				if (err) {
					return API.error.json(res, err, "Terjadi kesalahan di dalam sistem.");
				}
				else {
					if (user == null) {
						return API.forbidden.json(res, "Autentikasi gagal dilakukan.");
					}
					else {
						if (user.role != 'lecturer') {
							return API.forbidden.json(res, "Mahasiswa/Staf tidak diizinkan untuk mengakses sumber daya.")
						}
						else {
							if (typeof req.body.identifier != "undefined") {
								return API.success.json(res, user);
							}
							else {
								if (user.hashed_password == user.encryptPassword(req.body.password)) {
									return API.success.json(res, user);
								}
								else {
									return API.forbidden.json(res, "E-mail/password yang Anda masukkan tidak valid.")
								}
							}
						}
					}
				}
			});
		}
	};

	actions.api_current = {
		path 	: '/current',
		prefix	: 'api',
		method	: 'get',
		before	: auth.check,
		handler	: function(req, res, next) {
			var conditions = {};

			if (typeof req.body.identifier != "undefined") {
				conditions.identifier = req.body.identifier;

				User.findOne(conditions).exec(function(err, user) {
					if (err) {
						return res.status(500).json({
							message: "Something bad happened."
						});
					}
					else {
						if (user) {
							res.status(200).json({
								message: "Halo " + user.name + "!",
								result: user
							});
						}
						else {
							res.status(403).json({
								message: "Invalid credentials."
							});
						}
					}				
				});
			}
			else {
				res.status(400).json({
					success: false,
					message: "Invalid request."
				});
			}			
		}
	};

	actions.api_details = [
		{
			path 	: '/:id',
			prefix	: 'api',
			method	: 'get',
			before	: auth.check,
			handler	: function(req, res, next) {
				User.findOne({
					'_id': ObjectId(req.param.id)
				})
				.exec(function(findError, user) {
					if (findError) {
						return API.error.json(res, findError);
					}

					if (user == null) {
						return API.invalid.json(res, 'Tidak dapat menemukan user dengan id yang diberikan.');
					}
					else {
						return API.success.json(res, user, 'Halo ' + user.display_name);
					}
				});
			}
		},
		{
			path 	: '/:id',
			prefix	: 'api',
			method	: 'put',
			before	: passport.authenticate('bearer', { session: false }),
			handler	: function(req, res, next) {
				delete req.body._id;

				User.findByIdAndUpdate(ObjectId(req.params.id, {$set: req.body}, {}, function(updateError, savedUser) {
					if (updateError) {
						return API.error.json(res, updateError)
					}
					else {
						return API.success.json(res, savedUser);
					}
				}));
			}
		},
	];

	return actions;
} 

module.exports = controller;
