// models/User.js
import mongoose from "mongoose";
import passportLocalMongoosePkg from "passport-local-mongoose";

const passportLocalMongoose =
  passportLocalMongoosePkg?.default ?? passportLocalMongoosePkg;

const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true }, // used for login
  email: { type: String, required: true, unique: true },
});

UserSchema.plugin(passportLocalMongoose);

export default mongoose.model("User", UserSchema);
