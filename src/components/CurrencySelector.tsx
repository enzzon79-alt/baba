import React, { useState, useEffect } from 'react';
import {
  CURRENCIES,
  CurrencyCode,
  getActiveCurrency,
  setActiveCurrency,
  CURRENCY_EVENT
} from '../services/currency';
import { ChevronDown, Check, Globe, X } from 'lucide-react';

interface CurrencySelectorProps {
  className?: string;
  compact?: boolean;
}

export const CurrencySelector: React.FC<CurrencySelectorProps> = ({
  className = '',
  compact = false
}) => {
  const [current, setCurrent] = useState<CurrencyCode>(() => getActiveCurrency());
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handleCurrencyChange = (e: any) => {
      const newCur = e.detail || getActiveCurrency();
      setCurrent(newCur);
    };

    const handleOpenModal = () => {
      setIsOpen(true);
    };

    window.addEventListener(CURRENCY_EVENT, handleCurrencyChange);
    window.addEventListener('baba_open_country_modal', handleOpenModal);
    return () => {
      window.removeEventListener(CURRENCY_EVENT, handleCurrencyChange);
      window.removeEventListener('baba_open_country_modal', handleOpenModal);
    };
  }, []);

  const handleSelect = (code: CurrencyCode) => {
    setActiveCurrency(code);
    setCurrent(code);
    setIsOpen(false);
  };

  const currencyList = Object.values(CURRENCIES);
  const active = CURRENCIES[current] || CURRENCIES.BRL;

  return (
    <>
      <div className={`relative inline-block ${className}`}>
        {/* Botão da Bandeira e Moeda Atual */}
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-neutral-200/90 hover:border-neutral-300 bg-white hover:bg-neutral-50 shadow-2xs text-neutral-900 transition-all cursor-pointer active:scale-95 ${
            isOpen ? 'ring-2 ring-amber-400 border-amber-400' : ''
          }`}
          title={`País Atual: ${active.country} (${active.symbol}) - Clica para escolher o país`}
        >
          <span className="text-lg leading-none">{active.flag}</span>
          <span className="text-xs font-black tracking-tight">{active.country}</span>
          <span className="text-[11px] font-bold text-[#FF6A00]">({active.symbol})</span>
          <ChevronDown
            className={`w-3.5 h-3.5 text-neutral-400 transition-transform duration-200 ${
              isOpen ? 'rotate-180 text-neutral-900' : ''
            }`}
          />
        </button>
      </div>

      {/* Modal Centrado Global - Escolher o País */}
      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 z-[100] bg-black/65 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn"
        >
          <div
            onClick={e => e.stopPropagation()}
            className="bg-white rounded-3xl max-w-md w-full overflow-hidden shadow-2xl border border-neutral-200 animate-scaleUp"
          >
            {/* Cabeçalho do Modal */}
            <div className="p-4 sm:p-5 bg-neutral-900 text-white flex items-center justify-between border-b border-neutral-800">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-400/40 text-amber-400 flex items-center justify-center">
                  <Globe className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white leading-tight">
                    Escolher o País
                  </h3>
                  <p className="text-[11px] text-neutral-400">
                    Seleciona o teu país para converter moedas e preços
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1.5 text-neutral-400 hover:text-white rounded-lg transition-colors cursor-pointer hover:bg-neutral-800"
                title="Fechar"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Lista dos Países Pedidos: Angola, Portugal, EUA, Congo, Brasil */}
            <div className="p-4 sm:p-5 space-y-2.5 max-h-[65vh] overflow-y-auto">
              {currencyList.map(c => {
                const isSelected = c.code === current;
                return (
                  <button
                    key={c.code}
                    type="button"
                    onClick={() => handleSelect(c.code)}
                    className={`w-full p-3.5 rounded-2xl border text-left transition-all flex items-center justify-between gap-3 cursor-pointer ${
                      isSelected
                        ? 'bg-amber-50/90 border-[#FF6A00] ring-2 ring-orange-500/20 shadow-xs'
                        : 'bg-white border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50 active:scale-98'
                    }`}
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className="w-12 h-12 rounded-2xl bg-neutral-100 flex items-center justify-center text-2xl shrink-0 shadow-2xs border border-neutral-200">
                        {c.flag}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-black text-neutral-900 leading-tight">
                            {c.country}
                          </span>
                          <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-neutral-100 text-neutral-600">
                            {c.code}
                          </span>
                        </div>
                        <div className="text-xs text-neutral-500 mt-0.5 font-medium">
                          Moeda Oficial: <strong className="text-[#FF6A00] font-bold">{c.symbol}</strong>
                        </div>
                      </div>
                    </div>

                    <div className="shrink-0">
                      {isSelected ? (
                        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-black border border-emerald-300">
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                          <span>Ativo</span>
                        </div>
                      ) : (
                        <span className="text-xs font-bold text-neutral-400 group-hover:text-neutral-700">
                          Selecionar
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Rodapé informativo */}
            <div className="p-4 bg-neutral-50 border-t border-neutral-200 flex items-center justify-between">
              <span className="text-[11px] text-neutral-500 font-medium">
                País atual: <strong className="text-neutral-900">{active.country} ({active.symbol})</strong>
              </span>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="px-4 py-2 bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-extrabold rounded-xl transition-colors cursor-pointer shadow-xs"
              >
                Concluir
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
