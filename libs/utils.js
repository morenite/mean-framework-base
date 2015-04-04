module.exports = function() {

	var	_	= require('underscore')
			;

	/* Standard API Utility */
	var APIUtility = {};
	
	APIUtility.error = {
		json: function(res, errorObject, message, errorInfo) {

			var returnedObject = {
				success: false,
				system_error: {
					error: errorObject
				}
			};

			if (message) {
				returnedObject.message = message;
			}

			if (errorInfo) {
				returnedObject.system_error.message = errorInfo;
			}

			return res.status(500).json(returnedObject);
		}
	};

	APIUtility.forbidden = {
		json: function(res, message) {
			return res.status(403).json({
				success: false,
				message: message
			});
		}
	};

	APIUtility.invalid = {
		json: function(res, message) {
			return res.status(400).json({
				success: false,
				message: message
			});
		}
	};

	APIUtility.success = {
		json: function(res, responseObject, message) {
			var returnedObject = {
				success: true
			};

			if (message) {
				returnedObject.message = message;
			}

			if (_.isArray(responseObject)) {
				returnedObject.results = responseObject;
			}
			else {
				returnedObject.result = responseObject;
			}

			return res.status(200).json(returnedObject);
		}
	};

	APIUtility.commonHandler = {
		json: function(res, error, responseObject, message, errorInfo) {
			if (error) {
				return APIUtility.error(res, error, errorInfo);
			}
			else {
				return APIUtility.success(res, responseObject, message);
			}
		}
	};
	

	return {
		API: APIUtility
	};
};