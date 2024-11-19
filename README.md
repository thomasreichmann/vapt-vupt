# Buscador de datas para agendamento de identidade no Vapt-Vupt

Esse projeto contém formas que testei de verificar periódicamente os agendamentos disponíveis em municípios especificos no [Vapt-Vupt](https://vaptvupt.go.gov.br/)

## Como está rodando

O projeto está rodando um workflow do Github Actions que executa um script `.js` usando node, esse workflow é executado a cada 5 minutos.

A parte mais interessante foi ter um motivo para implementar um self-hosted runner no meu servidor local (homelab) para garantir que o workflow iria ser executado frequentemente. 
Atualmente o servidor local está rodando o runner utilizando o quick-start padrão do github e um serviço para manter ele ativo em momentos onde o servidor reiniciar.

## Informações interessantes

Essa solução podia facilmente ser implementada direto commo uma cronjob rodando no meu servidor(homelab), mas fui insistente em fazer usando Actions com um schedule, 
achei que dessa forma seria mais fácil de controlar e saber o que está sendo rodado, e me permitiria desabilitar/habilitar o buscador de qualquer lugar.

Atualmente a notificação que eu escolhi foi uma mensagem por webhook no discord, essa era a solução mais simples e imediata para receber um push notification no meu celular, 
mas seria interessante também adicionar notificações por email (e/ou app dedicado?)

Um dos problemas que a solução tem é, caso uma data seja encontrada, o buscador vai notificar a cada X minutos enquanto aquela data estiver disponível, então pode sim gerar um leve(ou não tão leve) spam de notificações.
Mas em teoria, se o intervalo de datas que você está buscando estiver bem definido, você pode desativar o buscador assim que encontrar e conseguir agendar.

Outra adição interessante seria também mandar pela notificação qual unidade em especifico tem as datas disponíveis.

## Arquivos "mortos"

Antes de usar um script js para buscar as datas, fiz a solução usando um [Document do insomnia](https://docs.insomnia.rest/insomnia/get-started-with-documents), e rodando uma test-suite dele no actions usando o [inso](https://github.com/marketplace/actions/setup-inso)
para rodar no Actions. Essa solução não foi boa e foi substituida pelo script mais simples e com menos depêndencias.

Com isso, tudo que está nas pastas `specs`, `.insomnia` e o workflow `test-scheduler.yml` são "mortos".

## Disclaimer

Quase toda linha de código nesse repo foi gerado ou pelo Chat-GPT ou pela Claude (Sonnet 3.5). O intuíto era criar uma solução rápida para um problema pontual (e funcionou perfeitamente).
