# Captura de leads CCIPRA

Projeto Firebase: `ccipra-leads`. Não requer Cloud Functions nem plano Blaze.

## Migração segura

- A central de consulta `central-de-leads-ccipra` também precisa apontar para `ccipra-leads` e ter as regras `usuarios/{uid}` e `leads` já publicadas.
- Faça backup/exportação dos leads existentes antes de desligar o projeto antigo. Os dados **não** são transferidos automaticamente quando trocamos o Firebase.
- Não substituir a credencial `FIREBASE_SERVICE_ACCOUNT_JSON` de produção nem publicar esta branch antes de concluir App Check, homologação e a estratégia de migração dos leads.
- As Security Rules da central permitem leitura por usuários autorizados; **não** publique as regras fechadas deste repositório sobre o novo banco compartilhado com a central, pois isso bloquearia a leitura da central. A API usa Admin SDK e não depende de permissões do cliente.

## Fluxo

`leads.js` inicializa App Check com o provedor Enterprise/Fraud Defense e envia JSON para `/api/leads` no mesmo domínio. A API valida origem, tamanho, campos e token (incluindo o App ID) antes de gravar. Não existe endpoint público de leitura, edição ou exclusão. As regras do Firestore devem permanecer fechadas para clientes.

O botão só informa sucesso após resposta do servidor. Dados não entram em URLs, analytics ou localStorage. O mesmo envio conserva um UUID durante nova tentativa de rede, evitando duplicação. Alterar os campos gera um novo UUID.

## Configuração para ativar

1. No projeto Vercel que já hospeda `advancetintasccipra.vercel.app`, usar esta branch para Preview. Não criar outro projeto com o mesmo nome. A conexão disponível durante a implementação não expôs esse projeto; portanto, nenhum deploy ou configuração remota foi alterado.
2. No Google Cloud, selecionar o novo projeto Firebase acima. A conta de serviço antiga NÃO funciona com o novo projeto. Em IAM e administrador → Contas de serviço, criar uma conta dedicada `leads-vercel`. Conceder **Cloud Datastore User** (`roles/datastore.user`) nesse projeto exclusivo de leads. Não usar Owner/Editor nem reutilizar a conta do Advance Check.
3. Na conta de serviço, criar uma chave JSON. Copiar o conteúdo completo diretamente para a variável **Secret** `FIREBASE_SERVICE_ACCOUNT_JSON` na Vercel. Não enviar o JSON por chat, não adicionar ao repositório e não colocá-lo em `public/`. Guardar com segurança ou apagar a cópia local após configurar.
5. Para Preview, restringir a variável de credencial a esta branch autorizada. Quando ativar Production, cadastrar os valores no ambiente correspondente. A variável `FIREBASE_SERVICE_ACCOUNT_JSON` deve conter a nova conta de serviço, com `project_id: ccipra-leads`. Alterações de variáveis exigem um novo deploy.
6. No Firebase Console → App Check, registrar o app Web `1:469987907955:web:414350be001aaaf6cccd06` com reCAPTCHA Enterprise, criar/vincular uma chave de site apropriada e autorizar `advancetintasccipra.vercel.app` (e os hosts de Preview usados). Configurar a chave pública em `RECAPTCHA_ENTERPRISE_SITE_KEY` na Vercel para Build; o build intencionalmente falha se ela estiver ausente. Essa é uma *site key pública*, não a chave secreta da conta de serviço. Para testar numa URL de Preview, adicionar a origem HTTPS exata em `LEAD_ALLOWED_ORIGINS` e o hostname correspondente na chave reCAPTCHA Enterprise. Não usar curingas. A origem de produção já está configurada no código.
7. Framework preset: Other. Build: `npm run build`. Output: `public`. Runtime: Node 24. Não há necessidade de Firebase Hosting, Authentication, Storage, Analytics ou cadastro de chave secreta do reCAPTCHA na Vercel.
8. Publicar `firestore.rules` pelo console do Firebase. O arquivo é referência; o deploy da Vercel não publica regras do Firebase.

O Admin SDK ignora Security Rules: a credencial e a autorização no servidor são parte da proteção. App Check não impede todo abuso nem substitui limites.

## Limites e armazenamento

- Até 16 KiB por requisição, tipos e tamanhos estritos e rejeição de campos extras.
- Não há limite por IP. Pessoas na mesma rede podem enviar sem compartilhar uma cota por endereço.
- Até 1.000 leads por dia UTC no projeto. Atingir o limite retorna 429; ajustar conscientemente se o tráfego esperado mudar.
- O limite global é transacional no Firestore, compartilhado entre instâncias. O IP não é consultado nem armazenado.
- `_leadLimits/global` mantém somente o contador global diário. Contadores antigos por IP não são mais lidos nem atualizados.
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

## Compatibilidade de dependências

Firebase Admin 14.5.0 usa `jwks-rsa` 4, cujo carregamento de `jose` 6 via require falha no runtime da Vercel observado (ERR_REQUIRE_ESM). O override limitado ao Firebase Admin fixa `jwks-rsa` em 3.2.2, que usa uma distribuição CommonJS de jose. O teste de regressão inicia um processo Node com `--no-experimental-require-module` para reproduzir essa restrição. Reavaliar o override ao atualizar o SDK; não remover sem executar esse teste.
