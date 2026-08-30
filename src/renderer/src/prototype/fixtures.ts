// PROTOTYPE — throwaway fixture data. No Gmail, no persistence.
import type { EmailMsg, MarkedItem } from '../types'

type Seed = [from: string, subject: string, date: string, snippet: string]

const seeds: Seed[] = [
  ['Wise <noreply@info.wise.com>', 'Your free Wise card is inside', 'Aug 28, 11:50 AM', 'Spend in 40+ currencies with the real exchange rate. Order yours today.'],
  ['UW-IT Service Center <help@uw.edu>', 'Two-factor devices changed for UW NetID dvieira', 'Jul 15, 03:07 PM', 'A two-factor device was added to your account. If this was not you, contact UW-IT.'],
  ['UW-IT Service Center <help@uw.edu>', 'Email forwarding changed for UW NetID dvieira', 'Jul 1, 06:47 PM', 'Your UW email forwarding address was updated on July 1.'],
  ['UW-IT Service Center <help-noreply@uw.edu>', 'Verify your UW NetID recovery email address', 'Jul 1, 06:47 PM', 'Please confirm the recovery address on file so we can reach you.'],
  ['UW-IT Service Center <help-noreply@uw.edu>', 'UW NetID Request', 'Jul 1, 06:43 PM', 'Your UW NetID request has been received and is being processed.'],
  ['UW Immunity Verification <immunity@uw.edu>', 'Confirmation: Immunization Requirements Satisfied', 'Jul 14, 05:01 PM', 'You have satisfied the immunization requirements for autumn quarter.'],
  ['UW CIRCLE <uwcircle@uw.edu>', 'Your fall 2026 guide', 'Aug 19, 04:31 PM', 'Everything happening on campus this fall, in one place.'],
  ['UW CIRCLE <uwcircle@uw.edu>', 'Your fall 2026 guide (resend)', 'Aug 19, 04:31 PM', 'Everything happening on campus this fall, in one place.'],
  ['UW CIRCLE <uwcircle@uw.edu>', 'Enjoying your life outside of graduate school', 'Aug 5, 03:00 PM', 'Grad school is not all of you. Here is how peers make room for the rest.'],
  ['UW CIRCLE <uwcircle@uw.edu>', 'Getting the support you need in graduate school', 'Jul 22, 03:15 PM', 'Advising, counselling and peer groups available to you this quarter.'],
  ['UW Canvas <notifications@instructure.com>', 'Course Enrollment', 'Jul 20, 02:32 PM', 'You have been enrolled in CSE 512 A: Data Visualization.'],
  ['UW Registrar <registrar@uw.edu>', 'Enrollment Confirmation Received', 'Jul 1, 06:57 PM', 'Your enrollment for autumn quarter 2026 has been confirmed.'],
  ['The Medium Newsletter <newsletters@medium.com>', 'How Medium writers communicate science', 'Aug 26, 10:20 AM', 'Plus: the essays our editors could not stop thinking about this week.'],
  ['Tesouro Direto <tesourodireto@emkt.b3.com.br>', 'O mercado mudou. E agora, Daniel?', 'Aug 28, 11:16 AM', 'Veja o que mudou nas taxas dos titulos publicos nesta semana.'],
  ['Super Duolingo <super-support@duolingo.com>', 'Welcome to Duolingo Family Plan!', 'Aug 27, 07:28 AM', 'You can now invite up to 5 people to your family plan.'],
  ['Spotify <no-reply@alerts.spotify.com>', '843759 - Your Spotify login code', 'Aug 27, 03:03 PM', 'Use this code to finish signing in. It expires in 10 minutes.'],
  ['Samsung <samsunglatam@br.email.samsung.com>', 'Quer ter ate R$ 500 OFF no lancamento?', 'Aug 28, 07:57 PM', 'Cadastre-se agora e garanta seu cupom de lancamento.'],
  ['Samsung <samsunglatam@br.email.samsung.com>', 'Ultimos dias para aproveitar ate 60% OFF', 'Aug 28, 12:06 PM', 'A promocao acaba domingo. Nao perca.'],
  ['Samsung <samsunglatam@br.email.samsung.com>', 'Seu Galaxy merece um upgrade', 'Aug 25, 09:12 AM', 'Troque seu aparelho antigo e economize no novo Galaxy.'],
  ['GitHub <noreply@github.com>', '[mado_mail] Run failed: build (main)', 'Aug 29, 08:41 AM', 'The workflow build failed on commit 5071183 improve UX.'],
  ['GitHub <noreply@github.com>', '[mado_mail] Dependabot: bump vite from 7.2.4 to 7.2.6', 'Aug 24, 06:02 AM', 'Bumps vite from 7.2.4 to 7.2.6. Release notes included.'],
  ['LinkedIn <messages-noreply@linkedin.com>', '3 new jobs for "Staff Engineer"', 'Aug 29, 07:10 AM', 'Based on your profile and search history this week.'],
  ['LinkedIn <invitations@linkedin.com>', 'Marina sent you an invitation', 'Aug 22, 05:44 PM', 'Marina would like to connect with you on LinkedIn.'],
  ['Nubank <nao-responda@nubank.com.br>', 'Sua fatura fechou', 'Aug 27, 06:00 AM', 'A fatura do seu cartao fechou em R$ 1.284,30. Vencimento dia 5.'],
  ['Notion <team@makenotion.com>', 'Your weekly digest', 'Aug 25, 11:00 AM', '4 pages updated in Mado workspace since you last checked in.'],
  ['Vercel <notifications@vercel.com>', 'Deployment ready: mado-site', 'Aug 28, 10:33 PM', 'Production deployment for mado-site completed in 42s.'],
  ['Ana Ribeiro <ana.ribeiro@fastmail.com>', 'Re: weekend plans', 'Aug 29, 09:15 AM', 'Sunday works better for me. Should I book the table for four?'],
  ['Marcos Leal <marcos@studioleal.co>', 'Invoice #2291 attached', 'Aug 28, 04:20 PM', 'Attaching the invoice for August. Payment terms are net 15.'],
  ['Steam <noreply@steampowered.com>', 'Items on your wishlist are on sale', 'Aug 26, 01:00 PM', '3 items from your wishlist are discounted for the next 48 hours.'],
  ['Airbnb <automated@airbnb.com>', 'Your trip to Lisbon is in 12 days', 'Aug 23, 08:00 AM', 'Here is everything you need before check-in on September 10.'],
  ['Google <no-reply@accounts.google.com>', 'Security alert for your account', 'Aug 21, 07:55 PM', 'A new sign-in on Windows. If this was you, no action is needed.'],
  ['Stripe <receipts@stripe.com>', 'Your receipt from Anthropic', 'Aug 20, 03:31 PM', 'Receipt for $20.00 USD paid on August 20, 2026.']
]

