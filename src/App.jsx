import { useState } from 'react'
import { Routes, Route, useNavigate } from 'react-router-dom'
import './App.css'
import html2pdf from 'html2pdf.js'

function LandingPage() {
  const navigate = useNavigate();
  return (
    <div className="landing-page">
      <h1>Resume Builder</h1>
      
      <button onClick={() => navigate('/builder')}>Start Building</button>
    </div>
  );
}

const initialForm = {
  personal: { name: '', email: '', phone: '', linkedin: '', portfolio: '' },
  education: [{ institute: '', degree: '', city: '', state: '', gpa: '', start: '', end: '' }],
  experience: [{ company: '', role: '', city: '', state: '', start: '', end: '', bullets: [''] }],
  projects: [{ name: '', course: '', city: '', state: '', start: '', end: '', bullets: [''] }],
  involvement: [{ title: '', org: '', start: '', end: '', bullets: [''] }],
  skills: '',
  honors: [{ name: '', date: '' }],
  summary: '',
  certifications: '',
};

const exampleForm = {
  personal: {
    name: 'Athul Raj R',
    email: 'athul3210rajr@gmail.com',
    phone: '8590664361',
    linkedin: 'athull-r',
    portfolio: '',
  },
  summary: 'Curious and adaptive individual with a passion for exploration and continuous learning. A quick learner eager to embrace new challenges and contribute to innovative solutions.',
  education: [
    {
      institute: 'AWH Engineering College',
      degree: 'Btech CSE',
      city: 'Calicut',
      state: '',
      gpa: '7.6',
      start: '2021',
      end: '2025'
    },
    {
      institute: 'Kendriya Vidyalaya No 1',
      degree: '12th CSE',
      city: 'Calicut',
      state: '',
      gpa: '80%',
      start: '2020',
      end: '2021'
    }
  ],
  experience: [
    {
      company: 'Exult',
      role: 'QA Intern',
      city: '',
      state: '',
      start: 'May 2025',
      end: 'Aug 2025',
      bullets: [
        'Learned testing and test case writing methodologies, contributing to improved project quality.'
      ]
    },
    {
      company: 'ICT Academy',
      role: 'MERN Developer',
      city: '',
      state: '',
      start: 'Sept 2024',
      end: 'Nov 2024',
      bullets: [
        'Learned MERN stack basics and completed a full-stack project.'
      ]
    }
  ],
  projects: [
    {
      name: 'Lets Go!',
      course: '',
      city: '',
      state: '',
      start: '',
      end: '',
      bullets: [
        'Dedicated social media platform for travel and nature lovers , platform to host green camps'
      ]
    },
    {
      name: 'Resume4me',
      course: '',
      city: '',
      state: '',
      start: '',
      end: '',
      bullets: [
        'A free, beginner-friendly platform to easily create ATS-friendly resumes.'
      ]
    },
    {
      name: 'Ruse',
      course: '',
      city: '',
      state: '',
      start: '',
      end: '',
      bullets: [
        'An AI-powered web game where players investigate by interacting with roleplaying characters.'
      ]
    }
  ],
  involvement: [
    {
      title: 'Chairperson',
      org: '',
      start: '2022',
      end: '2023',
      bullets: []
    },
    {
      title: 'Event Coordinator',
      org: 'NSS',
      start: '2022',
      end: '2024',
      bullets: []
    }
  ],
  skills: 'Python, HTML, CSS, Js, React, Git, Java, C',
  honors: [],
  certifications: ''
};

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

// Helper to extract LinkedIn username and build full URL
function getLinkedInInfo(linkedinInput) {
  if (!linkedinInput) return { username: '', url: '' };
  let username = linkedinInput.trim();
  let url = linkedinInput.trim();
  // If input is a full URL
  const match = username.match(/linkedin\.com\/in\/([a-zA-Z0-9\-_.]+)/);
  if (match) {
    username = match[1];
    url = `https://www.linkedin.com/in/${username}`;
  } else if (!username.startsWith('http')) {
    // If input is just the username
    url = `https://www.linkedin.com/in/${username}`;
  }
  return { username, url };
}

