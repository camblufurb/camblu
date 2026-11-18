import { Link } from 'react-router-dom';
import { AnimatedClimateTitle } from '../components/AnimatedClimateTitle';
import { Icon } from '../components/Icon';

const PRIVACY_SECTIONS = [
  {
    icon: 'verified_user',
    title: '1. Controlador e Finalidade do Portal',
    paragraphs: [
      'O portal digital do Centro Acadêmico de Medicina de Blumenau (CAMBLU — FURB) é mantido pela diretoria estudantil vigente em caráter institucional e sem fins lucrativos para gestão de eventos, certificados de horas complementares (AACCs), Clube CAMBLU, Lojinha Oficial, transparência financeira e atendimento discente.',
      'Esta Política de Privacidade descreve como tratamos seus dados pessoais em conformidade com a Lei Geral de Proteção de Dados Pessoais (LGPD — Lei nº 13.709/2018) e com as diretrizes de segurança do Google OAuth.',
    ],
  },
  {
    icon: 'manage_accounts',
    title: '2. Dados Pessoais Coletados',
    paragraphs: [
      'Autenticação Google (Firebase Auth): recebemos apenas nome completo, endereço de e-mail e URL da foto de perfil fornecidos pela sua Conta Google ao clicar em entrar. Não acessamos sua senha nem outros dados privados da sua conta Google.',
      'Cadastro acadêmico e perfil (/perfil): coletamos CPF, telefone/celular, vínculo institucional (FURB ou externo), turma e condição de calouro (incluindo tamanho de camiseta para benefícios aplicáveis) exclusivamente para identificação nominal em ingressos, retirada de itens na Lojinha e emissão de certificados.',
      'Demandas e CAMBLU Mulher (/demandas e /camblu-mulher): quando você opta pelo envio anônimo, o nome e o e-mail do remetente não são gravados no banco de dados nem incluídos na mensagem encaminhada.',
    ],
  },
  {
    icon: 'receipt_long',
    title: '3. Uso dos Dados e Serviços Terceirizados',
    paragraphs: [
      'Infraestrutura Firebase (Google Cloud): autenticação de sessão, armazenamento cadastral, ingressos, certificados e registros públicos acadêmicos utilizam Firebase Authentication, Cloud Firestore e Cloud Storage.',
      'Pagamentos via Stripe: ao finalizar compras de ingressos, produtos da Lojinha ou assinaturas do Clube CAMBLU, você é redirecionado ao ambiente seguro do Stripe (Cartão de Crédito ou PIX). O portal do CAMBLU não coleta, processa nem armazena números de cartão de crédito.',
      'Validação pública de certificados (/certificados/validar): ao consultar a autenticidade de um certificado por código, apenas o nome do titular e o CPF parcialmente mascarado são exibidos publicamente para proteção de privacidade.',
      'Validação pública da carteirinha de estudante (/clube/cartao/validar): exclusiva para membros com assinatura ativa a partir do Plano Comum, apresentando foto, nome completo, CPF, instituição (FURB), curso e turma estritamente mediante leitura do QR Code ou código identificador da carteirinha.',
    ],
  },
  {
    icon: 'security',
    title: '4. Segurança, Retenção e Direitos do Titular (LGPD)',
    paragraphs: [
      'O acesso a registros pessoais de usuários, ingressos, pedidos e relatos é protegido por regras estritas de autenticação e controle de acesso no servidor, restrito ao próprio titular da conta e à diretoria administradora autenticada (camblufurb@gmail.com).',
      'Você pode consultar ou atualizar seus dados cadastrais diretamente na página de perfil, revogar permissões de login Google a qualquer momento nas configurações da sua Conta Google ou solicitar esclarecimentos, correções e exclusão de conta/dados pelo e-mail institucional.',
    ],
  },
];

export function PrivacyPolicyPage() {
  return (
    <section className="page-section container m3-reveal" style={{ display: 'grid', gap: '2rem' }}>
      <div className="m3-card m3-card--forest page-hero-card">
        <div className="page-hero-inner">
          <span className="m3-label-large" style={{ color: '#f1de97' }}>
            Conformidade LGPD & OAuth
          </span>
          <AnimatedClimateTitle tone="light" accessibleHeading="Política de Privacidade">
            PRIVACIDADE
          </AnimatedClimateTitle>
          <p className="page-hero-desc">
            Transparência sobre como o portal do CAMBLU coleta, protege e utiliza informações acadêmicas e cadastrais
            nos termos da Lei Geral de Proteção de Dados (LGPD).
          </p>
        </div>
      </div>

      <div style={{ display: 'grid', gap: '1.25rem' }}>
        {PRIVACY_SECTIONS.map((sec) => (
          <article key={sec.title} className="m3-card" style={{ display: 'grid', gap: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <span className="m3-badge m3-badge--blue" aria-hidden="true">
                <Icon name={sec.icon} size={18} />
              </span>
              <h2 style={{ margin: 0 }}>{sec.title}</h2>
            </div>
            <div style={{ display: 'grid', gap: '0.6rem', color: 'var(--md-sys-color-on-surface-variant)' }}>
              {sec.paragraphs.map((p) => (
                <p key={p} style={{ margin: 0, lineHeight: 1.65 }}>
                  {p}
                </p>
              ))}
            </div>
          </article>
        ))}

        <article className="m3-card m3-card--tonal" style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
          <div style={{ display: 'grid', gap: '0.35rem' }}>
            <h2 style={{ margin: 0 }}>Contato sobre Privacidade e Dados</h2>
            <p className="text-muted" style={{ margin: 0 }}>
              Dúvidas ou solicitações referentes aos seus dados pessoais podem ser enviadas para{' '}
              <a href="mailto:camblufurb@gmail.com">camblufurb@gmail.com</a> · Última atualização: novembro de 2026.
            </p>
          </div>
          <Link to="/" className="m3-btn m3-btn--outlined">
            <Icon name="home" size={18} />
            <span>Voltar ao Início</span>
          </Link>
        </article>
      </div>
    </section>
  );
}
