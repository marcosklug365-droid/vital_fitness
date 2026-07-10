import { format, parseISO, isValid } from 'date-fns';
import { es } from 'date-fns/locale';

/**
 * Formatea un número o string a formato moneda (ARS)
 * @param {number|string} amount 
 * @returns {string} Ejemplo: "$ 1.500,00"
 */
export const formatMoney = (amount) => {
  const num = Number(amount);
  if (isNaN(num)) return '$ 0,00';
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
  }).format(num);
};

/**
 * Formatea una fecha (Date o string ISO) a string "dd/MM/yyyy"
 * @param {Date|string} date 
 * @returns {string} Ejemplo: "24/10/2023"
 */
export const formatDate = (date) => {
  if (!date) return '-';
  const d = typeof date === 'string' ? parseISO(date) : date;
  if (!isValid(d)) return '-';
  return format(d, 'dd/MM/yyyy');
};

/**
 * Formatea una fecha con hora a string "dd/MM/yyyy HH:mm"
 * @param {Date|string} date 
 * @returns {string} Ejemplo: "24/10/2023 18:30"
 */
export const formatDateTime = (date) => {
  if (!date) return '-';
  const d = typeof date === 'string' ? parseISO(date) : date;
  if (!isValid(d)) return '-';
  return format(d, 'dd/MM/yyyy HH:mm');
};

/**
 * Retorna el nombre del día y la fecha: "Jueves 24 de Octubre"
 * @param {Date|string} date 
 * @returns {string}
 */
export const formatLongDate = (date) => {
  if (!date) return '-';
  const d = typeof date === 'string' ? parseISO(date) : date;
  if (!isValid(d)) return '-';
  return format(d, "EEEE d 'de' MMMM", { locale: es });
};
