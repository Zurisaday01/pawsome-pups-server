import mongoose from 'mongoose';
import Category from './categoryModel.js';

const productSchema = new mongoose.Schema(
	{
		name: {
			type: String,
			required: [true, 'A product must have a name'],
			trim: true,
		},
		imageCover: {
			type: String,
			required: [true, 'A product must have an image cover'],
		},
		images: {
			type: [String],
			required: [true, 'A product must have view items'],
		},
		category: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'Category',
			required: [true, 'A product must have a category'],
		},
		storeName: {
			type: String,
			required: [true, 'A product must have a store creator'],
		},
		ratingAverage: {
			type: Number,
			required: true,
			default: 4.5,
			min: [1, 'Rating must ve above 1.0'],
			max: [5, 'Rating must be below 5.0'],
			set: val => Math.round(val * 10) / 10,
		},
		reviewsQuantity: {
			type: Number,
			default: 0,
		},
		variants: [
			{
				size: {
					enum: ['L', 'M', 'S'],
					type: String,
				},
				color: [String], //name, hex color
				countInStock: Number,
				price: Number,
			},
		],
	},
	{ timestamps: true, toObject: { virtuals: true }, toJSON: { virtuals: true } }
);

// populated virtual
productSchema.virtual('reviews', {
	ref: 'Review',
	localField: '_id',
	foreignField: 'productId',
});

productSchema.pre(/^find/, function (next) {
	this.populate({
		path: 'category',
		model: 'Category',
		select: 'name',
	});

	next();
});

productSchema.statics.calcProductsQuantity = async function (categoryId) {
	const stats = await this.aggregate([
		{
			$match: {
				category: categoryId,
			},
		},
		{
			$group: {
				_id: '$category',
				nProduct: { $sum: 1 },
			},
		},
	]);

	if (stats.length > 0) {
		// find the maching document in the product Collection

		await Category.findByIdAndUpdate(categoryId, {
			productsQuantity: stats[0].nProduct,
		});
	} else {
		await Category.findByIdAndUpdate(categoryId, {
			productsQuantity: 0,
		});
	}
};

productSchema.post('save', function () {
	// this.constructor === Product
	this.constructor.calcProductsQuantity(this.category);
});

// findByIdAndUpdate - behind this is the same as findOneAndUpdate
// findByIdAndDelete
productSchema.pre(/^findOneAnd/, async function (next) {
	//findOne returns the product document
	this.product = await this.model.findOne(this.getQuery());
	//this.getQuery()_id =  64ae972c6915fb4574b52a31

	//console.log(this.product.category._id);
	// this.product.constructor === Model { Product }

	next();
});

productSchema.post(/^findOneAnd/, async function () {
	//calcProductsQuantity(categoryId)
	await this.product.constructor.calcProductsQuantity(
		this.product.category._id
	);
});

const Product = mongoose.model('Product', productSchema);

export default Product;
