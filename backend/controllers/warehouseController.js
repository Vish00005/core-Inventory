import Warehouse from '../models/warehouseModel.js';

// @desc    Get all warehouses
// @route   GET /api/warehouses
// @access  Private
export const getWarehouses = async (req, res, next) => {
  try {
    const warehouses = await Warehouse.find({});
    res.json(warehouses);
  } catch (error) {
    next(error);
  }
};

// @desc    Get single warehouse
// @route   GET /api/warehouses/:id
// @access  Private
export const getWarehouseById = async (req, res, next) => {
  try {
    const warehouse = await Warehouse.findById(req.params.id);

    if (warehouse) {
      res.json(warehouse);
    } else {
      res.status(404);
      return next(new Error('Warehouse not found'));
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Create a warehouse
// @route   POST /api/warehouses
// @access  Private (Manager/Admin)
export const createWarehouse = async (req, res, next) => {
  try {
    const { name, location, description, rooms } = req.body;

    const warehouseExists = await Warehouse.findOne({ name });
    if (warehouseExists) {
      res.status(400);
      return next(new Error('Warehouse with this name already exists'));
    }

    const warehouse = new Warehouse({
      name,
      location,
      description,
      rooms: rooms && Array.isArray(rooms) && rooms.length > 0 ? rooms : ['Main Area'],
    });

    const createdWarehouse = await warehouse.save();
    res.status(201).json(createdWarehouse);
  } catch (error) {
    next(error);
  }
};

// @desc    Update a warehouse
// @route   PUT /api/warehouses/:id
// @access  Private (Manager/Admin)
export const updateWarehouse = async (req, res, next) => {
  try {
    const { name, location, description, rooms } = req.body;

    const warehouse = await Warehouse.findById(req.params.id);

    if (warehouse) {
      // Check name conflict
      if (name !== warehouse.name) {
        const nameExists = await Warehouse.findOne({ name });
        if (nameExists) {
          res.status(400);
          return next(new Error('Warehouse with this name already exists'));
        }
      }

      warehouse.name = name || warehouse.name;
      warehouse.location = location || warehouse.location;
      warehouse.description = description !== undefined ? description : warehouse.description;
      
      if (rooms && Array.isArray(rooms) && rooms.length > 0) {
        warehouse.rooms = [...new Set(rooms)]; // ensures uniqueness within the array
      }

      const updatedWarehouse = await warehouse.save();
      res.json(updatedWarehouse);
    } else {
      res.status(404);
      return next(new Error('Warehouse not found'));
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a warehouse
// @route   DELETE /api/warehouses/:id
// @access  Private (Admin)
export const deleteWarehouse = async (req, res, next) => {
  try {
    const warehouse = await Warehouse.findById(req.params.id);

    if (warehouse) {
      // We should potentially check if inventory exists in this warehouse here before deleting
      await Warehouse.deleteOne({ _id: warehouse._id });
      res.json({ message: 'Warehouse removed' });
    } else {
      res.status(404);
      return next(new Error('Warehouse not found'));
    }
  } catch (error) {
    next(error);
  }
};
