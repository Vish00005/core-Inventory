import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuthStore } from '../store/authStore';
import { UserCog, ShieldCheck, User as UserIcon, ShieldAlert } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const UsersPage = () => {
  const { token, user: currentUser } = useAuthStore();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(null);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_URL}/users`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUsers(res.data);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [token]);

  const handleRoleChange = async (userId, newRole) => {
    if (userId === currentUser._id) {
      alert("You cannot change your own role.");
      return;
    }

    try {
      setUpdating(userId);
      await axios.patch(`${API_URL}/users/${userId}/role`, { role: newRole }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      // Update local state
      setUsers(users.map(u => u._id === userId ? { ...u, role: newRole } : u));
    } catch (error) {
      alert(error.response?.data?.message || 'Error updating role');
    } finally {
      setUpdating(null);
    }
  };

  const getRoleBadge = (role) => {
    switch (role) {
      case 'admin':
        return <span className="flex items-center gap-1 bg-red-500/10 text-red-600 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-red-500/20"><ShieldAlert size={12} /> Admin</span>;
      case 'manager':
        return <span className="flex items-center gap-1 bg-blue-500/10 text-blue-600 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-blue-500/20"><ShieldCheck size={12} /> Manager</span>;
      default:
        return <span className="flex items-center gap-1 bg-slate-500/10 text-slate-600 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-slate-500/20"><UserIcon size={12} /> Staff</span>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">System User Management</h2>
          <p className="text-muted-foreground mt-1">Manage global access control and roles</p>
        </div>
        <div className="bg-primary/10 text-primary px-4 py-2 rounded-xl border border-primary/20 flex items-center gap-2">
           <UserCog size={20} />
           <span className="text-xs font-bold uppercase tracking-widest">{users.length} Active Accounts</span>
        </div>
      </div>

      <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-muted/50 border-b border-border">
              <th className="px-6 py-4 text-[10px] font-black uppercase text-muted-foreground tracking-widest">User Profile</th>
              <th className="px-6 py-4 text-[10px] font-black uppercase text-muted-foreground tracking-widest">Email Address</th>
              <th className="px-6 py-4 text-[10px] font-black uppercase text-muted-foreground tracking-widest">Current Role</th>
              <th className="px-6 py-4 text-[10px] font-black uppercase text-muted-foreground tracking-widest text-right">Administrative Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/50">
            {loading ? (
              <tr>
                <td colSpan="4" className="px-6 py-12 text-center text-muted-foreground">
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    <span className="text-[10px] font-bold uppercase tracking-widest italic">Fetching Directory...</span>
                  </div>
                </td>
              </tr>
            ) : (
              users.map(u => (
                <tr key={u._id} className="hover:bg-muted/30 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                        {u.name.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-bold group-hover:text-primary transition-colors">{u.name}</p>
                        <p className="text-[10px] text-muted-foreground font-mono">ID: {u._id.slice(-8).toUpperCase()}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-xs text-muted-foreground">{u.email}</span>
                  </td>
                  <td className="px-6 py-4">
                    {getRoleBadge(u.role)}
                  </td>
                  <td className="px-6 py-4 text-right">
                    {u._id === currentUser._id ? (
                      <span className="text-[10px] font-black text-muted-foreground/40 italic uppercase tracking-tighter">Current Session</span>
                    ) : (
                      <div className="flex justify-end gap-2">
                        <select 
                          disabled={updating === u._id}
                          value={u.role}
                          onChange={(e) => handleRoleChange(u._id, e.target.value)}
                          className="bg-muted border border-border text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg focus:ring-2 focus:ring-primary/20 appearance-none cursor-pointer hover:bg-muted/80 transition-colors"
                        >
                          <option value="admin">Admin</option>
                          <option value="manager">Manager</option>
                          <option value="staff">Staff</option>
                        </select>
                        {updating === u._id && (
                          <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin my-auto" />
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      
      <div className="bg-orange-500/5 border border-orange-500/10 p-4 rounded-xl flex items-start gap-4">
        <div className="bg-orange-500/20 p-2 rounded-lg text-orange-600">
           <ShieldAlert size={18} />
        </div>
        <div>
          <h4 className="text-xs font-black uppercase text-orange-600 tracking-widest mb-1">Security Warning</h4>
          <p className="text-xs text-orange-600/70 leading-relaxed italic">
            Admins have full visibility into the ledger, inventory adjustments, and user management. Reassigning a role will take effect on the user's next login or session refresh. Use caution when granting global administrative privileges.
          </p>
        </div>
      </div>
    </div>
  );
};

export default UsersPage;
