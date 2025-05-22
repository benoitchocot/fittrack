let users = [];

module.exports = {
  getUsers: () => users,
  addUser: (user) => users.push(user),
  findUserByEmail: (email) => users.find(u => u.email === email),
};
