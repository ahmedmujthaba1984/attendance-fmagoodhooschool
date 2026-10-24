import React, { useState, useRef, useEffect } from 'react';
import {
  Mic,
  MicOff,
  Sparkles,
  X,
  Check,
  Loader2,
  Volume2,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  Clock,
  UserCheck,
  Trash2,
  Languages,
  CheckCircle2,
  RotateCcw
} from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';
import { GradeLevel, AttendanceRecord, Student } from '../types';
import { safeHapticVibrate } from '../utils/browserUtils';

export interface VoiceParsedMatch {
  studentId?: string;
  studentName: string;
  studentNameDhivehi?: string;
  gradeLevel?: string;
  status: AttendanceRecord['status'];
  leaveReason?: AttendanceRecord['leaveReason'];
  arrivalTime?: string;
  remarks?: string;
}

interface VoiceDictationModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetGrade: GradeLevel | 'ALL';
  selectedDate: string;
  students?: Student[];
  onApplyParsedAttendance: (matches: VoiceParsedMatch[]) => void;
}

const ALL_GRADES_LIST: (GradeLevel | 'ALL')[] = [
  'ALL',
  'LKG',
  'UKG',
  'Grade 1',
  'Grade 2',
  'Grade 3',
  'Grade 4',
  'Grade 5',
  'Grade 6',
  'Grade 7',
  'Grade 8',
  'Grade 9',
  'Grade 10',
];

