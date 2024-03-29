const Store = require('../../models/sellerStoreModel');
const AppError = require('../../utils/appError');
const Product = require('../../models/productsModel');
const catchAsync = require('../../utils/catchAsync');
const Factory = require('../factoryHandler');
const OrderProduct = require('../../models/orderProductsModel');
const axios = require('axios').default;
const Order = require('../../models/orderModel');

// const Seller = require('../../models/sellerModel');

exports.createProduct = catchAsync(async (req, res, next) => {
  req.body.owner = req.user.id;

  // const { productName, description } = req.body;

  try {
    const store = await Store.findOne({ owner: { $eq: req.user.id } });
    req.body.store = store.id;
    const {
      productName,
      description,
      video,
      category,
      quantity,
      originalPrice,
      salePrice,
      colors,
    } = req.body;
    const moderationResponse = await axios.post(
      'http://35.223.95.232:8080/v1/moderate',
      {
        title: productName,
        text: description,
      }
    );
    console.log(
      `Moderation Response 1 : ${moderationResponse.data.inappropriate}`
    );
    console.log('Success 1');

    if (moderationResponse.data.inappropriate) {
      return res.status(406).json({
        status: 'Error',
        message: 'The product contains inappropriate content.',
      });
    }

    // Check if an image file was uploaded
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        status: 'Error',
        message: 'Product images are required',
      });
    }

    // Get the filename of the uploaded image
    const productImages = req.files.map(
      (file) => `http://localhost:8000/uploads/${file.filename}`
    );

    // Save other product details to the database
    const product = await Product.create({
      owner: req.body.owner,
      store: req.body.store,
      productName,
      description,
      productImages,
      video,
      category,
      quantity,
      originalPrice,
      salePrice,
      colors,
    });
    axios
      .post('http://35.223.95.232:8080/v1/update-product-model', {
        product_id: product.id,
      })
      .then(() => {
        console.log(`Product id sent is: ${product.id}`);
      })
      .catch((error) => {
        console.log(
          `Failed to send the newly created product ID:, ${error}\n and Product Id; ${product.id}`
        );
      });

    res.status(201).json({
      status: 'Success',
      message: 'Product Created!',
      product,
    });
    console.log('Product created successfully.');
  } catch (err) {
    return res.status(401).send({
      message: `Error message for create product end is: ${err?.message}`,
    });
  }
});

exports.getallproducts = catchAsync(async (req, res, next) => {
  const products = await Product.find();

  res.status(200).json({
    status: 'Success',
    product: products || `No Product Found`,
  });
});

exports.getallsellerproducts = catchAsync(async (req, res, next) => {
  try {
    const products = await Product.find({ owner: req.user._id });

    res.status(200).json({
      status: 'Success',
      product: products || `No Product Found`,
    });
  } catch (error) {
    res.status(500).json({
      status: 'Error',
      message: 'An error occurred while retrieving products.',
      error: console.log(
        `Can't get product for this seller. Error is: ${error.message}`
      ),
    });
  }
});

exports.updateProducts = catchAsync(async (req, res, next) => {
  const products = await Product.updateOne(
    { _id: req.params.id },
    { $set: req.body }
  );
  if (products) {
    res.status(200).json({
      status: 'success',
      message: 'Product updated successfully',
      product: products,
    });
  } else {
    return next(
      new AppError("Can't Update product. As No Product found with such id")
    );
  }
});

// exports.updateProducts = catchAsync(async (req, res, next) => {
//   const {id} = req.params;
//   console.log(`Update Product id id: ${id}`);
//   const updateFields = req.body;

//   try {
//     // Find the product by ID
//     const product = await Product.findById(id);
//     console.log(`product is: ${product}`);
//     if (!product) {
//       return res.status(404).json({
//         status: 'Error',
//         message: 'Product not found',
//         err,
//       });
//     }

