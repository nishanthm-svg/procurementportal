import { useState, useRef, useEffect } from 'react'
import axios from 'axios'

const API = import.meta.env.VITE_API_URL || ''

const CATEGORIES = {
  milk_quality:   { label: 'Milk Quality / Adulteration',   icon: '🥛', color: 'bg-red-100 text-red-800 border-red-300' },
  payment:        { label: 'Payment / Price Issues',        icon: '💰', color: 'bg-orange-100 text-orange-800 border-orange-300' },
  equipment:      { label: 'Equipment / Machine Fault',     icon: '⚙️', color: 'bg-yellow-100 text-yellow-800 border-yellow-300' },
  transport:      { label: 'Transport / Collection Issues', icon: '🚛', color: 'bg-blue-100 text-blue-800 border-blue-300' },
  staff_behavior: { label: 'Staff Behavior / Misconduct',   icon: '👤', color: 'bg-purple-100 text-purple-800 border-purple-300' },
  veterinary:     { label: 'Veterinary / Animal Health',    icon: '🐄', color: 'bg-green-100 text-green-800 border-green-300' },
  membership:     { label: 'Membership / Registration',     icon: '📋', color: 'bg-indigo-100 text-indigo-800 border-indigo-300' },
  other:          { label: 'Other / General',               icon: '📝', color: 'bg-gray-100 text-gray-800 border-gray-300' },
}

const LANGS = [
  { code: 'te-IN', label: 'తెలుగు' },
  { code: 'hi-IN', label: 'हिन्दी' },
  { code: 'kn-IN', label: 'ಕನ್ನಡ' },
  { code: 'en-IN', label: 'English' },
]

const KEYWORDS = {
  milk_quality:   ['quality','adulteration','fat','snf','sample','test','spoil','smell','dilute','water','rejected','పాల','నాణ్యత'],
  payment:        ['payment','price','rate','money','amount','dues','bonus','salary','bill','cheque','చెల్లింపు','రేటు'],
  equipment:      ['machine','equipment','bmc','broken','repair','fault','not working','power','pump','meter','యంత్రం'],
  transport:      ['transport','vehicle','collection','pickup','late','tanker','delay','driver','రవాణా'],
  staff_behavior: ['staff','employee','behavior','rude','bribe','harassment','misconduct','agent','collector'],
  veterinary:     ['animal','cow','buffalo','sick','disease','medicine','vet','fodder','feed','cattle','పశువు'],
  membership:     ['member','registration','id','card','enroll','share','passbook','account'],
}

function detectCategory(text) {
  const lower = (text || '').toLowerCase()
  for (const [cat, words] of Object.entries(KEYWORDS)) {
    if (words.some(w => lower.includes(w))) return cat
  }
  return 'other'
}

function Step1({ data, onChange, onNext }) {
  const valid = data.farmerName && data.villageName
  return (
    <div className="space-y-5">
      <div className="text-center mb-6">
        <div className="text-5xl mb-3">🐄</div>
        <h2 className="text-xl font-bold text-green-800">మీ వివరాలు నమోదు చేయండి</h2>
        <p className="text-sm text-gray-500 mt-1">Please enter your basic details</p>
      </div>

      <Field label="Farmer Name / రైతు పేరు *" value={data.farmerName}
        onChange={v => onChange('farmerName', v)} placeholder="Enter your full name" />
      <Field label="Village Name / గ్రామం పేరు *" value={data.villageName}
        onChange={v => onChange('villageName', v)} placeholder="Enter your village name" />
      <Field label="MPP Code / MPP కోడ్" value={data.mppCode}
        onChange={v => onChange('mppCode', v)} placeholder="e.g. MPP-001" />
      <Field label="BMCU Code / BMCU కోడ్" value={data.bmcuCode}
        onChange={v => onChange('bmcuCode', v)} placeholder="e.g. BMCU-123" />
      <Field label="BMCU Name / BMCU పేరు" value={data.bmcuName}
        onChange={v => onChange('bmcuName', v)} placeholder="Enter BMCU name" />

      <button
        onClick={onNext}
        disabled={!valid}
        className={`w-full py-4 rounded-2xl text-white font-bold text-lg transition-all ${
          valid ? 'bg-green-700 hover:bg-green-800 shadow-md active:scale-95' : 'bg-gray-300 cursor-not-allowed'
        }`}
      >
        Next: Record Grievance →
      </button>
    </div>
  )
}

