import { User } from 'lucide-react';
import logoUnifor from '../assets/logo-achouunifor.png';
import '../styles/Inicio.css';

const MENU = [
  ['inicio', 'Início'],
  ['gerenciar', 'Gerenciar Item'],
  ['notificacoes', 'Notificações'],
  ['painel', 'Painel Adm.'],
];

// Barra superior das telas de quem está logado; `ativo` é a tela atual
function Topbar({ ativo, aoNavegar, aoAbrirPerfil, menu = MENU }) {
  function clicarLogo() {
    aoNavegar('inicio');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  return (
    <header className="inicio-topbar">
      <button className="logo-botao" onClick={clicarLogo} aria-label="Ir para o início">
        <img className="inicio-logo" src={logoUnifor} alt="AchouUNIFOR" />
      </button>

      <div className="inicio-direita">
        <nav className="inicio-menu">
          {menu.map(([tela, rotulo]) => (
            <button
              key={tela}
              className={tela === ativo ? 'ativo' : undefined}
              onClick={() => aoNavegar(tela)}
            >
              {rotulo}
            </button>
          ))}
        </nav>
        <button className="inicio-perfil" onClick={aoAbrirPerfil} aria-label="Perfil">
          <User size={22} />
        </button>
      </div>
    </header>
  );
}

export default Topbar;
