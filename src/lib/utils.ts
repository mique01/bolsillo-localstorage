/**
 * Funciones de utilidad para la aplicación
 */

import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Formatea un número como moneda (pesos argentinos)
 * @param amount - El monto a formatear
 * @returns El monto formateado como moneda
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
}

/**
 * Formatea una fecha en formato legible
 * @param dateString - La fecha en formato ISO o string válido para Date
 * @returns La fecha formateada en formato dd/mm/yyyy
 */
export function formatDate(date: Date | string): string {
  if (typeof date === 'string') {
    date = new Date(date);
  }
  
  return date.toLocaleDateString('es-AR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

/**
 * Genera un ID único
 * @returns Un ID único basado en timestamp y número aleatorio
 */
export function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

/**
 * Calcula el tiempo transcurrido desde una fecha dada
 * @param dateString - La fecha en formato ISO o string válido para Date
 * @returns String con el tiempo transcurrido (ej: "hace 2 días")
 */
export function timeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  let interval = Math.floor(seconds / 31536000);
  if (interval >= 1) {
    return interval === 1 ? 'hace 1 año' : `hace ${interval} años`;
  }
  
  interval = Math.floor(seconds / 2592000);
  if (interval >= 1) {
    return interval === 1 ? 'hace 1 mes' : `hace ${interval} meses`;
  }
  
  interval = Math.floor(seconds / 86400);
  if (interval >= 1) {
    return interval === 1 ? 'hace 1 día' : `hace ${interval} días`;
  }
  
  interval = Math.floor(seconds / 3600);
  if (interval >= 1) {
    return interval === 1 ? 'hace 1 hora' : `hace ${interval} horas`;
  }
  
  interval = Math.floor(seconds / 60);
  if (interval >= 1) {
    return interval === 1 ? 'hace 1 minuto' : `hace ${interval} minutos`;
  }
  
  return seconds < 10 ? 'ahora mismo' : `hace ${Math.floor(seconds)} segundos`;
}

/**
 * Trunca un texto si excede la longitud máxima
 * @param text - El texto a truncar
 * @param maxLength - La longitud máxima permitida
 * @returns El texto truncado con "..." si excede la longitud máxima
 */
export function truncateText(text: string, maxLength: number): string {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}

/**
 * Agrupa un array por una propiedad
 * @param array - El array a agrupar
 * @param key - La propiedad por la que agrupar
 * @returns Un objeto con las agrupaciones
 */
export function groupBy<T, K extends keyof any>(array: T[], key: (item: T) => K) {
  return array.reduce((acc, item) => {
    const groupKey = key(item);
    if (!acc[groupKey]) {
      acc[groupKey] = [];
    }
    acc[groupKey].push(item);
    return acc;
  }, {} as Record<K, T[]>);
}

/**
 * Capitaliza la primera letra de un string
 * @param str - El string a capitalizar
 * @returns El string con la primera letra en mayúscula
 */
export function capitalize(str: string): string {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export function getRandomColor(): string {
  const letters = '0123456789ABCDEF';
  let color = '#';
  for (let i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
}

// Función para obtener el primer día del mes actual
export function getFirstDayOfMonth(): Date {
  const date = new Date();
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

// Función para obtener el último día del mes actual
export function getLastDayOfMonth(): Date {
  const date = new Date();
  return new Date(date.getFullYear(), date.getMonth() + 1, 0);
}

// Función para obtener la fecha de hace N días
export function getDaysAgo(days: number): Date {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date;
} 