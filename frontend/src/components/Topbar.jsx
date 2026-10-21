import { User } from 'lucide-react';
import { Link, useLocation } from 'react-router';
import logoUnifor from '../assets/logo-achouunifor.png';
import { tipoUsuario } from '../services/api';
import '../styles/Inicio.css';

const MENU_ADMIN = [
  ['/', 'Início'],
  ['/gerenciar', 'Gerenciar Item'],
  ['/notificacoes', 'Notificações'],
  ['/painel', 'Painel Adm.'],
];

const MENU_ALUNO = [
  ['/', 'Início'],
  ['/denunciar', 'Denunciar'],
  ['/notificacoes', 'Notificações'],
];

// Barra superior das telas de quem está logado; o menu depende do tipo de usuário
function Topbar() {
  const { pathname } = useLocation();
  const menu = tipoUsuario() === 'administrador' ? MENU_ADMIN : MENU_ALUNO;

  // "Início" também fica marcado no detalhe de um item (/itens/5); os outros valem para as subrotas
  const ativo = (para) =>
    para === '/'
      ? pathname === '/' || pathname.startsWith('/itens/')
      : pathname === para || pathname.startsWith(`${para}/`);

  return (
    <header className="inicio-topbar">
      <Link
        to="/"
        className="logo-botao"
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        aria-label="Ir para o início"
      >
        <img className="inicio-logo" src={logoUnifor} alt="AchouUNIFOR" />
      </Link>

      <div className="inicio-direita">
        <nav className="inicio-menu">
          {menu.map(([para, rotulo]) => (
            <Link
              key={para}
              to={para}
              className={ativo(para) ? 'ativo' : undefined}
              aria-current={ativo(para) ? 'page' : undefined}
            >
              {rotulo}
            </Link>
          ))}
        </nav>
        <Link to="/perfil" className="inicio-perfil" aria-label="Perfil">
          <User size={22} />
        </Link>
      </div>
    </header>
  );
}

export default Topbar;
