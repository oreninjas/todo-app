const userModel = require("../model/user.model");

const checkUserExists = async (req, res, next) => {
  const { email, password } = req.body;
  try{
    const findUser = await userModel.findOne({ email: email });
    if (findUser) {
      return res.send("User already exists");
    }
    next()
  }catch(err){
    return res.status(500).send('Error checking user in DB: ', err);
  }
};

module.exports = checkUserExists;
