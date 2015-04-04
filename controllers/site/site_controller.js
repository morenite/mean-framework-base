var controller = function() {
	var User 		= require('../../models/UserSchema');

	var auth 		= require('../../libs/auth')(),
		utils		= require('../../libs/utils')(),
		API 		= utils.API
		;

	var actions = {};

	actions.name = '';

	actions.index = {
		path 	: '',
		method	: 'get',
		handler	: function(req, res, next) {
			res.render('index', {
				title: 'Home'
			});
		}
	};

	actions.api_index = {
		path 	: '',
		prefix	: 'api',
		method	: 'get',
		handler	: function(req, res, next) {
			res.status(200).json({
				message: "Halo dari Skripsi Server. Sementara, silakan kontak Imam Hidayat <imam.hidayat92@gmail.com> untuk dokumentasi."
			});
		}
	};

	actions.api_change_password = {
		path: 'change_password/:email/:new_password',
		prefix: 'api',
		method: 'get',
		handler: function(req, res, next) {
			User.findOne({"email": req.params.email})
			.exec(function(findError, user) {
				if (findError) {
					return API.error.json(res, findError);
				}
				else {
					if (user == null) {
						return API.invalid.json(res, "Can\'t find user with email: " + req.params.email);
					}
					else {
						user.password = req.params.new_password;
						user.save(function(saveError, user) {
							if (saveError) {
								return API.error.json(res, saveError);
							}	
							else {
								return API.success.json(res, user);
							}
						});
						
					}
				}
			});
		}
	}

	return actions;
};

module.exports = controller;
