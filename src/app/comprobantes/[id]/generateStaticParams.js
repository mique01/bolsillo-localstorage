// Esta función es requerida para páginas dinámicas cuando se usa output: export
export function generateStaticParams() {
  // Para desarrollo local o cuando no hay datos persistentes, devolvemos un array con un ID dummy
  // que será reemplazado en tiempo de ejecución con el ID real
  return [{ id: 'placeholder' }];
} 