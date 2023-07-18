import mongoose from 'mongoose';
import validator from 'validator';
import uniqueValidator from 'mongoose-unique-validator';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema(
	{
		name: {
			type: String,
			unique: true,
			required: [true, 'Please tell us your name!'],
		},
		email: {
			type: String,
			required: [true, 'Please provide your email'],
			unique: true,
			lowercase: true,
			trim: true,
			validate: [validator.isEmail, 'Please provide a valid email!'],
		},
		photo: {
			type: String,
			default: 'default.png',
		},
		role: {
			type: String,
			enum: ['user', 'admin'],
			default: 'user',
		},
		password: {
			type: String,
			required: [true, 'Please provide a password!'],
			minlengh: 8,
			select: false, //must not be accessible
		},
		passwordConfirm: {
			type: String,
			required: [true, 'Please confirm your password'],
			validate: {
				// This only works on create and save
				validator: function (e) {
					return e === this.password;
				},
				message: 'Passwords are not the same!',
			},
		},
		active: {
			type: Boolean,
			default: true,
			select: false,
		},
		passwordChangedAt: Date,
	},
	{
		timestamps: true,
		toObject: { virtuals: true },
		toJSON: { virtuals: true },
	}
);

// Apply the uniqueValidator plugin to userSchema.
userSchema.plugin(uniqueValidator, {
	message: 'Please change: "{VALUE}", {PATH} must be unique!',
});

userSchema.virtual('cart', {
	ref: 'Cart', // populating from this collection
	localField: '_id',
	foreignField: 'userId',
	justOne: true,
});

userSchema.virtual('wishlist', {
	ref: 'Wishlist', // populating from this collection
	localField: '_id',
	foreignField: 'userId',
	justOne: true,
});

userSchema.virtual('address', {
	ref: 'Address', // populating from this collection
	localField: '_id',
	foreignField: 'userId',
	justOne: true,
});

// show all documents (users) that have active: true
userSchema.pre(/^find/, function (next) {
	//This points to the current query
	this.find({ active: { $ne: false } });

	next();
});

userSchema.pre('save', function (next) {
	if (!this.isModified('password') || this.isNew) return next();

	// add a delay to the modification
	this.passwordChangedAt = Date.now() - 1000;

	next();
});

userSchema.pre('save', async function (next) {
	if (!this.isModified('password')) return next();

	// bcryptjs.hash(password, numSaltRounds);
	this.password = await bcrypt.hash(this.password, 12);

	// delete passwordConfirm field
	this.passwordConfirm = undefined;

	next();
});

userSchema.methods.correctPassword = async function (
	inputPassword,
	userPssword
) {
	return await bcrypt.compare(inputPassword, userPssword);
};

// user created = token issued
userSchema.methods.changedPasswordAfterUserCreated = function (tokenTimestamp) {
	if (this.passwordChangedAt) {
		const changedTimestamp = parseInt(
			this.passwordChangedAt.getTime() / 1000,
			10
		);

		return changedTimestamp > tokenTimestamp;
	}

	// it means the password didn't change
	return false;
};

const User = mongoose.model('User', userSchema);

export default User;
