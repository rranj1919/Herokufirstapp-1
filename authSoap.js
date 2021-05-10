// Check SOAP request authorization
// Returns true if credentials are correct, false otherwise
const isAuthorized = (headers) => {
    // Deny Unauthorized Requests
    try {
        console.log("Authorizing user ", headers.Security.UsernameToken.Username);
        // Check if username exists and matches
        if(!headers.Security.UsernameToken.Username || headers.Security.UsernameToken.Username !== process.env.USERNAME) {
            console.log('Unauthorized request');
            return false;
        }

        // Check if password exists and matches
        if(!headers.Security.UsernameToken.Password['$value'] || headers.Security.UsernameToken.Password['$value'] !== process.env.PASSWORD) {
            console.log('Unauthorized request');
            return false;
        }

        return true;
    } catch(err) {
        // Errors if the authentication headers are not provided
        console.error('Authentication Error: ', err);
        return false;
    }
}

module.exports = {
    isAuthorized
}