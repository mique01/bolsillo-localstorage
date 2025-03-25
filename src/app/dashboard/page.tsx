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
import { Wallet, CreditCard, TrendingUp, TrendingDown, Calendar, PieChart, Users, ChevronDown } from 'lucide-react';
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
  const [timeframe, setTimeframe] = useState<'7days' | 'month' | 'year' | 'all'>('month');
  const [selectedMonth, setSelectedMonth] = useState<string>('Este Mes');
  const [budgets, setBudgets] = useState<{[key: string]: number}>({});

  useEffect(() => {
    if (!user) return;
    
    loadData();
    loadBudgets();
  }, [user, timeframe]);

  const loadBudgets = () => {
    if (!user) return;
    
    const storedBudgets = localStorage.getItem('budgets');
    if (storedBudgets) {
      try {
        const allBudgets = JSON.parse(storedBudgets);
        // Filtrar presupuestos del usuario actual
        const userBudgets = allBudgets.filter((b: any) => b.userId === user.id);
        
        // Convertir array de presupuestos a objeto {categoría: monto}
        const budgetsMap: {[key: string]: number} = {};
        userBudgets.forEach((budget: any) => {
          budgetsMap[budget.category] = budget.amount;
        });
        
        setBudgets(budgetsMap);
      } catch (error) {
        console.error("Error parsing budgets:", error);
      }
    }
  };

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
      
      if (timeframe === '7days') {
        // Filtrar transacciones de los últimos 7 días
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(now.getDate() - 7);
        return transactionDate >= sevenDaysAgo;
      } else if (timeframe === 'month') {
        // Filtrar transacciones del mes actual
        return (
          transactionDate.getMonth() === currentMonth &&
          transactionDate.getFullYear() === currentYear
        );
      } else if (timeframe === 'year') {
        // Filtrar transacciones del año actual
        return transactionDate.getFullYear() === currentYear;
      } else {
        // Todas las transacciones (timeframe === 'all')
        return true;
      }
    });
    
    // Calcular totales
    let incomeTotal = 0;
    let expensesTotal = 0;
    const categoryExpenses: {[key: string]: number} = {};
    const monthlyData: {[key: string]: {income: number, expense: number}} = {};
    const expensesByPerson: {[key: string]: number} = { "Sin asignar": 0 };
    
    // Inicializar datos para el gráfico según el timeframe
    if (timeframe === 'year') {
      const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
      months.forEach(month => {
        monthlyData[month] = { income: 0, expense: 0 };
      });
    } else if (timeframe === 'month') {
      // Para vista mensual, usar días del mes actual
      const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
      for (let i = 1; i <= daysInMonth; i++) {
        monthlyData[i.toString()] = { income: 0, expense: 0 };
      }
    } else if (timeframe === '7days') {
      // Para vista de 7 días, usar etiquetas de días relativos (Hoy, Ayer, etc.)
      const dayLabels = [];
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        
        if (i === 0) {
          dayLabels.push('Hoy');
        } else if (i === 1) {
          dayLabels.push('Ayer');
        } else {
          const day = date.getDate();
          const month = date.getMonth() + 1;
          dayLabels.push(`${day}/${month}`);
        }
      }
      
      dayLabels.forEach(label => {
        monthlyData[label] = { income: 0, expense: 0 };
      });
    } else {
      // Para 'all', agrupar por meses en el último año
      const lastYearMonths = [];
      for (let i = 11; i >= 0; i--) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        const monthName = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'][date.getMonth()];
        const year = date.getFullYear();
        lastYearMonths.push(`${monthName} ${year}`);
      }
      
      lastYearMonths.forEach(label => {
        monthlyData[label] = { income: 0, expense: 0 };
      });
    }
    
    // Inicializar gastos por persona
    if (settings && settings.people) {
      settings.people.forEach(person => {
        expensesByPerson[person] = 0;
      });
    }
    
    filteredTransactions.forEach(transaction => {
      const transactionDate = new Date(transaction.date);
      
      if (transaction.type === 'income') {
        incomeTotal += transaction.amount;
        
        // Agregar a datos para el gráfico
        let dateKey = '';
        
        if (timeframe === 'year') {
          const month = transactionDate.getMonth();
          dateKey = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'][month];
        } else if (timeframe === 'month') {
          dateKey = transactionDate.getDate().toString();
        } else if (timeframe === '7days') {
          const today = new Date();
          const diffTime = Math.abs(today.getTime() - transactionDate.getTime());
          const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
          
          if (diffDays === 0) {
            dateKey = 'Hoy';
          } else if (diffDays === 1) {
            dateKey = 'Ayer';
          } else {
            const day = transactionDate.getDate();
            const month = transactionDate.getMonth() + 1;
            dateKey = `${day}/${month}`;
          }
        } else {
          // Para 'all', usar mes y año
          const month = transactionDate.getMonth();
          const monthName = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'][month];
          const year = transactionDate.getFullYear();
          dateKey = `${monthName} ${year}`;
        }
        
        if (monthlyData[dateKey]) {
          monthlyData[dateKey].income += transaction.amount;
        }
      } else {
        expensesTotal += transaction.amount;
        
        // Agregar a datos para el gráfico
        let dateKey = '';
        
        if (timeframe === 'year') {
          const month = transactionDate.getMonth();
          dateKey = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'][month];
        } else if (timeframe === 'month') {
          dateKey = transactionDate.getDate().toString();
        } else if (timeframe === '7days') {
          const today = new Date();
          const diffTime = Math.abs(today.getTime() - transactionDate.getTime());
          const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
          
          if (diffDays === 0) {
            dateKey = 'Hoy';
          } else if (diffDays === 1) {
            dateKey = 'Ayer';
          } else {
            const day = transactionDate.getDate();
            const month = transactionDate.getMonth() + 1;
            dateKey = `${day}/${month}`;
          }
        } else {
          // Para 'all', usar mes y año
          const month = transactionDate.getMonth();
          const monthName = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'][month];
          const year = transactionDate.getFullYear();
          dateKey = `${monthName} ${year}`;
        }
        
        if (monthlyData[dateKey]) {
          monthlyData[dateKey].expense += transaction.amount;
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
    
    const lineChartData = {
      labels,
      datasets: [
        {
          label: 'Ingresos',
          data: incomeData,
          fill: false,
          borderColor: 'rgb(34, 197, 94)', // Verde para ingresos
          backgroundColor: 'rgb(34, 197, 94)',
          tension: 0.4,
        },
        {
          label: 'Gastos',
          data: expenseData,
          fill: false,
          borderColor: 'rgb(239, 68, 68)', // Rojo para gastos
          backgroundColor: 'rgb(239, 68, 68)',
          tension: 0.4,
        }
      ],
    };
    
    return lineChartData;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', { 
      day: '2-digit', 
      month: '2-digit',
      year: '2-digit' 
    });
  };

  // Componente para mostrar una tarjeta de balance
  const BalanceCard = ({ title, amount, icon, trend, color }: { 
    title: string, 
    amount: number, 
    icon: React.ReactNode,
    trend?: { value: number, isUp: boolean },
    color?: string
  }) => (
    <div className="bg-gray-800 rounded-lg shadow-md p-5 border border-gray-700">
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-400">{title}</span>
        <div className={`p-2 rounded-lg ${color || 'bg-blue-900/20'}`}>
          {icon}
        </div>
      </div>
      <div className="text-2xl font-bold mt-1">{formatCurrency(amount)}</div>
      
      {trend && (
        <div className={`flex items-center text-xs ${trend.isUp ? 'text-green-400' : 'text-red-400'} font-medium`}>
          {trend.isUp ? <TrendingUp size={14} className="mr-1" /> : <TrendingDown size={14} className="mr-1" />}
          <span>{trend.value}%</span>
        </div>
      )}
    </div>
  );

  // Componente para selector de mes
  const MonthSelector = ({ selectedValue, onChange }: {
    selectedValue: string;
    onChange: (value: string) => void;
  }) => (
    <div className="relative inline-block">
      <button className="bg-gray-700 px-3 py-1.5 rounded-lg text-sm flex items-center">
        {selectedValue}
        <ChevronDown size={14} className="ml-1" />
      </button>
    </div>
  );

  // Componente para renderizar los gastos por categoría
  const ExpensesByCategoryChart = () => {
    const chartData = getExpensesByCategory();
    
    return (
      <div className="bg-gray-800 rounded-lg shadow-md p-6 border border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium">Gastos por Categoría</h3>
          <MonthSelector 
            selectedValue={selectedMonth} 
            onChange={setSelectedMonth}
          />
        </div>
        
        <div className="h-64">
          {totalExpenses > 0 ? (
            <Doughnut 
              data={chartData} 
              options={{
                responsive: true,
                maintainAspectRatio: false,
                cutout: '65%',
                layout: {
                  padding: 20
                },
                plugins: {
                  legend: {
                    position: 'right',
                    labels: {
                      boxWidth: 12,
                      padding: 15,
                      color: '#ccc'
                    }
                  },
                  tooltip: {
                    callbacks: {
                      label: function(context: any) {
                        const label = context.label || '';
                        const value = context.raw as number;
                        const total = (context.chart.getDatasetMeta(0) as any).total || 0;
                        const percentage = Math.round((value / total) * 100);
                        return `${label}: ${formatCurrency(value)} (${percentage}%)`;
                      }
                    }
                  }
                }
              }}
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <p className="text-gray-400">No hay datos de gastos disponibles</p>
            </div>
          )}
        </div>
        
        <div className="grid grid-cols-2 gap-3 mt-5">
          {Object.entries(expensesByCategory).slice(0, 4).map(([category, amount]) => {
            const percentage = totalExpenses ? Math.round((amount / totalExpenses) * 100) : 0;
            return (
              <div key={category} className="flex items-center">
                <div className="w-2 h-2 rounded-full bg-blue-500 mr-2"></div>
                <div className="flex-1">
                  <div className="flex justify-between text-sm">
                    <span className="truncate-text overflow-hidden">{category}</span>
                    <span>{percentage}%</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // Datos para el gráfico de gastos por categoría
  const getExpensesByCategory = () => {
    // Convertir datos a formato de gráfico
    const labels = Object.keys(expensesByCategory);
    const data = Object.values(expensesByCategory);
    
    // Colores para cada categoría
    const backgroundColors = [
      'rgb(54, 162, 235)',
      'rgb(75, 192, 192)',
      'rgb(153, 102, 255)',
      'rgb(255, 159, 64)',
      'rgb(255, 99, 132)',
    ];
    
    return {
      labels,
      datasets: [
        {
          data,
          backgroundColor: backgroundColors,
          borderWidth: 0,
        }
      ]
    };
  };

  // Componente para mostrar gastos por persona
  const ExpensesByPersonChart = () => {
    const chartData = getExpensesByPerson();
    
    return (
      <div className="bg-gray-800 rounded-lg shadow-md p-6 border border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium">Gastos por Persona</h3>
          <MonthSelector 
            selectedValue={selectedMonth} 
            onChange={setSelectedMonth}
          />
        </div>
        
        <div className="h-64">
          {Object.keys(peopleExpenses).length > 0 ? (
            <Doughnut 
              data={chartData} 
              options={{
                responsive: true,
                maintainAspectRatio: false,
                cutout: '65%',
                layout: {
                  padding: 20
                },
                plugins: {
                  legend: {
                    position: 'right',
                    labels: {
                      boxWidth: 12,
                      padding: 15,
                      color: '#ccc'
                    }
                  },
                  tooltip: {
                    callbacks: {
                      label: function(context: any) {
                        const label = context.label || '';
                        const value = context.raw as number;
                        const total = (context.chart.getDatasetMeta(0) as any).total || 0;
                        const percentage = Math.round((value / total) * 100);
                        return `${label}: ${formatCurrency(value)} (${percentage}%)`;
                      }
                    }
                  }
                }
              }}
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <p className="text-gray-400">No hay datos de gastos por persona disponibles</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Datos para el gráfico de gastos por persona
  const getExpensesByPerson = () => {
    // Convertir datos a formato de gráfico
    const labels = Object.keys(peopleExpenses);
    const data = Object.values(peopleExpenses);
    
    // Colores para cada persona
    const backgroundColors = [
      'rgb(153, 102, 255)',
      'rgb(54, 162, 235)',
      'rgb(75, 192, 192)',
      'rgb(255, 159, 64)',
      'rgb(255, 99, 132)',
    ];
    
    return {
      labels,
      datasets: [
        {
          data,
          backgroundColor: backgroundColors,
          borderWidth: 0,
        }
      ]
    };
  };

  // Componente para mostrar el gráfico de flujo de efectivo
  const CashFlowChart = () => {
    const data = prepareChartData();

  return (
      <div className="bg-gray-800 rounded-lg shadow-md p-6 border border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium">Flujo de Efectivo</h3>
          <div className="flex space-x-2">
            <button 
              onClick={() => setTimeframe('7days')}
              className={`text-sm px-3 py-1 rounded-lg ${timeframe === '7days' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:bg-gray-700'}`}
            >
              7 días
            </button>
            <button 
              onClick={() => setTimeframe('month')}
              className={`text-sm px-3 py-1 rounded-lg ${timeframe === 'month' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:bg-gray-700'}`}
            >
              30 días
            </button>
            <button 
              onClick={() => setTimeframe('year')}
              className={`text-sm px-3 py-1 rounded-lg ${timeframe === 'year' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:bg-gray-700'}`}
            >
              Este Año
            </button>
            <button 
              onClick={() => setTimeframe('all')}
              className={`text-sm px-3 py-1 rounded-lg ${timeframe === 'all' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:bg-gray-700'}`}
            >
              Todos
            </button>
          </div>
        </div>
        
        <div className="h-[300px]">
          <Line 
            data={data} 
            options={{
              responsive: true,
              maintainAspectRatio: false,
              scales: {
                x: {
                  grid: {
                    display: false,
                    color: 'rgba(100, 100, 100, 0.2)',
                  },
                  ticks: {
                    color: 'rgba(200, 200, 200, 0.8)',
                  }
                },
                y: {
                  grid: {
                    color: 'rgba(100, 100, 100, 0.2)',
                  },
                  ticks: {
                    callback: function(value) {
                      return formatCurrency(value as number);
                    },
                    color: 'rgba(200, 200, 200, 0.8)',
                  }
                }
              },
              plugins: {
                legend: {
                  labels: {
                    color: 'rgba(200, 200, 200, 0.8)',
                  }
                }
              },
              elements: {
                point: {
                  radius: 3,
                  hoverRadius: 5,
                }
              }
            }} 
          />
        </div>
      </div>
    );
  };

  // Componente para mostrar la comparación de gastos vs presupuestos
  const ExpensesVsBudgetChart = () => {
    const chartData = getExpensesVsBudgetData();
    
    return (
      <div className="bg-gray-800 rounded-lg shadow-md p-6 border border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium">Gastos vs Presupuestos</h3>
          <MonthSelector 
            selectedValue={selectedMonth} 
            onChange={setSelectedMonth}
          />
        </div>
        
        <div className="h-64">
          {Object.keys(budgets).length > 0 ? (
            <Bar 
              data={chartData} 
              options={{
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                  x: {
                    grid: {
                      display: false,
                    },
                    ticks: {
                      color: 'rgba(200, 200, 200, 0.8)',
                    }
                  },
                  y: {
                    grid: {
                      color: 'rgba(100, 100, 100, 0.2)',
                    },
                    ticks: {
                      callback: function(value) {
                        return formatCurrency(value as number);
                      },
                      color: 'rgba(200, 200, 200, 0.8)',
                    }
                  }
                },
                plugins: {
                  legend: {
                    labels: {
                      color: 'rgba(200, 200, 200, 0.8)',
                    }
                  },
                  tooltip: {
                    callbacks: {
                      label: function(context) {
                        const label = context.dataset.label || '';
                        const value = context.raw as number;
                        return `${label}: ${formatCurrency(value)}`;
                      }
                    }
                  }
                },
              }}
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <p className="text-gray-400">No hay presupuestos configurados</p>
            </div>
          )}
        </div>
      </div>
    );
  };
  
  // Datos para el gráfico de gastos vs presupuestos
  const getExpensesVsBudgetData = () => {
    // Filtrar categorías que tengan presupuesto asignado
    const categoriesWithBudget = Object.keys(budgets).filter(category => 
      budgets[category] > 0 && expensesByCategory[category] !== undefined
    );
    
    // Preparar datos para el gráfico
    const labels = categoriesWithBudget;
    const expensesData = categoriesWithBudget.map(category => expensesByCategory[category] || 0);
    const budgetsData = categoriesWithBudget.map(category => budgets[category] || 0);
    
    return {
      labels,
      datasets: [
        {
          label: 'Gastos',
          data: expensesData,
          backgroundColor: 'rgb(239, 68, 68)', // Rojo
        },
        {
          label: 'Presupuesto',
          data: budgetsData,
          backgroundColor: 'rgb(59, 130, 246)', // Azul
        }
      ]
    };
  };

  return (
    <ProtectedRoute>
      <div className="space-y-6">
        {/* Main Balance Cards */}
        <div className="flex flex-col md:flex-row md:justify-between gap-5">
          <div className="md:w-1/3">
            <div className="bg-gray-800 rounded-lg shadow p-5 border border-gray-700 h-full">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-400">Mi Balance</span>
                <MonthSelector 
                  selectedValue={selectedMonth} 
                  onChange={setSelectedMonth}
                />
              </div>
              <div className="text-3xl font-bold mt-2">{formatCurrency(totalIncome - totalExpenses)}</div>
              <p className="text-sm text-gray-400 mt-1">Tu Balance en el Período</p>
              
              <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded mt-4 text-sm transition-colors w-full">Agregar Transacción</button>
            </div>
          </div>
          
          <div className="md:w-2/3 grid grid-cols-1 md:grid-cols-2 gap-4">
            <BalanceCard 
              title="Ingresos" 
              amount={totalIncome} 
              icon={<Wallet size={18} className="text-green-400" />}
              trend={{ value: 12, isUp: true }}
              color="bg-green-800/20"
            />
            
            <BalanceCard 
              title="Gastos" 
              amount={totalExpenses} 
              icon={<CreditCard size={18} className="text-red-400" />}
              trend={{ value: 8, isUp: false }}
              color="bg-red-800/20"
            />
          </div>
        </div>
        
        {/* Cash Flow Chart */}
        <CashFlowChart />
        
        {/* Expense Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <ExpensesByCategoryChart />
          <ExpensesVsBudgetChart />
        </div>
        
        {/* People Expenses Chart (conditional) */}
        {settings?.liveWithOthers && (
          <div className="grid grid-cols-1 gap-5">
            <ExpensesByPersonChart />
          </div>
        )}
        
        {/* Recent Transactions */}
        <div className="bg-gray-800 rounded-lg shadow p-6 border border-gray-700">
          <h3 className="text-lg font-medium">Transacciones Recientes</h3>
          
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-gray-400 border-b border-gray-700">
                  <th className="pb-3 text-left">Descripción</th>
                  <th className="pb-3 text-left">Categoría</th>
                  <th className="pb-3 text-left">Fecha</th>
                  <th className="pb-3 text-right">Monto</th>
                </tr>
              </thead>
              <tbody>
                {recentTransactions.length > 0 ? (
                  recentTransactions.map((transaction) => (
                    <tr key={transaction.id} className="border-b border-gray-700">
                      <td className="py-3 truncate-text overflow-hidden whitespace-nowrap max-w-[200px]">
                        {transaction.description}
                      </td>
                      <td className="py-3">{transaction.category}</td>
                      <td className="py-3">{formatDate(transaction.date)}</td>
                      <td className={`py-3 text-right ${
                        transaction.type === 'income' ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="py-4 text-center text-gray-400">
                      No hay transacciones recientes
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
} 