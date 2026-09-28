# Relatórios personalizados

Acesso pela aba **Relatórios**, à direita de PER/DCOMP, ou diretamente em `/reports/status`.

O filtro **Cliente ou CNPJ** pesquisa nome, razão social ou CNPJ e permite selecionar até 100 clientes. As empresas escolhidas aparecem como marcadores removíveis. Sem seleção, o relatório considera todos os clientes ativos. Status, tributo, grupo e período podem ser combinados e são respeitados pelo CSV.

## Rascunhos históricos

`Rascunho` continua disponível nos filtros para localizar registros antigos. Novas PER/DCOMPs usam `Transmitido` como padrão e a API impede criar ou fazer um processo voltar para Rascunho. Um registro antigo ainda em Rascunho pode ser salvo sem alterar esse campo ou movido para qualquer status atual. Nenhum registro existente é convertido pela migração.

## Conferência no sandbox

1. Abra Relatórios na navegação principal.
2. Digite parte do nome ou CNPJ e selecione dois ou mais clientes nos resultados abaixo do campo.
3. Combine com status, tributo, grupo ou período e clique em Aplicar filtros.
4. Remova individualmente um cliente e aplique novamente.
5. Exporte o CSV e confirme que contém todos os resultados filtrados, não apenas a página visível.
6. Abra uma PER/DCOMP antiga em Rascunho: ela deve continuar legível e permitir mudança para outro status. Em uma nova PER/DCOMP, Rascunho não deve ser oferecido.
