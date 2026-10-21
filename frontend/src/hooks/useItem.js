import { useEffect, useState } from 'react';
import { buscar } from '../services/api';

// Um item do backend pelo caminho (ex.: '/itens/5'), para as telas abertas direto pela URL
function useItem(caminho) {
  const [item, setItem] = useState(null);
  const [erro, setErro] = useState('');

  useEffect(() => {
    let cancelado = false;
    buscar(caminho)
      .then((dados) => !cancelado && setItem(dados))
      .catch((e) => !cancelado && setErro(e.message || 'Não foi possível carregar o item.'));
    return () => {
      cancelado = true;
    };
  }, [caminho]);

  return { item, setItem, erro };
}

export default useItem;
