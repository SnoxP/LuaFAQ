import React, { useState, useEffect } from 'react';
import { Heart, Copy, Check, QrCode } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { useSettings } from '../context/SettingsContext';

// CRC16 CCITT-FALSE
function calculateCRC16(str: string) {
  let crc = 0xFFFF;
  for (let c = 0; c < str.length; c++) {
    crc ^= str.charCodeAt(c) << 8;
    for (let i = 0; i < 8; i++) {
      if (crc & 0x8000) crc = (crc << 1) ^ 0x1021;
      else crc = crc << 1;
    }
  }
  return (crc & 0xFFFF).toString(16).toUpperCase().padStart(4, '0');
}

function generatePixPayload(key: string, name: string, city: string, amount: string) {
  const formatStr = (id: string, value: string) => {
    const len = value.length.toString().padStart(2, '0');
    return `${id}${len}${value}`;
  };

  let payload = '';
  payload += formatStr('00', '01'); // Payload Format Indicator
  
  const merchantAccountInfo = formatStr('00', 'br.gov.bcb.pix') + formatStr('01', key);
  payload += formatStr('26', merchantAccountInfo);
  
  payload += formatStr('52', '0000'); // Merchant Category Code
  payload += formatStr('53', '986'); // Transaction Currency (BRL)
  
  if (amount && parseFloat(amount) > 0) {
    payload += formatStr('54', parseFloat(amount).toFixed(2)); // Transaction Amount
  }
  
  payload += formatStr('58', 'BR'); // Country Code
  payload += formatStr('59', name); // Merchant Name
  payload += formatStr('60', city); // Merchant City
  
  const additionalData = formatStr('05', '***'); // TxId
  payload += formatStr('62', additionalData);
  
  payload += '6304'; // CRC16 prefix
  
  const crc = calculateCRC16(payload);
  return payload + crc;
}

export default function DonatePage() {
  const [amount, setAmount] = useState<string>('1.00');
  const [pixPayload, setPixPayload] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const { t } = useSettings();

  const pixKey = 'f4c8ce38-2212-4e7c-9c9d-097f891a7d9c';

  useEffect(() => {
    const numAmount = parseFloat(amount);
    if (!isNaN(numAmount) && numAmount >= 1) {
      setPixPayload(generatePixPayload(pixKey, 'LuaTools', 'Brasil', amount));
    } else {
      setPixPayload('');
    }
  }, [amount]);

  const handleCopy = () => {
    if (pixPayload) {
      navigator.clipboard.writeText(pixPayload);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="bg-white dark:bg-[#171717] rounded-xl p-8 border border-black/10 dark:border-white/10 text-center shadow-sm transition-colors duration-200">
        <Heart className="w-16 h-16 text-pink-500 mx-auto mb-6" />
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-white mb-4">{t('donate.title')}</h1>
        <p className="text-zinc-600 dark:text-zinc-400 mb-8">
          {t('donate.subtitle')}
        </p>
        
        <div className="space-y-6 max-w-md mx-auto">
          {/* Pix Generator */}
          <div className="bg-zinc-50 dark:bg-[#212121] p-6 rounded-lg border border-black/5 dark:border-white/5 transition-colors duration-200">
            <div className="mb-4 text-left">
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">{t('donate.amount')}</label>
              <input
                type="number"
                min="1"
                step="0.50"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full bg-white dark:bg-[#171717] border border-black/10 dark:border-white/10 rounded-lg px-4 py-2 text-zinc-900 dark:text-white focus:outline-none focus:border-pink-500 transition-colors"
                placeholder="Mínimo R$ 1,00"
              />
              {parseFloat(amount) < 1 && (
                <p className="text-red-500 dark:text-red-400 text-xs mt-2">{t('donate.minAmount')}</p>
              )}
            </div>

            {pixPayload && (
              <div className="flex flex-col items-center space-y-4 animate-in fade-in duration-300">
                <div className="bg-white p-4 rounded-xl border border-black/10 dark:border-transparent">
                  <QRCodeSVG value={pixPayload} size={200} />
                </div>
                
                <div className="w-full">
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2 text-left">{t('donate.copyPaste')}</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      readOnly
                      value={pixPayload}
                      className="flex-1 bg-white dark:bg-[#171717] border border-black/10 dark:border-white/10 rounded-lg px-4 py-2 text-zinc-600 dark:text-zinc-400 text-sm font-mono truncate focus:outline-none"
                    />
                    <button
                      onClick={handleCopy}
                      className="px-4 py-2 bg-zinc-900 dark:bg-zinc-800 hover:bg-zinc-800 dark:hover:bg-zinc-700 text-white rounded-lg transition-colors flex items-center gap-2"
                    >
                      {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          <p className="text-xs text-zinc-500 mt-4">
            {t('donate.thanks')}
          </p>
        </div>
      </div>
    </div>
  );
}
