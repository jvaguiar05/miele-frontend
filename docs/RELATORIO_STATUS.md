# Relatório de Status e histórico de vencimentos

## Onde acessar

- Relatórios → Relatório de Status (`/reports/status`).
- Dashboard: cards de volume, saldo e processos, barras de status e ranking por empresa abrem o relatório com filtros na URL. Próximos a vencer mantém o relatório de prazos.
- Detalhe da PER/DCOMP → aba Vencimentos (também no seletor de seção do celular).

## Regras

O relatório usa processos ativos/não excluídos de clientes ativos/não excluídos, igual ao Dashboard. Todos os status são aceitos, inclusive rascunho e cancelado. Filtros: nome/CNPJ, empresa exata (link do Dashboard), status, tributo por trecho, grupo e datas inclusivas.

O período pode usar transmissão, vencimento ou cadastro. O status mostrado é o atual, não uma reconstrução histórica. Grupos Volume transmitido e Saldo em acompanhamento usam as mesmas regras do Dashboard. Saldo é o campo cadastrado; valores ausentes/ilegíveis são sinalizados como total parcial.

Tabela com 50 registros por página. Totais representam todos os registros filtrados. CSV exporta todas as páginas com os filtros aplicados, incluindo proteção para textos que poderiam ser interpretados como fórmulas. Alterações digitadas no formulário só passam a valer após Aplicar filtros. Voltar/avançar no navegador restaura filtros da URL.

O histórico consulta a auditoria por tipo de entidade e ID interno da PER/DCOMP correspondente ao UUID da rota. Exibe vencimento inicial, alterações e justificativas, com usuário e horário. Eventos da mesma requisição com datas iguais são agrupados quando há uma justificativa explícita. Não oferece alteração/exclusão de logs. Histórico ausente não é reconstruído artificialmente.

Endpoints restritos a administradores/funcionários aprovados:

- GET `/api/v1/perdcomps/status-report/`
- GET `/api/v1/perdcomps/{uuid}/deadline-history/`

Sem migração de banco e sem alterações nos cadastros existentes.

## Validação

14 testes passam usando SQLite em memória: calendário, criação/edição, auditoria, permissões, filtros, CSV, paginação e correspondência dos totais com o Dashboard.

Comando no backend: `manage.py test apps.clients.test_dashboard_operations apps.perdcomps.test_deadlines apps.perdcomps.test_reports --settings=core.settings.dashboard_test --noinput`.

Build frontend aprovado. TypeScript completo ainda aponta erros anteriores em Requests/RequestsTable. Conferência visual nesta entrega permanece pendente.
