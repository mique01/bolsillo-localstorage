export type Transaction = {
  id: string;
  user_id: string;
  description: string;
  amount: number;
  date: string;
  category: string;
  type: 'income' | 'expense';
  payment_method: string;
  person?: string;
  attachment_id?: string;
  created_at?: string;
};

export type Category = {
  id: string;
  user_id: string;
  name: string;
  type: 'income' | 'expense';
  created_at?: string;
};

export type PaymentMethod = {
  id: string;
  user_id: string;
  name: string;
  created_at?: string;
};

export type Person = {
  id: string;
  user_id: string;
  name: string;
  created_at?: string;
};

export type Comprobante = {
  id: string;
  user_id: string;
  description: string;
  file_name: string;
  file_type: string;
  file_url: string;
  folder_id: string;
  created_at?: string;
};

export type Folder = {
  id: string;
  user_id: string;
  name: string;
  created_at?: string;
};

export type Budget = {
  id: string;
  user_id: string;
  category: string;
  amount: number;
  period: 'monthly' | 'yearly';
  created_at?: string;
};

// Helper functions to work with localStorage
function getCollection<T>(collectionName: string): T[] {
  try {
    const collection = localStorage.getItem(collectionName);
    return collection ? JSON.parse(collection) : [];
  } catch (error) {
    console.error(`Error fetching ${collectionName}:`, error);
    return [];
  }
}

function saveCollection<T>(collectionName: string, data: T[]): void {
  try {
    localStorage.setItem(collectionName, JSON.stringify(data));
  } catch (error) {
    console.error(`Error saving ${collectionName}:`, error);
  }
}

