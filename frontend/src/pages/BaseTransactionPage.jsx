import React, { useState, useEffect } from "react";
import axios from "axios";
import { useAuthStore } from "../store/authStore";
import { useNavigate } from "react-router-dom";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const BaseTransactionPage = ({
  title,
  type,
  endpoint,
  requiresSource,
  requiresDestination,
}) => {
  const { token, user } = useAuthStore();
  const navigate = useNavigate();

  const [products, setProducts] = useState([]);
  const [warehouses, setWarehouses] = useState([]);

  const [items, setItems] = useState([
    { product: "", quantity: 1, warehouse: "", room: "", newQuantity: 0 },
  ]);
  const [sourceWarehouse, setSourceWarehouse] = useState("");
  const [destinationWarehouse, setDestinationWarehouse] = useState("");
  const [sourceRoom, setSourceRoom] = useState("");
  const [destinationRoom, setDestinationRoom] = useState("");
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState("COMPLETED");
  const [submitting, setSubmitting] = useState(false);
  const [pendingQueue, setPendingQueue] = useState([]);
  const [queueLoading, setQueueLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [prodRes, wareRes] = await Promise.all([
          axios.get(`${API_URL}/products`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get(`${API_URL}/warehouses`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);
        setProducts(prodRes.data);
        setWarehouses(wareRes.data);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };
    fetchData();
  }, [token]);

  const fetchQueue = async () => {
    if (type !== "RECEIPT" && type !== "DELIVERY") return;
    try {
      setQueueLoading(true);
      const res = await axios.get(
        `${API_URL}/inventory/transactions?status=PENDING&type=${type}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      setPendingQueue(res.data);
    } catch (error) {
      console.error("Error fetching queue:", error);
    } finally {
      setQueueLoading(false);
    }
  };

  useEffect(() => {
    fetchQueue();
  }, [token, type]);

  const handleAddItem = () => {
    setItems([
      ...items,
      { product: "", quantity: 1, warehouse: "", room: "", newQuantity: 0 },
    ]);
  };

  const handleRemoveItem = (index) => {
    const newItems = [...items];
    newItems.splice(index, 1);
    setItems(newItems);
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...items];
    newItems[index][field] = value;
    // Reset room if warehouse changes
    if (field === "warehouse") {
      newItems[index].room = "";
    }
    setItems(newItems);
  };

  const getWarehouseRooms = (warehouseId) => {
    const warehouse = warehouses.find((w) => w._id === warehouseId);
    return warehouse ? warehouse.rooms || ["Main Area"] : [];
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      // Validate
      if (items.some((item) => !item.product))
        throw new Error("Product is required for all items");
      if (type !== "ADJUSTMENT" && items.some((item) => item.quantity <= 0))
        throw new Error("Quantity must be > 0");
      if (type === "ADJUSTMENT" && items.some((item) => item.newQuantity < 0))
        throw new Error("New quantity cannot be negative");

      const payload = { items: [], notes };

      if (type === "TRANSFER") {
        if (!sourceWarehouse || !destinationWarehouse)
          throw new Error("Source and destination required");
        if (!sourceRoom || !destinationRoom)
          throw new Error("Source and destination rooms required");
        if (
          sourceWarehouse === destinationWarehouse &&
          sourceRoom === destinationRoom
        ) {
          throw new Error(
            "Source and destination cannot be the exact same warehouse and room",
          );
        }
        payload.sourceWarehouse = sourceWarehouse;
        payload.destinationWarehouse = destinationWarehouse;
        payload.sourceRoom = sourceRoom;
        payload.destinationRoom = destinationRoom;
        payload.items = items.map((item) => ({
          product: item.product,
          quantity: Number(item.quantity),
        }));
      } else if (type === "ADJUSTMENT") {
        if (items.some((item) => !item.warehouse || !item.room))
          throw new Error("Warehouse and Room required for all items");
        payload.items = items.map((item) => ({
          product: item.product,
          warehouse: item.warehouse,
          room: item.room,
          newQuantity: Number(item.newQuantity),
        }));
      } else {
        if (items.some((item) => !item.warehouse || !item.room))
          throw new Error("Warehouse and Room required for all items");
        payload.items = items.map((item) => ({
          product: item.product,
          warehouse: item.warehouse,
          room: item.room,
          quantity: Number(item.quantity),
        }));
        payload.status = status;
      }

      await axios.post(`${API_URL}/inventory/${endpoint}`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      navigate("/transactions");
    } catch (error) {
      alert(
        error.response?.data?.message ||
          error.message ||
          "Error processing transaction",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleFinalize = async (txId) => {
    try {
      await axios.post(
        `${API_URL}/inventory/transactions/${txId}/complete`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      fetchQueue();
    } catch (error) {
      alert(error.response?.data?.message || "Error finalizing transaction");
    }
  };

  const canProcess =
    user?.role === "admin" ||
    user?.role === "manager" ||
    (user?.role === "staff" && type !== "ADJUSTMENT");

  if (!canProcess) {
    return (
      <div className="h-full flex items-center justify-center p-8 text-center bg-card rounded-xl border border-border shadow-sm">
        <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
        <p className="text-muted-foreground">
          You do not have permission to process {title.toLowerCase()}.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto space-y-8 max-w-5xl">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">{title}</h2>
          <p className="text-muted-foreground mt-1">
            Process {type.toLowerCase()} transactions
          </p>
        </div>
      </div>

      {/* Main Process Form */}
      <form
        onSubmit={handleSubmit}
        className="bg-card border border-border p-8 rounded-2xl shadow-sm space-y-6"
      >
        <h3 className="text-lg font-semibold border-b border-border pb-3 mb-4 flex items-center gap-2">
          <div className="w-2 h-2 bg-primary rounded-full" /> New Process Entry
        </h3>

        {/* Global Warehouse Selection (for Transfers) */}
        {type === "TRANSFER" && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pb-6 border-b border-border">
            <div>
              <label className="block text-xs font-bold uppercase text-muted-foreground mb-1">
                Source Warehouse
              </label>
              <select
                required
                value={sourceWarehouse}
                onChange={(e) => {
                  setSourceWarehouse(e.target.value);
                  setSourceRoom("");
                }}
                className="w-full border border-input p-2.5 rounded-lg bg-background text-sm focus:ring-2 focus:ring-primary/20"
              >
                <option value="">Select source...</option>
                {warehouses.map((w) => (
                  <option key={w._id} value={w._id}>
                    {w.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold uppercase text-muted-foreground mb-1">
                Source Room
              </label>
              <select
                required
                value={sourceRoom}
                onChange={(e) => setSourceRoom(e.target.value)}
                className="w-full border border-input p-2.5 rounded-lg bg-background text-sm focus:ring-2 focus:ring-primary/20"
              >
                <option value="">Select room...</option>
                {getWarehouseRooms(sourceWarehouse).map((room) => (
                  <option key={room} value={room}>
                    {room}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold uppercase text-muted-foreground mb-1">
                Destination Warehouse
              </label>
              <select
                required
                value={destinationWarehouse}
                onChange={(e) => {
                  setDestinationWarehouse(e.target.value);
                  setDestinationRoom("");
                }}
                className="w-full border border-input p-2.5 rounded-lg bg-background text-sm focus:ring-2 focus:ring-primary/20"
              >
                <option value="">Select destination...</option>
                {warehouses.map((w) => (
                  <option key={w._id} value={w._id}>
                    {w.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold uppercase text-muted-foreground mb-1">
                Destination Room
              </label>
              <select
                required
                value={destinationRoom}
                onChange={(e) => setDestinationRoom(e.target.value)}
                className="w-full border border-input p-2.5 rounded-lg bg-background text-sm focus:ring-2 focus:ring-primary/20"
              >
                <option value="">Select room...</option>
                {getWarehouseRooms(destinationWarehouse).map((room) => (
                  <option key={room} value={room}>
                    {room}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
              Line Items
            </h4>
            <button
              type="button"
              onClick={handleAddItem}
              className="text-xs bg-secondary text-secondary-foreground px-4 py-1.5 rounded-full hover:bg-secondary/80 font-bold transition-all"
            >
              + Add Another SKU
            </button>
          </div>

          <div className="space-y-3">
            {items.map((item, index) => (
              <div
                key={index}
                className="flex flex-col md:flex-row gap-4 items-end bg-muted/20 p-5 rounded-xl border border-border/50 group hover:border-primary/30 transition-all"
              >
                <div className="flex-1 w-full">
                  <label className="block text-[10px] font-black uppercase text-muted-foreground mb-1 tracking-tighter">
                    Product SKU / ID
                  </label>
                  <select
                    required
                    value={item.product}
                    onChange={(e) =>
                      handleItemChange(index, "product", e.target.value)
                    }
                    className="w-full border border-input p-2 rounded-md text-sm bg-background font-medium"
                  >
                    <option value="">Choose item...</option>
                    {products.map((p) => (
                      <option key={p._id} value={p._id}>
                        {p.name} ({p.sku})
                      </option>
                    ))}
                  </select>
                </div>

                {type !== "TRANSFER" && (
                  <>
                    <div className="flex-1 w-full">
                      <label className="block text-[10px] font-black uppercase text-muted-foreground mb-1 tracking-tighter">
                        {type === "RECEIPT"
                          ? "Origin (From Company)"
                          : "Destination (To Customer)"}
                      </label>
                      <select
                        required
                        value={item.warehouse}
                        onChange={(e) =>
                          handleItemChange(index, "warehouse", e.target.value)
                        }
                        className="w-full border border-input p-2 rounded-md text-sm bg-background"
                      >
                        <option value="">Select location...</option>
                        {warehouses.map((w) => (
                          <option key={w._id} value={w._id}>
                            {w.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="w-full md:w-40">
                      <label className="block text-[10px] font-black uppercase text-muted-foreground mb-1 tracking-tighter">
                        Room / Area
                      </label>
                      <select
                        required
                        value={item.room}
                        onChange={(e) =>
                          handleItemChange(index, "room", e.target.value)
                        }
                        className="w-full border border-input p-2 rounded-md text-sm bg-background"
                      >
                        <option value="">Select room...</option>
                        {getWarehouseRooms(item.warehouse).map((room) => (
                          <option key={room} value={room}>
                            {room}
                          </option>
                        ))}
                      </select>
                    </div>
                  </>
                )}

                <div className="w-full md:w-32">
                  <label className="block text-[10px] font-black uppercase text-muted-foreground mb-1 tracking-tighter">
                    {type === "ADJUSTMENT" ? "Target Count" : "Qty"}
                  </label>
                  <input
                    required
                    type="number"
                    min={type === "ADJUSTMENT" ? "0" : "1"}
                    value={
                      type === "ADJUSTMENT" ? item.newQuantity : item.quantity
                    }
                    onChange={(e) =>
                      handleItemChange(
                        index,
                        type === "ADJUSTMENT" ? "newQuantity" : "quantity",
                        e.target.value,
                      )
                    }
                    className="w-full border border-input p-2 rounded-md text-sm bg-background font-bold text-center"
                  />
                </div>

                {items.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveItem(index)}
                    className="p-2 text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                  >
                    <span className="text-xs font-bold">Remove</span>
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="pt-6 border-t border-border grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-xs font-bold uppercase text-muted-foreground mb-1.5">
              Administrative Notes
            </label>
            <textarea
              rows="2"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full border border-input p-3 rounded-xl bg-background text-sm resize-none"
              placeholder="Provide context for this movement..."
            />
          </div>
          {(type === "RECEIPT" || type === "DELIVERY") && (
            <div>
              <label className="block text-xs font-bold uppercase text-muted-foreground mb-1.5">
                Processing Workflow
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full border border-input p-3 rounded-xl bg-background font-medium text-sm"
              >
                {type === "RECEIPT" ? (
                  <>
                    <option value="COMPLETED">Delivered</option>
                    <option value="PENDING">Ordered</option>
                  </>
                ) : (
                  <>
                    <option value="COMPLETED">Dispatched</option>
                    <option value="PENDING">Ordered</option>
                  </>
                )}
              </select>
              <p className="mt-2 text-[10px] text-muted-foreground italic">
                {status === "PENDING"
                  ? "* Record will be held in the Finalization Queue."
                  : "* This will instantly commit the stock change."}
              </p>
            </div>
          )}
        </div>

        <div className="flex justify-end pt-4">
          <button
            type="submit"
            disabled={submitting}
            className={`px-10 py-3 bg-primary text-primary-foreground rounded-full font-black uppercase tracking-widest text-xs transition-all shadow-lg hover:shadow-primary/20 ${submitting ? "opacity-70 cursor-not-allowed" : "hover:scale-[1.02] active:scale-95"}`}
          >
            {submitting
              ? "Authenticating..."
              : `Commit ${title.split(" ")[1] || title}`}
          </button>
        </div>
      </form>

      {/* Pending Queue Section (Refactored to Table Layout) */}
      {(type === "RECEIPT" || type === "DELIVERY") && (
        <div className="space-y-4 pt-8">
          <div className="flex items-center justify-between px-2">
            <div>
              <h3 className="text-xl font-bold flex items-center gap-2 text-foreground">
                Finalization Queue
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-widest bg-muted px-2 py-0.5 rounded">
                  Pending {type.toLowerCase()}s
                </span>
              </h3>
            </div>
            <div className="flex items-center gap-2 bg-orange-500/10 text-orange-600 text-[10px] px-3 py-1 rounded-full border border-orange-500/20 font-black tracking-widest uppercase">
              <div className="w-1.5 h-1.5 bg-orange-500 rounded-full animate-pulse" />
              {pendingQueue.length} Action{pendingQueue.length !== 1 ? "s" : ""}{" "}
              Required
            </div>
          </div>

          <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-muted/50 border-b border-border">
                  <th className="px-6 py-4 text-[10px] font-black uppercase text-muted-foreground tracking-widest">
                    Date / Time
                  </th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase text-muted-foreground tracking-widest">
                    Product SKU
                  </th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase text-muted-foreground tracking-widest">
                    Quantity
                  </th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase text-muted-foreground tracking-widest">
                    {type === "RECEIPT"
                      ? "Target Location (Inbound)"
                      : "Source Location (Outbound)"}
                  </th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase text-muted-foreground tracking-widest text-right">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {queueLoading ? (
                  <tr>
                    <td
                      colSpan="5"
                      className="px-6 py-12 text-center text-muted-foreground"
                    >
                      <div className="flex flex-col items-center gap-2">
                        <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                        <span className="text-[10px] font-bold uppercase tracking-widest">
                          Refreshing Logistics...
                        </span>
                      </div>
                    </td>
                  </tr>
                ) : pendingQueue.length === 0 ? (
                  <tr>
                    <td
                      colSpan="5"
                      className="px-6 py-12 text-center text-muted-foreground"
                    >
                      <p className="text-sm italic">
                        Workspace is clean. No pending {type.toLowerCase()}{" "}
                        items.
                      </p>
                    </td>
                  </tr>
                ) : (
                  pendingQueue.map((tx) => (
                    <tr
                      key={tx._id}
                      className="hover:bg-muted/30 transition-colors group"
                    >
                      <td className="px-6 py-4">
                        <span className="text-xs text-muted-foreground block">
                          {new Date(tx.createdAt).toLocaleDateString()}
                        </span>
                        <span className="text-[10px] text-muted-foreground font-mono">
                          {new Date(tx.createdAt).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm font-bold group-hover:text-primary transition-colors">
                          {tx.product?.name}
                        </p>
                        <p className="text-[10px] text-muted-foreground font-mono uppercase">
                          {tx.product?.sku}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-xl font-black text-foreground">
                          x{tx.quantity}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-xs font-bold leading-tight uppercase">
                          {tx.destinationWarehouse?.name ||
                            tx.sourceWarehouse?.name}
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                          {tx.destinationRoom || tx.sourceRoom}
                        </p>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          type="button"
                          onClick={() => handleFinalize(tx._id)}
                          className="bg-primary text-primary-foreground px-5 py-2 rounded-lg hover:bg-primary/90 font-black text-[10px] uppercase tracking-widest transition-all shadow-sm active:scale-95"
                        >
                          Finalize Item
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default BaseTransactionPage;
