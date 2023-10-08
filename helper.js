const generateRandomString = () => {
  const characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < 6; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    result += characters[randomIndex];
  }
  return result;
};

const getUserByEmail = (email, database) => {
  for (const userId in database) {
    const user = database[userId];
    if (user.email === email) {
      return user;
    }
  }
  return undefined;
};

const authenticateUser = (req, res, next) => {
  if (req.session.user_id) {
    res.redirect("/urls");
  } else {
    next();
  }
};

const urlsForUser = (id, database) => {
  const userUrls = {};
  for (const shortURL in database) {
    if (database[shortURL].userID === id) {
      userUrls[shortURL] = database[shortURL];
    }
  }
  return userUrls;
};

module.exports = {
  generateRandomString,
  getUserByEmail,
  authenticateUser,
  urlsForUser,
};
