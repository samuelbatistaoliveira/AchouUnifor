import { useCallback, useEffect, useState } from 'react';
import { buscar } from '../services/api';

/**
 * @typedef {Object} CategoriaItem
 * @property {number} id_categoria Identificador único da categoria.
 * @property {string} nome Nome de exibição da categoria.
 * @property {number} total_itens Quantidade total de itens vinculados à categoria.
 */

// Cache em memória da sessão para evitar requisições repetidas a cada troca de tela no menu
let cacheCategorias = null;

/**
 * Hook responsável por buscar e manter a lista de categorias ativas do sistema.
 * Utiliza cache em memória na navegação entre páginas e atualiza o cache quando `recarregar()` é chamado.
 *
 * @returns {{
 *   categorias: CategoriaItem[],
 *   carregando: boolean,
 *   erro: string,
 *   recarregar: () => Promise<void>
 * }}
 */
function useCategorias() {
  const [categorias, setCategorias] = useState(() => cacheCategorias ?? []);
  const [carregando, setCarregando] = useState(() => cacheCategorias === null);
  const [erro, setErro] = useState('');

  const recarregar = useCallback(
    () =>
      buscar('/categorias')
        .then((dados) => {
          const lista = Array.isArray(dados) ? dados : [];
          cacheCategorias = lista;
          setCategorias(lista);
          setErro('');
        })
        .catch(() => setErro('Não foi possível carregar as categorias.'))
        .finally(() => setCarregando(false)),
    []
  );

  useEffect(() => {
    if (cacheCategorias === null) {
      recarregar();
    }
  }, [recarregar]);

  return { categorias, carregando, erro, recarregar };
}

export default useCategorias;
