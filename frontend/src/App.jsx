import { Fragment, useEffect, useState } from 'react';
import { Navigate, Outlet, Route, Routes, useLocation, useNavigate } from 'react-router';
import Topbar from './components/Topbar';
import Login from './pages/auth/Login';
import Cadastro from './pages/auth/Cadastro';
import EsqueceuSenha from './pages/auth/EsqueceuSenha';
import RedefinirSenha from './pages/auth/RedefinirSenha';
import Inicio from './pages/admin/Inicio';
import GerenciarItem from './pages/admin/GerenciarItem';
import Notificacoes from './pages/admin/Notificacoes';
import CriarNotificacao from './pages/admin/CriarNotificacao';
import PainelAdm from './pages/admin/PainelAdm';
import InicioAluno from './pages/aluno/InicioAluno';
import DenunciarPerda from './pages/aluno/DenunciarPerda';
import NotificacoesAluno from './pages/aluno/NotificacoesAluno';
import MinhasDenuncias from './pages/aluno/MinhasDenuncias';
import DetalhesItem from './pages/comum/DetalhesItem';
import Perfil from './pages/comum/Perfil';
import { tipoUsuario, tokenSalvo } from './services/api';

// Telas com a barra de cima
function ComTopbar() {
  return (
    <div className="inicio">
      <Topbar />
      <Outlet />
    </div>
  );
}

// Clicar no menu da tela em que já se está abre ela do zero (ex.: formulário vazio)
function NovaACadaVisita({ children }) {
  const { key } = useLocation();
  return <Fragment key={key}>{children}</Fragment>;
}

function App() {
  const [logado, setLogado] = useState(() => !!tokenSalvo());
  const location = useLocation();
  const navigate = useNavigate();

  // cada tela nova começa do topo
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  function entrar() {
    setLogado(true);
    // volta para a tela que a pessoa tentou abrir antes de fazer login
    navigate(location.state?.de ?? '/', { replace: true });
  }

  function sair() {
    localStorage.removeItem('token');
    sessionStorage.removeItem('token');
    setLogado(false);
    navigate('/login', { replace: true });
  }

  if (!logado) {
    return (
      <Routes>
        <Route path="/login" element={<Login aoEntrar={entrar} />} />
        <Route path="/cadastro" element={<Cadastro />} />
        <Route path="/esqueci-senha" element={<EsqueceuSenha />} />
        <Route path="/redefinir-senha" element={<RedefinirSenha />} />
        <Route path="*" element={<Navigate to="/login" replace state={{ de: location }} />} />
      </Routes>
    );
  }

  // o login é o mesmo para todos; o tipo do usuário decide quais rotas existem
  if (tipoUsuario() === 'administrador') {
    return (
      <Routes>
        <Route element={<ComTopbar />}>
          <Route index element={<Inicio />} />
          <Route path="gerenciar/:id?" element={<NovaACadaVisita><GerenciarItem /></NovaACadaVisita>} />
          <Route path="notificacoes" element={<Notificacoes />} />
          <Route path="notificacoes/nova" element={<CriarNotificacao />} />
          <Route path="painel" element={<Navigate to="/painel/itens" replace />} />
          <Route path="painel/:secao" element={<PainelAdm />} />
        </Route>
        <Route path="itens/:id" element={<DetalhesItem />} />
        <Route path="perfil" element={<Perfil aoSair={sair} />} />
        <Route path="redefinir-senha" element={<RedefinirSenha />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    );
  }

  return (
    <Routes>
      <Route element={<ComTopbar />}>
        <Route index element={<InicioAluno />} />
        <Route path="denunciar" element={<NovaACadaVisita><DenunciarPerda /></NovaACadaVisita>} />
        <Route path="notificacoes" element={<NotificacoesAluno />} />
        <Route path="minhas-denuncias" element={<MinhasDenuncias />} />
      </Route>
      <Route path="itens/:id" element={<DetalhesItem />} />
      <Route path="perfil" element={<Perfil aoSair={sair} />} />
      <Route path="redefinir-senha" element={<RedefinirSenha />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
