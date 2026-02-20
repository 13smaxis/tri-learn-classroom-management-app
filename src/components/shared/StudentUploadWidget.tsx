import React, { useEffect, useRef, useState } from 'react';

export interface ParsedLearner {
  learnerNumber: string;
  fullName: string;
}

interface StudentUploadWidgetProps {
  /** Called with parsed learners after a successful CSV parse */
  onLearnersReady: (learners: ParsedLearner[]) => void;
  /** If true, show a manual "capture" form alongside/as-alternative to CSV upload */
  allowManualCapture?: boolean;
  /** External loading state – when the parent is saving to backend */
  isSaving?: boolean;
  /** 0-100 progress value; shown while saving */
  saveProgress?: number;
  /** Label for the upload button */
  uploadLabel?: string;
  /** Let the parent force-open a specific mode */
  initialMode?: 'choose' | 'csv' | 'manual';
  /** Called when user clicks Cancel in capture form */
  onCancel?: () => void;
}

const StudentUploadWidget: React.FC<StudentUploadWidgetProps> = ({
  onLearnersReady,
  allowManualCapture = true,
  isSaving = false,
  saveProgress = 0,
  uploadLabel = 'Upload',
  initialMode = 'choose',
  onCancel,
}) => {
  const fileRef = useRef<HTMLInputElement>(null);
  const [mode, setMode] = useState<'choose' | 'csv' | 'manual'>(initialMode);
  const [file, setFile] = useState<File | null>(null);
  const [csvLearners, setCsvLearners] = useState<ParsedLearner[]>([]);
  const [parseError, setParseError] = useState('');
  const [nextAutoId, setNextAutoId] = useState(1);
  const [manualRows, setManualRows] = useState<{ id: string; name: string; surname: string }[]>([
    { id: '1', name: '', surname: '' },
  ]);

  // ── CSV handling ──────────────────────────────────────────
  // Helper to generate a unique 6-digit ID
  const generateUniqueId = (existing: Set<string>) => {
    let id;
    do {
      id = Math.floor(100000 + Math.random() * 900000).toString();
    } while (existing.has(id));
    existing.add(id);
    return id;
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    setParseError('');
    setCsvLearners([]);
    const selected = e.target.files?.[0];
    if (!selected) return;
    setFile(selected);

    const reader = new FileReader();
    reader.onload = () => {
      const text = reader.result?.toString() || '';
      const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
      if (lines.length < 2) {
        setParseError('File is empty or has no data rows.');
        return;
      }
      const dataLines = lines.slice(1); // skip header
      const usedIds = new Set<string>();
      const parsed: ParsedLearner[] = dataLines.map((line, idx) => {
        const [, nameRaw, surnameRaw] = line.split(',');
        // Always generate a new unique 6-digit learnerNumber
        const learnerNumber = generateUniqueId(usedIds);
        const firstName = (nameRaw || '').trim();
        const surname = (surnameRaw || '').trim();
        const fullName = [firstName, surname].filter(Boolean).join(' ') || `Learner ${idx + 1}`;
        return { learnerNumber, fullName };
      });
      setCsvLearners(parsed);
    };
    reader.readAsText(selected);
    e.target.value = '';
  };

  const handleCsvUpload = () => {
    if (csvLearners.length === 0) return;
    onLearnersReady(csvLearners);
  };

  // ── Manual capture ────────────────────────────────────────
  const updateManualRow = (index: number, field: 'id' | 'name' | 'surname', value: string) => {
    setManualRows(prev => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  const addManualRow = () => {
    const newId = nextAutoId + 1;
    setNextAutoId(newId);
    setManualRows(prev => [...prev, { id: String(newId), name: '', surname: '' }]);
  };

  const removeManualRow = (index: number) => {
    setManualRows(prev => prev.filter((_, i) => i !== index));
  };

  const handleManualUpload = () => {
    const usedIds = new Set<string>();
    const parsed: ParsedLearner[] = manualRows
      .filter(r => r.name.trim() || r.surname.trim())
      .map((r, idx) => {
        let learnerNumber = r.id.trim();
        if (!learnerNumber || learnerNumber.length !== 6 || isNaN(Number(learnerNumber))) {
          learnerNumber = generateUniqueId(usedIds);
        } else {
          if (usedIds.has(learnerNumber)) {
            learnerNumber = generateUniqueId(usedIds);
          } else {
            usedIds.add(learnerNumber);
          }
        }
        return {
          learnerNumber,
          fullName: [r.name.trim(), r.surname.trim()].filter(Boolean).join(' '),
        };
      });
    if (parsed.length === 0) return;
    onLearnersReady(parsed);
  };

  // ── Progress bar ──────────────────────────────────────────
  const ProgressBar = () => (
    <div className="w-full mt-3">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-medium text-blue-700">Uploading…</span>
        <span className="text-xs font-medium text-blue-700">{Math.round(saveProgress)}%</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-300 ease-out"
          style={{ width: `${saveProgress}%` }}
        />
      </div>
    </div>
  );

  // ── Mode chooser ──────────────────────────────────────────
  if (mode === 'choose') {
    return (
      <div className="space-y-4">
        <p className="text-sm text-gray-600">How would you like to add students?</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setMode('csv')}
            className="flex flex-col items-center gap-2 p-5 rounded-xl border-2 border-gray-200 hover:border-blue-400 hover:bg-blue-50 transition-all"
          >
            <span className="text-3xl">📄</span>
            <span className="font-semibold text-gray-900">Upload CSV File</span>
            <span className="text-xs text-gray-500 text-center">Import a CSV list with Student ID, Name, Surname columns</span>
          </button>
          {allowManualCapture && (
            <button
              type="button"
              onClick={() => setMode('manual')}
              className="flex flex-col items-center gap-2 p-5 rounded-xl border-2 border-gray-200 hover:border-blue-400 hover:bg-blue-50 transition-all"
            >
              <span className="text-3xl">✏️</span>
              <span className="font-semibold text-gray-900">Capture Manually</span>
              <span className="text-xs text-gray-500 text-center">Type in student details one by one</span>
            </button>
          )}
        </div>
      </div>
    );
  }

  // ── CSV upload mode ───────────────────────────────────────
  if (mode === 'csv') {
    return (
      <div className="space-y-4">
        <button type="button" onClick={() => { setMode('choose'); setFile(null); setCsvLearners([]); setParseError(''); }} className="text-sm text-blue-600 hover:underline">
          ← Back to options
        </button>

        <div
          onClick={() => fileRef.current?.click()}
          className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50/30 transition-all"
        >
          <input ref={fileRef} type="file" accept=".csv" onChange={handleFileSelect} className="hidden" />
          <span className="text-4xl block mb-2">📁</span>
          {file ? (
            <p className="text-sm font-medium text-gray-800">{file.name}</p>
          ) : (
            <p className="text-sm text-gray-500">Click to select a CSV file</p>
          )}
          <p className="text-xs text-gray-400 mt-1">Expected columns: Student ID, Student Name, Student Surname</p>
        </div>

        {parseError && (
          <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600 border border-red-100">{parseError}</div>
        )}

        {csvLearners.length > 0 && (
          <div className="rounded-lg border border-gray-200 max-h-48 overflow-y-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-bold text-gray-700">#</th>
                  <th className="px-3 py-2 text-left text-xs font-bold text-gray-700">ID</th>
                  <th className="px-3 py-2 text-left text-xs font-bold text-gray-700">Full Name</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {csvLearners.map((l, i) => (
                  <tr key={i} className="hover:bg-gray-50">
                    <td className="px-3 py-1.5 text-gray-500">{i + 1}</td>
                    <td className="px-3 py-1.5 text-gray-700">{l.learnerNumber}</td>
                    <td className="px-3 py-1.5 text-gray-900 font-medium">{l.fullName}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="px-3 py-2 bg-gray-50 text-xs text-gray-500 border-t">{csvLearners.length} student(s) found</div>
          </div>
        )}

        {isSaving && <ProgressBar />}

        {!isSaving && csvLearners.length > 0 && (
          <div className="flex justify-end">
            <button
              type="button"
              onClick={handleCsvUpload}
              className="px-4 py-2 text-sm bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-all"
            >
              {uploadLabel}
            </button>
          </div>
        )}
      </div>
    );
  }

  // ── Manual capture mode ───────────────────────────────────
  return (
    <div className="space-y-4">
      <button type="button" onClick={() => setMode('choose')} className="text-sm text-blue-600 hover:underline sm:hidden">
        ← Back to options
      </button>

      <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
        {manualRows.map((row, idx) => (
          <div key={idx} className="flex items-center gap-2">
            <span className="text-xs text-gray-400 w-5 shrink-0">{idx + 1}.</span>
            <input
              type="text"
              placeholder="ID"
              value={row.id}
              readOnly
              className="w-16 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-500 cursor-default"
            />
            <input
              type="text"
              placeholder="First Name"
              value={row.name}
              onChange={e => updateManualRow(idx, 'name', e.target.value)}
              className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
            <input
              type="text"
              placeholder="Surname"
              value={row.surname}
              onChange={e => updateManualRow(idx, 'surname', e.target.value)}
              className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
            {manualRows.length > 1 && (
              <button type="button" onClick={() => removeManualRow(idx)} className="text-red-400 hover:text-red-600 text-lg leading-none">×</button>
            )}
          </div>
        ))}
      </div>

      <button type="button" onClick={addManualRow} className="text-sm text-blue-600 hover:underline">
        + Add another student
      </button>

      {isSaving && <ProgressBar />}

      {!isSaving && (
        <div className="flex justify-end gap-2">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-all"
            >
              Cancel
            </button>
          )}
          <button
            type="button"
            onClick={handleManualUpload}
            disabled={!manualRows.some(r => r.name.trim() || r.surname.trim())}
            className="px-4 py-2 text-sm bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            Save
          </button>
        </div>
      )}
    </div>
  );
};

export default StudentUploadWidget;
