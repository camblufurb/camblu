# API do Clube CAMBLU (`GET /api/clube/status`)

Documentação técnica destinada exclusivamente a parceiros e integrações de backend (Spaiq, Gorit PRO e ferramentas acadêmicas autorizadas) para verificação de assinatura ativa no **Clube CAMBLU**.

## Visão Geral

- **Endpoint:** `GET /api/clube/status`
- **Base URL (Produção Firebase Hosting):** `https://<seu-dominio>/api/clube/status`
- **Base URL (Emulador / Cloud Function):** `https://southamerica-east1-<project-id>.cloudfunctions.net/api/api/clube/status`
- **Autenticação:** Aberta (conforme definição atual do projeto, retorna exclusivamente flags não sensíveis de status da assinatura, sem expor dados pessoais do aluno).

## Parâmetros de Consulta (Query String)

Informe pelo menos um dos parâmetros abaixo:

| Parâmetro | Tipo | Descrição | Exemplo |
| :--- | :--- | :--- | :--- |
| `cpf` | `string` | CPF do estudante (com ou sem máscara; dígitos normalizados automaticamente no servidor) | `?cpf=52998224725` |
| `email` | `string` | E-mail cadastrado da conta Google do estudante | `?email=aluno@furb.br` |

## Resposta (`200 OK`)

```json
{
  "active": true,
  "tier": "raro",
  "tierCode": 2,
  "validUntil": "2027-05-16T12:00:00.000Z"
}
```

### Campos retornados

- `active` (`boolean`): `true` apenas se `membershipActive` estiver ativo e `validUntil` (quando definido) ainda estiver no futuro.
- `tier` (`"none" | "comum" | "raro" | "epico" | "lendario"`): nível vigente da assinatura (`"none"` quando `active === false`).
- `tierCode` (`0 | 1 | 2 | 3 | 4`): código numérico do plano ativo para facilitar regras condicionais por nível:
  - `0`: nenhum plano ativo (`none`)
  - `1`: `comum` (Comum)
  - `2`: `raro` (Raro)
  - `3`: `epico` (Épico)
  - `4`: `lendario` (Lendário)
- `validUntil` (`string | null`): data limite em formato ISO 8601 ou `null`.

Quando nenhum usuário corresponde ao CPF/e-mail informado, o endpoint retorna `200 OK` com:

```json
{
  "active": false,
  "tier": "none",
  "tierCode": 0,
  "validUntil": null
}
```

### Erros possíveis

- `400 Bad Request`: retornado quando nem `cpf` nem `email` são enviados na query:
  ```json
  { "error": "Informe cpf ou email na query." }
  ```

## Exemplos de Integração

### cURL

```bash
curl "https://www.camblu.org/api/clube/status?cpf=52998224725"
```

### JavaScript / TypeScript

```ts
export async function consultarClubeCamblu(cpfOuEmail: string) {
  const param = cpfOuEmail.includes('@')
    ? `email=${encodeURIComponent(cpfOuEmail.trim())}`
    : `cpf=${encodeURIComponent(cpfOuEmail.replace(/\D+/g, ''))}`;

  const res = await fetch(`https://www.camblu.org/api/clube/status?${param}`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return (await res.json()) as {
    active: boolean;
    tier: 'none' | 'comum' | 'raro' | 'epico' | 'lendario';
    tierCode: 0 | 1 | 2 | 3 | 4;
    validUntil: string | null;
  };
}
```
