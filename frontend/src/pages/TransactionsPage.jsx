import React, { useState, useEffect } from "react";
import axios from "axios";
import { useAuthStore } from "../store/authStore";
import {
  RefreshCw,
  Search,
  ArrowDownRight,
  ArrowUpRight,
  ArrowRight,
  Settings,
} from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const TransactionsPage = () => {
  const { token } = useAuthStore();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [expandedId, setExpandedId] = useState(null);
  const [updating, setUpdating] = useState(false);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_URL}/inventory/transactions`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setTransactions(res.data);
    } catch (error) {
      console.error("Error fetching transactions:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [token]);

  const filteredTransactions = transactions.filter((tx) => {
    const matchesSearch =
      tx.product?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tx.product?.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tx.notes?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesType = typeFilter ? tx.type === typeFilter : true;
    const matchesStatus = statusFilter ? tx.status === statusFilter : true;
    return matchesSearch && matchesType && matchesStatus;
  });

  const getTypeIcon = (type) => {
    switch (type) {
      case "RECEIPT":
        return (
          <div className="p-1.5 bg-green-500/10 text-green-600 rounded-md">
            <ArrowDownRight size={16} />
          </div>
        );
      case "DELIVERY":
        return (
          <div className="p-1.5 bg-red-500/10 text-red-600 rounded-md">
            <ArrowUpRight size={16} />
          </div>
        );
      case "TRANSFER":
        return (
          <div className="p-1.5 bg-blue-500/10 text-blue-600 rounded-md">
            <ArrowRight size={16} />
          </div>
        );
      case "ADJUSTMENT":
        return (
          <div className="p-1.5 bg-purple-500/10 text-purple-600 rounded-md">
            <Settings size={16} />
          </div>
        );
      default:
        return <RefreshCw size={16} />;
    }
  };

  const handleComplete = async (id) => {
    try {
      await axios.post(
        `${API_URL}/inventory/transactions/${id}/complete`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      fetchTransactions();
    } catch (error) {
      alert(error.response?.data?.message || "Error completing transaction");
    }
  };

  const handleStatusChange = async (txId, newStatus) => {
    try {
      setUpdating(true);
      await axios.patch(
        `${API_URL}/inventory/transactions/${txId}/status`,
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      await fetchTransactions();
      setExpandedId(null);
    } catch (error) {
      alert(error.response?.data?.message || "Error updating status");
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">
            Transaction Ledger
          </h2>
          <p className="text-muted-foreground mt-1">
            History of all inventory movements
          </p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <select
            className="border border-input bg-background rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
          >
            <option value="">All Types</option>
            <option value="RECEIPT">Receipts</option>
            <option value="DELIVERY">Deliveries</option>
            <option value="TRANSFER">Transfers</option>
            <option value="ADJUSTMENT">Adjustments</option>
          </select>

          <select
            className="border border-input bg-background rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">All Status</option>
            <option value="PENDING">Pending</option>
            <option value="COMPLETED">Completed</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
          <div className="relative flex-1 sm:w-56">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search product..."
              className="pl-9 pr-4 py-2 border border-input bg-background rounded-md w-full focus:outline-none focus:ring-2 focus:ring-primary/50"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <button
            onClick={fetchTransactions}
            className="p-2 border rounded-md hover:bg-muted text-muted-foreground transition-colors"
            title="Refresh"
          >
            <RefreshCw size={18} />
          </button>
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left whitespace-nowrap">
            <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b border-border">
              <tr>
                <th className="px-6 py-3">Date</th>
                <th className="px-6 py-3">ID</th>
                <th className="px-6 py-3">Type</th>
                <th className="px-6 py-3">Product</th>
                <th className="px-6 py-3">Qty</th>
                <th className="px-6 py-3">Source</th>
                <th className="px-6 py-3">Destination</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan="9"
                    className="px-6 py-8 text-center text-muted-foreground"
                  >
                    Loading transactions...
                  </td>
                </tr>
              ) : filteredTransactions.length === 0 ? (
                <tr>
                  <td
                    colSpan="9"
                    className="px-6 py-8 text-center text-muted-foreground"
                  >
                    No transactions found.
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((tx) => (
                  <React.Fragment key={tx._id}>
                    <tr
                      className={`border-b border-border hover:bg-muted/50 cursor-pointer transition-colors ${expandedId === tx._id ? "bg-muted/30" : ""}`}
                      onClick={() =>
                        setExpandedId(expandedId === tx._id ? null : tx._id)
                      }
                    >
                      <td className="px-6 py-4 text-muted-foreground">
                        {new Date(tx.createdAt).toLocaleString()}
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-mono text-xs font-bold text-primary bg-primary/5 px-2 py-1 rounded">
                          {tx.formattedId ||
                            tx._id.toString().substring(0, 8).toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {getTypeIcon(tx.type)}
                          <span className="font-medium text-xs tracking-wider">
                            {tx.type}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-medium">
                        {tx.product?.name || "Unknown"}{" "}
                        <span className="text-xs text-muted-foreground block">
                          {tx.product?.sku}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-bold">{tx.quantity}</td>
                      <td className="px-6 py-4 text-muted-foreground">
                        {tx.sourceWarehouse?.name ||
                          (tx.type === "RECEIPT" ? (
                            <span className="text-primary/60 italic font-medium">
                              Company
                            </span>
                          ) : (
                            "-"
                          ))}
                        {tx.sourceRoom && (
                          <span className="text-xs block text-primary/70">
                            {tx.sourceRoom}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-muted-foreground">
                        {tx.destinationWarehouse?.name ||
                          (tx.type === "DELIVERY" ? (
                            <span className="text-primary/60 italic font-medium">
                              Customer
                            </span>
                          ) : (
                            "-"
                          ))}
                        {tx.destinationRoom && (
                          <span className="text-xs block text-primary/70">
                            {tx.destinationRoom}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-2.5 py-1 rounded-full text-xs font-medium border ${
                            tx.status === "COMPLETED"
                              ? "bg-green-500/10 text-green-600 border-green-500/20"
                              : tx.status === "PENDING"
                                ? "bg-orange-500/10 text-orange-600 border-orange-500/20"
                                : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {tx.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        {tx.status === "PENDING" && (
                          <button
                            onClick={() => handleComplete(tx._id)}
                            className="text-xs bg-primary text-primary-foreground px-3 py-1.5 rounded-md hover:bg-primary/90 transition-colors"
                          >
                            Complete
                          </button>
                        )}
                      </td>
                    </tr>

                    {expandedId === tx._id && (
                      <tr className="bg-muted/20 animate-in slide-in-from-top-1 duration-200">
                        <td
                          colSpan="9"
                          className="px-6 py-6 border-b border-border"
                        >
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            {/* Col 1: Metadata */}
                            <div className="space-y-4">
                              <div>
                                <p className="text-[10px] uppercase font-bold text-muted-foreground mb-1">
                                  Transaction ID
                                </p>
                                <p className="font-mono text-xs font-bold text-primary">
                                  {tx.formattedId || tx._id}
                                </p>
                              </div>
                              <div>
                                <p className="text-[10px] uppercase font-bold text-muted-foreground mb-1">
                                  Processed By
                                </p>
                                <p className="text-sm font-medium">
                                  {tx.createdBy?.name || "System / Unknown"}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {tx.createdBy?.email}
                                </p>
                              </div>
                              {tx.notes && (
                                <div>
                                  <p className="text-[10px] uppercase font-bold text-muted-foreground mb-1">
                                    Notes
                                  </p>
                                  <p className="text-sm italic bg-background/50 p-2 rounded border border-border">
                                    "{tx.notes}"
                                  </p>
                                </div>
                              )}
                            </div>

                            {/* Col 2: Product & Path */}
                            <div className="space-y-4">
                              <div>
                                <p className="text-[10px] uppercase font-bold text-muted-foreground mb-1">
                                  Product Details
                                </p>
                                <p className="text-sm font-bold">
                                  {tx.product?.name}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  SKU: {tx.product?.sku}
                                </p>
                              </div>
                              <div className="p-3 bg-background/50 rounded-lg border border-border">
                                <div className="mb-2">
                                  <p className="text-[10px] uppercase font-bold text-muted-foreground">
                                    From
                                  </p>
                                  <p className="text-xs font-medium">
                                    {tx.sourceWarehouse
                                      ? `${tx.sourceWarehouse.name} › ${tx.sourceRoom}`
                                      : tx.type === "RECEIPT"
                                        ? "Distributor / Company"
                                        : "N/A"}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-[10px] uppercase font-bold text-muted-foreground">
                                    To
                                  </p>
                                  <p className="text-xs font-medium">
                                    {tx.destinationWarehouse
                                      ? `${tx.destinationWarehouse.name} › ${tx.destinationRoom}`
                                      : tx.type === "DELIVERY"
                                        ? "Customer"
                                        : "N/A"}
                                  </p>
                                </div>
                              </div>
                            </div>

                            {/* Col 3: Actions & Status */}
                            <div className="flex flex-col justify-between items-end">
                              <div className="text-right">
                                <p className="text-[10px] uppercase font-bold text-muted-foreground mb-1">
                                  Current Status
                                </p>
                                <span
                                  className={`px-3 py-1 rounded-full text-xs font-black tracking-widest uppercase border ${
                                    tx.status === "COMPLETED"
                                      ? "bg-green-500/10 text-green-600 border-green-500/20"
                                      : tx.status === "PENDING"
                                        ? "bg-orange-500/10 text-orange-600 border-orange-500/20"
                                        : "bg-muted text-muted-foreground"
                                  }`}
                                >
                                  {tx.status}
                                </span>
                              </div>

                              {tx.status === "PENDING" ? (
                                <div className="w-full space-y-2 mt-4">
                                  <button
                                    disabled={updating}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleComplete(tx._id);
                                    }}
                                    className="w-full bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90 transition-all text-xs font-bold shadow-sm"
                                  >
                                    {updating
                                      ? "Processing..."
                                      : "Mark as Completed"}
                                  </button>
                                  <button
                                    disabled={updating}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleStatusChange(tx._id, "CANCELLED");
                                    }}
                                    className="w-full border border-destructive/30 text-destructive hover:bg-destructive/5 px-4 py-2 rounded-md transition-all text-xs font-bold"
                                  >
                                    Void Transaction
                                  </button>
                                </div>
                              ) : (
                                <div className="flex items-center gap-2 text-muted-foreground text-[10px] font-bold uppercase mt-4">
                                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                                  Record Finalized & Locked
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Removed Transaction Detail Modal */}
    </div>
  );
};

export default TransactionsPage;