//     // Update the product details based on the user's specified fields
//     Object.keys(updateFields).forEach((key) => {
//       product[key] = updateFields[key];
//     });

//     // Perform moderation check on updated product details
//     // const moderationResponse = await axios.post(
//     //   'http://35.223.95.232:8080/v1/moderate',
//     //   {
//     //     title: product.productName,
//     //     text: product.description,
//     //   }
//     // );

//     // if (moderationResponse.data.inappropriate) {
//     //   return res.status(406).json({
//     //     status: 'Error',
//     //     message: 'The product contains inappropriate content.',
//     //   });
//     // }

//     // Check if new image files were uploaded
//     if (req.files && req.files.length > 0) {
//       const newProductImages = req.files.map(
//         (file) => `http://localhost:8000/uploads/${file.filename}`
//       );
//       product.productImages = newProductImages;
//     }

//     console.log(`product 22222222 is: ${product}`);

//     // Save the updated product to the database
//     await product.save();

//     // Perform product model update
//     // axios
//     //   .post('http://35.223.95.232:8080/v1/update-product-model', {
//     //     product_id: product.id,
//     //   })
//     //   .then(() => {
//     //     console.log(`Product id sent is: ${product.id}`);
//     //   })
//     //   .catch((error) => {
//     //     console.log(
//     //       `Failed to send the updated product ID:, ${error}\n and Product Id; ${product.id}`
//     //     );
//     //   });

//     res.status(200).json({
//       status: 'Success',
//       message: 'Product updated successfully',
//       product,
//     });
//     console.log('Product updated successfully.');
//   } catch (err) {
//     return res.status(400).json({
//       status: 'Error',
//       message: `Error updating product: ${err.message}\n`,
//       console: console.log(`Erro is ${err}`),
//     });
//   }
// });

exports.deleteProducts = catchAsync(async (req, res, next) => {
  const products = await Product.findByIdAndDelete(req.params.id);
  if (products) {
    res.status(200).json({
      status: 'success',
      message: 'Product deleted successfully',
    });
  } else {
    return next(
      new AppError("Can't Delete Product. As No Product found with such id")
    );
  }
});

exports.generateRecommendation = catchAsync(async (req, res, next) => {
  const userId = req.params.id;
  console.log('Generating recommendation user id ', userId);
  let product_id = null;
  const num_responses = 5;

  // Check if the user has created an order
  const order = await Order.findOne({ owner: userId });
  console.log('before check order ', order);
  if (order) {
    console.log(' yes order found');

    // If the user has created an order, get a product ID from the order
    const productIds = order.products.map((product) => product.productId);
    product_id = productIds[Math.floor(Math.random() * productIds.length)];
  } else {
    console.log(' no order found, go for sold item');

    // If no order created, find a product with the highest soldItems count
    const products = await Product.find().sort({ soldItems: -1 }).limit(1);
    if (products.length > 0) {
      console.log(' sold item found');

      product_id = products[0]._id;
    } else {
      console.log('no sold item, random product');

      // If no soldItems, get a random product ID from any product
      const randomProduct = await Product.findOne();
      if (randomProduct) {
        product_id = randomProduct._id;
      }
    }
  }

  console.log('Product ID: ' + product_id);
  try {
    console.log('call ml api ');

    // Call the ML API with the product_id
    const recommendationResponse = await axios.post(
      'http://35.223.95.232:8080/v1/recommend-product',
      {
        product_id,
        num_responses,
      }
    );
    console.log('response recoomd model', recommendationResponse);

    // Handle the recommendation response here

    res.status(200).json({
      status: 'Success',
      product_id,
      recommendationResponse: recommendationResponse.data,
    });
  } catch (err) {
    return res.status(500).json({
      status: 'Error',
      message: `Failed to generate recommendation with error ${err.message}`,
      // error: console.log(`Error is ${err.message}`),
    });
  }
});

exports.getoneproduct = Factory.getOne(Product);
