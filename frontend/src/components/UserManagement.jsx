import React, { useState, useEffect } from 'react';
import { api } from '../api-config';
import { useTheme } from '../contexts/ThemeContext';
import { Users, UserPlus, Edit, Trash2, X, Save, Eye, EyeOff } from 'lucide-react';

const UserManagement = ({ user, onBack }) => {
  const { theme } = useTheme();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [showPassword, setShowPassword] = useState({});

  // Form state
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    role: 'user',
  });

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getUsers();
      setUsers(data.users || []);
    } catch (err) {
      setError(err.message || 'Failed to load users');
      console.error('Error loading users:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddUser = async (e) => {
    e.preventDefault();
    try {
      setError(null);
      setSuccess(null);

      await api.createUser(formData);
      setSuccess('User created successfully!');
      setShowAddForm(false);
      setFormData({ email: '', password: '', name: '', role: 'user' });
      await loadUsers();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err.message || 'Failed to create user');
      console.error('Error creating user:', err);
    }
  };

  const handleEditUser = async (e) => {
    e.preventDefault();
    try {
      setError(null);
      setSuccess(null);

      const updateData = { ...formData };
      if (!updateData.password) {
        delete updateData.password;
      }

      await api.updateUser(editingUser.id, updateData);
      setSuccess('User updated successfully!');
      setEditingUser(null);
      setFormData({ email: '', password: '', name: '', role: 'user' });
      await loadUsers();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err.message || 'Failed to update user');
      console.error('Error updating user:', err);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user?')) {
      return;
    }

    try {
      setError(null);
      setSuccess(null);

      await api.deleteUser(userId);
      setSuccess('User deleted successfully!');
      await loadUsers();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err.message || 'Failed to delete user');
      console.error('Error deleting user:', err);
    }
  };

  const startEdit = (userToEdit) => {
    setEditingUser(userToEdit);
    setFormData({
      email: userToEdit.email,
      password: '',
      name: userToEdit.name || '',
      role: userToEdit.role || 'user',
    });
    setShowAddForm(false);
  };

  const cancelEdit = () => {
    setEditingUser(null);
    setFormData({ email: '', password: '', name: '', role: 'user' });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-brutal-light-bg dark:bg-brutal-dark-bg">
        <div className="text-center card-brutal p-8">
          <div className="w-12 h-12 border-4 border-black dark:border-white border-t-transparent animate-spin mx-auto mb-4"></div>
          <p className="text-black dark:text-white font-bold text-lg">Loading users...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brutal-light-bg dark:bg-brutal-dark-bg p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Users className="w-8 h-8 text-black dark:text-white" />
            <h1 className="text-3xl font-bold text-black dark:text-white">User Management</h1>
          </div>
          <div className="flex gap-3">
            {!showAddForm && !editingUser && (
              <button
                onClick={() => {
                  setShowAddForm(true);
                  setEditingUser(null);
                  setFormData({ email: '', password: '', name: '', role: 'user' });
                }}
                className="btn-brutal flex items-center gap-2 px-4 py-2"
              >
                <UserPlus className="w-5 h-5" />
                Add User
              </button>
            )}
            {onBack && (
              <button
                onClick={onBack}
                className="btn-brutal flex items-center gap-2 px-4 py-2"
              >
                <X className="w-5 h-5" />
                Back
              </button>
            )}
          </div>
        </div>

        {/* Messages */}
        {error && (
          <div className="mb-4 p-4 bg-red-100 dark:bg-red-900 border-2 border-red-500 rounded-lg">
            <p className="text-red-800 dark:text-red-200 font-bold">{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-4 p-4 bg-green-100 dark:bg-green-900 border-2 border-green-500 rounded-lg">
            <p className="text-green-800 dark:text-green-200 font-bold">{success}</p>
          </div>
        )}

        {/* Add User Form */}
        {showAddForm && (
          <div className="card-brutal p-6 mb-6">
            <h2 className="text-2xl font-bold text-black dark:text-white mb-4">Add New User</h2>
            <form onSubmit={handleAddUser} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-black dark:text-white mb-2">
                  Email *
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  className="input-brutal w-full"
                  placeholder="user@example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-black dark:text-white mb-2">
                  Password *
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                  minLength={6}
                  className="input-brutal w-full"
                  placeholder="Minimum 6 characters"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-black dark:text-white mb-2">
                  Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="input-brutal w-full"
                  placeholder="User's full name"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-black dark:text-white mb-2">
                  Role *
                </label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="input-brutal w-full"
                  required
                >
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              <div className="flex gap-3">
                <button type="submit" className="btn-brutal flex items-center gap-2 px-6 py-3">
                  <Save className="w-5 h-5" />
                  Create User
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddForm(false);
                    setFormData({ email: '', password: '', name: '', role: 'user' });
                  }}
                  className="btn-brutal flex items-center gap-2 px-6 py-3"
                >
                  <X className="w-5 h-5" />
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Edit User Form */}
        {editingUser && (
          <div className="card-brutal p-6 mb-6">
            <h2 className="text-2xl font-bold text-black dark:text-white mb-4">Edit User</h2>
            <form onSubmit={handleEditUser} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-black dark:text-white mb-2">
                  Email *
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  className="input-brutal w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-black dark:text-white mb-2">
                  Password (leave blank to keep current)
                </label>
                <div className="relative">
                  <input
                    type={showPassword.edit ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    minLength={6}
                    className="input-brutal w-full pr-12"
                    placeholder="Leave blank to keep current password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword({ ...showPassword, edit: !showPassword.edit })}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-black dark:text-white hover:opacity-70"
                  >
                    {showPassword.edit ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-black dark:text-white mb-2">
                  Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="input-brutal w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-black dark:text-white mb-2">
                  Role *
                </label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="input-brutal w-full"
                  required
                >
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              <div className="flex gap-3">
                <button type="submit" className="btn-brutal flex items-center gap-2 px-6 py-3">
                  <Save className="w-5 h-5" />
                  Save Changes
                </button>
                <button
                  type="button"
                  onClick={cancelEdit}
                  className="btn-brutal flex items-center gap-2 px-6 py-3"
                >
                  <X className="w-5 h-5" />
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Users List */}
        <div className="card-brutal p-6">
          <h2 className="text-2xl font-bold text-black dark:text-white mb-4">All Users</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b-4 border-black dark:border-white">
                  <th className="text-left py-3 px-4 font-black text-black dark:text-white">Email</th>
                  <th className="text-left py-3 px-4 font-black text-black dark:text-white">Name</th>
                  <th className="text-left py-3 px-4 font-black text-black dark:text-white">Role</th>
                  <th className="text-left py-3 px-4 font-black text-black dark:text-white">Created</th>
                  <th className="text-right py-3 px-4 font-black text-black dark:text-white">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr
                    key={u.id}
                    className="border-b-2 border-black dark:border-white hover:bg-gray-100 dark:hover:bg-gray-800"
                  >
                    <td className="py-3 px-4 text-black dark:text-white font-bold">{u.email}</td>
                    <td className="py-3 px-4 text-black dark:text-white">{u.name || '-'}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-3 py-1 border-2 border-black dark:border-white font-bold ${
                          u.role === 'admin'
                            ? 'bg-black dark:bg-white text-white dark:text-black'
                            : 'bg-white dark:bg-black text-black dark:text-white'
                        }`}
                      >
                        {u.role?.toUpperCase() || 'USER'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-black dark:text-white text-sm">
                      {u.created_at ? new Date(u.created_at).toLocaleDateString() : '-'}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => startEdit(u)}
                          className="btn-brutal p-2"
                          title="Edit user"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        {u.id !== user?.id && (
                          <button
                            onClick={() => handleDeleteUser(u.id)}
                            className="btn-brutal p-2"
                            title="Delete user"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {users.length === 0 && (
              <div className="text-center py-8 text-black dark:text-white">
                <p className="font-bold">No users found</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserManagement;

