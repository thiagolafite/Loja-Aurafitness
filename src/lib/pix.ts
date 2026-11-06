/**
 * Utilitário de Geração de PIX Estático (Padrão Banco Central do Brasil / EMV BR Code)
 * Garante compatibilidade com todos os aplicativos bancários (Nubank, Itaú, Inter, Bradesco, PicPay, etc.)
 */

function crc16(payload: string): string {
  let crc = 0xFFFF;
  for (let i = 0; i < payload.length; i++) {
    crc ^= payload.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      if ((crc & 0x8000) !== 0) {
        crc = ((crc << 1) ^ 0x1021) & 0xFFFF;
      } else {
        crc = (crc << 1) & 0xFFFF;
      }
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, '0');
}

function emvField(id: string, value: string): string {
  const len = String(value.length).padStart(2, '0');
  return `${id}${len}${value}`;
}

export interface PixPayloadOptions {
  key: string;
  name?: string;
  city?: string;
  amount?: number;
  txid?: string;
  description?: string;
}

export function generatePixBrCode({
  key,
  name = 'AURA FITNESS',
  city = 'SAO PAULO',
  amount,
  txid = '***',
  description,
}: PixPayloadOptions): string {
  const cleanKey = key.trim();
  const cleanName = (name || 'AURA FITNESS')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .slice(0, 25);

  const cleanCity = (city || 'SAO PAULO')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .slice(0, 15);

  const cleanTxid = (txid || '***')
    .replace(/[^a-zA-Z0-9]/g, '')
    .slice(0, 25) || '***';

  let merchantAccount = emvField('00', 'BR.GOV.BCB.PIX') + emvField('01', cleanKey);
  if (description) {
    const cleanDesc = description.normalize('NFD').replace(/[\u0300-\u036f]/g, '').slice(0, 40);
    merchantAccount += emvField('02', cleanDesc);
  }

  let payload =
    emvField('00', '01') +
    emvField('26', merchantAccount) +
    emvField('52', '0000') +
    emvField('53', '986');

  if (amount && Number(amount) > 0) {
    payload += emvField('54', Number(amount).toFixed(2));
  }

  payload +=
    emvField('58', 'BR') +
    emvField('59', cleanName) +
    emvField('60', cleanCity) +
    emvField('62', emvField('05', cleanTxid)) +
    '6304';

  return payload + crc16(payload);
}
