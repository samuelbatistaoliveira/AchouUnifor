import { useState } from 'react';
import Login from './pages/auth/Login.jsx';
import Inicio from './pages/admin/Inicio.jsx';
import Perfil from './pages/comum/Perfil.jsx';
import GerenciarItem from './pages/admin/GerenciarItem.jsx';
import PainelAdm from './pages/admin/PainelAdm.jsx';
import InicioAluno from './pages/aluno/InicioAluno.jsx';
import Notificacoes from './pages/admin/Notificacoes.jsx';
import CriarNotificacao from './pages/admin/CriarNotificacao.jsx';
import { tipoUsuario } from './services/api';

function App() {
  const temToken = () => !!(localStorage.getItem('token') || sessionStorage.getItem('token'));
  const [logado, setLogado] = useState(temToken);
  const [tela, setTela] = useState('inicio');
  const [itemEditado, setItemEditado] = useState(null);

  function editarItem(item) {
    setItemEditado(item);
    setTela('editar');
  }

  function sair() {
    localStorage.removeItem('token');
    sessionStorage.removeItem('token');
    setTela('inicio');
    setLogado(false);
  }

  if (!logado) return <Login aoEntrar={() => setLogado(true)} />;
  // login é o mesmo para todos; as telas abaixo são só de administrador
  if (tipoUsuario() !== 'administrador') return <InicioAluno aoSair={sair} />;
  if (tela === 'perfil') return <Perfil aoVoltar={() => setTela('inicio')} aoSair={sair} />;
  if (tela === 'painel') return <PainelAdm aoNavegar={setTela} aoAbrirPerfil={() => setTela('perfil')} aoEditarItem={editarItem} />;
  // keys diferentes: sair da edição para "Gerenciar Item" começa um formulário vazio
  if (tela === 'editar') return <GerenciarItem key="editar" item={itemEditado} aoNavegar={setTela} aoAbrirPerfil={() => setTela('perfil')} />;
  if (tela === 'notificacoes') return <Notificacoes aoNavegar={setTela} aoAbrirPerfil={() => setTela('perfil')} />;
  if (tela === 'nova-notificacao') return <CriarNotificacao aoNavegar={setTela} aoAbrirPerfil={() => setTela('perfil')} />;
  if (tela === 'gerenciar') return <GerenciarItem key="novo" aoNavegar={setTela} aoAbrirPerfil={() => setTela('perfil')} />;
  return <Inicio aoNavegar={setTela} aoAbrirPerfil={() => setTela('perfil')} aoEditarItem={editarItem} />;
}

export default App;
