const express = require("express");
const app = express();
const PORT = 8080; // default port 8080
const cookieParser = require("cookie-parser");
const cookieSession = require("cookie-session");

app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(
  cookieSession({
    name: "session",
    keys: ["key1", "key2"],
  })
);

app.set("view engine", "ejs");

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

const getUserByEmail = (email) => {
  for (const userId in users) {
    const user = users[userId];
    if (user.email === email) {
      return user;
    }
  }
  return null;
};

const authenticateUser = (req, res, next) => {
  if (req.session.user_id) {
    res.redirect("/urls");
  } else {
    next();
  }
};

const urlsForUser = (id) => {
  const userUrls = {};
  for (const shortURL in urlDatabase) {
    if (urlDatabase[shortURL].userID === id) {
      userUrls[shortURL] = urlDatabase[shortURL];
    }
  }
  return userUrls;
};

const users = {};

const urlDatabase = {
  b6UTxQ: {
    longURL: "https://www.tsn.ca",
    userID: "aJ48lW",
  },
  i3BoGr: {
    longURL: "https://www.google.ca",
    userID: "aJ48lW",
  },
};

app.get("/urls", (req, res) => {
  const user = users[req.session.user_id];
  if (!user) {
    return res.status(401).send("You need to be logged in to view this page.");
  }

  const userUrls = urlsForUser(req.session.user_id);

  const templateVars = { urls: userUrls, user: users[req.session.user_id] };
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  const userUrls = urlsForUser(req.session.user_id);
  const templateVars = { urls: userUrls, user: users[req.session.user_id] };
  if (!req.session.user_id) {
    res.redirect("/login");
  } else {
    res.render("urls_new", templateVars);
  }
});

app.get("/urls/:id", (req, res) => {
  if (!req.session.user_id) {
    return res.status(401).send("Please login in to view URLs");
  } else if (req.session.user_id !== urlDatabase[req.params.id].userID) {
    return res.status(401).send("Can not view another users URLs");
  } else {
    const id = req.params.id;
    const urlObj = urlDatabase[id];
    const userUrls = urlsForUser(req.session.user_id);
    if (!urlObj) {
      return res.status(404).send("URL not found");
    }

    const templateVars = {
      id: id,
      longURL: urlObj.longURL,
      user: users[req.session.user_id],
      userUrls: userUrls,
    };
    res.render("urls_show", templateVars);
  }
});

app.get("/u/:id", (req, res) => {
  const templateVars = { user: users[req.session.user_id] };
  const id = req.params.id;
  const longURL = urlDatabase[id];
  if (!longURL) {
    res.status(404).send("<h2>URL not found. Please check the link.</h2>");
  } else {
    res.redirect(longURL, templateVars);
  }
});

//generate new ID and redirects to urls with new ID
app.post("/urls", (req, res) => {
  if (!req.session.user_id) {
    res.status(403).send("You need to be logged in to create a new URL");
  } else {
    const id = generateRandomString();
    const longURL = req.body.longURL;
    const userUrls = urlsForUser(req.session.user_id);
    urlDatabase[id] = { longURL: longURL, userID: req.session.user_id };
    res.redirect(`/urls/${id}`);
  }
});

app.get("/register", authenticateUser, (req, res) => {
  const templateVars = { user: users[req.session.user_id] };
  res.render("register", templateVars);
});

app.get("/login", authenticateUser, (req, res) => {
  const templateVars = { user: users[req.session.user_id] };
  res.render("login", templateVars);
});

//Edit the longURL for an existing shortURL
app.post("/urls/:id", (req, res) => {
  const id = req.params.id;
  const longURL = req.body.longURL;
  const userID = req.session.user_id;
  if (!userID) {
    return res.status(403).send("You must login to edit");
  }
  if (!urlDatabase[id]) {
    return res.status(404).send("This id does not exist.");
  }
  if (userID !== urlDatabase[id].userID) {
    return res.status(403).send("You do not have permissions to edit this URL");
  }
  urlDatabase[id] = { longURL: longURL, userID: userID };
  res.redirect("/urls");
});

// Delete Tiny Url
app.post("/urls/:id/delete", (req, res) => {
  const id = req.params.id;
  const userID = req.session.user_id;
  if (!userID) {
    return res.status(403).send("You must login to delete");
  }
  if (!urlDatabase[id]) {
    return res.status(404).send("This id does not exist.");
  }
  if (userID !== urlDatabase[id].userID) {
    return res
      .status(403)
      .send("You do not have permissions to delete this URL");
  }
  delete urlDatabase[req.params.id];
  res.redirect("/urls");
});

app.post("/login", (req, res) => {
  const { email, password } = req.body;
  const user = getUserByEmail(email);

  if (!user || user.password !== password) {
    return res.status(403).send("Invalid email or password.");
  }

  req.session.user_id = user.id;
  res.redirect("/urls");
});

app.post("/logout", (req, res) => {
  req.session = null;
  res.redirect("/login");
});

app.post("/register", (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).send("Both email and password are required");
  }

  if (getUserByEmail(email)) {
    return res.status(400).send("Email already exists");
  }

  const userId = generateRandomString();

  users[userId] = {
    id: userId,
    email,
    password,
  };

  req.session.user_id = userId;

  res.redirect("/urls");
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
