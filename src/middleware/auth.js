const User = require("../models/User");

async function authUser(req, res, next) {
  const userId = req.cookies.userId;
  if (!userId)
    return res.status(401).json({ error: "Not logged in, Please login" });

  const user = await User.findById(userId);
  if (!user) return res.status(401).json({ error: "User not found" });

  req.user = user;
  next();
}

module.exports = { authUser };
