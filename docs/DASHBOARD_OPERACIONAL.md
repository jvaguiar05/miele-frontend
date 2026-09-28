# Dashboard operacional — primeira entrega

A página `/home` usa `/api/v1/dashboard/operations/` para administradores e funcionários aprovados. A administração continua em `/admin-dashboard`. Nenhuma migração ou alteração de registros é necessária.

## Regras desta versão

- Universo: PER/DCOMPs ativos, não excluídos, vinculados a clientes ativos e não excluídos.
- Volume: soma decimal de valor_pedido com transmissão até hoje, excluindo rascunhos e cancelados. Inclui transmitidos que posteriormente mudaram de status. Não consolida retificações; depende de regra futura de vínculo entre documentos.
- Saldo em acompanhamento: soma do valor_saldo cadastrado para TRANSMITIDO, EM_PROCESSAMENTO, PARCIALMENTE_DEFERIDO e VENCIDO. Não representa confirmação de disponibilidade do crédito. Valores ausentes ou inválidos geram aviso de total parcial.
- Alertas: mesmos status do saldo, usando data_vencimento cadastrada. Começam 30 dias úteis antes, excluindo o vencimento na contagem regressiva. Vencidos permanecem visíveis, sem modificar o status gravado.
- Calendário operacional inicial: segunda a sexta, exceto datas nacionais fixas. Datas adicionais locais/móveis podem ser configuradas no backend em DASHBOARD_EXTRA_HOLIDAYS (lista ISO). Validar o calendário e a interpretação do prazo com a equipe antes de produção.
- Trimestre: saldo atual e aviso nos últimos 7 dias corridos do trimestre quando há saldo positivo. Não há fotografia histórica ou comparação com trimestre anterior nesta entrega.
- Atividades: últimos 20 eventos do dia em São Paulo, respeitando as permissões do endpoint de auditoria.
- Atualização automática a cada minuto e ao retornar à janela, com botão manual. Falhas são mostradas, sem substituir valores por zeros fictícios.

## Validar no sandbox

Mantenha backend e frontend abertos e acesse `/home`. Se o endpoint não aparecer após a atualização automática do Django, reinicie apenas Start-Sandbox.ps1. Não execute novamente a inicialização nem apague o banco.

Confira totais, abra um processo pelo alerta, edite um valor fictício e clique Atualizar. As datas exibidas nos alertas preservam o dia cadastrado, sem conversão de fuso.

## Validação técnica

Backend: 5 testes com SQLite em memória, via `manage.py test apps.clients.test_dashboard_operations --settings=core.settings.dashboard_test --noinput`.
Frontend: `npm.cmd run build` passou. A checagem TypeScript completa aponta erros existentes nos arquivos de solicitações (Requests/RequestsTable), fora desta entrega.

## Próximas etapas

Confirmar regra de um ano, calendário completo e status elegíveis; implementar relatórios/exportação e histórico trimestral; depois notificações persistentes/e-mail, contratos e Mandado de Segurança. O painel atual não implementa esses módulos.
