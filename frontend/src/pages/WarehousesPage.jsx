import React, { useState, useEffect } from "react";
import axios from "axios";
import { useAuthStore } from "../store/authStore";
import { Plus, Edit2, Trash2 } from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const WarehousesPage = () => {
  const { token, user } = useAuthStore();
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(true);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    code: "",
    location: "",
    description: "",
    rooms: "Main Area",
  });
  const [editingId, setEditingId] = useState(null);

  const fetchWarehouses = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_URL}/warehouses`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setWarehouses(res.data);
    } catch (error) {
      console.error("Error fetching warehouses:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWarehouses();
  }, [token]);

  const handleOpenForm = (warehouse = null) => {
    if (warehouse) {
      setEditingId(warehouse._id);
      setFormData({
        name: warehouse.name,
        code: warehouse.code || "",
        location: warehouse.location,
        description: warehouse.description || "",
        rooms: warehouse.rooms ? warehouse.rooms.join(", ") : "Main Area",
      });
    } else {
      setEditingId(null);
      setFormData({
        name: "",
        code: "",
        location: "",
        description: "",
        rooms: "Main Area",
      });
    }
    setIsFormOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Parse rooms from CSV to array
    const roomsArray = formData.rooms
      .split(",")
      .map((r) => r.trim())
      .filter(Boolean);
    const payload = {
      ...formData,
      rooms: roomsArray.length > 0 ? roomsArray : ["Main Area"],
    };

    try {
      if (editingId) {
        await axios.put(`${API_URL}/warehouses/${editingId}`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
      } else {
        await axios.post(`${API_URL}/warehouses`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
      }
      setIsFormOpen(false);
      fetchWarehouses();
    } catch (error) {
      alert(error.response?.data?.message || "Error saving warehouse");
    }
  };

  const handleDelete = async (id) => {
    if (
      !window.confirm(
        "Are you sure you want to delete this warehouse? Ensure it has no inventory first.",
      )
    )
      return;
    try {
      await axios.delete(`${API_URL}/warehouses/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchWarehouses();
    } catch (error) {
      alert(error.response?.data?.message || "Error deleting warehouse");
    }
  };

  const canEdit = user?.role === "admin" || user?.role === "manager";

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Warehouses</h2>
          <p className="text-muted-foreground mt-1">
            Manage physical locations for inventory
          </p>
        </div>

        {canEdit && (
          <button
            onClick={() => handleOpenForm()}
            className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90 transition-colors"
          >
            <Plus size={16} /> Add Warehouse
          </button>
        )}
      </div>

      {isFormOpen && (
        <div className="bg-card border border-border p-6 rounded-xl shadow-sm mb-6">
          <h3 className="text-lg font-semibold mb-4">
            {editingId ? "Edit Warehouse" : "Add New Warehouse"}
          </h3>
          <form
            onSubmit={handleSubmit}
            className="grid grid-cols-1 md:grid-cols-2 gap-4"
          >
            <div>
              <label className="block text-sm font-medium mb-1">
                Warehouse Name
              </label>
              <input
                required
                type="text"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className="w-full border p-2 rounded-md"
                placeholder="e.g. Main Hub"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 uppercase">
                Code (2 Chars)
              </label>
              <input
                required
                type="text"
                maxLength={2}
                value={formData.code}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    code: e.target.value.toUpperCase(),
                  })
                }
                className="w-full border p-2 rounded-md font-mono"
                placeholder="WH"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Location</label>
              <input
                required
                type="text"
                value={formData.location}
                onChange={(e) =>
                  setFormData({ ...formData, location: e.target.value })
                }
                className="w-full border p-2 rounded-md"
                placeholder="e.g. New York, NY"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1">
                Rooms / Zones (comma separated)
              </label>
              <input
                required
                type="text"
                value={formData.rooms}
                onChange={(e) =>
                  setFormData({ ...formData, rooms: e.target.value })
                }
                className="w-full border p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50"
                placeholder="e.g. Main Area, Floor 2, Storage C"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                className="w-full border p-2 rounded-md"
                rows="2"
              ></textarea>
            </div>
            <div className="flex items-center gap-2 md:col-span-2 justify-end">
              <button
                type="button"
                onClick={() => setIsFormOpen(false)}
                className="px-4 py-2 border rounded-md hover:bg-muted"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-primary text-primary-foreground rounded-md"
              >
                Save Warehouse
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full py-8 text-center text-muted-foreground">
            Loading warehouses...
          </div>
        ) : warehouses.length === 0 ? (
          <div className="col-span-full py-8 text-center text-muted-foreground">
            No warehouses found.
          </div>
        ) : (
          warehouses.map((warehouse) => (
            <div
              key={warehouse._id}
              className="bg-card border border-border rounded-xl p-6 shadow-sm flex flex-col h-full hover:shadow-md transition-shadow"
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-semibold">{warehouse.name}</h3>
                  <span className="text-[10px] font-mono font-bold bg-primary/10 text-primary px-1.5 py-0.5 rounded uppercase">
                    {warehouse.code}
                  </span>
                </div>
                {canEdit && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleOpenForm(warehouse)}
                      className="text-muted-foreground hover:text-primary"
                    >
                      <Edit2 size={16} />
                    </button>
                    {user?.role === "admin" && (
                      <button
                        onClick={() => handleDelete(warehouse._id)}
                        className="text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                )}
              </div>
              <div className="text-sm text-foreground mb-4">
                <span className="font-medium text-muted-foreground mr-1">
                  Location:
                </span>{" "}
                {warehouse.location}
              </div>
              <div className="text-sm text-foreground mb-4">
                <span className="font-medium text-muted-foreground mr-1">
                  Rooms:
                </span>{" "}
                {warehouse.rooms?.join(", ") || "Main Area"}
              </div>
              <p className="text-sm text-muted-foreground flex-1">
                {warehouse.description || "No description provided."}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default WarehousesPage;
