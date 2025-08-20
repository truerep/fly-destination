const User = require('../models/User');
const ResponseHandler = require('../utils/responseHandler');
const smsService = require('../services/smsService');

class UserController {
  async getAllUsers(req, res) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const skip = (page - 1) * limit;

      const filter = {};
      if (req.query.userType) filter.userType = req.query.userType;
      if (req.query.isActive !== undefined) filter.isActive = req.query.isActive === 'true';
      if (req.query.isApproved !== undefined) filter.isApproved = req.query.isApproved === 'true';
      if (req.query.isBlocked !== undefined) filter.isBlocked = req.query.isBlocked === 'true';
      if (req.query.search) {
        filter.$or = [
          { email: { $regex: req.query.search, $options: 'i' } },
          { phoneNumber: { $regex: req.query.search, $options: 'i' } },
          { companyName: { $regex: req.query.search, $options: 'i' } },
          { contactPersonName: { $regex: req.query.search, $options: 'i' } },
          { agentId: { $regex: req.query.search, $options: 'i' } }
        ];
      }

      const users = await User.find(filter)
        .select('-password -phoneOtp -emailOtp')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

      const total = await User.countDocuments(filter);

      return ResponseHandler.success(res, {
        users,
        pagination: { page, limit, total, pages: Math.ceil(total / limit) }
      }, 'Users retrieved successfully');

    } catch (error) {
      console.error('Get all users error:', error);
      return ResponseHandler.error(res, 'Failed to retrieve users');
    }
  }

  async getUserById(req, res) {
    try {
      const { id } = req.params;
      const user = await User.findById(id).select('-password -phoneOtp -emailOtp');
      
      if (!user) {
        return ResponseHandler.notFound(res, 'User not found');
      }

      return ResponseHandler.success(res, { user }, 'User retrieved successfully');
    } catch (error) {
      console.error('Get user by ID error:', error);
      return ResponseHandler.error(res, 'Failed to retrieve user');
    }
  }

  async createUser(req, res) {
    try {
      const userData = req.body;
      
      const existingUser = await User.findOne({
        $or: [{ email: userData.email }, { phoneNumber: userData.phoneNumber }]
      });

      if (existingUser) {
        return ResponseHandler.conflict(res, 'User with this email or phone number already exists');
      }

      userData.isEmailVerified = true;
      userData.isPhoneVerified = true;

      const user = new User(userData);
      await user.save();

      // Prepare success message based on user type
      let successMessage = 'User created successfully';
      if (userData.userType === 'agent') {
        successMessage = `Agent created successfully with ID: ${user.agentId}`;
      }

      return ResponseHandler.success(res, {
        user: user.toPublicJSON()
      }, successMessage, 201);

    } catch (error) {
      console.error('Create user error:', error);
      
      // Handle specific agent ID generation errors
      if (error.message.includes('Unable to generate unique agent ID')) {
        return ResponseHandler.error(res, 'User creation failed: Unable to generate unique agent ID. Please try again.');
      }
      
      return ResponseHandler.error(res, 'Failed to create user');
    }
  }

  async updateUser(req, res) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      delete updateData.password;
      delete updateData.phoneOtp;
      delete updateData.emailOtp;
      delete updateData.agentId; // Prevent manual agentId updates

      const user = await User.findByIdAndUpdate(
        id,
        updateData,
        { new: true, runValidators: true }
      ).select('-password -phoneOtp -emailOtp');

      if (!user) {
        return ResponseHandler.notFound(res, 'User not found');
      }

      return ResponseHandler.success(res, { user }, 'User updated successfully');
    } catch (error) {
      console.error('Update user error:', error);
      return ResponseHandler.error(res, 'Failed to update user');
    }
  }

  async deleteUser(req, res) {
    try {
      const { id } = req.params;
      const user = await User.findById(id);
      
      if (!user) {
        return ResponseHandler.notFound(res, 'User not found');
      }

      if (user.userType === 'admin') {
        return ResponseHandler.forbidden(res, 'Cannot delete admin users');
      }

      await User.findByIdAndDelete(id);
      return ResponseHandler.success(res, null, 'User deleted successfully');
    } catch (error) {
      console.error('Delete user error:', error);
      return ResponseHandler.error(res, 'Failed to delete user');
    }
  }

  async blockUser(req, res) {
    try {
      const { id } = req.params;
      const { reason } = req.body;

      const user = await User.findById(id);
      if (!user) {
        return ResponseHandler.notFound(res, 'User not found');
      }

      if (user.userType === 'admin') {
        return ResponseHandler.forbidden(res, 'Cannot block admin users');
      }

      user.isBlocked = true;
      await user.save();

      await smsService.sendStatusUpdate(user.phoneNumber, 'blocked', reason || '');

      return ResponseHandler.success(res, {
        user: user.toPublicJSON()
      }, 'User blocked successfully');
    } catch (error) {
      console.error('Block user error:', error);
      return ResponseHandler.error(res, 'Failed to block user');
    }
  }

  async unblockUser(req, res) {
    try {
      const { id } = req.params;
      const user = await User.findById(id);
      
      if (!user) {
        return ResponseHandler.notFound(res, 'User not found');
      }

      user.isBlocked = false;
      await user.save();

      await smsService.sendStatusUpdate(user.phoneNumber, 'unblocked');

      return ResponseHandler.success(res, {
        user: user.toPublicJSON()
      }, 'User unblocked successfully');
    } catch (error) {
      console.error('Unblock user error:', error);
      return ResponseHandler.error(res, 'Failed to unblock user');
    }
  }

  async activateUser(req, res) {
    try {
      const { id } = req.params;
      const user = await User.findById(id);
      
      if (!user) {
        return ResponseHandler.notFound(res, 'User not found');
      }

      user.isActive = true;
      await user.save();

      return ResponseHandler.success(res, {
        user: user.toPublicJSON()
      }, 'User activated successfully');
    } catch (error) {
      console.error('Activate user error:', error);
      return ResponseHandler.error(res, 'Failed to activate user');
    }
  }

  async deactivateUser(req, res) {
    try {
      const { id } = req.params;
      const user = await User.findById(id);
      
      if (!user) {
        return ResponseHandler.notFound(res, 'User not found');
      }

      if (user.userType === 'admin') {
        return ResponseHandler.forbidden(res, 'Cannot deactivate admin users');
      }

      user.isActive = false;
      await user.save();

      return ResponseHandler.success(res, {
        user: user.toPublicJSON()
      }, 'User deactivated successfully');
    } catch (error) {
      console.error('Deactivate user error:', error);
      return ResponseHandler.error(res, 'Failed to deactivate user');
    }
  }

  // Admin: approve agent account
  async approveUser(req, res) {
    try {
      const { id } = req.params;
      const user = await User.findById(id);
      if (!user) {
        return ResponseHandler.notFound(res, 'User not found');
      }
      if (user.userType !== 'agent') {
        return ResponseHandler.forbidden(res, 'Only agent accounts require approval');
      }
      user.isApproved = true;
      user.isActive = true;
      await user.save();
      return ResponseHandler.success(res, { user: user.toPublicJSON() }, 'Agent approved successfully');
    } catch (error) {
      console.error('Approve user error:', error);
      return ResponseHandler.error(res, 'Failed to approve user');
    }
  }

  async getUserStats(req, res) {
    try {
      const totalUsers = await User.countDocuments();
      const activeUsers = await User.countDocuments({ isActive: true });
      const blockedUsers = await User.countDocuments({ isBlocked: true });
      const agents = await User.countDocuments({ userType: 'agent' });
      const customers = await User.countDocuments({ userType: 'customer' });
      const admins = await User.countDocuments({ userType: 'admin' });
      const verifiedUsers = await User.countDocuments({ 
        $and: [{ isEmailVerified: true }, { isPhoneVerified: true }] 
      });

      const stats = {
        total: totalUsers,
        active: activeUsers,
        blocked: blockedUsers,
        verified: verifiedUsers,
        byType: { agents, customers, admins }
      };

      return ResponseHandler.success(res, { stats }, 'User statistics retrieved successfully');
    } catch (error) {
      console.error('Get user stats error:', error);
      return ResponseHandler.error(res, 'Failed to retrieve user statistics');
    }
  }

  async searchUsers(req, res) {
    try {
      const { q, userType, isActive, isBlocked } = req.query;
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const skip = (page - 1) * limit;

      const filter = {};
      
      if (q) {
        filter.$or = [
          { email: { $regex: q, $options: 'i' } },
          { phoneNumber: { $regex: q, $options: 'i' } },
          { companyName: { $regex: q, $options: 'i' } },
          { contactPersonName: { $regex: q, $options: 'i' } },
          { gst: { $regex: q, $options: 'i' } },
          { pan: { $regex: q, $options: 'i' } },
          { agentId: { $regex: q, $options: 'i' } }
        ];
      }

      if (userType) filter.userType = userType;
      if (isActive !== undefined) filter.isActive = isActive === 'true';
      if (isBlocked !== undefined) filter.isBlocked = isBlocked === 'true';

      const users = await User.find(filter)
        .select('-password -phoneOtp -emailOtp')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

      const total = await User.countDocuments(filter);

      return ResponseHandler.success(res, {
        users,
        pagination: { page, limit, total, pages: Math.ceil(total / limit) }
      }, 'Search completed successfully');
    } catch (error) {
      console.error('Search users error:', error);
      return ResponseHandler.error(res, 'Failed to search users');
    }
  }

  // Agent updates own marker amount
  async updateMyMarkerAmount(req, res) {
    try {
      const { markerAmount } = req.body;
      if (typeof markerAmount === 'undefined' || Number(markerAmount) < 0) {
        return ResponseHandler.validationError(res, [{ field: 'markerAmount', message: 'markerAmount must be >= 0', value: markerAmount }]);
      }
      const user = await User.findByIdAndUpdate(req.user._id, { markerAmount: Number(markerAmount) }, { new: true });
      return ResponseHandler.success(res, user.toPublicJSON(), 'Marker amount updated');
    } catch (error) {
      return ResponseHandler.error(res, error.message || 'Failed to update marker amount');
    }
  }
}

module.exports = new UserController(); 