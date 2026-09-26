import { useState } from 'react'
import './Login.css'
import olhoAberto from '../assets/senha-visivel.png'
import olhoFechado from '../assets/senha-oculta.png'


function Login() {
    const [mostrarSenha, setMostrarSenha] = useState(false)

    return (
        <div className="login">
            <h1>Achou Unifor</h1>

            <form>
                <label htmlFor="email">Email</label>
                <input id="email" type="email" pattern=".+@edu\.unifor\.br" placeholder="seuemail@edu.unifor.br" />


                <label htmlFor="senha">Senha</label>
                <div className='campo-senha'>
                    <input id="senha" type={mostrarSenha ? 'text' : 'password'} placeholder="Sua senha institucional" />

                    <button type="button" onClick={() => setMostrarSenha(!mostrarSenha)}
                        aria-label={mostrarSenha ? 'Esconder senha' : 'Mostrar Senha'}
                    >
                        <img src={mostrarSenha ? olhoFechado : olhoAberto} alt="" />
                    </button>
                </div>
                <button className="btn-submeter" type="submit">Entrar</button>

            </form>
        </div>
    )
}

export default Login