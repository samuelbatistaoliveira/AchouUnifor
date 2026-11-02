import { Fragment, Suspense, lazy, useEffect, useState } from 'react';
import { Navigate, Outlet, Route, Routes, useLocation, useNavigate } from 'react-router';
import Topbar from './components/Topbar';
import { limparToken, sessaoVencida, tipoUsuario, tokenSalvo } from './services/api';

// Code splitting por rota: cada tela é carregada sob demanda (React.lazy)
const Login = lazy(() => import('./pages/auth/Login'));
const Cadastro = lazy(() => import('./pages/auth/Cadastro'));
const EsqueceuSenha = lazy(() => import('./pages/auth/EsqueceuSenha'));
const RedefinirSenha = lazy(() => import('./pages/auth/RedefinirSenha'));
const Inicio = lazy(() => import('./pages/admin/Inicio'));
const GerenciarItem = lazy(() => import('./pages/admin/GerenciarItem'));
const Notificacoes = lazy(() => import('./pages/admin/Notificacoes'));
const CriarNotificacao = lazy(() => import('./pages/admin/CriarNotificacao'));
const PainelAdm = lazy(() => import('./pages/admin/PainelAdm'));
const InicioAluno = lazy(() => import('./pages/aluno/InicioAluno'));
const DenunciarPerda = lazy(() => import('./pages/aluno/DenunciarPerda'));
const NotificacoesAluno = lazy(() => import('./pages/aluno/NotificacoesAluno'));
const MinhasDenuncias = lazy(() => import('./pages/aluno/MinhasDenuncias'));
const DetalhesItem = lazy(() => import('./pages/comum/DetalhesItem'));
const Perfil = lazy(() => import('./pages/comum/Perfil'));

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

  // cada tela nova começa do topo; com o token vencido, volta para o login
  useEffect(() => {
    window.scrollTo(0, 0);
    if (logado && sessaoVencida()) sair();
    // só a troca de tela dispara a conferência; logado/sair mudam junto com ela
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  function entrar() {
    setLogado(true);
    // volta para a tela que a pessoa tentou abrir antes de fazer login
    navigate(location.state?.de ?? '/', { replace: true });
  }

  function sair() {
    limparToken();
    setLogado(false);
    navigate('/login', { replace: true });
  }

  if (!logado) {
    return (
      <Suspense fallback={null}>
        <Routes>
          <Route path="/login" element={<Login aoEntrar={entrar} />} />
          <Route path="/cadastro" element={<Cadastro />} />
          <Route path="/esqueci-senha" element={<EsqueceuSenha />} />
          <Route path="/redefinir-senha" element={<RedefinirSenha />} />
          <Route path="*" element={<Navigate to="/login" replace state={{ de: location }} />} />
        </Routes>
      </Suspense>
    );
  }

  // o login é o mesmo para todos; o tipo do usuário decide quais rotas existem
  if (tipoUsuario() === 'administrador') {
    return (
      <Suspense fallback={null}>
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
      </Suspense>
    );
  }

  return (
    <Suspense fallback={null}>
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
    </Suspense>
  );
}

export default App;
