const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");

const templatesRoutes = require("./routes/templates");
const historyRoutes = require("./routes/history");
const authRoutes = require("./routes/auth");

const app = express();
const PORT = 3001;

app.use(cors());
app.use(bodyParser.json());

app.use("/templates", templatesRoutes);
app.use("/history", historyRoutes);
app.use("/auth", authRoutes);

app.listen(PORT, () => {
  console.log(`✅ API listening at http://localhost:${PORT}`);
});