const { assert } = require("chai");

const { getUserByEmail, urlsForUser } = require("../helper.js");

const testUsers = {
  userRandomID: {
    id: "userRandomID",
    email: "user@example.com",
    password: "purple-monkey-dinosaur",
  },
  user2RandomID: {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "dishwasher-funk",
  },
};

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

describe("getUserByEmail", function () {
  it("should return a user with valid email", () => {
    const user = getUserByEmail("user@example.com", testUsers);
    const expectedUserID = "userRandomID";
    assert.deepEqual(user.id, expectedUserID);
  });

  it("should return undefined with an invalid email", () => {
    const user = getUserByEmail("user3@example.com", testUsers);
    const expectedUserID = undefined;
    assert.deepEqual(user, expectedUserID);
  });

  it("should return two sites with userID --> aJ48lW", () => {
    const urls = urlsForUser("aJ48lW", urlDatabase);
    const expectedUrls = 2;
    assert.deepEqual(Object.keys(urls).length, expectedUrls);
  });
});