function Field({ label, value, onChange, placeholder }) {
  return (
    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-1">{label}</label>
      <input
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-base focus:outline-none focus:border-green-500 bg-white"
      />
    </div>
  )
}

function Step2({ data, onChange, onNext, onBack }) {
  const [recording, setRecording] = useState(false)
  const [lang, setLang] = useState('te-IN')
  const [interim, setInterim] = useState('')
  const recognitionRef = useRef(null)

  function startRecording() {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SR) {
      alert('Audio recording not supported in this browser. Please type your complaint.')
      return
    }
    const r = new SR()
    r.lang = lang
    r.continuous = true
    r.interimResults = true
    r.onresult = e => {
      let final = ''
      let inter = ''
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) final += e.results[i][0].transcript + ' '
        else inter += e.results[i][0].transcript
      }
      if (final) onChange('transcription', (data.transcription || '') + final)
      setInterim(inter)
    }
    r.onerror = () => { setRecording(false); setInterim('') }
    r.onend   = () => { setRecording(false); setInterim('') }
    recognitionRef.current = r
    r.start()
    setRecording(true)
  }

  function stopRecording() {
    recognitionRef.current?.stop()
    setRecording(false)
    setInterim('')
  }

  const detectedCat = detectCategory(data.transcription)
  const catInfo = CATEGORIES[data.category || detectedCat]

  return (
    <div className="space-y-5">
      <div className="text-center mb-4">
        <div className="text-5xl mb-3">🎙️</div>
        <h2 className="text-xl font-bold text-green-800">మీ సమస్య చెప్పండి</h2>
        <p className="text-sm text-gray-500 mt-1">Speak or type your grievance</p>
      </div>

      {/* Language selector */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">Language / భాష</label>
        <div className="flex gap-2 flex-wrap">
          {LANGS.map(l => (
            <button key={l.code}
              onClick={() => setLang(l.code)}
              className={`px-4 py-2 rounded-full text-sm font-medium border-2 transition-all ${
                lang === l.code ? 'bg-green-700 text-white border-green-700' : 'bg-white text-gray-600 border-gray-200 hover:border-green-400'
              }`}>
              {l.label}
            </button>
          ))}
        </div>
      </div>

      {/* Mic button */}
      <div className="flex flex-col items-center gap-3">
        <button
          onMouseDown={startRecording}
          onTouchStart={startRecording}
          onClick={recording ? stopRecording : startRecording}
          className={`w-24 h-24 rounded-full flex items-center justify-center text-4xl shadow-lg transition-all active:scale-95 ${
            recording
              ? 'bg-red-500 animate-pulse shadow-red-300'
              : 'bg-green-700 hover:bg-green-800 shadow-green-300'
          }`}
        >
          {recording ? '⏹️' : '🎙️'}
        </button>
        <p className="text-sm font-medium text-gray-600">
          {recording ? '🔴 Recording... tap to stop' : 'Tap to start recording'}
        </p>
        {interim && (
          <div className="w-full bg-yellow-50 border border-yellow-200 rounded-xl px-4 py-2 text-sm text-gray-600 italic">
            {interim}
          </div>
        )}
      </div>

      {/* Transcription / text box */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1">
          Your Grievance / మీ ఫిర్యాదు *
        </label>
        <textarea
          rows={5}
          value={data.transcription || ''}
          onChange={e => onChange('transcription', e.target.value)}
          placeholder="Spoken text appears here automatically, or type directly..."
          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-base focus:outline-none focus:border-green-500 resize-none bg-white"
        />
      </div>

      {/* Auto-detected category */}
      {(data.transcription || '').length > 5 && (
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-gray-700">
            Category / వర్గం (auto-detected)
          </label>
          <div className="flex flex-wrap gap-2">
            {Object.entries(CATEGORIES).map(([key, cat]) => (
              <button key={key}
                onClick={() => onChange('category', key)}
                className={`px-3 py-1.5 rounded-full text-sm border-2 font-medium transition-all ${
                  (data.category || detectedCat) === key
                    ? cat.color + ' border-current shadow-sm scale-105'
                    : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'
                }`}>
                {cat.icon} {cat.label}
              </button>
            ))}
          </div>
          <div className={`flex items-center gap-2 px-4 py-2 rounded-xl border-2 ${catInfo.color} text-sm font-medium`}>
            <span className="text-lg">{catInfo.icon}</span>
            <span>Routed to: <strong>{
              data.category
                ? CATEGORIES[data.category]?.label
                : CATEGORIES[detectedCat]?.label
            }</strong></span>
          </div>
        </div>
      )}

      <div className="flex gap-3">
        <button onClick={onBack}
          className="flex-1 py-3 rounded-2xl border-2 border-gray-300 text-gray-700 font-semibold">
          ← Back
        </button>
        <button
          onClick={() => onNext(data.category || detectedCat)}
          disabled={!(data.transcription || '').trim()}
          className={`flex-[2] py-3 rounded-2xl text-white font-bold text-base transition-all ${
            (data.transcription || '').trim()
              ? 'bg-green-700 hover:bg-green-800 shadow-md active:scale-95'
              : 'bg-gray-300 cursor-not-allowed'
          }`}>
          Review & Submit →
        </button>
      </div>
    </div>
  )
}

function Step3({ data, finalCategory, onSubmit, onBack, loading }) {
  const cat = CATEGORIES[finalCategory] || CATEGORIES.other
  return (
    <div className="space-y-5">
      <div className="text-center mb-4">
        <div className="text-5xl mb-3">📋</div>
        <h2 className="text-xl font-bold text-green-800">Review Your Complaint</h2>
        <p className="text-sm text-gray-500 mt-1">సమీక్షించి సమర్పించండి</p>
      </div>

      <div className="bg-green-50 border border-green-200 rounded-2xl overflow-hidden">
        <div className="bg-green-700 text-white px-4 py-2 text-sm font-bold uppercase tracking-wide">Farmer Details</div>
        <div className="px-4 py-3 space-y-2 text-sm">
          <Row label="Name" value={data.farmerName} />
          <Row label="Village" value={data.villageName} />
          {data.mppCode  && <Row label="MPP Code"  value={data.mppCode} />}
          {data.bmcuCode && <Row label="BMCU Code" value={data.bmcuCode} />}
          {data.bmcuName && <Row label="BMCU Name" value={data.bmcuName} />}
        </div>
      </div>

      <div className="bg-white border-2 border-gray-200 rounded-2xl overflow-hidden">
        <div className="bg-gray-100 text-gray-700 px-4 py-2 text-sm font-bold uppercase tracking-wide">Grievance</div>
        <div className="px-4 py-3">
          <p className="text-gray-800 text-sm leading-relaxed">{data.transcription}</p>
        </div>
      </div>

      <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border-2 ${cat.color}`}>
        <span className="text-2xl">{cat.icon}</span>
        <div>
          <div className="text-xs font-bold uppercase tracking-wide opacity-70">Category</div>
          <div className="font-bold">{cat.label}</div>
        </div>
      </div>

      <div className="flex gap-3">
        <button onClick={onBack}
          className="flex-1 py-3 rounded-2xl border-2 border-gray-300 text-gray-700 font-semibold">
          ← Edit
        </button>
        <button onClick={() => onSubmit(finalCategory)}
          disabled={loading}
          className="flex-[2] py-3 rounded-2xl bg-green-700 hover:bg-green-800 text-white font-bold text-base shadow-md active:scale-95 disabled:opacity-60">
          {loading ? '⏳ Submitting...' : '✅ Submit Complaint'}
        </button>
      </div>
    </div>
  )
}

function Row({ label, value }) {
  return (
    <div className="flex gap-2">
      <span className="text-gray-500 w-24 flex-shrink-0">{label}:</span>
      <span className="text-gray-900 font-medium">{value}</span>
    </div>
  )
}

function SuccessScreen({ complaint }) {
  return (
    <div className="flex flex-col items-center text-center space-y-6 py-8">
      <div className="w-24 h-24 rounded-full bg-green-100 flex items-center justify-center text-5xl shadow-lg">✅</div>
      <div>
        <h2 className="text-2xl font-bold text-green-800 mb-2">Complaint Registered!</h2>
        <p className="text-gray-600 text-sm">మీ ఫిర్యాదు నమోదు చేయబడింది</p>
      </div>

      <div className="bg-green-50 border-2 border-green-200 rounded-2xl px-8 py-4 w-full">
        <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">Reference Number</div>
        <div className="text-2xl font-bold text-green-800 font-mono">{complaint.id}</div>
        <div className="text-xs text-gray-500 mt-1">Save this number for tracking</div>
      </div>

      <div className="text-sm text-gray-600 space-y-1 bg-yellow-50 border border-yellow-200 rounded-xl px-4 py-3 w-full text-left">
        <p className="font-semibold text-yellow-800">📌 What happens next?</p>
        <p>• Your complaint is sent to <strong>{complaint.department}</strong></p>
        <p>• You will be contacted within <strong>48 hours</strong></p>
        <p>• If not resolved, alerts go to senior management</p>
      </div>

      <button
        onClick={() => window.location.reload()}
        className="w-full py-3 rounded-2xl border-2 border-green-700 text-green-700 font-semibold text-base hover:bg-green-50">
        Submit Another Complaint
      </button>
    </div>
  )
}

export default function ComplaintForm() {
  const [step, setStep] = useState(1)
  const [data, setData] = useState({
    farmerName: '', villageName: '', mppCode: '', bmcuCode: '', bmcuName: '',
    transcription: '', category: '',
  })
  const [finalCategory, setFinalCategory] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(null)
  const [error, setError] = useState('')

  function update(key, val) { setData(d => ({ ...d, [key]: val })) }

  async function submit(cat) {
    setLoading(true)
    setError('')
    try {
      const res = await axios.post(`${API}/api/grievance/complaints`, {
        ...data,
        categoryOverride: cat,
      })
      setSubmitted(res.data.complaint)
    } catch (e) {
      setError(e?.response?.data?.error || 'Submission failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-800 to-green-600">
      {/* Header */}
      <div className="bg-green-900 text-white px-4 py-4 flex items-center gap-3 shadow-lg">
        <div className="text-3xl">🥛</div>
        <div>
          <div className="font-bold text-sm leading-tight">Shreeja Mahila Milk Producer Company Ltd.</div>
          <div className="text-green-300 text-xs">Grievance Portal | ఫిర్యాదు కేంద్రం</div>
        </div>
      </div>

      {/* Step indicator */}
      {!submitted && (
        <div className="flex justify-center gap-2 py-4">
          {[1, 2, 3].map(s => (
            <div key={s} className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all ${
              step === s ? 'bg-white text-green-800 border-white' :
              step > s   ? 'bg-green-500 text-white border-green-400' :
              'bg-transparent text-green-200 border-green-400'
            }`}>
              {step > s ? '✓' : s}
            </div>
          ))}
        </div>
      )}

      {/* Card */}
      <div className="px-4 pb-10">
        <div className="bg-white rounded-3xl shadow-2xl p-6 max-w-md mx-auto">
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
              {error}
            </div>
          )}

          {submitted ? (
            <SuccessScreen complaint={submitted} />
          ) : step === 1 ? (
            <Step1 data={data} onChange={update} onNext={() => setStep(2)} />
          ) : step === 2 ? (
            <Step2 data={data} onChange={update} onBack={() => setStep(1)}
              onNext={cat => { setFinalCategory(cat); setStep(3) }} />
          ) : (
            <Step3 data={data} finalCategory={finalCategory}
              onBack={() => setStep(2)} onSubmit={submit} loading={loading} />
          )}
        </div>
      </div>
    </div>
  )
}
