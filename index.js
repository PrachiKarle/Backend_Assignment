const express = require("express");
const app = express();

app.use(express.json());

app.use("/products", require("./routes/products"));

app.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
});