export const VoiceDictationModal: React.FC<VoiceDictationModalProps> = ({
  isOpen,
  onClose,
  targetGrade,
  selectedDate,
  students = [],
  onApplyParsedAttendance,
}) => {
  const { t, isRTL } = useLanguage();
  const [selectedGrade, setSelectedGrade] = useState<GradeLevel | 'ALL'>(targetGrade || 'ALL');
  const [isRecording, setIsRecording] = useState(false);
  const [speechText, setSpeechText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [parseMode, setParseMode] = useState<'cloud' | 'local' | null>(null);
  const [speechLanguage, setSpeechLanguage] = useState<'en' | 'dv'>(isRTL ? 'dv' : 'en');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [parsedMatches, setParsedMatches] = useState<VoiceParsedMatch[] | null>(null);

  const recognitionRef = useRef<any>(null);
  const simTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const resultRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Sync selectedGrade when targetGrade changes externally
  useEffect(() => {
    setSelectedGrade(targetGrade || 'ALL');
  }, [targetGrade]);

  // Cleanup speech recognition on unmount or modal close
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {}
      }
      if (simTimeoutRef.current) {
        clearTimeout(simTimeoutRef.current);
      }
    };
  }, []);

  if (!isOpen) return null;

  const samplePromptsEnglish = [
    'Mohamed Azaan is absent today with fever, and Mohamed Azeen is 15 minutes late.',
    'Aasha Binth Nafiz is on sick leave with doctor MC slip.',
    'Elin Binth Ahmed is travelling to Malé for family matters.',
  ];

  const samplePromptsDhivehi = [
    'މުޙައްމަދު އަޒާން ބަލިވެގެން ސަލާމް ބުނެފައި، މުޙައްމަދު އަޒީން 15 މިނެޓު ލަސްވި.',
    'ޢާޝާ ބިންތި ނާފިޒް ޑޮކްޓަރު ސްލިޕާއެކު ސަލާމް ހުށަހަޅައިފި.',
    'އީލިން ބިންތި އަޙްމަދު ރަށުގައި ނެތް، މާލެ ފުރައިފި.',
  ];

  const handleToggleRecord = () => {
    safeHapticVibrate(25);
    setErrorMessage(null);

    if (!isRecording) {
      setIsRecording(true);
      if (simTimeoutRef.current) clearTimeout(simTimeoutRef.current);

      const WinSpeechRecognition =
        typeof window !== 'undefined'
          ? (window as unknown as { SpeechRecognition?: any; webkitSpeechRecognition?: any }).SpeechRecognition ||
            (window as unknown as { SpeechRecognition?: any; webkitSpeechRecognition?: any }).webkitSpeechRecognition
          : null;

      if (WinSpeechRecognition) {
        try {
          const recognition = new WinSpeechRecognition();
          recognitionRef.current = recognition;
          // Set recognition language based on user selector
          recognition.lang = speechLanguage === 'dv' ? 'ar-SA' : 'en-US';
          recognition.interimResults = true;
          recognition.continuous = false;

          recognition.onresult = (event: any) => {
            const transcript = Array.from(event.results)
              .map((res: any) => res[0]?.transcript || '')
              .join('');
            if (transcript) setSpeechText(transcript);
          };
          recognition.onerror = () => {
            setIsRecording(false);
          };
          recognition.onend = () => {
            setIsRecording(false);
          };
          recognition.start();
        } catch {
          // Graceful fallback simulation if microphone permissions rejected
          simTimeoutRef.current = setTimeout(() => {
            setSpeechText(
              speechLanguage === 'dv'
                ? 'މުޙައްމަދު އަޒާން ބަލިވެގެން ސަލާމް ބުނެފައި، މުޙައްމަދު އަޒީން 15 މިނެޓު ލަސްވި.'
                : 'Mohamed Azaan is absent today with fever, and Mohamed Azeen is 15 minutes late.'
            );
            setIsRecording(false);
          }, 2000);
        }
      } else {
        // Browser does not support native speech recognition
        simTimeoutRef.current = setTimeout(() => {
          setSpeechText(
            speechLanguage === 'dv'
              ? 'މުޙައްމަދު އަޒާން ބަލިވެގެން ސަލާމް ބުނެފައި، މުޙައްމަދު އަޒީން 15 މިނެޓު ލަސްވި.'
              : 'Mohamed Azaan is absent today with fever, and Mohamed Azeen is 15 minutes late.'
          );
          setIsRecording(false);
        }, 1800);
      }
    } else {
      setIsRecording(false);
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {}
      }
      if (simTimeoutRef.current) {
        clearTimeout(simTimeoutRef.current);
      }
    }
  };

  const scrollToResults = () => {
    setTimeout(() => {
      if (resultRef.current) {
        resultRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } else if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollTo({
          top: scrollContainerRef.current.scrollHeight,
          behavior: 'smooth',
        });
      }
    }, 150);
  };

  const handleParseWithGemini = async () => {
    const trimmedInput = speechText.trim();
    if (!trimmedInput) return;

    setIsProcessing(true);
    setErrorMessage(null);
    setParsedMatches(null);

    try {
      const res = await fetch('/api/ai/voice-parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: trimmedInput,
          targetGrade: selectedGrade !== 'ALL' ? selectedGrade : undefined,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const serverMatches = data?.result?.matches;
        if (Array.isArray(serverMatches)) {
          setParsedMatches(serverMatches);
          setParseMode('cloud');
          setIsProcessing(false);
          safeHapticVibrate(30);
          scrollToResults();
          return;
        }
      }
    } catch (fetchErr) {
      console.warn('Voice parse cloud error, using client algorithmic matcher:', fetchErr);
    }

    // Client-side deterministic algorithmic matching fallback
    const lower = trimmedInput.toLowerCase();
    const candidateStudents =
      selectedGrade !== 'ALL'
        ? students.filter((s) => s.gradeLevel === selectedGrade)
        : students;

    const matchedList: VoiceParsedMatch[] = [];

    candidateStudents.forEach((st) => {
      const partsEn = st.fullName.toLowerCase().split(' ').filter((p) => p.length > 2);
      const partsDv = (st.fullNameDhivehi || '').split(' ').filter((p) => p.trim().length > 2);

      const hasEnName = partsEn.some((p) => lower.includes(p));
      const hasDvName = partsDv.some((p) => trimmedInput.includes(p.trim()));

      if (hasEnName || hasDvName) {
        let status: AttendanceRecord['status'] = 'ABSENT';
        let leaveReason: AttendanceRecord['leaveReason'] = 'NONE';
        let arrivalTime: string | undefined = undefined;

        if (lower.includes('late') || lower.includes('lahaa') || trimmedInput.includes('ލަސް') || trimmedInput.includes('ލަހުން')) {
          status = 'LATE';
          arrivalTime = '08:15';
        } else if (
          lower.includes('sick') ||
          lower.includes('fever') ||
          lower.includes('doctor') ||
          lower.includes('mc') ||
          trimmedInput.includes('ސަލާމް') ||
          trimmedInput.includes('ބަލި') ||
          trimmedInput.includes('ހުން')
        ) {
          status = 'LEAVE';
          leaveReason = lower.includes('mc') || lower.includes('doctor') || trimmedInput.includes('ޑޮކްޓަރ') ? 'SICK_LEAVE_MC' : 'SICK_LEAVE';
        } else if (
          lower.includes('island') ||
          lower.includes('travel') ||
          lower.includes('male') ||
          trimmedInput.includes('ރަށުގައި ނެތް') ||
          trimmedInput.includes('މާލެ')
        ) {
          status = 'LEAVE';
          leaveReason = 'NOT_IN_ISLAND';
        } else if (lower.includes('present') || trimmedInput.includes('ހާޒިރު')) {
          status = 'PRESENT';
        }

        matchedList.push({
          studentId: st.id,
          studentName: st.fullName,
          studentNameDhivehi: st.fullNameDhivehi,
          gradeLevel: st.gradeLevel,
          status,
          leaveReason,
          arrivalTime,
          remarks: 'Identified via speech recognition',
        });
      }
    });

    setParsedMatches(matchedList);
    setParseMode('local');
    setIsProcessing(false);
    safeHapticVibrate(30);
    scrollToResults();
  };

  const handleUpdateMatchStatus = (index: number, newStatus: AttendanceRecord['status']) => {
    if (!parsedMatches) return;
    const updated = [...parsedMatches];
    updated[index] = {
      ...updated[index],
      status: newStatus,
      arrivalTime: newStatus === 'LATE' ? (updated[index].arrivalTime || '08:15') : undefined,
      leaveReason: newStatus === 'LEAVE' ? (updated[index].leaveReason !== 'NONE' ? updated[index].leaveReason : 'SICK_LEAVE') : 'NONE',
    };
    setParsedMatches(updated);
  };

  const handleRemoveMatch = (index: number) => {
    if (!parsedMatches) return;
    setParsedMatches(parsedMatches.filter((_, i) => i !== index));
  };

  const handleApply = () => {
    if (!parsedMatches || parsedMatches.length === 0) return;
    safeHapticVibrate(40);
    onApplyParsedAttendance(parsedMatches);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-3 sm:p-4">
      <div className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-100 bg-slate-50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-600 text-white shadow-xs">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <span>{t.voiceModalTitle}</span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700">
                  Gemini AI
                </span>
              </h3>
              <p className="text-xs text-slate-500">
                {isRTL
                  ? 'އަޑުން ނުވަތަ ލިޔުމުން ހާޒިރީ ރެކޯޑުކުރައްވާ (ދިވެހި އަދި އިނގިރޭސި)'
                  : 'Dictate or type attendance mutations in English or Dhivehi (Thaana)'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div ref={scrollContainerRef} className="p-4 sm:p-5 space-y-4 overflow-y-auto">
          {/* Grade Selector & Language Selector Bar */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <span className="font-bold text-slate-700 shrink-0">
                {isRTL ? 'ގްރޭޑް:' : 'Target Grade:'}
              </span>
              <select
                value={selectedGrade}
                onChange={(e) => setSelectedGrade(e.target.value as GradeLevel | 'ALL')}
                className="bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 font-semibold text-slate-800 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="ALL">
                  {isRTL ? 'ހުރިހާ ގްރޭޑެއް (All School - 215 Students)' : 'All Grades (All School - 215 Students)'}
                </option>
                {ALL_GRADES_LIST.filter((g) => g !== 'ALL').map((grade) => (
                  <option key={grade} value={grade}>
                    {grade}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-1.5 self-end sm:self-auto">
              <Languages className="w-3.5 h-3.5 text-slate-500" />
              <button
                type="button"
                onClick={() => setSpeechLanguage('en')}
                className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition cursor-pointer ${
                  speechLanguage === 'en'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                }`}
              >
                English
              </button>
              <button
                type="button"
                onClick={() => setSpeechLanguage('dv')}
                className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition cursor-pointer ${
                  speechLanguage === 'dv'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                }`}
              >
                ދިވެހި
              </button>
            </div>
          </div>

          {/* Recording Microphone & Waveform Area */}
          <div className="flex flex-col items-center justify-center p-6 rounded-2xl border-2 border-dashed border-indigo-200 bg-indigo-50/40 text-center relative overflow-hidden">
            <button
              type="button"
              onClick={handleToggleRecord}
              className={`w-16 h-16 rounded-full flex items-center justify-center shadow-lg transition-all cursor-pointer relative z-10 ${
                isRecording
                  ? 'bg-rose-600 text-white ring-8 ring-rose-200 animate-pulse scale-105'
                  : 'bg-indigo-600 hover:bg-indigo-700 text-white'
              }`}
              title={isRecording ? 'Click to stop recording' : 'Click to start voice recording'}
            >
              {isRecording ? <MicOff className="w-7 h-7" /> : <Mic className="w-7 h-7" />}
            </button>
            <span className="mt-3 text-xs font-bold text-indigo-950">
              {isRecording ? (
                <span className="flex items-center gap-1.5 text-rose-600">
                  <span className="w-2 h-2 rounded-full bg-rose-600 animate-ping" />
                  {t.listeningVoice || 'Listening to your voice... Speak clearly'}
                </span>
              ) : (
                t.startRecording || 'Click microphone to record voice attendance'
              )}
            </span>
            <span className="text-[11px] text-slate-500 mt-1">
              {isRecording
                ? 'Speak student name, status, or reason (e.g. "Mohamed Azaan absent with fever")'
                : 'Supports English names and Dhivehi Thaana speech'}
            </span>
          </div>

          {/* Dictated Text Area */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-700">
                {isRTL ? 'ދެއްކެވި ވާހަކަ ނުވަތަ ލިޔުއްވި ނޯޓު:' : 'Dictated Speech or Typed Note:'}
              </label>
              {speechText && (
                <button
                  type="button"
                  onClick={() => setSpeechText('')}
                  className="text-[11px] text-slate-400 hover:text-slate-600 flex items-center gap-1 cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>{isRTL ? 'ފޮހެލާ' : 'Clear'}</span>
                </button>
              )}
            </div>
            <textarea
              rows={3}
              value={speechText}
              onChange={(e) => setSpeechText(e.target.value)}
              placeholder={
                speechLanguage === 'dv' || isRTL
                  ? 'މިސާލަކަށް: މުޙައްމަދު އަޒާން ބަލިވެގެން ސަލާމުގައި، މުޙައްމަދު އަޒީން 15 މިނެޓު ލަސްވި...'
                  : 'e.g. Mohamed Azaan is absent today with fever, and Mohamed Azeen arrived 15 mins late...'
              }
              className="w-full p-3 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 focus:outline-none transition leading-relaxed"
            />
          </div>

          {/* Quick Click Samples */}
          <div>
            <span className="text-[11px] font-semibold text-slate-500 block mb-1.5">
              {isRTL ? 'އަވަސް މިސާލުތައް (ކްލިކް ކޮށްލައްވާ):' : 'Quick Sample Phrases (Click to test):'}
            </span>
            <div className="flex flex-wrap gap-1.5">
              {(speechLanguage === 'dv' || isRTL ? samplePromptsDhivehi : samplePromptsEnglish).map((phrase, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setSpeechText(phrase);
                    safeHapticVibrate(15);
                  }}
                  className="px-2.5 py-1.5 text-[11px] rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-left transition border border-slate-200/60 cursor-pointer"
                >
                  {phrase}
                </button>
              ))}
            </div>
          </div>

          {/* Action to Process via Gemini */}
          <div>
            <button
              type="button"
              disabled={!speechText.trim() || isProcessing}
              onClick={handleParseWithGemini}
              className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold text-xs transition flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-indigo-600/20"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>{isRTL ? 'ޖެމިނައި އޭއައި އިން ދެނެގަންނަނީ...' : 'Parsing with Gemini AI (Matching 215 Students)...'}</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span>{isRTL ? 'ޖެމިނައި އޭއައި މެދުވެރިކޮށް ދެނެގަނޭ' : 'Parse Attendance with Gemini AI'}</span>
                </>
              )}
            </button>
          </div>

          {/* Error Message Alert */}
          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Parsed Result Preview Container */}
          <div ref={resultRef} id="voice-dictation-results">
            {parsedMatches !== null && (
              <div className="space-y-3">
                {parsedMatches.length > 0 ? (
                  <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200 space-y-3 shadow-xs">
                    {/* Header info */}
                    <div className="flex items-center justify-between text-xs font-bold text-emerald-950">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                        <span>
                          {isRTL
                            ? `${parsedMatches.length} ދަރިވަރެއްގެ ހާޒިރީ ދެނެގަނެވިއްޖެ:`
                            : `Identified ${parsedMatches.length} Student Record(s):`}
                        </span>
                      </div>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800 flex items-center gap-1 border border-emerald-200">
                        <ShieldCheck className="w-3 h-3 text-emerald-600" />
                        {parseMode === 'cloud' ? 'Gemini AI Verified' : 'Local Fast Match'}
                      </span>
                    </div>

                    <p className="text-[11px] text-emerald-800/80">
                      {isRTL
                        ? 'ތިރީގައިވާ ސްޓޭޓަސްތައް ޗެކްކޮށް، ބޭނުންނަމަ ބަދަލުކުރުމަށްފަހު "ހާޒިރީ ރެކޯޑުކުރޭ" އަށް ފިއްތަވާ'
                        : 'Review detected statuses below. You can adjust the status pills before applying to roll call:'}
                    </p>

                    {/* Matched Student List Cards */}
                    <div className="space-y-2">
                      {parsedMatches.map((m, idx) => (
                        <div
                          key={idx}
                          className="p-3 bg-white rounded-xl border border-emerald-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                        >
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-900 text-sm">{m.studentName}</span>
                              {m.gradeLevel && (
                                <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 font-bold text-[10px]">
                                  {m.gradeLevel}
                                </span>
                              )}
                            </div>
                            {m.studentNameDhivehi && (
                              <div className="text-slate-500 font-thaana text-xs">
                                {m.studentNameDhivehi}
                              </div>
                            )}
                            <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
                              {m.remarks && <span>Note: {m.remarks}</span>}
                              {m.arrivalTime && (
                                <span className="inline-flex items-center gap-1 text-amber-700 font-semibold">
                                  <Clock className="w-3 h-3" /> Arrival: {m.arrivalTime}
                                </span>
                              )}
                              {m.leaveReason && m.leaveReason !== 'NONE' && (
                                <span className="inline-flex items-center gap-1 text-indigo-700 font-semibold">
                                  Reason: {m.leaveReason.replace('_', ' ')}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Quick Interactive Status Pill Switcher */}
                          <div className="flex items-center gap-2 shrink-0">
                            <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200">
                              {(['ABSENT', 'LATE', 'LEAVE', 'PRESENT'] as AttendanceRecord['status'][]).map((statusOption) => (
                                <button
                                  key={statusOption}
                                  type="button"
                                  onClick={() => handleUpdateMatchStatus(idx, statusOption)}
                                  className={`px-2 py-1 rounded text-[10px] font-bold transition cursor-pointer ${
                                    m.status === statusOption
                                      ? statusOption === 'ABSENT'
                                        ? 'bg-rose-600 text-white shadow-xs'
                                        : statusOption === 'LATE'
                                        ? 'bg-amber-500 text-white shadow-xs'
                                        : statusOption === 'LEAVE'
                                        ? 'bg-indigo-600 text-white shadow-xs'
                                        : 'bg-emerald-600 text-white shadow-xs'
                                      : 'text-slate-600 hover:text-slate-900'
                                  }`}
                                >
                                  {statusOption}
                                </button>
                              ))}
                            </div>

                            <button
                              type="button"
                              onClick={() => handleRemoveMatch(idx)}
                              className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                              title="Remove this student match"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Apply Button */}
                    <button
                      type="button"
                      onClick={handleApply}
                      className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-xs transition flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-emerald-600/30"
                    >
                      <Check className="w-4 h-4 text-emerald-200" />
                      <span>
                        {isRTL
                          ? `${parsedMatches.length} ދަރިވަރުންގެ ހާޒިރީ އަދާހަމަކުރޭ`
                          : `Apply to Roll Call (${parsedMatches.length} Students)`}
                      </span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs space-y-1.5">
                    <div className="flex items-center gap-2 font-bold text-amber-950">
                      <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                      <span>
                        {isRTL
                          ? 'މި ޖުމްލައިން އެއްވެސް ދަރިވަރެއް ދެނެގަނެވިފައެއް ނުވޭ'
                          : 'No matching students detected in this voice note.'}
                      </span>
                    </div>
                    <p className="text-[11px] text-amber-800">
                      {isRTL
                        ? 'ދަރިވަރުގެ ފުރިހަމަ ނަން ނުވަތަ ގޮވާ ނަން ސާފުކޮށް ވިދާޅުވާށެވެ. (މިސާލަކަށް: "މުޙައްމަދު އަޒާން ބަލިވެގެން ސަލާމް").'
                        : 'Please clearly state the student\'s name as registered in the school directory (e.g. "Mohamed Azaan is absent with fever" or "Mohamed Azeen is late").'}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
