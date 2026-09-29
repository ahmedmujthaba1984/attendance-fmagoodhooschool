import React, { useState, useEffect } from 'react';
import { X, Check, UserCheck, AlertCircle, Sparkles } from 'lucide-react';
import { Student } from '../types';

interface EditStudentModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: Student | null;
  onSave: (updatedStudent: Student) => Promise<void> | void;
  isRTL?: boolean;
}

export const EditStudentModal: React.FC<EditStudentModalProps> = ({
  isOpen,
  onClose,
  student,
  onSave,
  isRTL = false,
}) => {
  const [fullName, setFullName] = useState('');
  const [fullNameDhivehi, setFullNameDhivehi] = useState('');
  const [parentContactPhone, setParentContactPhone] = useState('');
  const [guardianName, setGuardianName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (student) {
      setFullName(student.fullName || '');
      setFullNameDhivehi(student.fullNameDhivehi || '');
      setParentContactPhone(student.parentContactPhone || '');
      setGuardianName(student.guardianName || '');
      setError(null);
    }
  }, [student, isOpen]);

  if (!isOpen || !student) return null;

  const handleApplyFix = (newDhivehiName: string) => {
    setFullNameDhivehi(newDhivehiName);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      setError(isRTL ? 'ދަރިވަރުގެ އިނގިރޭސި ނަން ލިޔުއްވާ' : 'English name is required');
      return;
    }
    if (!fullNameDhivehi.trim()) {
      setError(isRTL ? 'ދަރިވަރުގެ ދިވެހި ނަން ލިޔުއްވާ' : 'Dhivehi name is required');
      return;
    }

    try {
      setIsSaving(true);
      setError(null);

      const updated: Student = {
        ...student,
        fullName: fullName.trim(),
        fullNameDhivehi: fullNameDhivehi.trim(),
        parentContactPhone: parentContactPhone.trim(),
        guardianName: guardianName.trim(),
      };

      await onSave(updated);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save student details');
    } finally {
      setIsSaving(false);
    }
  };

  // Detected suggestion checks
  const suggestions: Array<{ label: string; action: () => void; description: string }> = [];

  if (fullNameDhivehi.includes('ޤައިސް')) {
    suggestions.push({
      label: isRTL ? 'ޤައިސް ގެ ބަދަލުގައި ކައިސް ޖައްސަވާ' : 'Change ޤައިސް to ކައިސް (Kais)',
      description: isRTL
        ? 'އިނގިރޭސި ކޭ (K) އަކުރު އާންމުކޮށް ލިޔެވެނީ ކާފު (ކ) ންނެވެ'
        : "'Kais' with K is spelled with Kaafu (ކ) in Thaana",
      action: () => handleApplyFix(fullNameDhivehi.replace(/ޤައިސް/g, 'ކައިސް')),
    });
  }

  if (fullNameDhivehi.includes('ޢުމަރު')) {
    suggestions.push({
      label: isRTL ? 'އަލިފުން ލިޔުއްވުމަށް (އުމަރު)' : 'Use Alif spelling (އުމަރު)',
      description: isRTL ? 'އަލިފު އުފިލި އުމަރު' : 'Alternative phonetic Thaana spelling (އުމަރު)',
      action: () => handleApplyFix(fullNameDhivehi.replace(/ޢުމަރު/g, 'އުމަރު')),
    });
  } else if (fullNameDhivehi.includes('އުމަރު')) {
    suggestions.push({
      label: isRTL ? 'ޢައިނުން ލިޔުއްވުމަށް (ޢުމަރު)' : 'Use Ayn spelling (ޢުމަރު)',
      description: isRTL ? 'ޢައިނު އުފިލި ޢުމަރު' : 'Standard Arabic-origin Thaana spelling (ޢުމަރު)',
      action: () => handleApplyFix(fullNameDhivehi.replace(/އުމަރު/g, 'ޢުމަރު')),
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]"
        dir={isRTL ? 'rtl' : 'ltr'}
      >
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-200 text-teal-700 flex items-center justify-center">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                {isRTL ? 'ދަރިވަރުގެ މަޢުލޫމާތު ބަދަލުކުރުން' : 'Edit Student Record'}
              </h2>
              <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                <span className="font-mono font-semibold px-1.5 py-0.5 rounded bg-slate-200 text-slate-700">
                  {student.admissionNumber}
                </span>
                <span>•</span>
                <span className="font-semibold text-teal-700">{student.gradeLevel}</span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <form onSubmit={handleSave} className="p-6 overflow-y-auto space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Dhivehi Name (High Priority) */}
          <div className="p-4 rounded-xl bg-teal-50/50 border border-teal-100 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-teal-900 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-teal-600" />
                <span>{isRTL ? 'ދިވެހި ނަން (ތާނަ)' : 'Dhivehi Name (Thaana)'}</span>
              </label>
              <span className="text-[11px] text-teal-700 font-thaana">ދިވެހި ބަހުން ފުރިހަމަ ނަން</span>
            </div>
            <input
              type="text"
              dir="rtl"
              value={fullNameDhivehi}
              onChange={(e) => setFullNameDhivehi(e.target.value)}
              className="w-full px-4 py-2.5 bg-white border border-teal-200 rounded-xl text-lg font-bold text-slate-900 font-thaana text-right focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 shadow-sm"
              placeholder="ދަރިވަރުގެ ދިވެހި ނަން ލިޔުއްވާ"
              required
            />

            {/* Suggestions & Quick Fixes */}
            {suggestions.length > 0 && (
              <div className="pt-2 border-t border-teal-100 space-y-1.5">
                <div className="text-[11px] font-semibold text-teal-800">
                  {isRTL ? 'ހުށަހެޅޭ އިޞްލާޙު:' : 'Suggested Corrections:'}
                </div>
                {suggestions.map((sug, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={sug.action}
                    className="w-full text-left px-3 py-1.5 rounded-lg bg-white border border-teal-200 hover:bg-teal-50 text-xs text-teal-900 flex items-center justify-between transition-colors group shadow-xs"
                  >
                    <div>
                      <span className="font-semibold">{sug.label}</span>
                      <p className="text-[10px] text-slate-500">{sug.description}</p>
                    </div>
                    <span className="text-[11px] font-bold text-teal-600 group-hover:underline">
                      {isRTL ? 'ބަދަލުކުރޭ' : 'Apply'}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* English Full Name */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700">
              {isRTL ? 'އިނގިރޭސި ނަން' : 'Full Name (English)'}
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white"
              placeholder="e.g. Umaru Kais Mohamed"
              required
            />
          </div>

          {/* Guardian Name */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700">
              {isRTL ? 'ބެލެނިވެރިޔާގެ ނަން' : 'Guardian Name'}
            </label>
            <input
              type="text"
              value={guardianName}
              onChange={(e) => setGuardianName(e.target.value)}
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white"
              placeholder="e.g. Parent of Umaru Kais Mohamed"
            />
          </div>

          {/* Parent Contact Phone */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700">
              {isRTL ? 'ގުޅޭނެ ނަންބަރު' : 'Parent Contact Phone'}
            </label>
            <input
              type="tel"
              value={parentContactPhone}
              onChange={(e) => setParentContactPhone(e.target.value)}
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white"
              placeholder="+960 7900134"
            />
          </div>

          {/* Modal Actions */}
          <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800 rounded-xl hover:bg-slate-100 transition-colors"
            >
              {isRTL ? 'ކެންސަލް' : 'Cancel'}
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2 text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 rounded-xl transition-all shadow-sm flex items-center gap-1.5 disabled:opacity-50"
            >
              {isSaving ? (
                <span>{isRTL ? 'ސޭވްވަނީ...' : 'Saving...'}</span>
              ) : (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>{isRTL ? 'ސޭވް ކުރޭ' : 'Save Changes'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
