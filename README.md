# Bolsillo App - Finanzas Personales

Una aplicación web moderna para gestionar tus finanzas personales, con seguimiento de transacciones, categorías, presupuestos y comprobantes.

## Características

- 💰 Registro de ingresos y gastos
- 📊 Dashboard con gráficos y estadísticas
- 📃 Gestión de comprobantes y archivos
- 📱 Diseño responsivo para móvil y escritorio
- 💼 Presupuestos por categoría

## Configuración

### Requisitos previos

- Node.js (versión 16.x o superior)

### Instalación

1. Clona este repositorio
```bash
git clone https://github.com/tuusuario/bolsillo-app.git
cd bolsillo-app
```

2. Instala las dependencias
```bash
npm install
```

3. Ejecuta la aplicación en modo desarrollo
```bash
npm run dev
```

### Estructura de datos

La aplicación utiliza localStorage para almacenar los siguientes datos:

#### Transacciones
```typescript
interface Transaction {
  id: string;
  description: string;
  amount: number;
  date: string;
  category: string;
  type: 'income' | 'expense';
  paymentMethod: string;
  person?: string;
  attachmentId?: string;
  createdAt: string;
}
```

#### Categorías
```typescript
interface Category {
  id: string;
  name: string;
  type: 'income' | 'expense';
  createdAt: string;
}
```

#### Métodos de pago
```typescript
interface PaymentMethod {
  id: string;
  name: string;
  createdAt: string;
}
```

#### Personas
```typescript
interface Person {
  id: string;
  name: string;
  createdAt: string;
}
```

#### Carpetas
```typescript
interface Folder {
  id: string;
  name: string;
  createdAt: string;
}
```

#### Comprobantes
```typescript
interface Receipt {
  id: string;
  description: string;
  fileName: string;
  fileType: string;
  fileUrl: string;
  folderId?: string;
  transactionId?: string;
  createdAt: string;
}
```

#### Presupuestos
```typescript
interface Budget {
  id: string;
  category: string;
  amount: number;
  period: 'monthly' | 'yearly';
  createdAt: string;
}
```

## Uso

1. Navega al dashboard para ver un resumen de tus finanzas
2. Agrega nuevas transacciones desde la sección de Transacciones
3. Gestiona tus comprobantes en la sección Comprobantes
4. Establece presupuestos en la sección Presupuestos

## Desarrollo

### Estructura de directorios

- `/src/app`: Páginas y componentes específicos de páginas
- `/src/app/api`: Rutas de API
- `/src/components`: Componentes React reutilizables
- `/src/lib`: Utilidades, hooks y contextos
  - `/contexts`: Contextos de React
  - `/hooks`: Hooks personalizados
  - `/services`: Servicios para manejo de datos locales

### Scripts disponibles

- `npm run dev`: Inicia el servidor de desarrollo
- `npm run build`: Construye la aplicación para producción
- `npm run start`: Inicia la aplicación en modo producción
- `npm run lint`: Ejecuta ESLint para verificar el código

## Contribución

Las contribuciones son bienvenidas. Para cambios importantes, por favor abre primero un issue para discutir qué te gustaría cambiar.

## Licencia

MIT