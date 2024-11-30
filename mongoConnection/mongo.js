import mongoose from "mongoose";

const mongooseConnect = (mongoURI) => {
  mongoose
    .connect(mongoURI)
    .then(() => {
      console.log("Mongoose Connected Successfully!");
    })
    .catch((err) => {
      console.error("MongoDB connection error : ", err);
    });
};

export default mongooseConnect;
