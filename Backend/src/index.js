import app from "./app.js";
import dotenv from "dotenv";
import connectDB from "./db/index.js";

dotenv.config({
  path: "./.env",
});

connectDB()
  .then(() => {
    app.listen(process.env.PORT || 7000, () => {
      console.log(`Server is running at port: ${process.env.PORT}`);
    });
  })
  .catch((err) => {
    console.log("MongoDB connection Failed !!", err);
  });
