import { useLocation, useNavigate } from 'react-router';

// Volta para a tela anterior; se a página foi aberta direto pelo endereço (sem anterior), vai para `padrao`
function useVoltar(padrao = '/') {
  const navigate = useNavigate();
  const { key } = useLocation();
  return () => (key === 'default' ? navigate(padrao) : navigate(-1));
}

export default useVoltar;