function ResumeBuilder() {
  const [form, setForm] = useState(initialForm);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState('');
  const [summaryKeywords, setSummaryKeywords] = useState('');
  const [aiGeneratedSummary, setAiGeneratedSummary] = useState('');

  // Handlers for dynamic fields
  const handleChange = (section, field, value, idx, subidx) => {
    if (Array.isArray(form[section])) {
      const updated = form[section].map((item, i) => {
        if (i !== idx) return item;
        if (Array.isArray(item[field])) {
          // For bullets
          const bullets = item[field].map((b, j) => (j === subidx ? value : b));
          return { ...item, [field]: bullets };
        }
        return { ...item, [field]: value };
      });
      setForm({ ...form, [section]: updated });
    } else if (section === 'personal') {
      setForm({ ...form, personal: { ...form.personal, [field]: value } });
    } else {
      setForm({ ...form, [section]: value });
    }
  };

  const addField = (section) => {
    setForm({
      ...form,
      [section]: [...form[section], Object.fromEntries(Object.keys(form[section][0]).map(k => Array.isArray(form[section][0][k]) ? ['bullets', ['']] : [k, '']))],
    });
  };

  const addBullet = (section, idx) => {
    const updated = form[section].map((item, i) =>
      i === idx ? { ...item, bullets: [...item.bullets, ''] } : item
    );
    setForm({ ...form, [section]: updated });
  };

  const handleDownloadPDF = () => {
    const element = document.getElementById('resume-preview');
    if (element) {
      html2pdf().from(element).set({
        margin: 0,
        filename: `${form.personal.name || 'resume'}.pdf`,
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' }
      }).save();
    }
  };

  // Helper for showing example
  const fillExample = () => setForm(exampleForm);

  // AI Suggest for Summary (using keywords)
  const handleAISummary = async () => {
    setAiLoading(true);
    setAiError('');
    setAiGeneratedSummary('');
    try {
      const prompt = `Write a single, concise, professional, ATS-friendly resume summary (2-3 sentences max) using these keywords: ${summaryKeywords}. Do not provide multiple options. Do not use headings. Only return the summary.`;
      const response = await fetch(
        'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-goog-api-key': GEMINI_API_KEY
          },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }]
          })
        }
      );
      const data = await response.json();
      console.log('Gemini response:', data);
      if (data.candidates && data.candidates[0].content.parts[0].text) {
        // Use only the first paragraph or up to the first line break
        const raw = data.candidates[0].content.parts[0].text.trim();
        const summary = raw.split(/\n{2,}|\n|\\n/)[0].replace(/^[-*>•\d.\s]+/, '').trim();
        setAiGeneratedSummary(summary);
      } else if (data.error) {
        setAiError('Gemini error: ' + data.error.message);
      } else {
        setAiError('Gemini did not return a summary.');
      }
    } catch (err) {
      setAiError('Error contacting Gemini API.');
    }
    setAiLoading(false);
  };

  const useAiSummary = () => {
    setForm({ ...form, summary: aiGeneratedSummary });
  };

  // Resume preview rendering
  const renderPreview = () => (
    <div className="resume-preview" id="resume-preview">
      <div className="resume-header">
        <div className="resume-name">{form.personal.name || ''}</div>
        <div className="resume-contact">
          {[form.personal.email, form.personal.phone, form.personal.portfolio]
            .filter(Boolean)
            .map((item, idx) => <span key={idx}>{idx > 0 && ' • '}{item}</span>)}
          {getLinkedInInfo(form.personal.linkedin).username && (
            <span>
              {' • '}
              <a href={getLinkedInInfo(form.personal.linkedin).url} target="_blank" rel="noopener noreferrer">{getLinkedInInfo(form.personal.linkedin).username}</a>
            </span>
          )}
        </div>
      </div>
      {/* SUMMARY */}
      {form.summary && (
        <div className="resume-section">
          <div className="resume-section-title">SUMMARY</div>
          <div>{form.summary}</div>
        </div>
      )}
      {/* EDUCATION */}
      {form.education.some(ed => ed.institute || ed.degree || ed.city || ed.state || ed.gpa || ed.start || ed.end) && (
        <div className="resume-section">
          <div className="resume-section-title">EDUCATION</div>
          {form.education.map((ed, i) => (
            (ed.institute || ed.degree || ed.city || ed.state || ed.gpa || ed.start || ed.end) && (
              <div className="resume-row" key={i}>
                <div className="resume-left">
                  <b>{ed.institute}</b>{ed.institute && ed.degree && ', '}
                  <span className="resume-italic">{ed.degree}</span><br/>
                  {(ed.city || ed.state) && <span className="resume-light">{ed.city}{ed.city && ed.state && ', '}{ed.state}</span>}<br/>
                </div>
                <div className="resume-right">
                  <span>{ed.start}{ed.start && ed.end && ' - '}{ed.end}</span><br/>
                  {ed.gpa && <span>GPA: {ed.gpa}</span>}
                </div>
              </div>
            )
          ))}
        </div>
      )}
      {/* EXPERIENCE */}
      {form.experience.some(ex => ex.company || ex.role || ex.city || ex.state || ex.start || ex.end || (ex.bullets && ex.bullets.some(b => b))) && (
        <div className="resume-section">
          <div className="resume-section-title">RELEVANT EXPERIENCE</div>
          {form.experience.map((ex, i) => (
            (ex.company || ex.role || ex.city || ex.state || ex.start || ex.end || (ex.bullets && ex.bullets.some(b => b))) && (
              <div className="resume-row" key={i}>
                <div className="resume-left">
                  <b>{ex.company}</b>{ex.company && ex.role && ', '}
                  <span className="resume-italic">{ex.role}</span><br/>
                  {(ex.city || ex.state) && <span className="resume-light">{ex.city}{ex.city && ex.state && ', '}{ex.state}</span>}
                </div>
                <div className="resume-right">
                  <span>{ex.start}{ex.start && ex.end && ' - '}{ex.end}</span>
                </div>
                {ex.bullets && ex.bullets.filter(b => b).length > 0 && (
                  <ul className="resume-bullets">
                    {ex.bullets.filter(b => b).map((b, j) => <li key={j}>{b}</li>)}
                  </ul>
                )}
              </div>
            )
          ))}
        </div>
      )}
      {/* PROJECTS */}
      {form.projects.some(pr => pr.name || pr.course || pr.city || pr.state || pr.start || pr.end || (pr.bullets && pr.bullets.some(b => b))) && (
        <div className="resume-section">
          <div className="resume-section-title">PROJECT EXPERIENCE</div>
          {form.projects.map((pr, i) => (
            (pr.name || pr.course || pr.city || pr.state || pr.start || pr.end || (pr.bullets && pr.bullets.some(b => b))) && (
              <div className="resume-row" key={i}>
                <div className="resume-left">
                  <b>{pr.name}</b>{pr.name && pr.course && ', '}
                  <span className="resume-italic">{pr.course}</span><br/>
                  {(pr.city || pr.state) && <span className="resume-light">{pr.city}{pr.city && pr.state && ', '}{pr.state}</span>}
                </div>
                <div className="resume-right">
                  <span>{pr.start}{pr.start && pr.end && ' - '}{pr.end}</span>
                </div>
                {pr.bullets && pr.bullets.filter(b => b).length > 0 && (
                  <ul className="resume-bullets">
                    {pr.bullets.filter(b => b).map((b, j) => <li key={j}>{b}</li>)}
                  </ul>
                )}
              </div>
            )
          ))}
        </div>
      )}
      {/* INVOLVEMENT */}
      {form.involvement.some(iv => iv.title || iv.org || iv.start || iv.end || (iv.bullets && iv.bullets.some(b => b))) && (
        <div className="resume-section">
          <div className="resume-section-title">CAMPUS & COMMUNITY INVOLVEMENT</div>
          {form.involvement.map((iv, i) => (
            (iv.title || iv.org || iv.start || iv.end || (iv.bullets && iv.bullets.some(b => b))) && (
              <div className="resume-row" key={i}>
                <div className="resume-left">
                  <b>{iv.title}</b>{iv.title && iv.org && ', '}{iv.org}
                </div>
                <div className="resume-right">
                  <span>{iv.start}{iv.start && iv.end && ' - '}{iv.end}</span>
                </div>
                {iv.bullets && iv.bullets.filter(b => b).length > 0 && (
                  <ul className="resume-bullets">
                    {iv.bullets.filter(b => b).map((b, j) => <li key={j}>{b}</li>)}
                  </ul>
                )}
              </div>
            )
          ))}
        </div>
      )}
      {/* SKILLS */}
      {form.skills && (
        <div className="resume-section">
          <div className="resume-section-title">SKILLS</div>
          <div className="resume-skills-table">
            {form.skills.split(',').map(s => s.trim()).filter(Boolean).map((skill, i) => (
              <div className="resume-skill-cell" key={i}>{skill}</div>
            ))}
          </div>
        </div>
      )}
      {/* HONORS */}
      {form.honors.some(h => h.name || h.date) && (
        <div className="resume-section">
          <div className="resume-section-title">HONORS AND AWARDS</div>
          {form.honors.map((h, i) => (
            (h.name || h.date) && (
              <div className="resume-row" key={i}>
                <div className="resume-left">{h.name}</div>
                <div className="resume-right">{h.date}</div>
              </div>
            )
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="builder-layout">
      <div style={{ width: '100%' }}>
        <button type="button" className="example-btn" onClick={fillExample} style={{marginBottom: '1rem'}}>Fill it</button>
      </div>
      <form className="resume-form" onSubmit={e => e.preventDefault()}>
        <h2>Personal Info</h2>
        <div className="helper-text">Fill in your contact details as they should appear on your resume.</div>
        <input placeholder="Full Name (e.g. Jane Doe)" value={form.personal.name} onChange={e => handleChange('personal', 'name', e.target.value)} />
        <input placeholder="Email (e.g. jane.doe@email.com)" value={form.personal.email} onChange={e => handleChange('personal', 'email', e.target.value)} />
        <input placeholder="Phone (e.g. +1 234 567 8901)" value={form.personal.phone} onChange={e => handleChange('personal', 'phone', e.target.value)} />
        <input placeholder="LinkedIn (e.g. linkedin.com/in/janedoe)" value={form.personal.linkedin} onChange={e => handleChange('personal', 'linkedin', e.target.value)} />
        <input placeholder="Portfolio (e.g. janedoe.dev)" value={form.personal.portfolio} onChange={e => handleChange('personal', 'portfolio', e.target.value)} />
        <h2>Summary / Objective</h2>
        <div className="helper-text">Enter keywords (comma-separated) that describe your professional background, skills, and goals. Example: software engineer, 5+ years, React, scalable apps</div>
        <div style={{display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem'}}>
          <input
            placeholder="e.g. software engineer, 5+ years, React, scalable apps"
            value={summaryKeywords}
            onChange={e => setSummaryKeywords(e.target.value)}
            style={{flex: 1}}
          />
          <button type="button" className="ai-btn" onClick={handleAISummary} disabled={aiLoading || !summaryKeywords.trim()} title={!summaryKeywords.trim() ? 'Enter keywords' : 'Let AI suggest a summary'}>
            {aiLoading ? 'AI...' : 'AI Suggest'}
          </button>
        </div>
        {aiError && <div className="helper-text" style={{color: 'red'}}>{aiError}</div>}
        {aiGeneratedSummary && (
          <div className="ai-summary-box">
            <div><b>AI Generated Summary:</b></div>
            <div style={{margin: '0.5rem 0'}}>{aiGeneratedSummary}</div>
            <button type="button" className="use-btn" onClick={useAiSummary}>Use It</button>
          </div>
        )}
        <textarea placeholder="Summary will appear here..." value={form.summary} onChange={e => handleChange('summary', null, e.target.value)} />
        <h2>Education</h2>
        {form.education.map((ed, i) => (
          <div key={i} className="form-section">
            <input placeholder="Institute Name" value={ed.institute} onChange={e => handleChange('education', 'institute', e.target.value, i)} />
            <input placeholder="Degree" value={ed.degree} onChange={e => handleChange('education', 'degree', e.target.value, i)} />
            <input placeholder="City" value={ed.city} onChange={e => handleChange('education', 'city', e.target.value, i)} />
            <input placeholder="State" value={ed.state} onChange={e => handleChange('education', 'state', e.target.value, i)} />
            <input placeholder="GPA (optional)" value={ed.gpa} onChange={e => handleChange('education', 'gpa', e.target.value, i)} />
            <input placeholder="Start (Month Year)" value={ed.start} onChange={e => handleChange('education', 'start', e.target.value, i)} />
            <input placeholder="End (Month Year or Expected)" value={ed.end} onChange={e => handleChange('education', 'end', e.target.value, i)} />
          </div>
        ))}
        <button type="button" className="add-btn" onClick={() => addField('education')}>+ Add Education</button>
        <h2>Work Experience</h2>
        {form.experience.map((ex, i) => (
          <div key={i} className="form-section">
            <input placeholder="Company" value={ex.company} onChange={e => handleChange('experience', 'company', e.target.value, i)} />
            <input placeholder="Role" value={ex.role} onChange={e => handleChange('experience', 'role', e.target.value, i)} />
            <input placeholder="City" value={ex.city} onChange={e => handleChange('experience', 'city', e.target.value, i)} />
            <input placeholder="State" value={ex.state} onChange={e => handleChange('experience', 'state', e.target.value, i)} />
            <input placeholder="Start (Month Year)" value={ex.start} onChange={e => handleChange('experience', 'start', e.target.value, i)} />
            <input placeholder="End (Month Year)" value={ex.end} onChange={e => handleChange('experience', 'end', e.target.value, i)} />
            {ex.bullets.map((b, j) => (
              <input key={j} placeholder={`Bullet Point ${j+1}`} value={b} onChange={e => handleChange('experience', 'bullets', e.target.value, i, j)} />
            ))}
            <button type="button" className="add-btn" onClick={() => addBullet('experience', i)}>+ Add Bullet</button>
          </div>
        ))}
        <button type="button" className="add-btn" onClick={() => addField('experience')}>+ Add Experience</button>
        <h2>Projects</h2>
        {form.projects.map((pr, i) => (
          <div key={i} className="form-section">
            <input placeholder="Project Name" value={pr.name} onChange={e => handleChange('projects', 'name', e.target.value, i)} />
            <input placeholder="Course (optional)" value={pr.course} onChange={e => handleChange('projects', 'course', e.target.value, i)} />
            <input placeholder="City" value={pr.city} onChange={e => handleChange('projects', 'city', e.target.value, i)} />
            <input placeholder="State" value={pr.state} onChange={e => handleChange('projects', 'state', e.target.value, i)} />
            <input placeholder="Start (Month Year)" value={pr.start} onChange={e => handleChange('projects', 'start', e.target.value, i)} />
            <input placeholder="End (Month Year)" value={pr.end} onChange={e => handleChange('projects', 'end', e.target.value, i)} />
            {pr.bullets.map((b, j) => (
              <input key={j} placeholder={`Bullet Point ${j+1}`} value={b} onChange={e => handleChange('projects', 'bullets', e.target.value, i, j)} />
            ))}
            <button type="button" className="add-btn" onClick={() => addBullet('projects', i)}>+ Add Bullet</button>
          </div>
        ))}
        <button type="button" className="add-btn" onClick={() => addField('projects')}>+ Add Project</button>
        <h2>Campus & Community Involvement</h2>
        {form.involvement.map((iv, i) => (
          <div key={i} className="form-section">
            <input placeholder="Title (if applicable)" value={iv.title} onChange={e => handleChange('involvement', 'title', e.target.value, i)} />
            <input placeholder="Club/Organization Name" value={iv.org} onChange={e => handleChange('involvement', 'org', e.target.value, i)} />
            <input placeholder="Start (Month Year)" value={iv.start} onChange={e => handleChange('involvement', 'start', e.target.value, i)} />
            <input placeholder="End (Month Year)" value={iv.end} onChange={e => handleChange('involvement', 'end', e.target.value, i)} />
            {iv.bullets.map((b, j) => (
              <input key={j} placeholder={`Bullet Point ${j+1}`} value={b} onChange={e => handleChange('involvement', 'bullets', e.target.value, i, j)} />
            ))}
            <button type="button" className="add-btn" onClick={() => addBullet('involvement', i)}>+ Add Bullet</button>
          </div>
        ))}
        <button type="button" className="add-btn" onClick={() => addField('involvement')}>+ Add Involvement</button>
        <h2>Skills</h2>
        <input placeholder="e.g. JavaScript, React, CSS, HTML, Git" value={form.skills} onChange={e => handleChange('skills', null, e.target.value)} />
        <h2>Honors and Awards</h2>
        {form.honors.map((h, i) => (
          <div key={i} className="form-section">
            <input placeholder="Name of Honor/Award/Grant" value={h.name} onChange={e => handleChange('honors', 'name', e.target.value, i)} />
            <input placeholder="Month and Year Given" value={h.date} onChange={e => handleChange('honors', 'date', e.target.value, i)} />
          </div>
        ))}
        <button type="button" className="add-btn" onClick={() => addField('honors')}>+ Add Honor/Award</button>
      </form>
      <div style={{ width: '100%' }}>
        <button type="button" className="pdf-btn" onClick={handleDownloadPDF} style={{marginBottom: '1rem'}}>Download PDF</button>
        {renderPreview()}
      </div>
    </div>
  );
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/builder" element={<ResumeBuilder />} />
    </Routes>
  );
}

export default App

