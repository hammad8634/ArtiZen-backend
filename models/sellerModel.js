const crypto = require('crypto');
const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcrypt');
// const { type } = require('os');

const sellerSchema = mongoose.Schema(
  {
    name: {
      type: String,
      minlength: [3, 'must have greater or equal to 3 length'],
      maxlength: [50, 'must have less or equal to 50 length'],
      required: [true, 'Must have a name'],
    },
    email: {
      type: String,
      required: [true, 'Must have a email'],
      unique: [true, 'Email must not be used before'],
      lowercase: true,
      validate: [validator.isEmail, 'Enter valid email'],
    },

    phoneNumber: {
      type: String,
      // match: /^(\()?\d{3}(\))?(-|\s)?\d{7}$/,
      minlength: [11, 'must have length equal to 11'],
      maxlength: [11, 'must have length equal to 11'],
      required: [true, 'Must have a phone number'],
      unique: [true, 'Phone number must not be used before'],
    },

    cnic: {
      type: String,
      // minlength: [13, 'must have greater or equal to 13 length'],
      // maxlength: [13, 'must have less or equal to 13 length'],
      required: [true, 'Must have a cnic number'],
      unique: [true, 'Cnic number must not be used before'],
    },

    password: {
      type: String,
      required: [true, 'Must have a password'],
      minlength: [8, 'must have >8 length'],
      select: false,
    },
    passwordConfirm: {
      type: String,
      required: [true, 'Must have a confirm password'],
      validate: {
        validator: function (el) {
          return el === this.password;
        },
        message: 'Passwords are not same',
      },
    },
    passwordChangedAt: {
      type: Date,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    role: {
      type: String,
      enum: ['seller'],
      default: 'seller',
    },

    cnicPhotoFront: String,
    cnicPhotoBack: String,

    cnicConfirm: {
      type: Boolean,
      default: true,
    },
    passResetToken: String,
    passTokenExpire: Date,
    active: {
      type: Boolean,
      default: true,
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

sellerSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();

  this.password = await bcrypt.hash(this.password, 12);

  this.passwordConfirm = undefined;
  next();
});

sellerSchema.pre('save', function (next) {
  if (!this.isModified('password') || this.isNew) return next();

  this.passwordChangedAt = Date.now() - 1000;
  next();
});

sellerSchema.pre(/^find/, function (next) {
  this.find({ active: { $ne: false } });
  next();
});

sellerSchema.methods.correctPassword = async function (
  candPassword,
  userPassword
) {
  return await bcrypt.compare(candPassword, userPassword);
};

sellerSchema.methods.changedPasswordAfter = function (JWTTimesstamp) {
  if (this.passwordChangedAt) {
    const changedTimeStamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10
    );
    // console.log(changedTimeStamp, JWTTimesstamp)
    return JWTTimesstamp < changedTimeStamp;
  }
};

sellerSchema.methods.passwordResetToken = function () {
  const ResetToken = crypto.randomBytes(32).toString('hex');

  this.passResetToken = crypto
    .createHash('sha256')
    .update(ResetToken)
    .digest('hex');

  // console.log({ ResetToken }, this.passResetToken);

  this.passTokenExpire = Date.now() + 10 * 60 * 1000;

  return ResetToken;
};

const Seller = mongoose.model('Seller', sellerSchema);

module.exports = Seller;
