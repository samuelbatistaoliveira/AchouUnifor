import logoUnifor from './assets/logo-achouunifor.png';
import './Inicio.css';
import './AreaAluno.css';

// shortcut: placeholder até as telas do aluno existirem; o site atual é só para administradores
function AreaAluno({ aoSair }) {
  return (
    <div className="inicio">
      <header className="inicio-topbar">
        <img className="inicio-logo" src={logoUnifor} alt="AchouUNIFOR" />
        <button className="area-aluno-sair" onClick={aoSair}>Sair</button>
      </header>

      <main className="area-aluno">
        <h1>Área do aluno</h1>
        <p>Esta área ainda está em construção. Em breve você poderá acompanhar seus itens por aqui.</p>
      </main>
    </div>
  );
}

export default AreaAluno;
