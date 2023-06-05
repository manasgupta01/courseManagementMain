const User = require("./models/model");
const bcrypt = require("bcryptjs");
const logger = require("../validation/utilities/logger.js");

async function createUser(
  i_name,
  i_email,
  hashedpassword,
  i_phone_number,
  i_username,
  i_interests,
  i_college,
  i_token
) {
  const salt = Number(process.env.SALT);
  try {
    const newUser = new User({
      name: i_name,
      email: i_email,
      password: hashedpassword,
      phone_number: i_phone_number,
      username: i_username,
      interests: i_interests,
      college: i_college,
      token: i_token,
    });

    await newUser.save();
    logger.info(`User with email : ${i_email} added successfully to database`);
    return 201;
  } catch (err) {

    if (err.code == 11000 || err.code == 11001) {
      logger.error("duplicate key", err.keyValue);
      return 409
      
    }
    logger.error("Error saving user:", err);
    return 500
  }
}


// login 
module.exports.getLoginStatus = async (i_email, i_password) => {
  try {
    const users = await User.findOne({ email: i_email });
    if (!users) {
      return -1; //email not found
    }

    const result = await bcrypt.compare(i_password, users.password);
    if (result) {
      return 1; //password matched
    } else {
      return -2; //password mismatch
    }
  } catch (err) {
    logger.error(err);
  }
}

async function getDetailsByToken(i_token) {
  try {
    const users = await User.findOne({ token: i_token });
    return users; 
  } catch (err) {
    logger.error("Error finding users:", err);
    return 500
  }
}

// query should be in format {key : value}
// where key is the attribute name and value is the attribute value
async function checkExistance(query){
  try{
    const result = await User.findOne(query);
    if(!result) return false;
    return true;
  }catch (err) {
    logger.error(err);
  }
}

module.exports.createUser = createUser;
module.exports.getDetailsByToken = getDetailsByToken;
module.exports.checkExistance = checkExistance;
