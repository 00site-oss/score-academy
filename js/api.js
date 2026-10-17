// Mock API – replace with google.script.run when deploying with Code.gs + Sheets

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
    return structuredClone(defaultData);
  }
  return JSON.parse(raw);
}

function save(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function nextId(arr) {
  return arr.reduce((m, i) => Math.max(m, i.id || 0), 0) + 1;
}

// ---------- Auth ----------
export function login(username, password) {
  const data = load();
  const user = data.users.find(u => u.username === username && u.password === password);
  if (!user) return { success: false, message: 'Invalid username or password' };
  const { password: _, ...safe } = user;
  return { success: true, user: safe };
}

// ---------- Users ----------
export function getUser(userId) {
  const data = load();
  const user = data.users.find(u => u.id === userId);
  if (!user) return null;
  const { password: _, ...safe } = user;
  return safe;
}

export function getAllUsers() {
  return load().users.map(({ password, ...u }) => u);
}

// ---------- Assignments ----------
export function getAssignments(activeOnly = false) {
  let list = load().assignments;
  if (activeOnly) list = list.filter(a => a.active);
  return list;
}

export function addAssignment({ title, description, maxScore }) {
  const data = load();
  const id = nextId(data.assignments);
  data.assignments.push({ id, title, description, maxScore: Number(maxScore) || 10, dueDate: '', active: true });
  save(data);
  return { success: true, id };
}

// ---------- Submissions ----------
export function submitWork(userId, assignmentId, text) {
  const data = load();
  const id = nextId(data.submissions);
  data.submissions.push({
    id,
    assignmentId: Number(assignmentId),
    userId: Number(userId),
    text,
    status: 'Pending',
    scoreAwarded: 0,
    submittedAt: new Date().toISOString(),
    gradedAt: '',
    adminNotes: ''
  });
  save(data);
  return { success: true, id };
}

export function getPendingSubmissions() {
  const data = load();
  return data.submissions
    .filter(s => s.status === 'Pending')
    .map(s => {
      const user = data.users.find(u => u.id === s.userId);
      const assignment = data.assignments.find(a => a.id === s.assignmentId);
      return {
        ...s,
        studentName: user?.name || 'Unknown',
        assignmentTitle: assignment?.title || 'Unknown',
        maxScore: assignment?.maxScore || 0
      };
    });
}

export function getStudentSubmissions(userId) {
  const data = load();
  return data.submissions
    .filter(s => s.userId === Number(userId))
    .map(s => {
      const assignment = data.assignments.find(a => a.id === s.assignmentId);
      return { ...s, assignmentTitle: assignment?.title || 'Unknown' };
    })
    .sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));
}

export function gradeSubmission(submissionId, scoreAwarded, adminNotes = '') {
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
}

// ---------- Rewards ----------
export function getRewards(activeOnly = true) {
  let list = load().rewards;
  if (activeOnly) list = list.filter(r => r.active);
  return list;
}

export function redeemReward(userId, rewardId) {
  const data = load();
  const user = data.users.find(u => u.id === Number(userId));
  const reward = data.rewards.find(r => r.id === Number(rewardId) && r.active);

  if (!user) return { success: false, message: 'User not found' };
  if (!reward) return { success: false, message: 'Reward not available' };

  if (user.overallScore < reward.cost) {
    return {
      success: false,
      message: `Not enough Overall Score. You have ${user.overallScore}, need ${reward.cost}`
    };
  }

  // Exact calculation requested: Overall Score − cost
  user.overallScore = user.overallScore - reward.cost;

  const id = nextId(data.redemptions);
  data.redemptions.push({
    id,
    userId: user.id,
    rewardId: reward.id,
    cost: reward.cost,
    status: 'Pending',
    requestedAt: new Date().toISOString(),
    fulfilledAt: '',
    notes: ''
  });

  save(data);
  return {
    success: true,
    message: `Successfully redeemed "${reward.name}" for ${reward.cost} points`,
    remainingScore: user.overallScore
  };
}

export function getUserRedemptions(userId) {
  const data = load();
  return data.redemptions
    .filter(r => r.userId === Number(userId))
    .map(r => {
      const reward = data.rewards.find(rw => rw.id === r.rewardId);
      return { ...r, rewardName: reward?.name || 'Reward' };
    })
    .sort((a, b) => new Date(b.requestedAt) - new Date(a.requestedAt));
}

export function getDashboardStats() {
  const data = load();
  return {
    users: data.users.filter(u => u.role === 'student').length,
    assignments: data.assignments.length,
    pending: data.submissions.filter(s => s.status === 'Pending').length,
    rewards: data.rewards.filter(r => r.active).length
  };
}

// Reset demo data
export function resetDemo() {
  localStorage.removeItem(STORAGE_KEY);
  return load();
}
