import Product from "../models/productModel.js";
import Warehouse from "../models/warehouseModel.js";
import Inventory from "../models/inventoryModel.js";
import Transaction from "../models/transactionModel.js";

// @desc    Get dashboard metrics
// @route   GET /api/dashboard
// @access  Private
export const getDashboardData = async (req, res, next) => {
  try {
    const totalProducts = await Product.countDocuments();
    const allInventory = await Inventory.find().populate(
      "product",
      "category reorderLevel",
    );

    let totalStock = 0;
    let lowStockItems = 0;

    // Calculate stock levels
    allInventory.forEach((inv) => {
      totalStock += inv.quantity;
      if (inv.product && inv.quantity <= inv.product.reorderLevel) {
        lowStockItems++;
      }
    });

    // We can simulate pending deliveries/receipts by looking at transactions,
    // though in a full system these would be "draft" or "pending" status orders.
    // For this demonstration, we'll just count recent transactions as activities.
    const recentActivity = await Transaction.countDocuments({
      createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }, // last 30 days
    });

    // Calculate pending stats
    const pendingReceipts = await Transaction.aggregate([
      { $match: { type: "RECEIPT", status: "PENDING" } },
      { $group: { _id: null, total: { $sum: "$quantity" } } },
    ]);
    const pendingDeliveries = await Transaction.aggregate([
      { $match: { type: "DELIVERY", status: "PENDING" } },
      { $group: { _id: null, total: { $sum: "$quantity" } } },
    ]);

    const toBeReceived =
      pendingReceipts.length > 0 ? pendingReceipts[0].total : 0;
    const toBeDelivered =
      pendingDeliveries.length > 0 ? pendingDeliveries[0].total : 0;

    // Charts data
    // 1. Inventory distribution by category
    const categoryDistribution = {};
    allInventory.forEach((inv) => {
      if (!inv.product) return;
      const cat = inv.product.category || "Uncategorized";
      categoryDistribution[cat] =
        (categoryDistribution[cat] || 0) + inv.quantity;
    });

    const categoryData = Object.keys(categoryDistribution).map((name) => ({
      name,
      value: categoryDistribution[name],
    }));

    // 2. Stock levels by warehouse
    const warehouseInventories = await Inventory.find().populate(
      "warehouse",
      "name",
    );
    const warehouseStock = {};
    warehouseInventories.forEach((inv) => {
      if (!inv.warehouse) return;
      const wName = inv.warehouse.name;
      warehouseStock[wName] = (warehouseStock[wName] || 0) + inv.quantity;
    });

    const warehouseData = Object.keys(warehouseStock).map((name) => ({
      name,
      value: warehouseStock[name],
    }));

    // 3. Transactions over time (e.g., last 6 months or 12 months)
    const pipeline = [
      {
        $match: {
          createdAt: {
            $gte: new Date(new Date().setMonth(new Date().getMonth() - 6)),
          },
        },
      },
      {
        $group: {
          _id: { $month: "$createdAt" },
          count: { $sum: 1 },
          volume: { $sum: "$quantity" },
        },
      },
      {
        $sort: { _id: 1 },
      },
    ];
    const monthlyTransDataRaw = await Transaction.aggregate(pipeline);

    // Map month numbers to names (crude way for demo)
    const monthNames = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    const monthlyTransactions = monthlyTransDataRaw.map((item) => ({
      name: monthNames[item._id - 1],
      transactions: item.count,
      volume: item.volume,
    }));

    res.json({
      kpis: {
        totalProducts,
        totalStock,
        lowStockItems,
        recentActivity,
        toBeReceived,
        toBeDelivered,
      },
      charts: {
        categoryDistribution: categoryData,
        warehouseStock: warehouseData,
        monthlyTransactions,
      },
    });
  } catch (error) {
    next(error);
  }
};
