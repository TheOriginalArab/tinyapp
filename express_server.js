const express = require("express");
const app = express();
const PORT = 8080; // default port 8080
const cookieSession = require("cookie-session");
const bcrypt = require("bcryptjs");
const {
  generateRandomString,
  getUserByEmail,
  authenticateUser,
  urlsForUser,
} = require("./helper");

app.use(express.urlencoded({ extended: true }));
app.use(
  cookieSession({
    name: "session",
    keys: ["key1", "key2"],
  })
);

app.set("view engine", "ejs");

const users = {};

const urlDatabase = {
  i3BoGr: {
    longURL: "https://www.google.ca",
    userID: "a1b2c3",
  },
};

app.get("/", (req, res) => {
  const user = users[req.session.user_id];
  if (!user) {
    res.redirect("/login");
  } else {
    res.redirect("/urls");
  }
});

app.get("/urls", (req, res) => {
  const user = users[req.session.user_id];
  if (!user) {
    return res.status(401).send("You need to be logged in to view this page.");
  }

  const userUrls = urlsForUser(req.session.user_id, urlDatabase);

  const templateVars = { urls: userUrls, user: users[req.session.user_id] };
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  const userUrls = urlsForUser(req.session.user_id, urlDatabase);
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
    const userUrls = urlsForUser(req.session.user_id, urlDatabase);
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
  const id = req.params.id;
  if (!urlDatabase[id]) {
    res.status(404).send("<h2>URL not found. Please check the link.</h2>");
  } else {
    const longURL = urlDatabase[id].longURL;
    res.redirect(longURL);
  }
});

//generate new ID and redirects to urls with new ID
app.post("/urls", (req, res) => {
  if (!req.session.user_id) {
    res.status(403).send("You need to be logged in to create a new URL");
  } else {
    const id = generateRandomString();
    const longURL = req.body.longURL;
    const userUrls = urlsForUser(req.session.user_id, urlDatabase);
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
  const user = getUserByEmail(email, users);

  if (!user) {
    return res.status(403).send("Invalid email or password.");
  }

  bcrypt.compare(password, user.password, (err, result) => {
    if (err || !result) {
      return res.status(403).send("Invalid email or password");
    }
  });

  req.session.user_id = user.id;
  res.redirect("/urls");
});

app.post("/logout", (req, res) => {
  req.session = null;
  res.redirect("/login");
});

app.post("/register", (req, res) => {
  const { email, password } = req.body;
  const hashedPassword = bcrypt.hashSync(password, 10);

  if (!email || !password) {
    return res.status(400).send("Both email and password are required");
  }

  if (getUserByEmail(email, users)) {
    return res.status(400).send("Email already exists");
  }

  const userId = generateRandomString();

  users[userId] = {
    id: userId,
    email,
    password: hashedPassword,
  };

  req.session.user_id = userId;

  res.redirect("/urls");
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
