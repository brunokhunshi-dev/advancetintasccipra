# Captura de leads CCIPRA

Projeto Firebase: `captura-de-leads---ccipra-2026`. Não requer Cloud Functions nem plano Blaze.

## Fluxo

`leads.js` inicializa App Check com o provedor Enterprise/Fraud Defense e envia JSON para `/api/leads` no mesmo domínio. A API valida origem, tamanho, campos e token (incluindo o App ID) antes de gravar. Não existe endpoint público de leitura, edição ou exclusão. As regras do Firestore devem permanecer fechadas para clientes.

O botão só informa sucesso após resposta do servidor. Dados não entram em URLs, analytics ou localStorage. O mesmo envio conserva um UUID durante nova tentativa de rede, evitando duplicação. Alterar os campos gera um novo UUID.

## Configuração para ativar

1. No projeto Vercel que já hospeda `advancetintasccipra.vercel.app`, usar esta branch para Preview. Não criar outro projeto com o mesmo nome. A conexão disponível durante a implementação não expôs esse projeto; portanto, nenhum deploy ou configuração remota foi alterado.
2. No Google Cloud, selecionar o projeto Firebase acima. Em IAM e administrador → Contas de serviço, criar uma conta dedicada `leads-vercel`. Conceder **Cloud Datastore User** (`roles/datastore.user`) nesse projeto exclusivo de leads. Não usar Owner/Editor nem reutilizar a conta do Advance Check.
3. Na conta de serviço, criar uma chave JSON. Copiar o conteúdo completo diretamente para a variável **Secret** `FIREBASE_SERVICE_ACCOUNT_JSON` na Vercel. Não enviar o JSON por chat, não adicionar ao repositório e não colocá-lo em `public/`. Guardar com segurança ou apagar a cópia local após configurar.
4. Criar `LEAD_RATE_LIMIT_SECRET` como Secret, com valor aleatório de pelo menos 32 caracteres, gerado por gerenciador de senhas. Não usar a chave do reCAPTCHA.
5. Para Preview, restringir as duas variáveis a esta branch autorizada. Quando ativar Production, cadastrar os valores no ambiente correspondente. Alterações de variáveis exigem um novo deploy.
6. Para testar numa URL de Preview, adicionar a origem HTTPS exata em `LEAD_ALLOWED_ORIGINS` e o hostname correspondente na chave Fraud Defense. Não usar curingas. A origem de produção já está configurada no código. Confirmar que a chave pública de `leads.js` é exatamente a registrada no App Check com Fraud Defense/Enterprise.
7. Framework preset: Other. Build: `npm run build`. Output: `public`. Runtime: Node 24. Não há necessidade de Firebase Hosting, Authentication, Storage, Analytics ou cadastro de chave secreta do reCAPTCHA na Vercel.
8. Publicar `firestore.rules` pelo console do Firebase. O arquivo é referência; o deploy da Vercel não publica regras do Firebase.

O Admin SDK ignora Security Rules: a credencial e a autorização no servidor são parte da proteção. App Check não impede todo abuso nem substitui limites.

## Limites e armazenamento

- Até 16 KiB por requisição, tipos e tamanhos estritos e rejeição de campos extras.
- Até 5 envios por IP por janela de 10 minutos e 20 por dia UTC. A janela é fixa; não é um limite deslizante.
- Até 1.000 leads por dia UTC no projeto. Atingir o limite retorna 429; ajustar conscientemente se o tráfego esperado mudar.
- Os limites são transacionais no Firestore, compartilhados entre instâncias. O IP não é salvo: usa-se um identificador HMAC em `_leadLimits`. Esse identificador é pseudônimo, não anonimização.
- Pessoas na mesma rede da feira podem compartilhar IP e limite. Testar esse cenário antes de divulgar o formulário.
- `_leadLimits` contém um documento por identificador de IP mais um contador global. Não é exposto ao visitante.
- As cotas gratuitas podem ser consumidas por requisições e leituras rejeitadas; esses limites não constituem garantia contra esgotamento de recursos. Monitorar Vercel e Firestore.
- Nenhuma exclusão automática está configurada: definir o prazo aprovado de retenção antes da publicação e executar a limpeza de leads, contadores antigos e exportações. Não depende de TTL pago do Firestore.
- Não há painel administrativo nesta entrega. Consultar os cadastros pelo console Firebase, com acesso IAM restrito e contas individuais.

## Validação

`npm ci`, `npm test`, `npm run build`. O build copia somente os arquivos públicos necessários; API, testes, regras, documentos e credenciais não são copiados para `public/`.

Antes de produção, testar na Vercel com credencial real:

1. Enviar um lead de teste no domínio autorizado e confirmar um documento em `leads` com data do servidor e status `novo`.
2. Conferir todos os campos e o pedido de amostra; apagar o lead de teste depois.
3. Verificar que requests sem App Check ou com token inválido retornam 401 e não gravam.
4. Verificar origem externa → 403; campos extras → 400; payload grande → 413; excesso de envios → 429.
5. Repetir o mesmo `envioId`: deve existir apenas um documento.
6. No navegador, tentar leitura direta do Firestore: deve retornar permissão negada.
7. Confirmar que textos com caracteres HTML aparecem como texto no console ou em qualquer futuro painel. Nunca renderizar mensagens com `innerHTML`.

Os testes locais usam dependências simuladas: não validam credencial, App Check real, permissões IAM ou gravação real. Isso só pode ser confirmado depois da configuração remota.
