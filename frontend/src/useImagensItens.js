import { useEffect, useState } from 'react';

// Primeira foto de cada item (Supabase, via backend): { [id_item]: url | null }
function useImagensItens(itens) {
  const [imagens, setImagens] = useState({});

  useEffect(() => {
    let cancelado = false;

    async function carregarImagens() {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');

      if (!token) return;

      const resultados = await Promise.all(
        itens.map(async (item) => {
          try {
            const resposta = await fetch(
              `http://localhost:3000/imagens/item/${item.id_item}`,
              {
                headers: {
                  Authorization: `Bearer ${token}`
                }
              }
            );

            if (!resposta.ok) {
              return [item.id_item, null];
            }

            const dados = await resposta.json();

            return [
              item.id_item,
              dados.imagens?.[0]?.url ?? null
            ];
          } catch {
            return [item.id_item, null];
          }
        })
      );

      if (!cancelado) {
        setImagens(Object.fromEntries(resultados));
      }
    }

    carregarImagens();

    return () => {
      cancelado = true;
    };
  }, [itens]);

  return imagens;
}

export default useImagensItens;
