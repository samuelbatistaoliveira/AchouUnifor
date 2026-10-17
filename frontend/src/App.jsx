import { useState } from 'react';
import Login from './Login.jsx';
import Inicio from './Inicio.jsx';
import Perfil from './Perfil.jsx';
import GerenciarItem from './GerenciarItem.jsx';

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
  if (tela === 'perfil') return <Perfil aoVoltar={() => setTela('inicio')} aoSair={sair} />;
  if (tela === 'gerenciar') return <GerenciarItem aoNavegar={setTela} aoAbrirPerfil={() => setTela('perfil')} />;
  return <Inicio aoNavegar={setTela} aoAbrirPerfil={() => setTela('perfil')} />;
}

export default App;
