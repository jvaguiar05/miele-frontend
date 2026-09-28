# Vencimentos e próximos a vencer

## Uso

No cadastro PER/DCOMP, aba Datas, o cálculo automático está marcado para novos registros. Informe a transmissão para ver o vencimento e o início do alerta. Regra operacional inicial: mais um ano de calendário, avançando até o próximo dia útil. 29/02 passa a 28/02 no ano seguinte, antes do ajuste de dia útil.

Ao editar, o cálculo vem desmarcado para preservar vencimentos existentes. Ative para recalcular. Uma nova data manual diferente da previsão exige justificativa, gravada na auditoria com autor, data anterior e nova data. Nenhum registro existente é recalculado em lote.

Na API, criação sem vencimento calcula automaticamente. Em atualização sem vencimento explícito, alterar transmissão recalcula; sem alteração de datas, preserva. `recalculate_due_date: true` força o cálculo. `due_date_reason` recebe a justificativa da exceção.

O menu Relatórios e o botão Relatório e exportação no Dashboard abrem o relatório de próximos a vencer. Filtros: nome/CNPJ, status e intervalo de vencimento. O intervalo restringe a janela de 30 dias úteis; não transforma o relatório em uma lista geral. Vencidos são opcionais. CSV exporta todos os resultados dos filtros aplicados, com proteção contra fórmulas inseridas nos textos.

## Calendário e escopo

Dashboard, relatório e cálculo de vencimento compartilham o mesmo calendário: dias de semana, feriados nacionais fixos e `DASHBOARD_EXTRA_HOLIDAYS`, lista de datas ISO no settings Django. Feriados móveis/locais não são presumidos; configure as datas aplicáveis antes de validar os prazos para uso em produção.

São elegíveis para alertas TRANSMITIDO, EM_PROCESSAMENTO, PARCIALMENTE_DEFERIDO e VENCIDO, de processos e clientes ativos/não excluídos. As datas de vencimento existentes continuam sendo a fonte dos alertas.

Não exige migração, reinicialização do banco ou novos usuários. Se necessário, reinicie somente Start-Sandbox.ps1 e atualize o navegador.

## Testes

`manage.py test apps.clients.test_dashboard_operations apps.perdcomps.test_deadlines --settings=core.settings.dashboard_test --noinput`

SQLite temporário em memória. Cobre calendário/ano bissexto, prévia, criação/edição pela API, exceção com auditoria, limite de 30 dias úteis, filtros, CSV e acesso anônimo.
