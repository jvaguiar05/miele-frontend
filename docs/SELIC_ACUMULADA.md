# Selic no Miele

## Selic Mensal

A aba **Selic Mensal**, ao lado da acumulada, usa o mesmo fluxo: selecionar PDF, conferir prévia e confirmar. Cada tipo mantém versões e taxas separadas. Somente ADM importa/corrige; usuários aprovados consultam, exportam CSV e baixam o original.

As duas abas oferecem o link **Consultar taxas no Sicalc**, aberto em uma nova guia. Os PDFs mensais usam a mesma pasta `GDRIVE_SELIC_FOLDER_ID`; não é necessária outra configuração do Drive.

O PDF mensal emitido em 01/10/2026 contém 380 taxas, de fevereiro/1995 a setembro/2026. Setembro/2026: 1,08%. Janeiro/1995 e outubro a dezembro/2026 estão vazios. O relatório foi validado e importado apenas no sandbox; em produção, o ADM deve confirmar sua importação após publicar backend e frontend.

A migração `0014_selic_report_type` classifica os relatórios existentes como acumulados e inclui o tipo na identificação das versões. Esta mudança não realiza cálculos ou alterações nos registros de PER/DCOMP.

Acesso: **Relatórios → Selic** (`/reports/selic`).

## O que a tabela representa

A carga inicial é o relatório do Sicalc emitido em 25/09/2026, com taxas acumuladas **para pagamento em setembro/2026**. Ela não é uma tabela genérica de taxas mensais.

- Fevereiro/1995 a setembro/2026: 380 valores publicados.
- Janeiro/1995 e outubro a dezembro/2026: vazios; vazio nunca é convertido em zero.
- Setembro/2026: `0,00`, um valor oficial válido.

## Atualização segura

Somente o administrador pode selecionar um novo PDF oficial. O sistema extrai e apresenta uma prévia com competência de pagamento, emissão, quantidade de valores, lacunas e divergências. Nada é salvo antes da confirmação.

Cada confirmação cria uma versão imutável, preservando PDF original, hash, tabela extraída, usuário e data. Uma correção manual exige justificativa e também cria outra versão; o histórico não é sobrescrito.

Todos os usuários aprovados podem consultar versões e exportar CSV. Apenas administradores podem importar ou corrigir.

## Limite atual

As taxas mensais oficiais ainda não foram importadas. O Miele não tenta derivá-las da tabela acumulada e não estima períodos futuros. Para implementar cálculos completos de créditos e débitos, ainda é necessário obter o relatório oficial de taxas mensais e validar as regras de incidência.
