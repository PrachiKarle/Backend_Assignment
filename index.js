const express = require("express");
const app = express();

app.use(express.json());

app.use("/products", require("./products/route.js"));

app.get("/",(req,res)=>{
    res.send("<h1>Product Availability & Pricing Normalization Service</h1>");
})
app.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
});
