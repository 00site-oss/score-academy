const { useState, useEffect, useCallback } = React;

// ---------- Simple icons (inline SVG) ----------
const Icon = ({ name, size = 20 }) => {
  const icons = {
    book: <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />,
    star: <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />,
    gift: <polyline points="20 12 20 22 4 22 4 12" /><rect x="2" y="7" width="20" height="5" /><line x1="12" y1="22" x2="12" y2="7" /><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z" /><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z" />,
    users: <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />,
    check: <polyline points="20 6 9 17 4 12" />,
    logout: <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />,
    plus: <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />,
  };
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      {icons[name]}
    </svg>
  );
};

// ---------- Mock API (inline for single-file simplicity, mirrors js/api.js) ----------
const STORAGE_KEY = 'overall_score_academy_v1';

const defaultData = {
  users: [
    { id: 1, name: 'Administrator', username: 'admin', password: 'admin', role: 'admin', overallScore: 0, email: 'admin@example.com' },
    { id: 2, name: 'Alice Student', username: 'student1', password: 'password123', role: 'student', overallScore: 45, email: 'alice@example.com' },
    { id: 3, name: 'Bob Learner', username: 'student2', password: 'password123', role: 'student', overallScore: 90, email: 'bob@example.com' }
  ],
  assignments: [
    { id: 1, title: 'Introduction Essay', description: 'Write 300–400 words about yourself and your learning goals.', maxScore: 20, dueDate: '', active: true },
    { id: 2, title: 'Critical Thinking Reflection', description: 'Reflect on a recent challenge and how you overcame it (min 250 words).', maxScore: 15, dueDate: '', active: true },
    { id: 3, title: 'Research Summary', description: 'Summarise one article related to your field of interest.', maxScore: 25, dueDate: '', active: true }
  ],
  submissions: [
    { id: 1, assignmentId: 1, userId: 2, text: 'My name is Alice and I love learning new things...', status: 'Graded', scoreAwarded: 18, submittedAt: '2026-10-10T10:00:00', gradedAt: '2026-10-11T14:00:00', adminNotes: 'Great introduction!' },
    { id: 2, assignmentId: 2, userId: 2, text: 'I recently faced a difficult coding problem...', status: 'Pending', scoreAwarded: 0, submittedAt: '2026-10-14T09:30:00', gradedAt: '', adminNotes: '' }
  ],
  rewards: [
    { id: 1, name: '£1 Amazon Gift Card', description: 'Digital Amazon voucher sent by email', cost: 25, active: true, stock: 100 },
    { id: 2, name: '£5 Amazon Gift Card', description: 'Digital Amazon voucher sent by email', cost: 100, active: true, stock: 50 },
    { id: 3, name: 'Assignment Skip Pass', description: 'Skip one future assignment without penalty', cost: 40, active: true, stock: 999 },
    { id: 4, name: 'Certificate of Achievement', description: 'Personalized PDF certificate', cost: 60, active: true, stock: 200 }
  ],
  redemptions: [
    { id: 1, userId: 3, rewardId: 1, cost: 25, status: 'Fulfilled', requestedAt: '2026-10-12T16:00:00', fulfilledAt: '2026-10-13T10:00:00', notes: 'Sent' }
  ]
};

function load() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultData));
    return JSON.parse(JSON.stringify(defaultData));
  }
  return JSON.parse(raw);
}

