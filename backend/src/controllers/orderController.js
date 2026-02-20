import Order from "../models/order.js";
import User from "../models/userModel.js";
import Product from "../models/product.js";
import crypto from 'crypto';
import mongoose from 'mongoose';

// POST /api/orders  – place a new order
export const placeOrder = async (req, res) => {
  try {
    const { items, deliveryInfo, subtotal, shippingFee, total } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ success: false, message: "No items in order" });
    }
    if (!deliveryInfo || !deliveryInfo.fullName || !deliveryInfo.region || !deliveryInfo.phoneNumber || !deliveryInfo.city || !deliveryInfo.address) {
      return res.status(400).json({ success: false, message: "All delivery fields are required" });
    }

    // Validate stock availability for all items before creating the order
    for (const item of items) {
      const product = await Product.findById(item.product);
      if (!product) {
        return res.status(404).json({ success: false, message: `Product not found: ${item.name}` });
      }
      if (product.stock < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for "${product.title || product.name}". Available: ${product.stock}, Requested: ${item.quantity}`,
        });
      }
    }

    const order = await Order.create({
      user: req.user._id,
      items,
      deliveryInfo,
      subtotal,
      shippingFee,
      total,
      status: "pending",
    });

    // Decrement stock for each ordered item
    for (const item of items) {
      await Product.findByIdAndUpdate(item.product, {
        $inc: { stock: -item.quantity },
      });
    }

    // Remove ordered products from user's cart
    const orderedProductIds = items.map((i) => i.product.toString());
    await User.findByIdAndUpdate(req.user._id, {
      $pull: { cartProducts: { $in: orderedProductIds } },
    });

    // Broadcast stock update so other services stay in sync
    console.log(`✅ Stock decremented for ${items.length} item(s) in order ${order._id}`);

    res.status(201).json({ success: true, data: order });
  } catch (err) {
    console.error("placeOrder error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/orders  – get orders for logged-in user
export const getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .populate("items.product");
    res.json({ success: true, data: orders });
  } catch (err) {
    console.error("getMyOrders error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/orders/:id  – get one order for logged-in user
export const getOrderById = async (req, res) => {
  try {
    const { id } = req.params;
    const order = await Order.findById(id).populate("items.product");

    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    if (order.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: "Not authorized" });
    }

    res.json({ success: true, data: order });
  } catch (err) {
    console.error("getOrderById error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};


// esewa signature generation
export const generateSignature = (req, res) => {
  const { total_amount, transaction_uuid, product_code } = req.body;
  const signed_field_names = "total_amount,transaction_uuid,product_code";
  const dataToSign = `total_amount=${total_amount},transaction_uuid=${transaction_uuid},product_code=${product_code}`;
  const secretKey = process.env.ESWEA_SECRET_KEY;
  const signature = crypto.createHmac('sha256', secretKey).update(dataToSign).digest('base64');
  res.json({ signature, signed_field_names });
};

// Verify eSewa payment and update order
export const verifyEsewaPayment = async (req, res) => {
  try {
    const { encodedData, orderId } = req.body;

    // Decode the base64 data from eSewa
    const decodedStr = Buffer.from(encodedData, 'base64').toString('utf-8');
    const paymentData = JSON.parse(decodedStr);

    if (paymentData.status !== 'COMPLETE') {
      return res.status(400).json({ success: false, message: 'Payment not complete' });
    }

    // Verify the signature from eSewa response
    const { signed_field_names, signature } = paymentData;
    const fields = signed_field_names.split(',');
    const dataToSign = fields.map(f => `${f}=${paymentData[f]}`).join(',');
    const secretKey = process.env.ESWEA_SECRET_KEY;
    const computedSignature = crypto.createHmac('sha256', secretKey).update(dataToSign).digest('base64');

    if (computedSignature !== signature) {
      return res.status(400).json({ success: false, message: 'Signature verification failed' });
    }

    // Update order payment status
    const order = await Order.findById(orderId).populate("items.product");
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    order.paymentStatus = 'paid';
    order.paymentMethod = 'esewa';
    order.transactionId = paymentData.transaction_code || paymentData.transaction_uuid;
    order.status = 'processing';
    await order.save();

    // Add purchased products to user's purchasedProducts array
    const productIds = order.items.map(item => item.product._id || item.product);
    await User.findByIdAndUpdate(order.user, {
      $addToSet: { purchasedProducts: { $each: productIds } }
    });

    res.json({ success: true, data: order, message: 'Payment verified successfully' });
  } catch (err) {
    console.error('verifyEsewaPayment error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ADMIN: Get all orders
export const getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find({})
      .populate('user', 'name email')
      .populate('items.product')
      .sort({ createdAt: -1 });

    res.json({ success: true, data: orders });
  } catch (err) {
    console.error('getAllOrders error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ADMIN: Update order status with business rules
export const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid order ID' });
    }

    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    // 🚨 Business Rule: Cannot ship/deliver unpaid orders
    const restrictedStatuses = ['processing', 'shipped', 'delivered'];
    if (restrictedStatuses.includes(status) && order.paymentStatus !== 'paid') {
      return res.status(400).json({
        success: false,
        message: `Cannot move order to ${status}. Payment must be completed first.`,
      });
    }

    // Validate status enum
    const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
      });
    }

    order.status = status;
    await order.save();

    const updatedOrder = await Order.findById(id)
      .populate('user', 'name email')
      .populate('items.product');

    res.json({
      success: true,
      message: 'Order status updated successfully',
      data: updatedOrder,
    });
  } catch (err) {
    console.error('updateOrderStatus error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};