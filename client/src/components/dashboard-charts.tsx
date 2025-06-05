import { useQuery } from "@tanstack/react-query";
import { BarChart3, PieChart, Activity, Clock } from "lucide-react";
import type { Task } from "@shared/schema";
import { LineChart, Line, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { Users } from "lucide-react";

// Componente per grafico a barre settimanale
const WeeklyBarChart = () => {
	const { data: allTasks = [] } = useQuery<Task[]>({ queryKey: ["/api/tasks"] });
	// Calcola i dati per gli ultimi 7 giorni
	const days = ["Dom", "Lun", "Mar", "Mer", "Gio", "Ven", "Sab"];
	const today = new Date();
	const weekData = Array.from({ length: 7 }).map((_, i) => {
		const d = new Date(today);
		d.setDate(today.getDate() - (6 - i));
		const dayName = days[d.getDay()];
		const completed = allTasks.filter(t => t.completed && sameDay(new Date(t.completedAt || t.dueDate || t.createdAt), d)).length;
		const total = allTasks.filter(t => sameDay(new Date(t.dueDate || t.createdAt), d)).length;
		return { day: dayName, completed, total };
	});
	const maxTotal = Math.max(...weekData.map(d => d.total), 1);
	function sameDay(a: Date, b: Date) {
		return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
	}
	return (
		<div className="bg-white rounded-2xl shadow-md border border-gray-100 p-6">
			<div className="flex items-center justify-between mb-6">
				<div>
					<h3 className="text-lg font-semibold text-gray-900">Attività Settimanali</h3>
					<p className="text-sm text-gray-600">Completate vs Totali</p>
				</div>
				<BarChart3 className="h-6 w-6 text-blue-600" />
			</div>
			<div className="space-y-4">
				{weekData.map((data, index) => (
					<div key={index} className="flex items-center space-x-4">
						<div className="w-8 text-sm font-medium text-gray-600">{data.day}</div>
						<div className="flex-1 flex items-center space-x-2">
							<div className="flex-1 bg-gray-200 rounded-full h-3 relative overflow-hidden">
								<div className="bg-gradient-to-r from-blue-500 to-blue-600 h-full rounded-full transition-all duration-500 ease-in-out" style={{ width: `${(data.completed / (data.total || 1)) * 100}%` }}></div>
								<div className="absolute top-0 right-0 w-1 h-full bg-gray-400" style={{ right: `${100 - (data.total / maxTotal) * 100}%` }}></div>
							</div>
							<div className="text-xs text-gray-500 min-w-fit">{data.completed}/{data.total}</div>
						</div>
					</div>
				))}
			</div>
			<div className="mt-4 pt-4 border-t border-gray-100">
				<div className="flex items-center justify-between text-sm">
					<span className="text-gray-600">Media completamento</span>
					<span className="font-semibold text-green-600">
						{weekData.length > 0 ? Math.round((weekData.reduce((acc, d) => acc + (d.completed / (d.total || 1)), 0) / weekData.length) * 100) : 0}%
					</span>
				</div>
			</div>
		</div>
	);
};

// Componente per distribuzione per categoria
const CategoryDistribution = () => {
	const { data: allTasks = [] } = useQuery<Task[]>({ queryKey: ["/api/tasks"] });
	const categoryMap: Record<string, { count: number; color: string }> = {};
	const colorPalette = ["bg-blue-500", "bg-green-500", "bg-red-500", "bg-purple-500", "bg-orange-500", "bg-pink-500"];
	allTasks.forEach((t, i) => {
		if (!t.category) return;
		if (!categoryMap[t.category]) {
			categoryMap[t.category] = { count: 0, color: colorPalette[Object.keys(categoryMap).length % colorPalette.length] };
		}
		categoryMap[t.category].count++;
	});
	const data = Object.entries(categoryMap).map(([category, { count, color }]) => ({ category, count, color }));
	const total = data.reduce((acc, item) => acc + item.count, 0);
	return (
		<div className="bg-white rounded-2xl shadow-md border border-gray-100 p-6">
			<div className="flex items-center justify-between mb-6">
				<div>
					<h3 className="text-lg font-semibold text-gray-900">Distribuzione Attività</h3>
					<p className="text-sm text-gray-600">Per categoria</p>
				</div>
				<PieChart className="h-6 w-6 text-purple-600" />
			</div>
			<div className="space-y-4">
				{data.map((item, index) => {
					const percentage = (item.count / (total || 1)) * 100;
					return (
						<div key={index} className="flex items-center space-x-3">
							<div className={`w-3 h-3 rounded-full ${item.color}`}></div>
							<div className="flex-1 flex items-center justify-between">
								<span className="text-sm font-medium text-gray-700">{item.category}</span>
								<div className="flex items-center space-x-2">
									<div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
										<div className={`h-full ${item.color} transition-all duration-500 ease-in-out`} style={{ width: `${percentage}%` }}></div>
									</div>
									<span className="text-xs text-gray-500 min-w-fit">{item.count}</span>
								</div>
							</div>
						</div>
					);
				})}
			</div>
			<div className="mt-4 pt-4 border-t border-gray-100">
				<div className="flex items-center justify-between text-sm">
					<span className="text-gray-600">Totale attività</span>
					<span className="font-semibold text-blue-600">{total}</span>
				</div>
			</div>
		</div>
	);
};

// Componente per metriche di performance
const PerformanceMetrics = () => {
	const { data: allTasks = [] } = useQuery<Task[]>({ queryKey: ["/api/tasks"] });
	// Tempo medio completamento (solo task completate con completedAt e dueDate)
	const completedTasks = allTasks.filter(t => t.completed && t.completedAt && t.dueDate);
	let avgTime = "-";
	if (completedTasks.length > 0) {
		const totalMs = completedTasks.reduce((acc, t) => acc + (new Date(t.completedAt!).getTime() - new Date(t.dueDate!).getTime()), 0);
		const avgMs = totalMs / completedTasks.length;
		const hours = Math.abs(Math.round(avgMs / (1000 * 60 * 60) * 10) / 10);
		avgTime = `${hours}h`;
	}
	// Efficienza: percentuale task completate
	const efficiency = allTasks.length > 0 ? Math.round((completedTasks.length / allTasks.length) * 100) : 0;
	return (
		<div className="bg-white rounded-2xl shadow-md border border-gray-100 p-6">
			<div className="flex items-center justify-between mb-6">
				<div>
					<h3 className="text-lg font-semibold text-gray-900">Performance</h3>
					<p className="text-sm text-gray-600">Metriche chiave</p>
				</div>
				<Activity className="h-6 w-6 text-green-600" />
			</div>
			<div className="space-y-6">
				<div className="flex items-center justify-between">
					<div className="flex items-center space-x-3">
						<div className="w-10 h-10 bg-gray-50 rounded-lg flex items-center justify-center">
							<Clock className="h-5 w-5 text-blue-600" />
						</div>
						<div>
							<p className="text-sm font-medium text-gray-900">Tempo Medio</p>
							<p className="text-xs text-gray-500">Ultime task completate</p>
						</div>
					</div>
					<div className="text-right">
						<p className="text-lg font-bold text-gray-900">{avgTime}</p>
					</div>
				</div>
				<div className="flex items-center justify-between">
					<div className="flex items-center space-x-3">
						<div className="w-10 h-10 bg-gray-50 rounded-lg flex items-center justify-center">
							<Activity className="h-5 w-5 text-green-600" />
						</div>
						<div>
							<p className="text-sm font-medium text-gray-900">Efficienza</p>
							<p className="text-xs text-gray-500">% task completate</p>
						</div>
					</div>
					<div className="text-right">
						<p className="text-lg font-bold text-gray-900">{efficiency}%</p>
					</div>
				</div>
			</div>
		</div>
	);
};

// Andamento mensile (ultimi 12 mesi)
const MonthlyTrendChart = () => {
	const { data: allTasks = [] } = useQuery<Task[]>({ queryKey: ["/api/tasks"] });
	const now = new Date();
	const months = Array.from({ length: 12 }).map((_, i) => {
		const d = new Date(now.getFullYear(), now.getMonth() - (11 - i), 1);
		return d;
	});
	const data = months.map((date) => {
		const month = date.toLocaleString('default', { month: 'short' });
		const year = date.getFullYear();
		const completed = allTasks.filter(t => t.completed && new Date(t.completedAt || t.dueDate || t.createdAt).getMonth() === date.getMonth() && new Date(t.completedAt || t.dueDate || t.createdAt).getFullYear() === year).length;
		return { name: `${month} ${year.toString().slice(-2)}`, completed };
	});
	return (
		<div className="bg-white rounded-2xl shadow-md border border-gray-100 p-6">
			<div className="flex items-center justify-between mb-6">
				<div>
					<h3 className="text-lg font-semibold text-gray-900">Andamento Mensile</h3>
					<p className="text-sm text-gray-600">Attività completate negli ultimi 12 mesi</p>
				</div>
				<BarChart3 className="h-6 w-6 text-blue-600" />
			</div>
			<ResponsiveContainer width="100%" height={180}>
				<LineChart data={data} margin={{ left: 0, right: 0, top: 10, bottom: 0 }}>
					<CartesianGrid strokeDasharray="3 3" />
					<XAxis dataKey="name" tick={{ fontSize: 12 }} />
					<YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
					<RechartsTooltip />
					<Line type="monotone" dataKey="completed" stroke="#2563eb" strokeWidth={2} dot={{ r: 3 }} />
				</LineChart>
			</ResponsiveContainer>
		</div>
	);
};

// Clienti da ricontattare (nessuna attività negli ultimi 30 giorni)
const ClientsToRecall = () => {
	const { data: allTasks = [] } = useQuery<Task[]>({ queryKey: ["/api/tasks"] });
	const now = new Date();
	// Mappa cliente -> ultima data attività
	const clientMap = new Map<string, Date>();
	allTasks.forEach(t => {
		if (t.client && t.client.trim() !== "") {
			const d = new Date(t.dueDate || t.createdAt);
			if (!clientMap.has(t.client) || d > clientMap.get(t.client)!) {
				clientMap.set(t.client, d);
			}
		}
	});
	const toRecall = Array.from(clientMap.entries())
		.filter(([_, lastDate]) => {
			const diffDays = (now.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24);
			return diffDays > 30;
		})
		.map(([name, lastDate]) => ({
			name,
			initials: name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2),
			lastContact: lastDate.toLocaleDateString(),
			days: Math.floor((now.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24)),
		}))
		.sort((a, b) => b.days - a.days)
		.slice(0, 5);
	return (
		<div className="bg-white rounded-2xl shadow-md border border-gray-100 p-6">
			<div className="flex items-center gap-2 mb-4">
				<span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-purple-100">
					<Users className="h-5 w-5 text-purple-600" />
				</span>
				<h2 className="text-lg font-semibold text-gray-900">Clienti da Ricontattare</h2>
				<span className="ml-2 px-2 py-0.5 text-xs rounded bg-purple-50 text-purple-700 font-medium">{toRecall.length}</span>
			</div>
			{toRecall.length === 0 ? (
				<p className="text-gray-400 text-sm">Nessun cliente da ricontattare.</p>
			) : (
				<ul className="divide-y divide-gray-100">
					{toRecall.map((client, idx) => (
						<li key={idx} className="py-2 flex items-center gap-2">
							<span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-gradient-to-br from-blue-400 to-purple-400 text-white text-xs font-bold">
								{client.initials}
							</span>
							<span className="font-medium text-gray-800">{client.name}</span>
							<span className="ml-auto text-xs text-gray-500">{client.days} giorni</span>
						</li>
					))}
				</ul>
			)}
		</div>
	);
};

export default function DashboardCharts() {
	return (
		<section className="bg-white rounded-2xl shadow-md border border-gray-100 p-6 mb-4">
			<h3 className="text-base font-semibold text-gray-900 mb-2">Andamento Attività e Performance</h3>
			<p className="text-sm text-gray-500 mb-4">Visualizza l'andamento delle attività, le categorie più frequenti e le performance nel tempo.</p>
			<div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
				<WeeklyBarChart />
				<CategoryDistribution />
				<PerformanceMetrics />
			</div>
			<div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
				<MonthlyTrendChart />
				<ClientsToRecall />
			</div>
		</section>
	);
}

export { WeeklyBarChart, CategoryDistribution, PerformanceMetrics };
