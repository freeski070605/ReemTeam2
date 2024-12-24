const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    email: { type: String, required: false, unique: true },
    password: { type: String, required: true },
    chips: { type: Number, default: 100 },
    isAdmin: { type: Boolean, default: false },
    music: [{ type: String }],
    videos: [{ type: String }],
    gameHistory: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Game' }],
});

userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) {
      return next();
    }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  });
  
  userSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
  };

const User = mongoose.model('User', userSchema);

module.exports = User;