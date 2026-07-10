import { differenceInDays, parseISO } from 'date-fns';

/**
 * Calcula el estado extendido de una membresía en base a su fecha de vencimiento
 * @param {string|Date} fechaVencimiento 
 * @returns {'activa' | 'por_vencer' | 'vencida' | 'sin_membresia'}
 */
export const calcularEstadoMembresia = (fechaVencimiento) => {
  if (!fechaVencimiento) return 'sin_membresia';

  const hoy = new Date();
  const vencimiento = typeof fechaVencimiento === 'string' ? parseISO(fechaVencimiento) : fechaVencimiento;
  const diasRestantes = differenceInDays(vencimiento, hoy);

  if (diasRestantes > 3) return 'activa';
  if (diasRestantes > 0 && diasRestantes <= 3) return 'por_vencer';
  return 'vencida';
};

/**
 * Devuelve las propiedades visuales (Badge variant, color, label) para un estado de membresía
 * @param {'activa' | 'por_vencer' | 'vencida' | 'sin_membresia' | 'suspendida'} estado 
 * @returns {{ label: string, variant: "default" | "secondary" | "destructive" | "outline", colorClass: string }}
 */
export const getMembresiaUI = (estado) => {
  switch (estado) {
    case 'activa':
      return { 
        label: 'Activa', 
        variant: 'default', // Por defecto en shadcn 'default' usa bg-primary (nuestro Lime)
        colorClass: 'text-primary' 
      };
    case 'por_vencer':
      return { 
        label: 'Por vencer', 
        variant: 'secondary', // Amarillo/Naranja en nuestra customización futura, por ahora secondary
        colorClass: 'text-yellow-500' 
      };
    case 'vencida':
      return { 
        label: 'Vencida', 
        variant: 'destructive', // bg-destructive
        colorClass: 'text-destructive' 
      };
    case 'suspendida':
      return { 
        label: 'Suspendida', 
        variant: 'outline', 
        colorClass: 'text-muted-foreground' 
      };
    case 'sin_membresia':
    default:
      return { 
        label: 'Sin membresía', 
        variant: 'outline', 
        colorClass: 'text-muted-foreground' 
      };
  }
};
