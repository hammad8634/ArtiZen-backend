const Order = require('../../models/orderModel');
const Product = require('../../models/productsModel');
const AppError = require('../../utils/appError');
const catchAsync = require('../../utils/catchAsync');
const Factory = require('../factoryHandler');
const OrderProduct = require('../../models/orderProductsModel');
// Create a new order
exports.createOrder = catchAsync(async (req, res, next) => {
  const { products, totalAmount } = req.body;
  const user = req.user.id;
  const name = req.body.name;
  const location = req.body.location;

  if (!req.paid) {
    return next(new AppError('Payment Failed', 404));
  }

  const order = new Order({ user, products, totalAmount, location, name });
  order.paymentStatus = 'Done';
  await order.save();

  // const productss = await Promise.all(
  //   products.map(async (product) => {
  //     const preprod = await Product.findById(product.product);
  //     const prod = await OrderProduct.create({
  //       user: req.user.id,
  //       seller: product.owner,
  //       order: order.id,
  //       orderno: order.orderno,
  //       quantity: product.quantity,
  //       productPrice: product.productPrice,
  //     });
  //   })
  // );

  res.status(201).json({
    status: 'Success',
    message: 'Product Order Created!',
    order,
  });
});

// exports.createOrder = catchAsync(async (req, res, next) => {
//   const {
//     email,
//     firstName,
//     lastName,
//     cityName,
//     address,
//     streetNumber,
//     phone,
//     paymentMethod,
//   } = req.body;
//   const user = req.user.id;

//   if (!req.paid) {
//     return next(new AppError('Payment Failed', 404));
//   }

//   // Get the user's cart details and populate the products field
//   const userCart = await Cart.findOne({ user }).populate('products.product');

//   if (!userCart) {
//     return next(new AppError('Cart not found', 404));
//   }

//   // Calculate the total amount based on cart products
//   let totalAmount = 0;
//   const products = userCart.products.map((cartItem) => {
//     const product = cartItem.product;
//     const quantity = cartItem.quantity;
//     const productTotalAmount = quantity * product.salePrice;
//     totalAmount += productTotalAmount;
//     return {
//       product: product._id,
//       quantity,
//       productTotalAmount,
//     };
//   });

//   const order = new Order({
//     user,
//     products,
//     totalAmount,
//     email,
//     firstName,
//     lastName,
//     cityName,
//     address,
//     streetNumber,
//     phone,
//     paymentMethod,
//   });
//   order.paymentStatus = 'Done';
//   await order.save();

//   res.status(201).json({
//     status: 'Success',
//     message: 'Product Order Created!',
//     order,
//   });
// });

// Get all orders
exports.getAllOrders = catchAsync(async (req, res, next) => {
  const orders = await Order.find()
    .populate('user', 'name email')
    .populate('products.product', 'name price');
  res.status(200).json({
    status: 'Success',
    order: orders || `No Product Found`,
  });
});

// Get all orders
exports.getSellerOrders = catchAsync(async (req, res, next) => {
  const orders = await Order.find({ seller: req.user.id })
    .populate('user', 'name email')
    .populate('products.product', 'name price');
  res.status(200).json({
    status: 'Success',
    order: orders || `No Product Found`,
  });
});

// Update order status By Seller
exports.updateOrderStatus = catchAsync(async (req, res, next) => {
  const { orderId, status } = req.body;

  const orders = await Order.findByIdAndUpdate(
    orderId,
    { status },
    { new: true }
  );
  if (orders) {
    res
      .status(200)
      .json({ status: 'success', message: 'Order updated successfully' });
  } else {
    return next(
      new AppError("Can't Update product. As No Order found with such id")
    );
  }
});

exports.deleteOrders = catchAsync(async (req, res, next) => {
  const orders = await Order.findByIdAndDelete(req.params.id);
  if (orders) {
    res.status(200).json({
      status: 'success',
      message: 'Order deleted successfully',
    });
  } else {
    return next(
      new AppError("Can't Delete Order. As No Order found with such id")
    );
  }
});

exports.getoneorder = Factory.getOne(Order);
