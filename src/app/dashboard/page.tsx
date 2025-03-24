'use client';

import { useState, useEffect } from 'react';
import { Bar, Doughnut, Line } from 'react-chartjs-2';
import { 
  Chart as ChartJS, 
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
  Filler
} from 'chart.js';
import { Wallet, CreditCard, BanknoteIcon, ArrowDownIcon, ArrowUpIcon, TrendingUp, TrendingDown, Calendar, PieChart, Users } from 'lucide-react';
import { useAuth } from '../../lib/hooks/useAuth';
import ProtectedRoute from '../components/ProtectedRoute';
import { formatCurrency } from '../../lib/utils';

// Registrar componentes ChartJS
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
  Filler
);

type Transaction = {
  id: string;
  userId: string;
  description: string;
  amount: number;
  date: string;
  category: string;
  type: 'income' | 'expense';
  paymentMethod?: string | null;
  person?: string | null;
  receiptId?: string | null;
};

type Person = string;

type Settings = {
  userId: string;
  liveWithOthers: boolean;
  darkMode: boolean;
  currency: string;
  people?: Person[];
};

export default function DashboardPage() {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [totalIncome, setTotalIncome] = useState(0);
  const [totalExpenses, setTotalExpenses] = useState(0);
  const [expensesByCategory, setExpensesByCategory] = useState<{[key: string]: number}>({});
  const [transactionsByMonth, setTransactionsByMonth] = useState<{[key: string]: {income: number, expense: number}}>({});
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const [peopleExpenses, setPeopleExpenses] = useState<{[key: string]: number}>({});
  const [timeframe, setTimeframe] = useState<'month' | 'year'>('month');

  useEffect(() => {
    if (!user) return;
    
    loadData();
  }, [user, timeframe]);

  const loadData = () => {
    // Cargar configuración
    if (user) {
      const configKey = `config_${user.id}`;
      const savedSettings = localStorage.getItem(configKey);
      
      if (savedSettings) {
        try {
          const userSettings = JSON.parse(savedSettings);
          setSettings(userSettings);
        } catch (error) {
          console.error("Error parsing settings:", error);
          setSettings(null);
        }
      }
    }

    // Cargar transacciones
    const storedTransactions = localStorage.getItem('transactions');
    if (storedTransactions) {
      const allTransactions = JSON.parse(storedTransactions);
      // Filtrar transacciones del usuario actual
      const userTransactions = allTransactions.filter(
        (t: Transaction) => t.userId === user?.id
      );
      setTransactions(userTransactions);
      
      // Procesar datos para los gráficos
      processTransactionsData(userTransactions);
    }
  };

  const processTransactionsData = (transactions: Transaction[]) => {
    // Obtener la fecha actual
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    
    // Filtrar por periodo seleccionado
    const filteredTransactions = transactions.filter(transaction => {
      const transactionDate = new Date(transaction.date);
      
      if (timeframe === 'month') {
        // Filtrar transacciones del mes actual
        return (
          transactionDate.getMonth() === currentMonth &&
          transactionDate.getFullYear() === currentYear
        );
      } else {
        // Filtrar transacciones del año actual
        return transactionDate.getFullYear() === currentYear;
      }
    });
    
    // Calcular totales
    let incomeTotal = 0;
    let expensesTotal = 0;
    const categoryExpenses: {[key: string]: number} = {};
    const monthlyData: {[key: string]: {income: number, expense: number}} = {};
    const expensesByPerson: {[key: string]: number} = { "Sin asignar": 0 };
    
    // Inicializar datos mensuales para el año actual
    if (timeframe === 'year') {
      const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
      months.forEach(month => {
        monthlyData[month] = { income: 0, expense: 0 };
      });
    } else {
      // Para vista mensual, usar días del mes actual
      const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
      for (let i = 1; i <= daysInMonth; i++) {
        monthlyData[i.toString()] = { income: 0, expense: 0 };
      }
    }
    
    // Inicializar gastos por persona
    if (settings && settings.people) {
      settings.people.forEach(person => {
        expensesByPerson[person] = 0;
      });
    }
    
    filteredTransactions.forEach(transaction => {
      if (transaction.type === 'income') {
        incomeTotal += transaction.amount;
        
        // Agregar a datos mensuales
        if (timeframe === 'year') {
          const month = new Date(transaction.date).getMonth();
          const monthName = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'][month];
          monthlyData[monthName].income += transaction.amount;
        } else {
          const day = new Date(transaction.date).getDate().toString();
          if (monthlyData[day]) {
            monthlyData[day].income += transaction.amount;
          }
        }
      } else {
        expensesTotal += transaction.amount;
        
        // Agregar a datos mensuales
        if (timeframe === 'year') {
          const month = new Date(transaction.date).getMonth();
          const monthName = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'][month];
          monthlyData[monthName].expense += transaction.amount;
        } else {
          const day = new Date(transaction.date).getDate().toString();
          if (monthlyData[day]) {
            monthlyData[day].expense += transaction.amount;
          }
        }
        
        // Agregar a gastos por categoría
        if (!categoryExpenses[transaction.category]) {
          categoryExpenses[transaction.category] = 0;
        }
        categoryExpenses[transaction.category] += transaction.amount;
        
        // Si la descripción contiene un nombre de persona, asignar gasto a esa persona
        let assignedToPerson = false;
        if (settings && settings.people) {
          for (const person of settings.people) {
            if (transaction.description.toLowerCase().includes(person.toLowerCase())) {
              if (!expensesByPerson[person]) {
                expensesByPerson[person] = 0;
              }
              expensesByPerson[person] += transaction.amount;
              assignedToPerson = true;
              break;
            }
          }
        }
        
        // Si no se asignó a ninguna persona, agregar a "Sin asignar"
        if (!assignedToPerson) {
          expensesByPerson["Sin asignar"] += transaction.amount;
        }
      }
    });
    
    // Ordenar transacciones recientes (5 más recientes)
    const recent = [...filteredTransactions].sort((a, b) => {
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    }).slice(0, 5);
    
    // Actualizar estados
    setTotalIncome(incomeTotal);
    setTotalExpenses(expensesTotal);
    setExpensesByCategory(categoryExpenses);
    setTransactionsByMonth(monthlyData);
    setRecentTransactions(recent);
    setPeopleExpenses(expensesByPerson);
  };

  // Preparar datos para los gráficos
  const prepareChartData = () => {
    // Datos para el gráfico de barras (ingresos vs gastos por mes/día)
    const labels = Object.keys(transactionsByMonth);
    const incomeData = labels.map(label => transactionsByMonth[label].income);
    const expenseData = labels.map(label => transactionsByMonth[label].expense);
    
    const barChartData = {
      labels,
      datasets: [
        {
          label: 'Ingresos',
          data: incomeData,
          backgroundColor: 'rgba(34, 197, 94, 0.7)',
          borderColor: 'rgba(34, 197, 94, 1)',
          borderWidth: 1,
        },
        {
          label: 'Gastos',
          data: expenseData,
          backgroundColor: 'rgba(239, 68, 68, 0.7)',
          borderColor: 'rgba(239, 68, 68, 1)',
          borderWidth: 1,
        },
      ],
    };
    
    // Datos para el gráfico de donut (gastos por categoría)
    const categoryLabels = Object.keys(expensesByCategory);
    const categoryData = categoryLabels.map(label => expensesByCategory[label]);
    
    const doughnutChartData = {
      labels: categoryLabels,
      datasets: [
        {
          data: categoryData,
          backgroundColor: [
            'rgba(59, 130, 246, 0.7)',
            'rgba(16, 185, 129, 0.7)',
            'rgba(249, 115, 22, 0.7)',
            'rgba(168, 85, 247, 0.7)',
            'rgba(236, 72, 153, 0.7)',
            'rgba(234, 179, 8, 0.7)',
            'rgba(14, 165, 233, 0.7)',
            'rgba(239, 68, 68, 0.7)',
          ],
          borderColor: [
            'rgba(59, 130, 246, 1)',
            'rgba(16, 185, 129, 1)',
            'rgba(249, 115, 22, 1)',
            'rgba(168, 85, 247, 1)',
            'rgba(236, 72, 153, 1)',
            'rgba(234, 179, 8, 1)',
            'rgba(14, 165, 233, 1)',
            'rgba(239, 68, 68, 1)',
          ],
          borderWidth: 1,
        },
      ],
    };
    
    // Datos para el gráfico de gastos por persona
    const peopleLabels = Object.keys(peopleExpenses);
    const peopleData = peopleLabels.map(label => peopleExpenses[label]);
    
    const peopleChartData = {
      labels: peopleLabels,
      datasets: [
        {
          data: peopleData,
          backgroundColor: [
            'rgba(59, 130, 246, 0.7)',
            'rgba(16, 185, 129, 0.7)',
            'rgba(249, 115, 22, 0.7)',
            'rgba(168, 85, 247, 0.7)',
            'rgba(236, 72, 153, 0.7)',
          ],
          borderColor: [
            'rgba(59, 130, 246, 1)',
            'rgba(16, 185, 129, 1)',
            'rgba(249, 115, 22, 1)',
            'rgba(168, 85, 247, 1)',
            'rgba(236, 72, 153, 1)',
          ],
          borderWidth: 1,
        },
      ],
    };
    
    return { barChartData, doughnutChartData, peopleChartData };
  };

  const { barChartData, doughnutChartData, peopleChartData } = prepareChartData();

  // Formatear fecha
  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = { 
      day: 'numeric', 
      month: 'short'
    };
    return new Date(dateString).toLocaleDateString('es-ES', options);
  };

  // Opciones de gráficos
  const barChartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          color: '#e5e7eb'
        }
      },
      title: {
        display: true,
        text: timeframe === 'month' ? 'Ingresos vs Gastos (Este Mes)' : 'Ingresos vs Gastos (Este Año)',
        color: '#e5e7eb'
      },
    },
    scales: {
      y: {
        ticks: {
          color: '#9ca3af'
        },
        grid: {
          color: 'rgba(75, 85, 99, 0.2)'
        }
      },
      x: {
        ticks: {
          color: '#9ca3af'
        },
        grid: {
          color: 'rgba(75, 85, 99, 0.2)'
        }
      }
    }
  };

  const doughnutOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'right' as const,
        labels: {
          color: '#e5e7eb'
        }
      },
      title: {
        display: true,
        text: 'Gastos por Categoría',
        color: '#e5e7eb'
      }
    }
  };

  const peopleChartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'right' as const,
        labels: {
          color: '#e5e7eb'
        }
      },
      title: {
        display: true,
        text: 'Gastos por Persona',
        color: '#e5e7eb'
      }
    }
  };

  const balance = totalIncome - totalExpenses;
  const isPositiveBalance = balance >= 0;

  // Agrupar gastos por persona
  const getExpensesByPerson = () => {
    if (!settings?.liveWithOthers || !settings?.people || settings.people.length === 0) {
      return [];
    }
    
    // Solo considerar gastos
    const expenses = transactions.filter(
      (t) => t.type === 'expense' && t.person
    );
    
    // Agrupar por persona
    const expensesByPerson: { [key: string]: number } = {};
    
    expenses.forEach((expense) => {
      if (expense.person) {
        if (expensesByPerson[expense.person]) {
          expensesByPerson[expense.person] += expense.amount;
        } else {
          expensesByPerson[expense.person] = expense.amount;
        }
      }
    });
    
    // Convertir a formato para el gráfico
    const chartData = Object.entries(expensesByPerson).map(([person, amount]) => ({
      person,
      amount,
    }));
    
    // Ordenar por monto (mayor a menor)
    return chartData.sort((a, b) => b.amount - a.amount);
  };

  // Gráfico de gastos por persona
  const renderExpensesByPersonChart = () => {
    const expensesByPerson = getExpensesByPerson();
    
    if (!settings?.liveWithOthers || expensesByPerson.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center h-64 bg-gray-800/40 rounded-xl border border-gray-700">
          <p className="text-gray-400">No hay datos disponibles</p>
          {!settings?.liveWithOthers && (
            <p className="text-gray-400 text-sm mt-2">
              Activa "Vivo con otras personas" en configuración
            </p>
          )}
        </div>
      );
    }
    
    // Colores para las barras
    const colors = [
      '#3B82F6', // blue-500
      '#8B5CF6', // violet-500
      '#EC4899', // pink-500
      '#10B981', // emerald-500
      '#F59E0B', // amber-500
      '#EF4444', // red-500
    ];
    
    return (
      <div className="mt-2">
        <div className="space-y-3">
          {expensesByPerson.map((item, index) => (
            <div key={item.person}>
              <div className="flex justify-between mb-1">
                <span className="text-sm text-gray-300">{item.person}</span>
                <span className="text-sm font-medium text-gray-300">
                  {formatCurrency(item.amount)}
                </span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2.5">
                <div
                  className="h-2.5 rounded-full"
                  style={{
                    width: `${(item.amount / expensesByPerson[0].amount) * 100}%`,
                    backgroundColor: colors[index % colors.length],
                  }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Agrupar transacciones por categoría para el gráfico
  const getExpensesByCategory = () => {
    // Solo considerar gastos
    const expenses = transactions.filter((t) => t.type === 'expense');
    
    // Agrupar por categoría
    const expensesByCategory: { [key: string]: number } = {};
    
    expenses.forEach((expense) => {
      if (expense.category) {
        if (expensesByCategory[expense.category]) {
          expensesByCategory[expense.category] += expense.amount;
        } else {
          expensesByCategory[expense.category] = expense.amount;
        }
      }
    });
    
    // Convertir a formato para el gráfico de barras
    const chartData = Object.entries(expensesByCategory).map(([category, amount]) => ({
      category,
      amount,
    }));
    
    // Ordenar por monto (mayor a menor)
    return chartData.sort((a, b) => b.amount - a.amount);
  };

  // Gráfico de gastos por categoría
  const renderExpensesByCategoryChart = () => {
    const expensesByCategory = getExpensesByCategory();
    
    if (expensesByCategory.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center h-64 bg-gray-800/40 rounded-xl border border-gray-700">
          <p className="text-gray-400">No hay datos suficientes</p>
        </div>
      );
    }
    
    // Colores para las barras
    const colors = [
      '#3B82F6', // blue-500
      '#8B5CF6', // violet-500
      '#EC4899', // pink-500
      '#10B981', // emerald-500
      '#F59E0B', // amber-500
      '#EF4444', // red-500
    ];
    
    return (
      <div className="mt-2">
        <div className="space-y-3">
          {expensesByCategory.slice(0, 5).map((item, index) => (
            <div key={item.category}>
              <div className="flex justify-between mb-1">
                <span className="text-sm text-gray-300">{item.category}</span>
                <span className="text-sm font-medium text-gray-300">
                  {formatCurrency(item.amount)}
                </span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2.5">
                <div
                  className="h-2.5 rounded-full"
                  style={{
                    width: `${(item.amount / expensesByCategory[0].amount) * 100}%`,
                    backgroundColor: colors[index % colors.length],
                  }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <ProtectedRoute>
      <div className="space-y-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <div className="flex gap-2">
            <button
              onClick={() => setTimeframe('month')}
              className={`px-4 py-2 rounded-md transition-colors ${
                timeframe === 'month'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              Este Mes
            </button>
            <button
              onClick={() => setTimeframe('year')}
              className={`px-4 py-2 rounded-md transition-colors ${
                timeframe === 'year'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              Este Año
            </button>
          </div>
        </div>

        {/* Tarjetas de resumen */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
          {/* Balance */}
          <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-gray-400 text-sm">Balance</h2>
                <p className={`text-2xl font-bold ${isPositiveBalance ? 'text-green-400' : 'text-red-400'}`}>
                  {formatCurrency(balance)}
                </p>
              </div>
              <div className={`p-3 rounded-full ${isPositiveBalance ? 'bg-green-900/30' : 'bg-red-900/30'}`}>
                <Wallet className={`w-6 h-6 ${isPositiveBalance ? 'text-green-400' : 'text-red-400'}`} />
              </div>
            </div>
            <div className="flex justify-between text-sm text-gray-400 mt-2">
              <span>Periodo: {timeframe === 'month' ? 'Este Mes' : 'Este Año'}</span>
            </div>
          </div>

          {/* Ingresos */}
          <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-gray-400 text-sm">Ingresos</h2>
                <p className="text-2xl font-bold text-green-400">{formatCurrency(totalIncome)}</p>
              </div>
              <div className="p-3 rounded-full bg-green-900/30">
                <ArrowDownIcon className="w-6 h-6 text-green-400" />
              </div>
            </div>
            <div className="flex justify-between text-sm text-gray-400 mt-2">
              <span>Periodo: {timeframe === 'month' ? 'Este Mes' : 'Este Año'}</span>
            </div>
          </div>

          {/* Gastos */}
          <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-gray-400 text-sm">Gastos</h2>
                <p className="text-2xl font-bold text-red-400">{formatCurrency(totalExpenses)}</p>
              </div>
              <div className="p-3 rounded-full bg-red-900/30">
                <ArrowUpIcon className="w-6 h-6 text-red-400" />
              </div>
            </div>
            <div className="flex justify-between text-sm text-gray-400 mt-2">
              <span>Periodo: {timeframe === 'month' ? 'Este Mes' : 'Este Año'}</span>
            </div>
          </div>
        </div>

        {/* Gráficos */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Gráfico de Ingresos vs Gastos */}
          <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
            <div className="h-[300px]">
              <Bar data={barChartData} options={barChartOptions} />
            </div>
          </div>

          {/* Gráfico de Gastos por Categoría */}
          <div className="bg-gray-800 rounded-xl shadow-lg border border-gray-700 p-5">
            <h3 className="text-lg font-medium text-white mb-4">Gastos por Categoría</h3>
            {renderExpensesByCategoryChart()}
          </div>
        </div>

        {/* Fila adicional con gráfico de personas y transacciones recientes */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Gráfico de Gastos por Persona */}
          <div className="bg-gray-800 rounded-xl shadow-lg border border-gray-700 p-5">
            <h3 className="text-lg font-medium text-white mb-4">Gastos por Persona</h3>
            {renderExpensesByPersonChart()}
          </div>

          {/* Transacciones Recientes */}
          <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
            <h2 className="text-lg font-medium text-white mb-4">Transacciones Recientes</h2>
            
            {recentTransactions.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-[230px] text-gray-400">
                <Calendar size={48} className="mb-4 opacity-50" />
                <p>No hay transacciones recientes</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[270px] overflow-y-auto pr-2">
                {recentTransactions.map(transaction => (
                  <div key={transaction.id} className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-full ${
                        transaction.type === 'income' ? 'bg-green-900/30' : 'bg-red-900/30'
                      }`}>
                        {transaction.type === 'income' ? (
                          <ArrowDownIcon className="w-4 h-4 text-green-400" />
                        ) : (
                          <ArrowUpIcon className="w-4 h-4 text-red-400" />
                        )}
                      </div>
                      <div>
                        <p className="text-white font-medium">{transaction.description}</p>
                        <p className="text-xs text-gray-400">{formatDate(transaction.date)} • {transaction.category}</p>
                      </div>
                    </div>
                    <p className={`font-medium ${
                      transaction.type === 'income' ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
} 