function save(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function nextId(arr) {
  return arr.reduce((m, i) => Math.max(m, i.id || 0), 0) + 1;
}

const API = {
  login(username, password) {
    const data = load();
    const user = data.users.find(u => u.username === username && u.password === password);
    if (!user) return { success: false, message: 'Invalid username or password' };
    const { password: _, ...safe } = user;
    return { success: true, user: safe };
  },
  getUser(userId) {
    const data = load();
    const user = data.users.find(u => u.id === userId);
    if (!user) return null;
    const { password: _, ...safe } = user;
    return safe;
  },
  getAllUsers() {
    return load().users.map(({ password, ...u }) => u);
  },
  getAssignments(activeOnly = false) {
    let list = load().assignments;
    if (activeOnly) list = list.filter(a => a.active);
    return list;
  },
  addAssignment({ title, description, maxScore }) {
    const data = load();
    const id = nextId(data.assignments);
    data.assignments.push({ id, title, description, maxScore: Number(maxScore) || 10, dueDate: '', active: true });
    save(data);
    return { success: true, id };
  },
  submitWork(userId, assignmentId, text) {
    const data = load();
    const id = nextId(data.submissions);
    data.submissions.push({
      id, assignmentId: Number(assignmentId), userId: Number(userId), text,
      status: 'Pending', scoreAwarded: 0, submittedAt: new Date().toISOString(), gradedAt: '', adminNotes: ''
    });
    save(data);
    return { success: true, id };
  },
  getPendingSubmissions() {
    const data = load();
    return data.submissions.filter(s => s.status === 'Pending').map(s => {
      const user = data.users.find(u => u.id === s.userId);
      const assignment = data.assignments.find(a => a.id === s.assignmentId);
      return { ...s, studentName: user?.name || 'Unknown', assignmentTitle: assignment?.title || 'Unknown', maxScore: assignment?.maxScore || 0 };
    });
  },
  getStudentSubmissions(userId) {
    const data = load();
    return data.submissions.filter(s => s.userId === Number(userId)).map(s => {
      const assignment = data.assignments.find(a => a.id === s.assignmentId);
      return { ...s, assignmentTitle: assignment?.title || 'Unknown' };
    }).sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));
  },
  gradeSubmission(submissionId, scoreAwarded, adminNotes = '') {
    const data = load();
    const sub = data.submissions.find(s => s.id === Number(submissionId));
    if (!sub) return { success: false, message: 'Submission not found' };
    const user = data.users.find(u => u.id === sub.userId);
    if (!user) return { success: false, message: 'User not found' };
    const points = Number(scoreAwarded) || 0;
    sub.status = 'Graded';
    sub.scoreAwarded = points;
    sub.gradedAt = new Date().toISOString();
    sub.adminNotes = adminNotes;
    user.overallScore = (user.overallScore || 0) + points;
    save(data);
    return { success: true, newOverallScore: user.overallScore };
  },
  getRewards(activeOnly = true) {
    let list = load().rewards;
    if (activeOnly) list = list.filter(r => r.active);
    return list;
  },
  redeemReward(userId, rewardId) {
    const data = load();
    const user = data.users.find(u => u.id === Number(userId));
    const reward = data.rewards.find(r => r.id === Number(rewardId) && r.active);
    if (!user) return { success: false, message: 'User not found' };
    if (!reward) return { success: false, message: 'Reward not available' };
    if (user.overallScore < reward.cost) {
      return { success: false, message: `Not enough Overall Score. You have ${user.overallScore}, need ${reward.cost}` };
    }
    // Exact: Overall Score − cost
    user.overallScore = user.overallScore - reward.cost;
    const id = nextId(data.redemptions);
    data.redemptions.push({
      id, userId: user.id, rewardId: reward.id, cost: reward.cost,
      status: 'Pending', requestedAt: new Date().toISOString(), fulfilledAt: '', notes: ''
    });
    save(data);
    return { success: true, message: `Successfully redeemed "${reward.name}" for ${reward.cost} points`, remainingScore: user.overallScore };
  },
  getUserRedemptions(userId) {
    const data = load();
    return data.redemptions.filter(r => r.userId === Number(userId)).map(r => {
      const reward = data.rewards.find(rw => rw.id === r.rewardId);
      return { ...r, rewardName: reward?.name || 'Reward' };
    }).sort((a, b) => new Date(b.requestedAt) - new Date(a.requestedAt));
  },
  getDashboardStats() {
    const data = load();
    return {
      users: data.users.filter(u => u.role === 'student').length,
      assignments: data.assignments.length,
      pending: data.submissions.filter(s => s.status === 'Pending').length,
      rewards: data.rewards.filter(r => r.active).length
    };
  }
};

