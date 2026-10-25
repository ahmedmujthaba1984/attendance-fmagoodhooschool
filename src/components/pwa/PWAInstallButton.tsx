import React, { useState } from 'react';
import { Download, Smartphone, Share2, PlusSquare, X, CheckCircle2 } from 'lucide-react';
import { usePWAInstall } from './usePWAInstall';
import { useLanguage } from '../../i18n/LanguageContext';

interface PWAInstallButtonProps {
  className?: string;
  variant?: 'compact' | 'full';
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({
  className = '',
  variant = 'compact',
}) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const { isRTL } = useLanguage();

  // If already running as an installed standalone app, hide install CTA
  if (isInstalled) {
    return null;
  }

  // Chromium / Android / Desktop 1-click install flow
  if (isInstallable) {
    return (
      <button
        type="button"
        onClick={install}
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-sky-600 to-teal-600 hover:from-sky-700 hover:to-teal-700 text-white font-bold text-xs shadow-xs transition active:scale-95 cursor-pointer ${className}`}
        title={isRTL ? 'ފޯނަށް މި އެޕް އިންސްޓޯލް ކުރައްވާ (އޮފްލައިންކޮށް ބޭނުންކުރެވޭނެ)' : 'Install App on Mobile (Works Offline)'}
      >
        <Smartphone className="w-3.5 h-3.5 shrink-0" />
        <span>{isRTL ? 'އެޕް އިންސްޓޯލް ކުރޭ' : 'Install Mobile App'}</span>
      </button>
    );
  }

  // iOS Safari flow (Safari does not support beforeinstallprompt event)
  return (
    <>
      <button
        type="button"
        onClick={() => setShowIOSGuide(true)}
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-sky-200 bg-sky-50/80 hover:bg-sky-100 text-sky-800 font-bold text-xs shadow-xs transition active:scale-95 cursor-pointer ${className}`}
        title={isRTL ? 'އޮފްލައިންކޮށް ފޯނުގައި ބޭނުންކުރުމަށް ހޯމް ސްކްރީނަށް އިތުރުކުރައްވާ' : 'Add to Home Screen for Offline Mobile Use'}
      >
        <Download className="w-3.5 h-3.5 shrink-0 text-sky-600" />
        <span>{isRTL ? 'ފޯނަށް އަޅުވާ' : 'Install on Mobile'}</span>
      </button>

      {/* Guided Modal for iOS Safari / Mobile Setup */}
      {showIOSGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-sm rounded-2xl bg-white p-5 sm:p-6 shadow-2xl border border-slate-200 relative">
            <button
              type="button"
              onClick={() => setShowIOSGuide(false)}
              className="absolute top-4 right-4 p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-10 h-10 rounded-xl bg-sky-100 flex items-center justify-center text-sky-600 shrink-0">
                <Smartphone className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-900">
                  {isRTL ? 'ފޯނުގެ ހޯމް ސްކްރީނަށް އަޅުވާ' : 'Install on iPhone / Android'}
                </h3>
                <p className="text-[11px] text-slate-500 font-medium">
                  {isRTL ? 'އިންޓަނެޓް ނެތަސް ހާޒިރީ މާކުކުރެވޭނެ' : 'Take attendance anywhere even with no internet'}
                </p>
              </div>
            </div>

            <div className="space-y-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200/80 text-xs text-slate-700">
              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-sky-600 text-white font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">1</span>
                <div>
                  <p className="font-semibold text-slate-900 flex items-center gap-1.5">
                    <span>{isRTL ? 'ސަފާރީގެ ޝެއަރ ބަޓަނަށް ފިއްތަވާ' : 'Tap the Share button in Safari toolbar'}</span>
                    <Share2 className="w-3.5 h-3.5 text-sky-600 inline" />
                  </p>
                  <p className="text-[11px] text-slate-500">
                    {isRTL ? '(ފޯނުގެ ތިރީގައިވާ ގޮޅި އަދި މައްޗަށް ދާ ތީރު)' : '(Square icon with arrow pointing up)'}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-sky-600 text-white font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">2</span>
                <div>
                  <p className="font-semibold text-slate-900 flex items-center gap-1.5">
                    <span>{isRTL ? '"Add to Home Screen" އަށް ފިއްތަވާ' : 'Tap "Add to Home Screen"'}</span>
                    <PlusSquare className="w-3.5 h-3.5 text-teal-600 inline" />
                  </p>
                  <p className="text-[11px] text-slate-500">
                    {isRTL ? 'މެނޫގެ ތިރިއަށް ސްކްރޯލް ކުރައްވައި "Add to Home Screen" ޚިޔާރުކުރައްވާ' : 'Scroll down the options list and select Add to Home Screen'}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-sky-600 text-white font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">3</span>
                <div>
                  <p className="font-semibold text-slate-900">
                    {isRTL ? 'މަތީ ކަނުގައިވާ "Add" އަށް ފިއްތަވާ' : 'Tap "Add" in top-right'}
                  </p>
                  <p className="text-[11px] text-emerald-700 font-medium flex items-center gap-1 mt-0.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{isRTL ? 'އެޕް ހޯމް ސްކްރީނަށް އެޅޭނެ، އިންޓަނެޓް ނެތަސް ހުޅުވޭނެ' : 'App installs to home screen & opens instantly offline!'}</span>
                  </p>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowIOSGuide(false)}
              className="mt-4 w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition cursor-pointer"
            >
              {isRTL ? 'ބަންދުކުރޭ' : 'Got it'}
            </button>
          </div>
        </div>
      )}
    </>
  );
};