// Transactions
export async function getTransactions(userId: string): Promise<{ data: Transaction[] | null; error: Error | null }> {
  try {
    const transactions = getCollection<Transaction>('transactions')
      .filter(t => t.user_id === userId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    return { data: transactions, error: null };
  } catch (error) {
    console.error("Error fetching transactions:", error);
    return { data: null, error: error as Error };
  }
}

export async function addTransaction(transaction: Omit<Transaction, 'id' | 'created_at'>): Promise<{ data: Transaction | null; error: Error | null }> {
  try {
    const transactions = getCollection<Transaction>('transactions');
    
    const newTransaction: Transaction = {
      ...transaction,
      id: Date.now().toString(),
      created_at: new Date().toISOString()
    };
    
    transactions.push(newTransaction);
    saveCollection('transactions', transactions);
    
    return { data: newTransaction, error: null };
  } catch (error) {
    console.error("Error adding transaction:", error);
    return { data: null, error: error as Error };
  }
}

export async function updateTransaction(
  transactionOrId: (Partial<Transaction> & { id: string }) | string,
  transactionData?: any
): Promise<{ data: Transaction | null; error: Error | null }> {
  try {
    const transactions = getCollection<Transaction>('transactions');
    
    let id: string;
    let updateData: Partial<Transaction>;
    
    if (typeof transactionOrId === 'string') {
      id = transactionOrId;
      updateData = transactionData;
    } else {
      id = transactionOrId.id;
      updateData = { ...transactionOrId, id: undefined };
    }
    
    const index = transactions.findIndex(t => t.id === id);
    
    if (index === -1) {
      return { data: null, error: new Error('Transaction not found') };
    }
    
    const updatedTransaction = {
      ...transactions[index],
      ...updateData,
      updated_at: new Date().toISOString()
    };
    
    transactions[index] = updatedTransaction;
    saveCollection('transactions', transactions);
    
    return { data: updatedTransaction, error: null };
  } catch (error) {
    console.error("Error updating transaction:", error);
    return { data: null, error: error as Error };
  }
}

export async function deleteTransaction(id: string): Promise<{ error: Error | null }> {
  try {
    const transactions = getCollection<Transaction>('transactions');
    const filteredTransactions = transactions.filter(t => t.id !== id);
    
    saveCollection('transactions', filteredTransactions);
    
    return { error: null };
  } catch (error) {
    console.error("Error deleting transaction:", error);
    return { error: error as Error };
  }
}

// Categories
export async function getCategories(userId: string, type?: 'income' | 'expense'): Promise<{ data: Category[] | null; error: Error | null }> {
  try {
    let categories = getCollection<Category>('categories')
      .filter(c => c.user_id === userId);
    
    if (type) {
      categories = categories.filter(c => c.type === type);
    }
    
    categories.sort((a, b) => a.name.localeCompare(b.name));
    
    return { data: categories, error: null };
  } catch (error) {
    console.error("Error fetching categories:", error);
    return { data: null, error: error as Error };
  }
}

export async function addCategory(category: Omit<Category, 'id' | 'created_at'>): Promise<{ data: Category | null; error: Error | null }> {
  try {
    const categories = getCollection<Category>('categories');
    
    const newCategory: Category = {
      ...category,
      id: Date.now().toString(),
      created_at: new Date().toISOString()
    };
    
    categories.push(newCategory);
    saveCollection('categories', categories);
    
    return { data: newCategory, error: null };
  } catch (error) {
    console.error("Error adding category:", error);
    return { data: null, error: error as Error };
  }
}

export async function updateCategory(category: Partial<Category> & { id: string }): Promise<{ data: Category | null; error: Error | null }> {
  try {
    const categories = getCollection<Category>('categories');
    const index = categories.findIndex(c => c.id === category.id);
    
    if (index === -1) {
      return { data: null, error: new Error('Category not found') };
    }
    
    const updatedCategory = {
      ...categories[index],
      ...category,
      updated_at: new Date().toISOString()
    };
    
    categories[index] = updatedCategory;
    saveCollection('categories', categories);
    
    return { data: updatedCategory, error: null };
  } catch (error) {
    console.error("Error updating category:", error);
    return { data: null, error: error as Error };
  }
}

export async function deleteCategory(id: string): Promise<{ error: Error | null }> {
  try {
    const categories = getCollection<Category>('categories');
    const filteredCategories = categories.filter(c => c.id !== id);
    
    saveCollection('categories', filteredCategories);
    
    return { error: null };
  } catch (error) {
    console.error("Error deleting category:", error);
    return { error: error as Error };
  }
}

// Payment Methods
export async function getPaymentMethods(userId: string): Promise<{ data: PaymentMethod[] | null; error: Error | null }> {
  try {
    const methods = getCollection<PaymentMethod>('payment_methods')
      .filter(m => m.user_id === userId)
      .sort((a, b) => a.name.localeCompare(b.name));
    
    return { data: methods, error: null };
  } catch (error) {
    console.error("Error fetching payment methods:", error);
    return { data: null, error: error as Error };
  }
}

export async function addPaymentMethod(method: Omit<PaymentMethod, 'id' | 'created_at'>): Promise<{ data: PaymentMethod | null; error: Error | null }> {
  try {
    const methods = getCollection<PaymentMethod>('payment_methods');
    
    const newMethod: PaymentMethod = {
      ...method,
      id: Date.now().toString(),
      created_at: new Date().toISOString()
    };
    
    methods.push(newMethod);
    saveCollection('payment_methods', methods);
    
    return { data: newMethod, error: null };
  } catch (error) {
    console.error("Error adding payment method:", error);
    return { data: null, error: error as Error };
  }
}

export async function updatePaymentMethod(method: Partial<PaymentMethod> & { id: string }): Promise<{ data: PaymentMethod | null; error: Error | null }> {
  try {
    const methods = getCollection<PaymentMethod>('payment_methods');
    const index = methods.findIndex(m => m.id === method.id);
    
    if (index === -1) {
      return { data: null, error: new Error('Payment method not found') };
    }
    
    const updatedMethod = {
      ...methods[index],
      ...method,
      updated_at: new Date().toISOString()
    };
    
    methods[index] = updatedMethod;
    saveCollection('payment_methods', methods);
    
    return { data: updatedMethod, error: null };
  } catch (error) {
    console.error("Error updating payment method:", error);
    return { data: null, error: error as Error };
  }
}

export async function deletePaymentMethod(id: string): Promise<{ error: Error | null }> {
  try {
    const methods = getCollection<PaymentMethod>('payment_methods');
    const filteredMethods = methods.filter(m => m.id !== id);
    
    saveCollection('payment_methods', filteredMethods);
    
    return { error: null };
  } catch (error) {
    console.error("Error deleting payment method:", error);
    return { error: error as Error };
  }
}

// People
export async function getPeople(userId: string): Promise<{ data: Person[] | null; error: Error | null }> {
  try {
    const people = getCollection<Person>('people')
      .filter(p => p.user_id === userId)
      .sort((a, b) => a.name.localeCompare(b.name));
    
    return { data: people, error: null };
  } catch (error) {
    console.error("Error fetching people:", error);
    return { data: null, error: error as Error };
  }
}

export async function addPerson(person: Omit<Person, 'id' | 'created_at'>): Promise<{ data: Person | null; error: Error | null }> {
  try {
    const people = getCollection<Person>('people');
    
    const newPerson: Person = {
      ...person,
      id: Date.now().toString(),
      created_at: new Date().toISOString()
    };
    
    people.push(newPerson);
    saveCollection('people', people);
    
    return { data: newPerson, error: null };
  } catch (error) {
    console.error("Error adding person:", error);
    return { data: null, error: error as Error };
  }
}

export async function updatePerson(person: Partial<Person> & { id: string }): Promise<{ data: Person | null; error: Error | null }> {
  try {
    const people = getCollection<Person>('people');
    const index = people.findIndex(p => p.id === person.id);
    
    if (index === -1) {
      return { data: null, error: new Error('Person not found') };
    }
    
    const updatedPerson = {
      ...people[index],
      ...person,
      updated_at: new Date().toISOString()
    };
    
    people[index] = updatedPerson;
    saveCollection('people', people);
    
    return { data: updatedPerson, error: null };
  } catch (error) {
    console.error("Error updating person:", error);
    return { data: null, error: error as Error };
  }
}

export async function deletePerson(id: string): Promise<{ error: Error | null }> {
  try {
    const people = getCollection<Person>('people');
    const filteredPeople = people.filter(p => p.id !== id);
    
    saveCollection('people', filteredPeople);
    
    return { error: null };
  } catch (error) {
    console.error("Error deleting person:", error);
    return { error: error as Error };
  }
}

// Budgets
export async function getBudgets(userId: string): Promise<{ data: Budget[] | null; error: Error | null }> {
  try {
    const budgets = getCollection<Budget>('budgets')
      .filter(b => b.user_id === userId);
    
    return { data: budgets, error: null };
  } catch (error) {
    console.error("Error fetching budgets:", error);
    return { data: null, error: error as Error };
  }
}

export async function addBudget(budget: Omit<Budget, 'id' | 'created_at'>): Promise<{ data: Budget | null; error: Error | null }> {
  try {
    const budgets = getCollection<Budget>('budgets');
    
    const newBudget: Budget = {
      ...budget,
      id: Date.now().toString(),
      created_at: new Date().toISOString()
    };
    
    budgets.push(newBudget);
    saveCollection('budgets', budgets);
    
    return { data: newBudget, error: null };
  } catch (error) {
    console.error("Error adding budget:", error);
    return { data: null, error: error as Error };
  }
}

export async function updateBudget(budget: Partial<Budget> & { id: string }): Promise<{ data: Budget | null; error: Error | null }> {
  try {
    const budgets = getCollection<Budget>('budgets');
    const index = budgets.findIndex(b => b.id === budget.id);
    
    if (index === -1) {
      return { data: null, error: new Error('Budget not found') };
    }
    
    const updatedBudget = {
      ...budgets[index],
      ...budget,
      updated_at: new Date().toISOString()
    };
    
    budgets[index] = updatedBudget;
    saveCollection('budgets', budgets);
    
    return { data: updatedBudget, error: null };
  } catch (error) {
    console.error("Error updating budget:", error);
    return { data: null, error: error as Error };
  }
}

export async function deleteBudget(id: string): Promise<{ error: Error | null }> {
  try {
    const budgets = getCollection<Budget>('budgets');
    const filteredBudgets = budgets.filter(b => b.id !== id);
    
    saveCollection('budgets', filteredBudgets);
    
    return { error: null };
  } catch (error) {
    console.error("Error deleting budget:", error);
    return { error: error as Error };
  }
} 