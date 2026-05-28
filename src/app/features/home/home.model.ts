import { Categoria } from '../admin/promociones/models/promocion.model';

export interface CategoriaConConteo extends Categoria {
  totalPromociones: number;
}
