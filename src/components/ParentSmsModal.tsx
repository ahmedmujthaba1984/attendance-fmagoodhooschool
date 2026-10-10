import React, { useState, useEffect } from 'react';
import { MessageSquare, Copy, Check, X, Sparkles, Phone, Send, Loader2 } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';
import { Student } from '../types';
import { safeCopyToClipboard } from '../utils/browserUtils';

interface ParentSmsModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: Student | null;
}

export const ParentSmsModal: React.FC<ParentSmsModalProps> = ({ isOpen, onClose, student }) => {
  const { t, language, isRTL } = useLanguage();
  const [copied, setCopied] = useState(false);
  const [issueType, setIssueType] = useState('UNEXCUSED_ABSENCE');
  const [loading, setLoading] = useState(false);
  const [draft, setDraft] = useState<{
    subject?: string;
    smsText?: string;
    channelRecommendation?: string;
  } | null>(null);

  useEffect(() => {
    if (isOpen && student) {
      generateDraft();
    }
  }, [isOpen, student, issueType, language]);

  if (!isOpen || !student) return null;

  const generateDraft = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/ai/draft-parent-sms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentName: isRTL ? student.fullNameDhivehi : student.fullName,
          studentGender: student.gender,
          admissionNumber: student.admissionNumber,
          issueType,
          minutesLate: 15,
          language,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.draft) {
          setDraft(data.draft);
          return;
        }
      }
    } catch {
      // Graceful local generation fallback
    } finally {
      setLoading(false);
    }

    // Immediate resilient fallback for SMS
    const studentLabel = isRTL ? student.fullNameDhivehi : student.fullName;
    if (language === 'dv') {
      setDraft({
        subject: 'ފ. މަގޫދޫ ސްކޫލް: ހާޒިރީގެ މައުލޫމާތު',
        smsText: `އައްސަލާމް ޢަލައިކުމް. އިއްޒަތްތެރި ބެލެނިވެރިޔާ، ދަރިވަރު ${studentLabel} (${student.admissionNumber}) މިއަދު ސްކޫލަށް ހާޒިރުވެފައި ނުވާތީ ދަންނަވަމެވެ. ސަލާމް ބުނުއްވާނަމަ ނުވަތަ ބަލިވެ އުޅޭނަމަ ސްކޫލަށް (6740015) އަންގަވައިދެއްވުން އެދެމެވެ. - ފ. މަގޫދޫ ސްކޫލް`,
        channelRecommendation: 'SMS & Viber / WhatsApp',
      });
    } else {
      setDraft({
        subject: 'F. Magoodhoo School: Attendance Notice',
        smsText: `Dear Parent, please be informed that ${studentLabel} (${student.admissionNumber}) was marked absent for today's morning session. Kindly inform the school administration at +960 6740015 if the student is on sick leave or travelling. - F. Magoodhoo School`,
        channelRecommendation: 'SMS & Viber / WhatsApp',
      });
    }
  };

  const handleCopy = async () => {
    if (draft?.smsText) {
      await safeCopyToClipboard(draft.smsText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-3 sm:p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-100 bg-slate-50 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-sky-100 text-sky-700">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">{t.smsDraftTitle}</h3>
              <p className="text-xs text-slate-500">
                {isRTL ? student.fullNameDhivehi : student.fullName} ({student.admissionNumber}) • {student.gradeLevel}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 sm:p-5 space-y-4 overflow-y-auto">
          {/* Issue Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              {isRTL ? 'ސަބަބު ނުވަތަ މައްސަލަ:' : 'Notification Issue:'}
            </label>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => setIssueType('UNEXCUSED_ABSENCE')}
                className={`py-2 px-3 rounded-lg border font-semibold transition cursor-pointer ${
                  issueType === 'UNEXCUSED_ABSENCE'
                    ? 'bg-rose-50 border-rose-300 text-rose-800'
                    : 'bg-slate-50 border-slate-200 text-slate-600'
                }`}
              >
                {isRTL ? 'ސަލާމް ނުބުނެ ޣައިރުޙާޒިރު' : 'Unexcused Absence'}
              </button>
              <button
                type="button"
                onClick={() => setIssueType('CHRONIC_LATE')}
                className={`py-2 px-3 rounded-lg border font-semibold transition cursor-pointer ${
                  issueType === 'CHRONIC_LATE'
                    ? 'bg-amber-50 border-amber-300 text-amber-800'
                    : 'bg-slate-50 border-slate-200 text-slate-600'
                }`}
              >
                {isRTL ? 'ގަޑިއަށް ލަސްވުން (Late)' : 'Late Arrival'}
              </button>
            </div>
          </div>

          {/* Guardian Info with Quick Direct Call Action */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs flex items-center justify-between gap-2">
            <div>
              <span className="text-slate-500 block">{isRTL ? 'ބެލެނިވެރިޔާގެ ނަން:' : 'Guardian:'}</span>
              <span className="font-bold text-slate-800">{student.guardianName || 'Parent / Guardian'}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="text-right">
                <span className="text-slate-500 block">{isRTL ? 'ގުޅޭނެ ނަންބަރު:' : 'Phone:'}</span>
                <span className="font-mono font-bold text-sky-700">{student.parentContactPhone}</span>
              </div>
              <a
                href={`tel:${student.parentContactPhone}`}
                className="p-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white shadow-xs transition inline-flex items-center justify-center shrink-0"
                title={isRTL ? 'ގުޅާލައްވާ' : 'Call Parent Now'}
              >
                <Phone className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Generated Text Area */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                <span>{isRTL ? 'އޭއައި ތައްޔާރުކޮށްދިން މެސެޖު:' : 'AI Drafted Message:'}</span>
              </label>
              {draft?.channelRecommendation && (
                <span className="text-[10px] font-semibold text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                  {draft.channelRecommendation}
                </span>
              )}
            </div>

            {loading ? (
              <div className="p-8 rounded-xl bg-slate-50 border border-slate-200 flex flex-col items-center justify-center text-slate-400 gap-2">
                <Loader2 className="w-6 h-6 animate-spin text-sky-600" />
                <span className="text-xs">{isRTL ? 'މެސެޖު ތައްޔާރުކުރެވެނީ...' : 'Generating draft...'}</span>
              </div>
            ) : (
              <div className="relative">
                <textarea
                  rows={4}
                  readOnly
                  value={draft?.smsText || ''}
                  className="w-full p-3 text-xs rounded-xl border border-slate-200 bg-slate-50 text-slate-800 focus:outline-none"
                />
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-2">
            <button
              type="button"
              onClick={handleCopy}
              disabled={loading || !draft?.smsText}
              className="flex-1 py-2.5 rounded-xl bg-sky-700 hover:bg-sky-800 disabled:bg-slate-200 text-white font-semibold text-xs transition flex items-center justify-center gap-2 cursor-pointer shadow-xs min-h-[44px]"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? (isRTL ? 'ކޮޕީކުރެވިއްޖެ' : 'Copied to Clipboard!') : (isRTL ? 'މެސެޖު ކޮޕީކުރޭ' : 'Copy Message')}</span>
            </button>

            <a
              href={`sms:${student.parentContactPhone}?body=${encodeURIComponent(draft?.smsText || '')}`}
              className="py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition flex items-center justify-center gap-1.5 shadow-xs min-h-[44px]"
            >
              <Send className="w-4 h-4" />
              <span>{isRTL ? 'އެސްއެމްއެސް ފޮނުވާ' : 'Send via SMS'}</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
