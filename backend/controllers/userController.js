import User from "../models/userModel.js";

// @desc    Get all users
// @route   GET /api/users
// @access  Private/Admin
export const getUsers = async (req, res, next) => {
  try {
    const users = await User.find({})
      .select("-password")
      .sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    next(error);
  }
};

// @desc    Update user role
// @route   PATCH /api/users/:id/role
// @access  Private/Admin
export const updateUserRole = async (req, res, next) => {
  try {
    const { role } = req.body;

    // Prevent self-demotion or self-change to avoid losing admin access
    if (req.user._id.toString() === req.params.id) {
      res.status(400);
      return next(
        new Error(
          "Admins cannot change their own role. Please ask another admin.",
        ),
      );
    }

    const validRoles = ["admin", "manager", "staff"];
    if (!validRoles.includes(role)) {
      res.status(400);
      return next(new Error("Invalid role specified"));
    }

    const user = await User.findById(req.params.id);

    if (user) {
      user.role = role;
      const updatedUser = await user.save();
      res.json({
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
      });
    } else {
      res.status(404);
      throw new Error("User not found");
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Private/Admin
export const deleteUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);

    if (user) {
      // Prevent self-deletion
      if (req.user._id.toString() === req.params.id) {
        res.status(400);
        return next(new Error("Admins cannot delete their own account."));
      }

      await User.deleteOne({ _id: user._id });
      res.json({ message: "User removed successfully" });
    } else {
      res.status(404);
      return next(new Error("User not found"));
    }
  } catch (error) {
    next(error);
  }
};
