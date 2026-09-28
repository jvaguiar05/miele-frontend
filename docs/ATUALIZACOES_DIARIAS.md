# Relatório de Atualizações Diárias

Acesso: Relatórios → Atualizações diárias (`/reports/updates`), ou Dashboard → Atividades de hoje → Relatório completo.

## Funcionamento

- Consulta somente leitura da auditoria já existente, sem nova migração.
- Sem datas: dia atual em America/Sao_Paulo. Uma data: apenas aquele dia. Duas datas: intervalo inclusivo, limitado a 366 dias.
- Filtros por cliente, número PER/DCOMP e ação; administradores também podem pesquisar usuário e autoria.
- Administradores veem todas as ações; funcionários veem apenas as próprias. A API aplica o mesmo limite ao CSV e ao card do dashboard.
- Eventos sem usuário são identificados como “Sistema / autoria não registrada”, sem atribuir automaticamente sua execução ao sistema.
- Detalhes mostram antes/depois dos campos de negócio autorizados e justificativas de exceção de vencimento, quando registradas.
- Paginação de 20 eventos. CSV inclui todas as páginas filtradas, uma linha por campo alterado, com proteção contra fórmulas de planilha.
- Endpoint: `GET /api/v1/activities/daily-report/`. Parâmetros: `start`, `end`, `user`, `client`, `perdcomp`, `action`, `origin`, `page`, `export=csv`.

## Limites e segurança

O relatório não inventa histórico anterior: depende dos eventos efetivamente gravados na auditoria. Campos técnicos, senhas, tokens, IPs e estruturas JSON brutas não são expostos pelo novo endpoint. Textos livres de negócio não devem conter credenciais.

O vínculo com cliente/PER/DCOMP depende do recurso e dos dados disponíveis. Eventos de aprovação e outros recursos podem não ter esse vínculo. Registros excluídos continuam representados quando houver histórico, mas sem link para abrir o cadastro inexistente. Nomes podem refletir o cadastro atual quando não houver nome no evento.

Esta implementação não altera as permissões dos endpoints legados de auditoria. Consultas extensas processam os eventos do período no servidor; medir o volume antes de ampliar a janela máxima ou implantar em produção.

## Conferência no sandbox

1. Altere um campo de uma PER/DCOMP fictícia e salve.
2. Abra o relatório, clique em Atualizar e expanda Detalhes do evento: confira usuário, horário, campo, antes e depois.
3. Filtre por cliente e número da PER/DCOMP; exporte o CSV e compare os valores.
4. Consulte um período sem alterações: deve aparecer “Nenhuma atividade corresponde aos filtros”.
5. Se houver usuário funcionário de teste, confirme que só aparecem ações dele.

Testes automatizados cobrem datas e fuso, permissões, exclusões, campos sensíveis, paginação, CSV e proteção contra fórmulas. A conferência visual deve ser feita no sandbox; não houve publicação em produção.