const bodyFor = (s: Seed): string =>
  s[3] +
  '\n\nThis is placeholder body text used by the prototype so the email peek has something to render. ' +
  'It stands in for the readable text extracted from the Gmail message body.\n\n-- ' +
  s[0].split('<')[0].trim()

export const emails: EmailMsg[] = seeds.map((s, i) => ({
  id: 'm' + i,
  threadId: 't' + i,
  from: s[0],
  subject: s[1],
  date: s[2],
  snippet: s[3],
  body: bodyFor(s)
}))

export const rules: MarkedItem[] = [
  { id: 'r1', from: 'uwcircle@uw.edu', action: 'archive' },
  { id: 'r2', from: 'samsunglatam', action: 'trash' },
  { id: 'r3', from: 'linkedin.com', action: 'trash' },
  { id: 'r4', from: 'noreply@github.com', action: 'archive' },
  { id: 'r5', from: 'medium.com', action: 'archive' }
]

export const senderName = (from: string): string => from.split('<')[0].trim() || from
export const senderAddr = (from: string): string =>
  (from.match(/<(.+)>/)?.[1] ?? from).toLowerCase()
export const senderDomain = (from: string): string => senderAddr(from).split('@')[1] ?? 'unknown'
export const initials = (from: string): string =>
  senderName(from)
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase()

/** Day bucket derived from the fixture date string, e.g. "Aug 28". */
export const dayOf = (date: string): string => date.split(',')[0]

/**
 * Subject reduced to a comparable shape: no Re:/Fwd:, no numbers, no punctuation.
 * Used to spot near-duplicate blasts ("Your fall 2026 guide" sent twice).
 */
export const subjectShape = (subject: string): string =>
  subject
    .toLowerCase()
    .replace(/^(re|fwd|fw):\s*/g, '')
    .replace(/\(resend\)/g, '')
    .replace(/[0-9]+/g, '#')
    .replace(/[^a-z#\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