// ---------- Components ----------
function Login({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const res = API.login(username.trim(), password);
    setLoading(false);
    if (res.success) onLogin(res.user);
    else setError(res.message);
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <h1>Overall Score Academy</h1>
        <p>Online assignments • Manual grading • Rewards</p>
        {error && <div className="alert alert-error">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Username</label>
            <input value={username} onChange={e => setUsername(e.target.value)} placeholder="admin or student1" required autoFocus />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required />
          </div>
          <button className="btn btn-primary" type="submit" disabled={loading}>
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>
        <div style={{ marginTop: 24, fontSize: 13, color: '#64748b', textAlign: 'center' }}>
          <strong>Demo:</strong> admin / admin &nbsp;|&nbsp; student1 / password123
        </div>
      </div>
    </div>
  );
}

function Header({ user, onLogout, onRefreshUser }) {
  return (
    <header className="app-header">
      <div className="logo">
        <Icon name="book" size={24} /> Overall Score Academy
      </div>
      <div className="user-bar">
        {user.role === 'student' && (
          <div className="score-badge">
            Overall Score: <strong>{user.overallScore}</strong>
          </div>
        )}
        <span>Hi, {user.name}</span>
        <button className="btn btn-outline btn-sm" onClick={onLogout}>
          <Icon name="logout" size={16} /> Logout
        </button>
      </div>
    </header>
  );
}

function Sidebar({ role, active, onNav }) {
  const studentLinks = [
    { id: 'dashboard', label: 'Dashboard', icon: 'star' },
    { id: 'assignments', label: 'Assignments', icon: 'book' },
    { id: 'my-work', label: 'My Submissions', icon: 'check' },
    { id: 'rewards', label: 'Redeem Rewards', icon: 'gift' },
  ];
  const adminLinks = [
    { id: 'dashboard', label: 'Dashboard', icon: 'star' },
    { id: 'grading', label: 'Pending Grading', icon: 'check' },
    { id: 'assignments', label: 'Manage Assignments', icon: 'book' },
    { id: 'users', label: 'Users & Scores', icon: 'users' },
    { id: 'rewards', label: 'Rewards', icon: 'gift' },
  ];
  const links = role === 'admin' ? adminLinks : studentLinks;

  return (
    <aside className="sidebar">
      <nav>
        {links.map(l => (
          <a key={l.id} href="#" className={active === l.id ? 'active' : ''} onClick={e => { e.preventDefault(); onNav(l.id); }}>
            <Icon name={l.icon} size={18} /> {l.label}
          </a>
        ))}
      </nav>
    </aside>
  );
}

function StudentDashboard({ user }) {
  const stats = {
    score: user.overallScore,
    submissions: API.getStudentSubmissions(user.id).length,
    pending: API.getStudentSubmissions(user.id).filter(s => s.status === 'Pending').length,
    graded: API.getStudentSubmissions(user.id).filter(s => s.status === 'Graded').length
  };
  return (
    <div>
      <h1 style={{ marginBottom: 24 }}>Welcome back, {user.name.split(' ')[0]}!</h1>
      <div className="stats-grid">
        <div className="stat-card">
          <div className="value">{stats.score}</div>
          <div className="label">Overall Score</div>
        </div>
        <div className="stat-card">
          <div className="value">{stats.submissions}</div>
          <div className="label">Total Submissions</div>
        </div>
        <div className="stat-card">
          <div className="value">{stats.pending}</div>
          <div className="label">Awaiting Grade</div>
        </div>
        <div className="stat-card">
          <div className="value">{stats.graded}</div>
          <div className="label">Graded</div>
        </div>
      </div>
      <div className="card">
        <div className="card-header"><h2>How Overall Score works</h2></div>
        <div className="card-body">
          <p>Complete assignments → Admin grades them → Points are added to your <strong>Overall Score</strong>.</p>
          <p style={{ marginTop: 12 }}>You can later redeem rewards. Example: if you have 90 points and a £1 Amazon reward costs 25 points:</p>
          <p style={{ marginTop: 8, fontFamily: 'monospace', background: '#f1f5f9', padding: 12, borderRadius: 8 }}>
            Overall Score: 90 − 25 = 65
          </p>
        </div>
      </div>
    </div>
  );
}

function AssignmentsList({ user, onSubmitted }) {
  const [assignments, setAssignments] = useState([]);
  const [selected, setSelected] = useState(null);
  const [text, setText] = useState('');
  const [msg, setMsg] = useState(null);

  useEffect(() => {
    setAssignments(API.getAssignments(true));
  }, []);

  const handleSubmit = () => {
    if (!text.trim()) return;
    const res = API.submitWork(user.id, selected.id, text.trim());
    if (res.success) {
      setMsg({ type: 'success', text: 'Submitted successfully! Waiting for admin review.' });
      setSelected(null);
      setText('');
      onSubmitted && onSubmitted();
    } else {
      setMsg({ type: 'error', text: res.message || 'Error' });
    }
  };

  return (
    <div>
      <h1 style={{ marginBottom: 24 }}>Available Assignments</h1>
      {msg && <div className={`alert alert-${msg.type}`}>{msg.text}</div>}
      <div className="assignment-grid">
        {assignments.map(a => (
          <div key={a.id} className="assignment-card">
            <h3>{a.title}</h3>
            <p>{a.description}</p>
            <div className="max-score">Max Score: {a.maxScore} points</div>
            <button className="btn btn-primary btn-sm" style={{ marginTop: 16 }} onClick={() => setSelected(a)}>
              Submit Work
            </button>
          </div>
        ))}
      </div>

      {selected && (
        <div className="modal-overlay" onClick={() => setSelected(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{selected.title}</h2>
              <button className="btn btn-outline btn-sm" onClick={() => setSelected(null)}>✕</button>
            </div>
            <div className="modal-body">
              <p style={{ marginBottom: 16, color: '#64748b' }}>{selected.description}</p>
              <div className="form-group">
                <label>Your submission</label>
                <textarea rows={8} value={text} onChange={e => setText(e.target.value)} placeholder="Write your answer here..." />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setSelected(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSubmit}>Submit for Review</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function MySubmissions({ user }) {
  const [list, setList] = useState([]);
  useEffect(() => {
    setList(API.getStudentSubmissions(user.id));
  }, [user.id]);

  return (
    <div>
      <h1 style={{ marginBottom: 24 }}>My Submissions</h1>
      <div className="card">
        <div className="card-body" style={{ padding: 0 }}>
          {list.length === 0 ? (
            <div className="empty-state">No submissions yet. Go complete an assignment!</div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Assignment</th>
                  <th>Status</th>
                  <th>Score</th>
                  <th>Submitted</th>
                  <th>Notes</th>
                </tr>
              </thead>
              <tbody>
                {list.map(s => (
                  <tr key={s.id}>
                    <td>{s.assignmentTitle}</td>
                    <td><span className={`badge badge-${s.status.toLowerCase()}`}>{s.status}</span></td>
                    <td>{s.status === 'Graded' ? `+${s.scoreAwarded}` : '—'}</td>
                    <td>{new Date(s.submittedAt).toLocaleDateString()}</td>
                    <td>{s.adminNotes || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

function RewardsPage({ user, onRedeemed }) {
  const [rewards, setRewards] = useState([]);
  const [redemptions, setRedemptions] = useState([]);
  const [msg, setMsg] = useState(null);

  const refresh = () => {
    setRewards(API.getRewards(true));
    setRedemptions(API.getUserRedemptions(user.id));
  };

  useEffect(refresh, [user.id]);

  const handleRedeem = (reward) => {
    if (!confirm(`Redeem "${reward.name}" for ${reward.cost} Overall Score points?\n\nYour current score: ${user.overallScore}\nAfter: ${user.overallScore - reward.cost}`)) return;
    const res = API.redeemReward(user.id, reward.id);
    if (res.success) {
      setMsg({ type: 'success', text: res.message + ` • Remaining: ${res.remainingScore}` });
      onRedeemed(res.remainingScore);
      refresh();
    } else {
      setMsg({ type: 'error', text: res.message });
    }
  };

  return (
    <div>
      <h1 style={{ marginBottom: 8 }}>Redeem Rewards</h1>
      <p style={{ color: '#64748b', marginBottom: 24 }}>Your Overall Score: <strong>{user.overallScore}</strong></p>
      {msg && <div className={`alert alert-${msg.type}`}>{msg.text}</div>}

      <div className="reward-grid">
        {rewards.map(r => (
          <div key={r.id} className="reward-card">
            <h3>{r.name}</h3>
            <p style={{ color: '#64748b', fontSize: 14 }}>{r.description}</p>
            <div className="cost">{r.cost} pts</div>
            <button
              className="btn btn-primary"
              disabled={user.overallScore < r.cost}
              onClick={() => handleRedeem(r)}
            >
              {user.overallScore < r.cost ? 'Not enough points' : 'Redeem'}
            </button>
          </div>
        ))}
      </div>

      <div className="card" style={{ marginTop: 32 }}>
        <div className="card-header"><h2>My Redemption History</h2></div>
        <div className="card-body" style={{ padding: 0 }}>
          {redemptions.length === 0 ? (
            <div className="empty-state">No redemptions yet</div>
          ) : (
            <table>
              <thead>
                <tr><th>Reward</th><th>Cost</th><th>Status</th><th>Date</th></tr>
              </thead>
              <tbody>
                {redemptions.map(r => (
                  <tr key={r.id}>
                    <td>{r.rewardName}</td>
                    <td>−{r.cost}</td>
                    <td><span className={`badge badge-${r.status === 'Fulfilled' ? 'graded' : 'pending'}`}>{r.status}</span></td>
                    <td>{new Date(r.requestedAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

// ---------- Admin components ----------
function AdminDashboard() {
  const stats = API.getDashboardStats();
  return (
    <div>
      <h1 style={{ marginBottom: 24 }}>Admin Dashboard</h1>
      <div className="stats-grid">
        <div className="stat-card"><div className="value">{stats.users}</div><div className="label">Students</div></div>
        <div className="stat-card"><div className="value">{stats.assignments}</div><div className="label">Assignments</div></div>
        <div className="stat-card"><div className="value">{stats.pending}</div><div className="label">Pending Reviews</div></div>
        <div className="stat-card"><div className="value">{stats.rewards}</div><div className="label">Active Rewards</div></div>
      </div>
    </div>
  );
}

function GradingQueue({ onGraded }) {
  const [list, setList] = useState([]);
  const [selected, setSelected] = useState(null);
  const [score, setScore] = useState('');
  const [notes, setNotes] = useState('');
  const [msg, setMsg] = useState(null);

  const refresh = () => setList(API.getPendingSubmissions());
  useEffect(refresh, []);

  const handleGrade = () => {
    const points = Number(score);
    if (isNaN(points) || points < 0) {
      setMsg({ type: 'error', text: 'Enter a valid score' });
      return;
    }
    const res = API.gradeSubmission(selected.id, points, notes);
    if (res.success) {
      setMsg({ type: 'success', text: `Graded! Student now has ${res.newOverallScore} Overall Score` });
      setSelected(null);
      setScore('');
      setNotes('');
      refresh();
      onGraded && onGraded();
    } else {
      setMsg({ type: 'error', text: res.message });
    }
  };

  return (
    <div>
      <h1 style={{ marginBottom: 24 }}>Pending Grading</h1>
      {msg && <div className={`alert alert-${msg.type}`}>{msg.text}</div>}
      <div className="card">
        <div className="card-body" style={{ padding: 0 }}>
          {list.length === 0 ? (
            <div className="empty-state">No pending submissions 🎉</div>
          ) : (
            <table>
              <thead>
                <tr><th>Student</th><th>Assignment</th><th>Submitted</th><th>Action</th></tr>
              </thead>
              <tbody>
                {list.map(s => (
                  <tr key={s.id}>
                    <td>{s.studentName}</td>
                    <td>{s.assignmentTitle}</td>
                    <td>{new Date(s.submittedAt).toLocaleString()}</td>
                    <td>
                      <button className="btn btn-primary btn-sm" onClick={() => { setSelected(s); setScore(s.maxScore); setNotes(''); }}>
                        Grade
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {selected && (
        <div className="modal-overlay" onClick={() => setSelected(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Grade Submission</h2>
              <button className="btn btn-outline btn-sm" onClick={() => setSelected(null)}>✕</button>
            </div>
            <div className="modal-body">
              <p><strong>Student:</strong> {selected.studentName}</p>
              <p><strong>Assignment:</strong> {selected.assignmentTitle} (max {selected.maxScore})</p>
              <div style={{ background: '#f8fafc', padding: 16, borderRadius: 8, margin: '16px 0', whiteSpace: 'pre-wrap' }}>
                {selected.text}
              </div>
              <div className="form-group">
                <label>Score to award (added to Overall Score)</label>
                <input type="number" min="0" max={selected.maxScore * 2} value={score} onChange={e => setScore(e.target.value)} />
              </div>
              <div className="form-group">
                <label>Admin notes (optional)</label>
                <textarea rows={3} value={notes} onChange={e => setNotes(e.target.value)} />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setSelected(null)}>Cancel</button>
              <button className="btn btn-success" onClick={handleGrade}>Award Points & Grade</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ManageAssignments() {
  const [list, setList] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', maxScore: 10 });

  const refresh = () => setList(API.getAssignments(false));
  useEffect(refresh, []);

  const handleAdd = () => {
    if (!form.title.trim()) return;
    API.addAssignment(form);
    setShowForm(false);
    setForm({ title: '', description: '', maxScore: 10 });
    refresh();
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1>Manage Assignments</h1>
        <button className="btn btn-primary" onClick={() => setShowForm(true)}>
          <Icon name="plus" size={16} /> New Assignment
        </button>
      </div>
      <div className="card">
        <div className="card-body" style={{ padding: 0 }}>
          <table>
            <thead>
              <tr><th>Title</th><th>Max Score</th><th>Status</th></tr>
            </thead>
            <tbody>
              {list.map(a => (
                <tr key={a.id}>
                  <td>
                    <strong>{a.title}</strong>
                    <div style={{ fontSize: 13, color: '#64748b' }}>{a.description.slice(0, 80)}…</div>
                  </td>
                  <td>{a.maxScore}</td>
                  <td><span className={`badge ${a.active ? 'badge-active' : 'badge-rejected'}`}>{a.active ? 'Active' : 'Inactive'}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h2>New Assignment</h2></div>
            <div className="modal-body">
              <div className="form-group">
                <label>Title</label>
                <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea rows={4} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Max Score (Overall Score points)</label>
                <input type="number" value={form.maxScore} onChange={e => setForm({ ...form, maxScore: e.target.value })} />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setShowForm(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleAdd}>Create</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function UsersList() {
  const [users, setUsers] = useState([]);
  useEffect(() => setUsers(API.getAllUsers()), []);
  return (
    <div>
      <h1 style={{ marginBottom: 24 }}>Users & Overall Scores</h1>
      <div className="card">
        <div className="card-body" style={{ padding: 0 }}>
          <table>
            <thead>
              <tr><th>Name</th><th>Username</th><th>Role</th><th>Overall Score</th></tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id}>
                  <td>{u.name}</td>
                  <td>{u.username}</td>
                  <td><span className="badge badge-active">{u.role}</span></td>
                  <td><strong>{u.overallScore}</strong></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ---------- Main App ----------
function App() {
  const [user, setUser] = useState(null);
  const [page, setPage] = useState('dashboard');

  const refreshUser = useCallback(() => {
    if (user) {
      const fresh = API.getUser(user.id);
      if (fresh) setUser(fresh);
    }
  }, [user]);

  const handleLogin = (u) => {
    setUser(u);
    setPage('dashboard');
  };

  const handleLogout = () => {
    setUser(null);
    setPage('dashboard');
  };

  if (!user) return <Login onLogin={handleLogin} />;

  const content = () => {
    if (user.role === 'admin') {
      switch (page) {
        case 'dashboard': return <AdminDashboard />;
        case 'grading': return <GradingQueue onGraded={refreshUser} />;
        case 'assignments': return <ManageAssignments />;
        case 'users': return <UsersList />;
        case 'rewards': return <RewardsPage user={user} onRedeemed={() => {}} />; // admin view limited
        default: return <AdminDashboard />;
      }
    } else {
      switch (page) {
        case 'dashboard': return <StudentDashboard user={user} />;
        case 'assignments': return <AssignmentsList user={user} onSubmitted={refreshUser} />;
        case 'my-work': return <MySubmissions user={user} />;
        case 'rewards': return <RewardsPage user={user} onRedeemed={(newScore) => setUser({ ...user, overallScore: newScore })} />;
        default: return <StudentDashboard user={user} />;
      }
    }
  };

  return (
    <div>
      <Header user={user} onLogout={handleLogout} onRefreshUser={refreshUser} />
      <div className="layout">
        <Sidebar role={user.role} active={page} onNav={setPage} />
        <main className="main">{content()}</main>
      </div>
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
