import mongoose from 'mongoose';
import uniqueValidator from 'mongoose-unique-validator';

const categorySchema = mongoose.Schema(
	{
		name: {
			type: String,
			unique: true,
			required: [true, 'Category must have a name!'],
		},
		productsQuantity: {
			type: Number,
			default: 0,
		},
	},
	{
		timestamps: true,
		toObject: { virtuals: true },
		toJSON: { virtuals: true },
	}
);

// populated virtual
categorySchema.virtual('products', {
	ref: 'Product',
	localField: '_id',
	foreignField: 'category',
});

// Apply the uniqueValidator plugin to userSchema.
categorySchema.plugin(uniqueValidator, {
	message: 'Please change: "{VALUE}", {PATH} must be unique!',
});

const Category = mongoose.model('Category', categorySchema);

export default Category;
