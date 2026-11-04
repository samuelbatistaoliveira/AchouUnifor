import { useSearchParams } from 'react-router';

// Filtros guardados na URL (ex.: /?categoria=Eletrônicos&status=achado):
// cada filtro tem endereço próprio, sobrevive ao F5 e volta certo no "voltar" do navegador.
function useFiltrosDaUrl() {
  const [params, setParams] = useSearchParams();

  const filtro = (nome) => params.get(nome) ?? '';

  function mudarFiltro(nome, valor) {
    setParams(
      (atuais) => {
        const novos = new URLSearchParams(atuais);
        if (valor) novos.set(nome, valor);
        else novos.delete(nome);
        return novos;
      },
      { replace: true } // digitar na busca não enche o histórico
    );
  }

  return [filtro, mudarFiltro];
}

export default useFiltrosDaUrl;
