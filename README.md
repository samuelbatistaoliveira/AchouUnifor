# 🔎 AchouUnifor

Sistema web criado para auxiliar a comunidade acadêmica da Universidade de Fortaleza (UNIFOR) na comunicação e no gerenciamento de objetos perdidos e encontrados dentro do campus.

## 🎯 Objetivo

O **AchouUnifor** tem como proposta oferecer um espaço único para que estudantes, professores e colaboradores possam registrar e procurar pertences que tenham sido perdidos ou encontrados na universidade.

A ideia é reduzir a dificuldade de localizar objetos e facilitar o processo de devolução, disponibilizando informações organizadas sobre cada item cadastrado.

O sistema está sendo desenvolvido como parte da disciplina de **Desenvolvimento de Plataformas Web**, da Universidade de Fortaleza.

## ⚙️ Principais recursos

Entre os recursos planejados para a plataforma estão:

* Registro de itens que foram perdidos;
* Registro de objetos encontrados no campus;
* Pesquisa de itens cadastrados;
* Filtros para facilitar a localização dos registros;
* Classificação dos objetos por categorias;
* Informações sobre data e local em que o item foi perdido ou encontrado;
* Adição de fotos aos registros;
* Página com os detalhes de cada objeto;
* Possibilidade de informar que um objeto já foi devolvido;
* Acompanhamento dos registros realizados pelo usuário;
* Mecanismo para auxiliar na identificação de possíveis correspondências;
* Área destinada ao gerenciamento e à organização dos registros.

> O conjunto de funcionalidades poderá sofrer alterações durante o desenvolvimento, conforme os requisitos definidos para o sistema.

## 📁 Estrutura de pastas

```
backend/
  sql/                 scripts do banco
  src/
    config/            banco, Supabase e upload
    controllers/       lógica de cada rota
    routes/            rotas do Express
    seguranca/         verificarToken e verificarAdmin
    server.js
frontend/src/
  pages/
    auth/              login, cadastro, esqueci a senha
    admin/             telas do administrador
    aluno/             telas do aluno
    comum/             telas usadas pelos dois (perfil, detalhes do item)
  components/          pedaços reaproveitados (Topbar, CampoFotos)
  hooks/               useCategorias, useImagensItens, useItem, useFiltrosDaUrl, useVoltar
  services/api.js      chamadas ao backend
  utils/constantes.js  listas fixas (blocos, status)
  styles/              arquivos .css
  assets/              imagens
  App.jsx              todas as rotas
```

## 🧭 Rotas do frontend

Cada tela tem seu endereço, e os filtros ficam na URL (ex.: `/?categoria=Eletrônicos&status=achado`), então dá para atualizar a página, voltar e compartilhar o link.

| Quem | Rota | Tela |
| --- | --- | --- |
| Todos | `/login`, `/cadastro`, `/esqueci-senha` | entrada |
| Todos | `/itens/:id` | detalhes do item |
| Todos | `/perfil` | perfil |
| Admin | `/` | início (filtros: `busca`, `categoria`, `bloco`, `data`, `status`) |
| Admin | `/gerenciar`, `/gerenciar/:id` | registrar / editar item |
| Admin | `/notificacoes`, `/notificacoes/nova` | notificações enviadas / nova |
| Admin | `/painel/itens`, `/painel/usuarios?busca=`, `/painel/categorias`, `/painel/denuncias`... | painel administrativo |
| Aluno | `/` | início (filtros: `busca`, `categoria`, `data`) |
| Aluno | `/denunciar` | denunciar perda |
| Aluno | `/notificacoes` | notificações |
| Aluno | `/minhas-denuncias?status=` | minhas denúncias |

## 👨‍💻 Equipe

* Fernando Antonio de Albuquerque Rocha Neto
* José Valter Alves de Lima Junior
* Pedro Lucas de Oliveira Duarte
* Francisco Edson Dier Marinho
* Samuel Batista Oliveira

## 🎓 Projeto acadêmico

**Universidade de Fortaleza — UNIFOR**

**Disciplina:** Desenvolvimento de Plataformas Web

## 📍 Situação atual

O projeto encontra-se em etapa inicial de desenvolvimento, envolvendo o levantamento das necessidades dos usuários, definição dos requisitos e planejamento das funcionalidades que serão implementadas.
