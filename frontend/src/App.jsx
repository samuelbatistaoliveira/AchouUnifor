import { useState } from 'react';
import Login from './Login.jsx';
import Inicio from './Inicio.jsx';
import Perfil from './Perfil.jsx';
import GerenciarItem from './GerenciarItem.jsx';
import PainelAdm from './PainelAdm.jsx';
import InicioAluno from './InicioAluno.jsx';
import { tipoUsuario } from './api';

function App() {
  const temToken = () => !!(localStorage.getItem('token') || sessionStorage.getItem('token'));
  const [logado, setLogado] = useState(temToken);
  const [tela, setTela] = useState('inicio');

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
  if (tela === 'painel') return <PainelAdm aoNavegar={setTela} aoAbrirPerfil={() => setTela('perfil')} />;
  if (tela === 'gerenciar') return <GerenciarItem aoNavegar={setTela} aoAbrirPerfil={() => setTela('perfil')} />;
  return <Inicio aoNavegar={setTela} aoAbrirPerfil={() => setTela('perfil')} />;
}

export default App;
