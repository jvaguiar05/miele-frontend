# Ambiente local isolado

Este ambiente serve para desenvolver e validar mudanças sem acessar o site, banco, usuários ou arquivos originais.

## Garantias de isolamento

- O frontend usa exclusivamente `http://127.0.0.1:8001/api/v1` no modo sandbox.
- O backend usa o banco local `miele-system/.sandbox/miele-sandbox.sqlite3`.
- O banco é criado vazio, com dados de teste inseridos manualmente.
- A integração com Google Drive é desativada nos scripts do sandbox.

## Primeiro uso

Abra um terminal no backend e execute:

```powershell
./scripts/Initialize-Sandbox.ps1
./scripts/Start-Sandbox.ps1
```

O primeiro comando pede uma senha e cria o administrador local `sandbox.admin`. Ele não usa nem altera contas reais.

Se o script informar que não encontrou Python funcional, recrie o ambiente virtual do backend com uma instalação local de Python 3.11+ e as dependências do arquivo `requirements/requirements-dev.txt`; os ambientes virtuais existentes nesta máquina apontam para instalações removidas.

Em outro terminal, no frontend, execute:

```powershell
npm run dev:sandbox
```

Abra a URL exibida pelo Vite, normalmente `http://localhost:8080`, e entre com `sandbox.admin` e a senha escolhida.

## Dados de teste

Cadastre clientes e PER/DCOMPs fictícios pela interface. Use CNPJs e nomes explicitamente fictícios; não importe planilhas ou documentos reais. Para testar vencimentos e relatórios, crie registros com datas e valores variados.

## Reinicialização

Para começar novamente, pare o backend, exclua apenas o arquivo `miele-system/.sandbox/miele-sandbox.sqlite3` e execute o passo de primeiro uso. Nunca execute comandos de limpeza contra o banco original.
