import React, { useState, useEffect } from 'react';
import { Download, Smartphone, Check, X } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export const PWAInstallButton: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [showDesktopGuide, setShowDesktopGuide] = useState(false);
  const { isRTL } = useLanguage();

  useEffect(() => {
    // Check if running in standalone PWA mode
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;
    setIsInstalled(isStandalone);

    // Detect iOS devices
    const ua = window.navigator.userAgent.toLowerCase();
    setIsIOS(/iphone|ipad|ipod/.test(ua));

    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        setIsInstalled(true);
        setDeferredPrompt(null);
      }
    } else if (isIOS) {
      setShowIOSGuide(true);
    } else {
      setShowDesktopGuide(true);
    }
  };

  if (isInstalled) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md bg-emerald-100 text-emerald-800 border border-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-300 dark:border-emerald-800">
        <Check className="w-3.5 h-3.5" />
        <span>{isRTL ? 'އިންސްޓޯލްވެފައި' : 'App Installed'}</span>
      </span>
    );
  }

  return (
    <>
      <button
        id="pwa-install-btn"
        type="button"
        onClick={handleInstallClick}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-sky-700 hover:bg-sky-800 text-white shadow-sm transition-all focus:ring-2 focus:ring-sky-500 focus:outline-none cursor-pointer"
        title={isRTL ? 'އޮފްލައިން ބޭނުންކުރުމަށް އިންސްޓޯލްކުރޭ' : 'Install PWA for offline use'}
      >
        <Download className="w-3.5 h-3.5" />
        <span>{isRTL ? 'އެޕް އިންސްޓޯލް' : 'Install PWA'}</span>
      </button>

      {showIOSGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2 text-sky-700 font-semibold text-base">
                <Smartphone className="w-5 h-5" />
                <span>{isRTL ? 'އައިފޯނަށް އިންސްޓޯލްކުރުން' : 'Install on iPhone / iPad'}</span>
              </div>
              <button
                type="button"
                onClick={() => setShowIOSGuide(false)}
                className="text-slate-400 hover:text-slate-600 rounded-lg p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 space-y-3 text-sm text-slate-700">
              <p>
                1. {isRTL ? 'ސަފާރީ ބްރައުޒާގެ ތިރީގައިވާ' : 'In Safari, tap the'}{' '}
                <strong className="text-sky-700">{isRTL ? 'ޙިއްޞާކުރާ (Share) އައިކަން' : 'Share'}</strong>{' '}
                {isRTL ? 'އަށް ފިއްތަވާލައްވާ.' : 'button at the bottom toolbar.'}
              </p>
              <p>
                2. {isRTL ? 'ތިރިއަށް ސްކްރޯލްކޮށްލުމަށްފަހު' : 'Scroll down and tap'}{' '}
                <strong className="text-sky-700">
                  {isRTL ? 'ހޯމް ސްކްރީނަށް އިތުރުކުރޭ (Add to Home Screen)' : 'Add to Home Screen'}
                </strong>
                .
              </p>
              <p className="text-xs text-slate-500 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                {isRTL
                  ? 'މިގޮތަށް އިންސްޓޯލްކުރުމުން އިންޓަރނެޓް ކެނޑުނަސް ހާޒިރީ ފުރުމުގެ ފުރުޞަތު ލިބިގެންދާނެއެވެ.'
                  : 'Installed PWA enables seamless offline attendance logging even during monsoonal network drops.'}
              </p>
            </div>

            <button
              type="button"
              onClick={() => setShowIOSGuide(false)}
              className="mt-5 w-full py-2.5 rounded-xl bg-sky-700 text-white font-medium text-sm hover:bg-sky-800 transition cursor-pointer"
            >
              {isRTL ? 'ބަންދުކުރޭ' : 'Got it'}
            </button>
          </div>
        </div>
      )}

      {showDesktopGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2 text-sky-700 font-semibold text-base">
                <Download className="w-5 h-5" />
                <span>{isRTL ? 'ކޮމްޕިއުޓަރަށް އިންސްޓޯލްކުރުން' : 'Install on Computer / Laptop'}</span>
              </div>
              <button
                type="button"
                onClick={() => setShowDesktopGuide(false)}
                className="text-slate-400 hover:text-slate-600 rounded-lg p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 space-y-3 text-sm text-slate-700">
              <p>
                {isRTL
                  ? 'މި އެޕްލިކޭޝަން އޮފްލައިންކޮށް ބޭނުންކުރުމަށް ކްރޯމް ނުވަތަ އެޖް ބްރައުޒާގެ އެޑްރެސް ބާރުގެ ކަނާތްފަރާތުގައިވާ "Install" އައިކަންއަށް ފިއްތަވާލައްވާ.'
                  : 'To use this portal offline on your desktop or Chromebook, click the "Install App" icon located in your browser address bar (top right).'}
              </p>
              <div className="p-3 bg-sky-50 rounded-xl border border-sky-200 text-xs text-sky-900">
                <p className="font-semibold">{isRTL ? 'އޮފްލައިން ސަޕޯޓް:' : 'Full Offline Mode:'}</p>
                <p className="mt-1">
                  {isRTL
                    ? 'އިންޓަނެޓް ކެނޑުނަސް ދަރިވަރުންގެ ހާޒިރީ މާކުކޮށް ސޭވްކުރެވޭނެއެވެ.'
                    : 'Attendance records and session audits are cached locally and synchronized automatically once connectivity returns.'}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowDesktopGuide(false)}
              className="mt-5 w-full py-2.5 rounded-xl bg-sky-700 text-white font-medium text-sm hover:bg-sky-800 transition cursor-pointer"
            >
              {isRTL ? 'ބަންދުކުރޭ' : 'Got it'}
            </button>
          </div>
        </div>
      )}
    </>
  );
};
