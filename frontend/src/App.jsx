import { useState } from 'react';
import Login from './Login.jsx';
import Inicio from './Inicio.jsx';

function App() {
  const temToken = () => !!(localStorage.getItem('token') || sessionStorage.getItem('token'));
  const [logado, setLogado] = useState(temToken);

  function sair() {
    localStorage.removeItem('token');
    sessionStorage.removeItem('token');
    setLogado(false);
  }

  return logado ? <Inicio aoSair={sair} /> : <Login aoEntrar={() => setLogado(true)} />;
}

export default App;
