# Posições e fechamentos trimestrais

## Acesso e uso

Dashboard → Posições e fechamentos, ou Relatórios → Saldos trimestrais (`/reports/quarters`).

A posição atual soma o saldo cadastrado de processos ativos/não excluídos, vinculados a clientes ativos/não excluídos, com status TRANSMITIDO, EM_PROCESSAMENTO, PARCIALMENTE_DEFERIDO ou VENCIDO. Usa o mesmo universo do indicador de saldo do Dashboard. Inclui saldo acumulado, não apenas transmissões do trimestre.

Administradores podem salvar posições parciais durante o trimestre. O fechamento fica disponível apenas no último dia do trimestre, sem saldos ausentes/ilegíveis. É único por ano/trimestre. A confirmação captura os valores relidos do banco nesse momento. Não é uma captura automática às 23:59; o horário efetivo fica visível.

Histórico e exportação CSV conservam nomes, CNPJ, status, datas e valores capturados, mesmo que os cadastros sejam alterados posteriormente. A interface/API não permite editar ou excluir fotografias. Funcionários aprovados podem consultar; apenas administradores podem registrar. Cada registro também gera evento de auditoria.

Comparação mostra o saldo atual menos o fechamento do trimestre imediatamente anterior, quando existe e não há campos inválidos na posição atual. Nenhum período anterior é reconstruído ou preenchido com zeros. Para esta primeira versão, fechamento retroativo e retificação formal não são oferecidos.

O aviso no Dashboard aparece nos últimos sete dias corridos do trimestre, quando o saldo total em acompanhamento é positivo. Sem envio de e-mail nesta entrega. A disponibilidade real do crédito não é inferida desses saldos.

## Sandbox e migração

Adicionada somente a tabela clients_quartersnapshot pela migração clients.0009_quartersnapshot. Aplicada ao banco local em `.sandbox/miele-sandbox.sqlite3`, após backup SQLite validado em `.sandbox/backup-before-quarters-20260924-175059-419769.sqlite3` (repositório backend).

O script `scripts/migrate_sandbox_quarters.py` do backend seleciona explicitamente o banco local, cria backup consistente com SQLite e aplica migrações. Não precisa ser executado novamente para testar esta entrega. Não execute Initialize-Sandbox nem apague o banco.

## Validação

18 testes aprovados em SQLite temporário em memória, cobrindo calendário, relatórios, auditoria, preservação das fotografias, fechamento duplicado, permissões e comparação trimestral. Build do frontend e ESLint da nova página aprovados. Persistem erros TypeScript anteriores em Requests/RequestsTable.

Para conferir manualmente: abra Saldos trimestrais, salve uma posição parcial, edite um saldo fictício, compare a posição atual com a fotografia salva e exporte a fotografia em CSV. A data/hora e o responsável devem permanecer os da captura. A confirmação de fechamento continuará desabilitada fora do último dia do trimestre.
