import mongoose from 'mongoose';

const addressSchema = new mongoose.Schema(
	{
		userId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'User',
		},
		street: {
			type: String,
			required: [true, 'Address must be filled!'],
		},
		city: {
			type: String,
			required: [true, 'Address must have a city!'],
		},
		state: {
			type: String,
			required: [true, 'Address must have a state!'],
		},
		zipCode: {
			type: String,
			required: [true, 'Address must have a zip code!'],
		},
		country: {
			type: String,
			required: [true, 'Address must have a country!'],
		},
		isSaved: {
			type: Boolean,
			default: true,
		},
	},
	{
		timestamps: true,
	}
);

const Address = mongoose.model('Address', addressSchema);

export default Address;
