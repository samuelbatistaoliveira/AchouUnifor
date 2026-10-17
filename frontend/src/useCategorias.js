import { useCallback, useEffect, useState } from 'react';

// Categorias ativas do banco: [{ id_categoria, nome, total_itens }]; `recarregar` busca de novo
function useCategorias() {
  const [categorias, setCategorias] = useState([]);
  const [erro, setErro] = useState('');

  const recarregar = useCallback(
    () =>
      fetch('http://localhost:3000/categorias')
        .then((r) => {
          if (!r.ok) throw new Error();
          return r.json();
        })
        .then((dados) => { setCategorias(dados); setErro(''); })
        .catch(() => setErro('Não foi possível carregar as categorias.')),
    []
  );

  useEffect(() => { recarregar(); }, [recarregar]);

  return { categorias, erro, recarregar };
}

export default useCategorias;
