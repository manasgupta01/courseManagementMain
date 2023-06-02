
// Function to validate username
const isValidUsername = (username) => {
  const minLength = 4;
  const maxLength = 30;
  const regex = /^[a-zA-Z0-9_]+$/;

  if (username.length < minLength || username.length > maxLength || !regex.test(username)) {
    //  return res.status(400).json({ error: 'Invalid username. It should be 4-30 characters long, alphanumeric, and contain an underscore.' });
    return false;
  }

  return true;
};

module.exports = isValidUsername;

  //return res.status(400).json({ error: 'Invalid username. It should be 4-30 characters long, alphanumeric, and contain an underscore.' });