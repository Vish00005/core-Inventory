import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuthStore } from '../store/authStore';
import { useNavigate } from 'react-router-dom';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line
} from 'recharts';
import { Package, Archive, Layers, Activity, ArrowDownRight, ArrowUpRight } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

const StatCard = ({ title, value, icon, description, link }) => {
  const navigate = useNavigate();
  return (
    <div 
      onClick={() => link && navigate(link)}
      className={`bg-card border border-border rounded-xl p-6 shadow-sm hover:shadow-md transition-all cursor-pointer group active:scale-[0.98] ${link ? 'hover:border-primary/50' : ''}`}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-muted-foreground group-hover:text-primary transition-colors">{title}</h3>
        <div className="p-2 bg-primary/10 rounded-lg text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-all">
          {icon}
        </div>
      </div>
      <div className="text-3xl font-bold text-foreground mb-1">{value}</div>
      {description && <p className="text-xs text-muted-foreground">{description}</p>}
    </div>
  );
};

const DashboardPage = () => {
  const { token } = useAuthStore();
  const [data, setData] = useState({ kpis: {}, charts: {} });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const res = await axios.get(`${API_URL}/dashboard`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setData(res.data);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, [token]);

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const { kpis, charts } = data;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        <p className="text-muted-foreground mt-1">Overview of your inventory and activities</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Total Products" 
          value={kpis?.totalProducts || 0} 
          icon={<Package size={20} />} 
          description="Unique SKUs in catalog"
          link="/products"
        />
        <StatCard 
          title="Total Stock" 
          value={kpis?.totalStock || 0} 
          icon={<Archive size={20} />} 
          description="Total items across all warehouses"
          link="/inventory"
        />
        <StatCard 
          title="Low Stock Items" 
          value={kpis?.lowStockItems || 0} 
          icon={<Layers size={20} className={kpis?.lowStockItems > 0 ? 'text-destructive' : ''} />} 
          description="Items below reorder level"
          link="/inventory"
        />
        <StatCard 
          title="Recent Activity" 
          value={kpis?.recentActivity || 0} 
          icon={<Activity size={20} />} 
          description="Transactions in last 30 days"
          link="/transactions"
        />
        <StatCard 
          title="To be Received" 
          value={kpis?.toBeReceived || 0} 
          icon={<ArrowDownRight size={20} className="text-orange-500" />} 
          description="Ordered stock pending arrival"
          link="/transactions"
        />
        <StatCard 
          title="To be Delivered" 
          value={kpis?.toBeDelivered || 0} 
          icon={<ArrowUpRight size={20} className="text-blue-500" />} 
          description="Placed orders pending delivery"
          link="/transactions"
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Distribution Chart */}
        <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
          <h3 className="text-lg font-semibold mb-6">Inventory by Category</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={charts?.categoryDistribution || []}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  fill="#8884d8"
                  paddingAngle={5}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {(charts?.categoryDistribution || []).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ borderRadius: '8px', border: '1px solid var(--border)' }}
                  itemStyle={{ color: 'var(--foreground)' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Warehouse Stock Chart */}
        <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
          <h3 className="text-lg font-semibold mb-6">Stock by Warehouse</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts?.warehouseStock || []} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: 'var(--muted-foreground)'}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: 'var(--muted-foreground)'}} />
                <Tooltip 
                  cursor={{fill: 'var(--muted)', opacity: 0.4}}
                  contentStyle={{ borderRadius: '8px', border: '1px solid var(--border)', backgroundColor: 'var(--background)' }}
                />
                <Bar dataKey="value" fill="var(--primary)" radius={[4, 4, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Monthly Transactions Trend */}
        <div className="bg-card border border-border rounded-xl p-6 shadow-sm lg:col-span-2">
          <h3 className="text-lg font-semibold mb-6">Transaction Activity (Last 6 Months)</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={charts?.monthlyTransactions || []} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: 'var(--muted-foreground)'}} />
                <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{fill: 'var(--muted-foreground)'}} />
                <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{fill: 'var(--muted-foreground)'}} />
                <Tooltip 
                  contentStyle={{ borderRadius: '8px', border: '1px solid var(--border)', backgroundColor: 'var(--background)' }}
                />
                <Legend iconType="circle" />
                <Line yAxisId="left" type="monotone" name="Transactions Count" dataKey="transactions" stroke="var(--primary)" strokeWidth={3} activeDot={{ r: 8 }} />
                <Line yAxisId="right" type="monotone" name="Volume Handled" dataKey="volume" stroke="#10b981" strokeWidth={3} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
