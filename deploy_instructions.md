
# Instruções de Deploy - IAFinanceCRM

Este projeto foi construído como um PWA (Progressive Web App) moderno.

### 1. Configuração do Banco de Dados
- Se estiver usando **Supabase**, copie o conteúdo de `db_schema.sql` e execute no SQL Editor do seu projeto.
- O sistema já vem com um usuário padrão:
  - **Email**: `admin@admin.com`
  - **Senha**: (qualquer uma no simulador, em produção use hashes)

### 2. Rodando o Projeto
- Este é um App React. Para rodar localmente:
  1. Instale as dependências: `npm install`
  2. Inicie o servidor: `npm run dev`
- Se for subir em uma hospedagem estática (Vercel, Netlify, Firebase Hosting), basta fazer o build.

### 3. PWA (Instalação no Celular)
- Acesse o link do projeto pelo Chrome (Android) ou Safari (iOS).
- No Android, aparecerá um banner "Adicionar à Tela Inicial".
- No iOS, clique em "Compartilhar" > "Adicionar à Tela de Início".

### 4. Estrutura do Backend (Mock)
O código atual utiliza um `store` persistido no `localStorage` para simular o backend PHP solicitado, garantindo que o app seja funcional imediatamente sem necessidade de um servidor PHP configurado para o preview. Para conectar a um backend PHP real:
- Altere os serviços em `App.tsx` para chamarem seus endpoints PHP via `fetch()`.
- Seus endpoints PHP devem retornar JSON no formato: `{"status": "success", "data": [...]}`.
