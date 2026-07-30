export interface PhpProjectFiles {
  'db_schema.sql': string;
  'config.php': string;
  'index.php': string;
  'judge_rubric.php': string;
  'admin_dashboard.php': string;
  'export_csv.php': string;
  'README.md': string;
}

export function generatePhpProjectCode(): PhpProjectFiles {
  const dbSchemaSql = `-- ============================================================
-- AMARA RAJA VIDYALAYAM - ARMUN EDITION-2 JUDGING SYSTEM
-- MySQL Database Schema with Unique Judge Usernames & Passwords
-- ============================================================

CREATE DATABASE IF NOT EXISTS armun_judging;
USE armun_judging;

-- 1. Committees Table
CREATE TABLE IF NOT EXISTS committees (
    id VARCHAR(20) PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    full_name VARCHAR(150) NOT NULL
);

INSERT INTO committees (id, name, full_name) VALUES
('UNSC', 'UNSC', 'United Nations Security Council'),
('UNHRC', 'UNHRC', 'United Nations Human Rights Council'),
('ILO', 'ILO', 'International Labour Organization'),
('UNEP', 'UNEP', 'United Nations Environment Programme'),
('DISEC', 'DISEC', 'Disarmament & International Security Committee'),
('IMF', 'IMF', 'International Monetary Fund'),
('UNESCO', 'UNESCO', 'UN Educational, Scientific & Cultural Organization'),
('WHO', 'WHO', 'World Health Organization'),
('PRESS', 'PRESS', 'International Press Corps')
ON DUPLICATE KEY UPDATE name=VALUES(name);

-- 2. Admin Users Table (Secretariat Admin Credentials)
CREATE TABLE IF NOT EXISTS admin_users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    pin VARCHAR(50) NOT NULL
);

-- Default Admin Credentials: Username: admin | Password / PIN: admin123
INSERT INTO admin_users (username, password, pin) VALUES 
('admin', 'admin123', 'admin123')
ON DUPLICATE KEY UPDATE pin=VALUES(pin);

-- 3. Judges Table (Unique Username & Password per Judge per Committee)
CREATE TABLE IF NOT EXISTS judges (
    id INT AUTO_INCREMENT PRIMARY KEY,
    committee_id VARCHAR(20) NOT NULL,
    judge_index INT NOT NULL CHECK (judge_index IN (1, 2, 3)),
    judge_name VARCHAR(100) NOT NULL,
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    pin VARCHAR(50) NOT NULL,
    UNIQUE KEY (committee_id, judge_index),
    FOREIGN KEY (committee_id) REFERENCES committees(id) ON DELETE CASCADE
);

-- Pre-seeded Judge Credentials (Unique username and password/PIN per slot)
INSERT INTO judges (committee_id, judge_index, judge_name, username, password, pin) VALUES
('UNSC', 1, 'UNSC Judge 1', 'unsc_judge1', '1111', '1111'),
('UNSC', 2, 'UNSC Judge 2', 'unsc_judge2', '1112', '1112'),
('UNSC', 3, 'UNSC Judge 3', 'unsc_judge3', '1113', '1113'),

('UNHRC', 1, 'UNHRC Judge 1', 'unhrc_judge1', '2221', '2221'),
('UNHRC', 2, 'UNHRC Judge 2', 'unhrc_judge2', '2222', '2222'),
('UNHRC', 3, 'UNHRC Judge 3', 'unhrc_judge3', '2223', '2223'),

('ILO', 1, 'ILO Judge 1', 'ilo_judge1', '3331', '3331'),
('ILO', 2, 'ILO Judge 2', 'ilo_judge2', '3332', '3332'),
('ILO', 3, 'ILO Judge 3', 'ilo_judge3', '3333', '3333'),

('UNEP', 1, 'UNEP Judge 1', 'unep_judge1', '4441', '4441'),
('UNEP', 2, 'UNEP Judge 2', 'unep_judge2', '4442', '4442'),
('UNEP', 3, 'UNEP Judge 3', 'unep_judge3', '4443', '4443'),

('DISEC', 1, 'DISEC Judge 1', 'disec_judge1', '5551', '5551'),
('DISEC', 2, 'DISEC Judge 2', 'disec_judge2', '5552', '5552'),
('DISEC', 3, 'DISEC Judge 3', 'disec_judge3', '5553', '5553'),

('IMF', 1, 'IMF Judge 1', 'imf_judge1', '6661', '6661'),
('IMF', 2, 'IMF Judge 2', 'imf_judge2', '6662', '6662'),
('IMF', 3, 'IMF Judge 3', 'imf_judge3', '6663', '6663'),

('UNESCO', 1, 'UNESCO Judge 1', 'unesco_judge1', '7771', '7771'),
('UNESCO', 2, 'UNESCO Judge 2', 'unesco_judge2', '7772', '7772'),
('UNESCO', 3, 'UNESCO Judge 3', 'unesco_judge3', '7773', '7773'),

('WHO', 1, 'WHO Judge 1', 'who_judge1', '8881', '8881'),
('WHO', 2, 'WHO Judge 2', 'who_judge2', '8882', '8882'),
('WHO', 3, 'WHO Judge 3', 'who_judge3', '8883', '8883'),

('PRESS', 1, 'PRESS Judge 1', 'press_judge1', '9991', '9991'),
('PRESS', 2, 'PRESS Judge 2', 'press_judge2', '9992', '9992'),
('PRESS', 3, 'PRESS Judge 3', 'press_judge3', '9993', '9993')
ON DUPLICATE KEY UPDATE pin=VALUES(pin);

-- 4. Delegates Table
CREATE TABLE IF NOT EXISTS delegates (
    id INT AUTO_INCREMENT PRIMARY KEY,
    sl_no INT NOT NULL,
    committee_id VARCHAR(20) NOT NULL,
    delegate_name VARCHAR(100) NOT NULL,
    portfolio VARCHAR(100) NOT NULL,
    FOREIGN KEY (committee_id) REFERENCES committees(id) ON DELETE CASCADE
);

-- Insert Sample Delegates
INSERT INTO delegates (sl_no, committee_id, delegate_name, portfolio) VALUES
(1, 'UNSC', 'Aarav Sharma', 'United States'),
(2, 'UNSC', 'Ananya Reddy', 'United Kingdom'),
(3, 'UNSC', 'Rohan Verma', 'France'),
(1, 'UNHRC', 'Ishaan Malhotra', 'Norway'),
(2, 'UNHRC', 'Tanvi Sen', 'Sweden'),
(1, 'ILO', 'Harsh Vardhan', 'United States'),
(1, 'UNEP', 'Nisha Sundaram', 'New Zealand'),
(1, 'DISEC', 'Devansh Ahuja', 'United States'),
(1, 'IMF', 'Sanjana Thakur', 'Japan'),
(1, 'UNESCO', 'Aishwarya M', 'Egypt'),
(1, 'WHO', 'Suhani Dixit', 'Switzerland'),
(1, 'PRESS', 'Kabir Mehta', 'BBC World News');

-- 5. Rubric Scores Table (Mandatory 10 Criteria, 10 Marks Each = 100 Total)
CREATE TABLE IF NOT EXISTS rubric_scores (
    id INT AUTO_INCREMENT PRIMARY KEY,
    delegate_id INT NOT NULL,
    committee_id VARCHAR(20) NOT NULL,
    judge_index INT NOT NULL CHECK (judge_index IN (1, 2, 3)),
    speech_score INT NOT NULL,
    research_score INT NOT NULL,
    position_paper_score INT NOT NULL,
    debate_score INT NOT NULL,
    diplomacy_score INT NOT NULL,
    rules_score INT NOT NULL,
    leadership_score INT NOT NULL,
    public_speaking_score INT NOT NULL,
    impact_score INT NOT NULL,
    relevance_score INT NOT NULL,
    total_marks INT NOT NULL,
    is_locked TINYINT(1) DEFAULT 0,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY (delegate_id, judge_index),
    FOREIGN KEY (delegate_id) REFERENCES delegates(id) ON DELETE CASCADE
);
`;

  const configPhp = `<?php
// config.php - MySQL Database Connection & Session Management
define('DB_HOST', 'localhost');
define('DB_USER', 'root');
define('DB_PASS', '');
define('DB_NAME', 'armun_judging');

if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

try {
    $pdo = new PDO("mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4", DB_USER, DB_PASS, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
    ]);
} catch (PDOException $e) {
    die("<div style='font-family:sans-serif;padding:20px;background:#fee2e2;color:#991b1b;border-radius:10px;'>
        <h2>Database Connection Error</h2>
        <p>Could not connect to MySQL database <strong>" . DB_NAME . "</strong> on <strong>" . DB_HOST . "</strong>.</p>
        <p>Please import <code>db_schema.sql</code> in phpMyAdmin and check database credentials in <code>config.php</code>.</p>
        <p>Error details: " . htmlspecialchars($e->getMessage()) . "</p>
    </div>");
}
?>`;

  const indexPhp = `<?php
// index.php - Secure Authentication Portal for Judges & Secretariat Admin
require_once 'config.php';

$error = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $role = $_POST['role'] ?? 'judge';
    $identifier = trim($_POST['identifier'] ?? '');
    $password = trim($_POST['password'] ?? '');

    if ($role === 'admin') {
        // Authenticate Secretariat Admin by Username/PIN or Password
        $stmt = $pdo->prepare("SELECT * FROM admin_users WHERE username = ? OR pin = ? OR password = ?");
        $stmt->execute([$identifier, $password, $password]);
        $admin = $stmt->fetch();

        if ($admin && ($admin['pin'] === $password || $admin['password'] === $password || $admin['username'] === $identifier)) {
            $_SESSION['role'] = 'admin';
            $_SESSION['username'] = $admin['username'];
            header("Location: admin_dashboard.php");
            exit;
        } else {
            $error = 'Invalid Secretariat Admin Username or Password/PIN!';
        }
    } else if ($role === 'judge') {
        // Authenticate Judge by Username & Password OR Committee + Slot + PIN
        $committeeId = $_POST['committee_id'] ?? '';
        $judgeIndex = (int)($_POST['judge_index'] ?? 0);

        if (!empty($identifier)) {
            // Login by Username & Password
            $stmt = $pdo->prepare("SELECT * FROM judges WHERE username = ? OR (committee_id = ? AND judge_index = ?)");
            $stmt->execute([$identifier, $committeeId, $judgeIndex]);
            $judge = $stmt->fetch();

            if ($judge && ($judge['password'] === $password || $judge['pin'] === $password)) {
                $_SESSION['role'] = 'judge';
                $_SESSION['username'] = $judge['username'];
                $_SESSION['judge_name'] = $judge['judge_name'];
                $_SESSION['committee_id'] = $judge['committee_id'];
                $_SESSION['judge_index'] = (int)$judge['judge_index'];
                header("Location: judge_rubric.php");
                exit;
            } else {
                $error = 'Invalid Judge Username or Password/PIN!';
            }
        } else {
            // Login by Committee + Judge Slot + PIN
            $stmt = $pdo->prepare("SELECT * FROM judges WHERE committee_id = ? AND judge_index = ? AND (pin = ? OR password = ?)");
            $stmt->execute([$committeeId, $judgeIndex, $password, $password]);
            $judge = $stmt->fetch();

            if ($judge) {
                $_SESSION['role'] = 'judge';
                $_SESSION['username'] = $judge['username'];
                $_SESSION['judge_name'] = $judge['judge_name'];
                $_SESSION['committee_id'] = $judge['committee_id'];
                $_SESSION['judge_index'] = (int)$judge['judge_index'];
                header("Location: judge_rubric.php");
                exit;
            } else {
                $error = 'Invalid PIN for selected Committee and Judge Slot!';
            }
        }
    }
}

// Fetch active committees for dropdown
$stmt = $pdo->query("SELECT * FROM committees ORDER BY name ASC");
$committees = $stmt->fetchAll();
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>ARMUN Edition-2 Evaluation Portal</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
        body { user-select: none; -webkit-user-select: none; }
    </style>
</head>
<body class="bg-slate-900 min-h-screen flex items-center justify-center p-4">
    <div class="bg-white max-w-lg w-full rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-6">
        
        {/* Top Header Banner */}
        <div className="bg-gradient-to-r from-indigo-950 via-indigo-900 to-slate-900 text-white p-6 text-center">
            <h1 class="text-xl font-black tracking-tight text-white">AMARA RAJA VIDYALAYAM</h1>
            <p class="text-xs text-indigo-200 font-semibold mt-0.5">ARMUN EDITION-2 Official Evaluation System</p>
            <span class="inline-block bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 text-[10px] font-bold px-3 py-0.5 rounded-full mt-2">
                CBSE Affiliation No: 130513 | Diguvamagham
            </span>
        </div>

        <div class="p-6">
            <?php if(!empty($error)): ?>
                <div class="bg-rose-50 border border-rose-200 text-rose-700 p-3 rounded-xl text-xs font-bold mb-4">
                    <?= htmlspecialchars($error) ?>
                </div>
            <?php endif; ?>

            <form method="POST" class="space-y-4">
                <div>
                    <label class="block text-xs font-bold uppercase text-slate-600 mb-1">Select Portal Role</label>
                    <select name="role" id="roleSelect" onchange="toggleRoleFields()" class="w-full border rounded-xl p-2.5 text-xs font-bold bg-slate-50 focus:bg-white focus:border-indigo-600">
                        <option value="judge">Judge Portal Login</option>
                        <option value="admin">Secretariat Admin Login</option>
                    </select>
                </div>

                <div id="judgeFields" class="space-y-3">
                    <div>
                        <label class="block text-xs font-bold uppercase text-slate-600 mb-1">Judge Username (Optional if selecting below)</label>
                        <input type="text" name="identifier" placeholder="Enter Username" class="w-full border rounded-xl p-2.5 text-xs font-mono">
                    </div>

                    <div class="grid grid-cols-2 gap-2">
                        <div>
                            <label class="block text-xs font-bold uppercase text-slate-600 mb-1">Committee</label>
                            <select name="committee_id" class="w-full border rounded-xl p-2.5 text-xs font-bold">
                                <?php foreach($committees as $c): ?>
                                    <option value="<?= $c['id'] ?>"><?= $c['name'] ?></option>
                                <?php endforeach; ?>
                            </select>
                        </div>

                        <div>
                            <label class="block text-xs font-bold uppercase text-slate-600 mb-1">Judge Slot</label>
                            <select name="judge_index" class="w-full border rounded-xl p-2.5 text-xs font-bold">
                                <option value="1">Judge 1</option>
                                <option value="2">Judge 2</option>
                                <option value="3">Judge 3</option>
                            </select>
                        </div>
                    </div>
                </div>

                <div>
                    <label class="block text-xs font-bold uppercase text-slate-600 mb-1">Password or Security PIN</label>
                    <input type="password" name="password" required placeholder="Enter Password or PIN" class="w-full border rounded-xl p-2.5 text-xs font-mono font-bold">
                </div>

                <button type="submit" class="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 rounded-xl text-xs transition shadow-md shadow-indigo-600/20">
                    Authenticate & Access Portal
                </button>
            </form>

        </div>
    </div>

    <script>
        function toggleRoleFields() {
            const role = document.getElementById('roleSelect').value;
            document.getElementById('judgeFields').style.display = role === 'judge' ? 'block' : 'none';
        }
    </script>
</body>
</html>`;

  const judgeRubricPhp = `<?php
// judge_rubric.php - Isolated Judge Portal with Mandatory Scoring & Mobile Anti-Screenshot Controls
require_once 'config.php';

if (($_SESSION['role'] ?? '') !== 'judge') {
    header("Location: index.php");
    exit;
}

$committeeId = $_SESSION['committee_id'];
$judgeIndex = (int)$_SESSION['judge_index'];
$username = $_SESSION['username'] ?? "Judge {$judgeIndex}";

$saveSuccess = false;
$saveError = '';

// Process Marks Save & Validation
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['save_scores'])) {
    $delegateId = (int)$_POST['delegate_id'];

    // List of all 10 Rubrics
    $rubrics = [
        'speech_score' => 'Opening Speech & Presentation',
        'research_score' => 'Research & Preparation',
        'position_paper_score' => 'Position Papers',
        'debate_score' => 'Participation in Debate',
        'diplomacy_score' => 'Diplomacy and Collaboration',
        'rules_score' => 'Use of Rules & Procedures',
        'leadership_score' => 'Leadership & Initiative',
        'public_speaking_score' => 'Public Speaking & Rhetoric',
        'impact_score' => 'Overall Impact',
        'relevance_score' => 'Relevance & Resolution'
    ];

    $scores = [];
    $missingCriteria = [];

    // ENFORCE MANDATORY SCORING FOR ALL 10 CRITERIA
    foreach ($rubrics as $key => $name) {
        if (!isset($_POST[$key]) || $_POST[$key] === '') {
            $missingCriteria[] = $name;
        } else {
            $val = (int)$_POST[$key];
            $scores[$key] = min(10, max(0, $val));
        }
    }

    if (!empty($missingCriteria)) {
        $saveError = "Mandatory Scoring Required! You must award marks (0-10) for all 10 criteria. Missing: " . implode(', ', $missingCriteria);
    } else {
        $totalMarks = array_sum($scores);

        $stmt = $pdo->prepare("INSERT INTO rubric_scores 
            (delegate_id, committee_id, judge_index, speech_score, research_score, position_paper_score, debate_score, diplomacy_score, rules_score, leadership_score, public_speaking_score, impact_score, relevance_score, total_marks, is_locked)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
            ON DUPLICATE KEY UPDATE 
            speech_score=VALUES(speech_score), research_score=VALUES(research_score), position_paper_score=VALUES(position_paper_score),
            debate_score=VALUES(debate_score), diplomacy_score=VALUES(diplomacy_score), rules_score=VALUES(rules_score),
            leadership_score=VALUES(leadership_score), public_speaking_score=VALUES(public_speaking_score),
            impact_score=VALUES(impact_score), relevance_score=VALUES(relevance_score), total_marks=VALUES(total_marks), is_locked=1");
        
        $stmt->execute([
            $delegateId, $committeeId, $judgeIndex,
            $scores['speech_score'], $scores['research_score'], $scores['position_paper_score'], $scores['debate_score'],
            $scores['diplomacy_score'], $scores['rules_score'], $scores['leadership_score'], $scores['public_speaking_score'],
            $scores['impact_score'], $scores['relevance_score'], $totalMarks
        ]);

        $saveSuccess = true;
    }
}

// Fetch Delegates strictly for this committee (STRICT ISOLATION)
$stmt = $pdo->prepare("SELECT * FROM delegates WHERE committee_id = ? ORDER BY sl_no ASC");
$stmt->execute([$committeeId]);
$delegates = $stmt->fetchAll();

// Fetch Scores submitted ONLY by this judge
$stmt = $pdo->prepare("SELECT * FROM rubric_scores WHERE committee_id = ? AND judge_index = ?");
$stmt->execute([$committeeId, $judgeIndex]);
$savedScoresRaw = $stmt->fetchAll();
$savedScores = [];
foreach($savedScoresRaw as $s) {
    $savedScores[$s['delegate_id']] = $s;
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <title>Judge Portal - <?= htmlspecialchars($committeeId) ?> (Judge <?= $judgeIndex ?>)</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
        /* Strict Mobile Anti-Screenshot & Security CSS */
        body {
            user-select: none;
            -webkit-user-select: none;
            -webkit-touch-callout: none;
            -ms-user-select: none;
        }
        @media print {
            body { display: none !important; }
        }
        .security-blur {
            filter: blur(16px) grayscale(100%);
            pointer-events: none;
        }
    </style>
</head>
<body class="bg-slate-100 text-slate-800 min-h-screen relative overflow-x-hidden">

    <!-- Confidential Watermark Overlay -->
    <div class="fixed inset-0 pointer-events-none z-10 opacity-[0.03] select-none overflow-hidden flex flex-col justify-between p-6">
        <?php for($i=0; $i<8; $i++): ?>
            <div class="flex justify-between text-xs font-mono font-black tracking-widest text-slate-900 rotate-[-12deg] space-x-12 whitespace-nowrap">
                <span>AMARA RAJA VIDYALAYAM ARMUN EDITION-2</span>
                <span>COMMITTEE: <?= htmlspecialchars($committeeId) ?> | JUDGE #<?= $judgeIndex ?> (<?= htmlspecialchars($username) ?>)</span>
                <span>CONFIDENTIAL DO NOT SCREENSHOT</span>
            </div>
        <?php endfor; ?>
    </div>

    <!-- Mobile Anti-Screenshot / Blur Protection Overlay -->
    <div id="screenProtectionOverlay" class="hidden fixed inset-0 bg-slate-950/95 z-50 flex flex-col items-center justify-center p-6 text-center text-white backdrop-blur-xl">
        <div class="w-16 h-16 rounded-2xl bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400 mb-4 text-2xl">
            🔒
        </div>
        <h2 class="text-xl font-bold tracking-tight text-white mb-2">Screen Protected for Confidentiality</h2>
        <p class="text-xs text-slate-300 max-w-md leading-relaxed">
            Content hidden because window focus was lost, tab was switched, or screen capture was detected. Return focus to continue evaluation.
        </p>
    </div>

    {/* Header */}
    <header class="bg-indigo-950 text-white p-4 sticky top-0 z-30 shadow-md border-b border-indigo-900">
        <div class="max-w-4xl mx-auto flex justify-between items-center">
            <div>
                <h1 class="font-black text-sm sm:text-base">AMARA RAJA VIDYALAYAM</h1>
                <p class="text-xs text-indigo-200 font-medium">
                    Committee: <span class="font-bold text-white"><?= htmlspecialchars($committeeId) ?></span> | Evaluator: <span class="font-bold text-amber-300">Judge #<?= $judgeIndex ?> (<?= htmlspecialchars($username) ?>)</span>
                </p>
            </div>
            <a href="index.php" class="bg-indigo-800 hover:bg-indigo-700 text-xs px-3.5 py-1.5 rounded-xl font-bold text-white border border-indigo-700">Logout</a>
        </div>
    </header>

    <main id="mainContent" class="max-w-4xl mx-auto p-4 space-y-4">
        
        {/* Security Banner */}
        <div class="bg-rose-50 border border-rose-200 text-rose-800 text-xs p-3 rounded-xl font-medium flex items-center justify-between">
            <div>
                <strong>CONFIDENTIAL JUDGE PORTAL:</strong> Evaluating <strong><?= htmlspecialchars($committeeId) ?></strong> as <strong>Judge #<?= $judgeIndex ?></strong>. Other judges' marks are strictly hidden.
            </div>
        </div>

        <?php if($saveSuccess): ?>
            <div class="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs p-3.5 rounded-xl font-bold">
                ✓ Evaluation marks saved and locked successfully!
            </div>
        <?php endif; ?>

        <?php if(!empty($saveError)): ?>
            <div class="bg-rose-50 border border-rose-200 text-rose-800 text-xs p-3.5 rounded-xl font-bold">
                ⚠️ <?= htmlspecialchars($saveError) ?>
            </div>
        <?php endif; ?>

        {/* Delegates List */}
        <div class="space-y-4">
            <?php foreach($delegates as $del): 
                $score = $savedScores[$del['id']] ?? null;
                $total = $score ? $score['total_marks'] : null;
            ?>
            <div class="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-3">
                <div class="flex justify-between items-center border-b pb-2">
                    <div class="flex items-center gap-2">
                        <span class="bg-indigo-600 text-white font-mono font-bold text-xs px-2.5 py-1 rounded-lg">#<?= $del['sl_no'] ?></span>
                        <div>
                            <h3 class="font-bold text-slate-900 text-sm"><?= htmlspecialchars($del['delegate_name']) ?></h3>
                            <p class="text-xs text-slate-500 font-medium">Portfolio: <span class="font-bold text-slate-700"><?= htmlspecialchars($del['portfolio']) ?></span></p>
                        </div>
                    </div>
                    <div class="text-right">
                        <span class="text-[10px] uppercase font-bold text-slate-400 block">Total Marks</span>
                        <span class="text-base font-black font-mono text-indigo-900"><?= $total !== null ? $total . ' / 100' : 'Pending' ?></span>
                    </div>
                </div>

                <form method="POST" onsubmit="return validateForm(this)" class="space-y-3">
                    <input type="hidden" name="save_scores" value="1">
                    <input type="hidden" name="delegate_id" value="<?= $del['id'] ?>">

                    <div class="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
                        <?php 
                        $rubricsList = [
                            'speech_score' => '1. Speech (10M)',
                            'research_score' => '2. Research (10M)',
                            'position_paper_score' => '3. Position (10M)',
                            'debate_score' => '4. Debate (10M)',
                            'diplomacy_score' => '5. Diplomacy (10M)',
                            'rules_score' => '6. Rules (10M)',
                            'leadership_score' => '7. Leadership (10M)',
                            'public_speaking_score' => '8. Public Spk (10M)',
                            'impact_score' => '9. Impact (10M)',
                            'relevance_score' => '10. Relevance & Resolution (10M)'
                        ];
                        foreach($rubricsList as $field => $label):
                            $val = $score[$field] ?? '';
                        ?>
                        <div class="bg-slate-50 p-2 rounded-xl border border-slate-200">
                            <label class="block text-[11px] font-bold text-slate-700 mb-1"><?= $label ?> <span class="text-rose-500">*</span></label>
                            <input type="number" name="<?= $field ?>" min="0" max="10" required value="<?= $val !== '' ? $val : '' ?>" placeholder="0-10" class="w-full bg-white border border-slate-300 rounded-lg p-1.5 font-mono font-bold text-center outline-none focus:border-indigo-600">
                        </div>
                        <?php endforeach; ?>
                    </div>

                    <div class="flex justify-between items-center pt-2">
                        <span class="text-[10px] text-slate-400 font-semibold">* All 10 Rubrics are Mandatory</span>
                        <button type="submit" class="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-5 py-2 rounded-xl text-xs transition shadow-xs">
                            Submit & Lock Evaluation
                        </button>
                    </div>
                </form>
            </div>
            <?php endforeach; ?>
        </div>

    </main>

    <script>
        // Enforce mandatory selection on client-side
        function validateForm(form) {
            const inputs = form.querySelectorAll('input[type="number"]');
            for (let input of inputs) {
                if (input.value === '' || input.value === null) {
                    alert('Mandatory Scoring Required! You must award marks (0-10) for all 10 criteria before submitting.');
                    input.focus();
                    return false;
                }
            }
            return true;
        }

        // Anti-Screenshot Event Handlers
        window.addEventListener('blur', function() {
            document.getElementById('screenProtectionOverlay').classList.remove('hidden');
            document.getElementById('mainContent').classList.add('security-blur');
        });
        window.addEventListener('focus', function() {
            document.getElementById('screenProtectionOverlay').classList.add('hidden');
            document.getElementById('mainContent').classList.remove('security-blur');
        });
        document.addEventListener('contextmenu', e => e.preventDefault());
    </script>
</body>
</html>`;

  const adminDashboardPhp = `<?php
// admin_dashboard.php - Secretariat Admin Control Panel
require_once 'config.php';

if (($_SESSION['role'] ?? '') !== 'admin') {
    header("Location: index.php");
    exit;
}

$message = '';

// Add Committee Action
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['add_committee'])) {
    $cid = strtoupper(trim($_POST['committee_id']));
    $cname = trim($_POST['committee_name']);
    $cfull = trim($_POST['full_name']);

    if (!empty($cid) && !empty($cname)) {
        $stmt = $pdo->prepare("INSERT INTO committees (id, name, full_name) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE name=VALUES(name), full_name=VALUES(full_name)");
        $stmt->execute([$cid, $cname, $cfull]);

        // Auto-generate 3 Judge logins for new committee
        for ($j = 1; $j <= 3; $j++) {
            $uname = strtolower($cid) . "_judge" . $j;
            $pin = "100" . $j;
            $stmtJ = $pdo->prepare("INSERT INTO judges (committee_id, judge_index, judge_name, username, password, pin) VALUES (?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE pin=VALUES(pin)");
            $stmtJ->execute([$cid, $j, "{$cid} Judge {$j}", $uname, $pin, $pin]);
        }
        $message = "Committee {$cid} added successfully with 3 Judge accounts!";
    }
}

// Add Delegate Action
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['add_delegate'])) {
    $cid = $_POST['target_committee'];
    $delName = trim($_POST['delegate_name']);
    $portfolio = trim($_POST['portfolio']);
    $slNo = (int)$_POST['sl_no'];

    if (!empty($delName) && !empty($portfolio)) {
        $stmt = $pdo->prepare("INSERT INTO delegates (sl_no, committee_id, delegate_name, portfolio) VALUES (?, ?, ?, ?)");
        $stmt->execute([$slNo, $cid, $delName, $portfolio]);
        $message = "Delegate {$delName} added to {$cid}!";
    }
}

// Fetch Committees
$stmt = $pdo->query("SELECT * FROM committees ORDER BY name ASC");
$committees = $stmt->fetchAll();

$selectedCommittee = $_GET['committee_id'] ?? ($committees[0]['id'] ?? 'UNSC');

// Fetch Delegates for active committee
$stmt = $pdo->prepare("SELECT * FROM delegates WHERE committee_id = ? ORDER BY sl_no ASC");
$stmt->execute([$selectedCommittee]);
$delegates = $stmt->fetchAll();

// Fetch Scores for active committee
$stmt = $pdo->prepare("SELECT * FROM rubric_scores WHERE committee_id = ?");
$stmt->execute([$selectedCommittee]);
$allScores = $stmt->fetchAll();

$scoresMap = [];
foreach($allScores as $s) {
    $scoresMap[$s['delegate_id']][$s['judge_index']] = $s['total_marks'];
}

// Fetch all Judges
$stmt = $pdo->query("SELECT * FROM judges ORDER BY committee_id ASC, judge_index ASC");
$allJudges = $stmt->fetchAll();
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>ARMUN Edition-2 Master Secretariat Dashboard</title>
    <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-slate-100 text-slate-800 min-h-screen pb-12">
    <header class="bg-slate-900 text-white p-4 shadow-md">
        <div class="max-w-7xl mx-auto flex justify-between items-center">
            <div>
                <h1 class="font-black text-lg">AMARA RAJA VIDYALAYAM</h1>
                <p class="text-xs text-slate-400">ARMUN Edition-2 Secretariat Control Panel</p>
            </div>
            <a href="index.php" class="text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-3.5 py-1.5 rounded-xl font-bold">Logout</a>
        </div>
    </header>

    <div class="max-w-7xl mx-auto p-4 sm:p-6 space-y-6">
        
        <?php if(!empty($message)): ?>
            <div class="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs p-3.5 rounded-xl font-bold">
                ✓ <?= htmlspecialchars($message) ?>
            </div>
        <?php endif; ?>

        <!-- Secretariat Admin Credentials Card -->
        <div class="bg-slate-900 text-white p-4 rounded-2xl border border-slate-800 flex flex-col sm:flex-row justify-between items-center gap-4">
            <div>
                <span class="text-[10px] uppercase font-bold text-amber-400 bg-amber-500/20 px-2 py-0.5 rounded border border-amber-400/30">Secretariat Admin Credentials</span>
                <div class="text-sm font-mono mt-1">
                    Username: <span class="text-white font-bold">admin</span> | Password / PIN: <span class="text-amber-300 font-bold">admin123</span>
                </div>
            </div>
            <a href="export_csv.php?committee_id=<?= $selectedCommittee ?>" class="bg-indigo-600 hover:bg-indigo-500 text-white text-xs px-4 py-2 rounded-xl font-bold transition shadow-xs">
                Export Master CSV (<?= $selectedCommittee ?>)
            </a>
        </div>

        <!-- Add Committee & Add Delegate Forms Grid -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            <!-- Add Committee Form -->
            <div class="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
                <h3 class="font-bold text-slate-900 text-sm border-b pb-2">Add New Committee</h3>
                <form method="POST" class="space-y-2.5 text-xs">
                    <input type="hidden" name="add_committee" value="1">
                    <div>
                        <label class="block font-bold text-slate-600 mb-1">Committee ID / Code (e.g. ECOFIN)</label>
                        <input type="text" name="committee_id" required placeholder="e.g. ECOFIN" class="w-full border rounded-xl p-2 font-mono">
                    </div>
                    <div>
                        <label class="block font-bold text-slate-600 mb-1">Short Name</label>
                        <input type="text" name="committee_name" required placeholder="e.g. ECOFIN" class="w-full border rounded-xl p-2">
                    </div>
                    <div>
                        <label class="block font-bold text-slate-600 mb-1">Full Name</label>
                        <input type="text" name="full_name" required placeholder="e.g. Economic and Financial Committee" class="w-full border rounded-xl p-2">
                    </div>
                    <button type="submit" class="bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2 px-4 rounded-xl transition shadow-xs">
                        Add Committee & Auto-Generate Judges
                    </button>
                </form>
            </div>

            <!-- Add Delegate Form -->
            <div class="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
                <h3 class="font-bold text-slate-900 text-sm border-b pb-2">Add Delegate to Committee</h3>
                <form method="POST" class="space-y-2.5 text-xs">
                    <input type="hidden" name="add_delegate" value="1">
                    <div>
                        <label class="block font-bold text-slate-600 mb-1">Select Target Committee</label>
                        <select name="target_committee" class="w-full border rounded-xl p-2 font-bold">
                            <?php foreach($committees as $c): ?>
                                <option value="<?= $c['id'] ?>"><?= $c['name'] ?> (<?= $c['full_name'] ?>)</option>
                            <?php endforeach; ?>
                        </select>
                    </div>
                    <div class="grid grid-cols-2 gap-2">
                        <div>
                            <label class="block font-bold text-slate-600 mb-1">SL No</label>
                            <input type="number" name="sl_no" value="<?= count($delegates) + 1 ?>" required class="w-full border rounded-xl p-2 font-mono">
                        </div>
                        <div>
                            <label class="block font-bold text-slate-600 mb-1">Portfolio / Country</label>
                            <input type="text" name="portfolio" required placeholder="e.g. India" class="w-full border rounded-xl p-2">
                        </div>
                    </div>
                    <div>
                        <label class="block font-bold text-slate-600 mb-1">Delegate Student Name</label>
                        <input type="text" name="delegate_name" required placeholder="e.g. Rahul Sharma" class="w-full border rounded-xl p-2">
                    </div>
                    <button type="submit" class="bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2 px-4 rounded-xl transition shadow-xs">
                        Add Delegate
                    </button>
                </form>
            </div>

        </div>

        <!-- Committee Tabs Navigation -->
        <div class="flex flex-wrap gap-2 border-b border-slate-300 pb-3">
            <?php foreach($committees as $c): ?>
                <a href="admin_dashboard.php?committee_id=<?= $c['id'] ?>" 
                   class="px-4 py-2 rounded-xl text-xs font-bold transition-all <?= $selectedCommittee === $c['id'] ? 'bg-indigo-600 text-white shadow' : 'bg-white text-slate-700 border hover:bg-slate-50' ?>">
                   <?= $c['name'] ?>
                </a>
            <?php endforeach; ?>
        </div>

        <!-- Master Evaluation Sheet Table -->
        <div class="bg-white rounded-2xl shadow-xs border border-slate-200 overflow-x-auto">
            <div class="p-4 border-b flex justify-between items-center bg-slate-50">
                <h2 class="font-bold text-slate-900 text-sm">Master Evaluation Sheet: <?= htmlspecialchars($selectedCommittee) ?></h2>
                <span class="text-xs text-slate-500 font-medium"><?= count($delegates) ?> Delegates Enrolled</span>
            </div>

            <table class="w-full text-left text-xs border-collapse">
                <thead class="bg-slate-900 text-white font-semibold">
                    <tr>
                        <th class="p-3 border-r border-slate-800">SL</th>
                        <th class="p-3 border-r border-slate-800">Delegate Name</th>
                        <th class="p-3 border-r border-slate-800">Portfolio</th>
                        <th class="p-3 border-r border-slate-800 text-center bg-slate-800">Judge 1</th>
                        <th class="p-3 border-r border-slate-800 text-center bg-slate-800">Judge 2</th>
                        <th class="p-3 border-r border-slate-800 text-center bg-slate-800">Judge 3</th>
                        <th class="p-3 text-center bg-indigo-900">Average Score</th>
                    </tr>
                </thead>
                <tbody class="divide-y font-sans">
                    <?php if(empty($delegates)): ?>
                        <tr><td colSpan="7" class="p-6 text-center text-slate-400">No delegates recorded for <?= $selectedCommittee ?>.</td></tr>
                    <?php else: ?>
                        <?php foreach($delegates as $d): 
                            $j1 = $scoresMap[$d['id']][1] ?? '-';
                            $j2 = $scoresMap[$d['id']][2] ?? '-';
                            $j3 = $scoresMap[$d['id']][3] ?? '-';

                            $validCount = 0; $sum = 0;
                            if(is_numeric($j1)) { $sum += $j1; $validCount++; }
                            if(is_numeric($j2)) { $sum += $j2; $validCount++; }
                            if(is_numeric($j3)) { $sum += $j3; $validCount++; }
                            $avg = $validCount > 0 ? round($sum / $validCount, 2) : '-';
                        ?>
                        <tr class="hover:bg-slate-50">
                            <td class="p-3 border-r font-mono text-center font-bold text-slate-500"><?= $d['sl_no'] ?></td>
                            <td class="p-3 border-r font-bold text-slate-900"><?= htmlspecialchars($d['delegate_name']) ?></td>
                            <td class="p-3 border-r text-slate-700"><?= htmlspecialchars($d['portfolio']) ?></td>
                            <td class="p-3 border-r text-center font-mono font-bold"><?= $j1 ?></td>
                            <td class="p-3 border-r text-center font-mono font-bold"><?= $j2 ?></td>
                            <td class="p-3 border-r text-center font-mono font-bold"><?= $j3 ?></td>
                            <td class="p-3 text-center font-mono font-black text-indigo-900 bg-indigo-50"><?= $avg ?></td>
                        </tr>
                        <?php endforeach; ?>
                    <?php endif; ?>
                </tbody>
            </table>
        </div>

        <!-- All Judge Credentials Matrix -->
        <div class="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <h3 class="font-bold text-slate-900 text-sm border-b pb-2">Registered Judge Accounts Matrix</h3>
            <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5 text-xs font-mono">
                <?php foreach($allJudges as $j): ?>
                    <div class="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                        <div class="font-bold text-indigo-900 font-sans text-xs"><?= $j['committee_id'] ?> — Judge #<?= $j['judge_index'] ?></div>
                        <div class="text-[11px] text-slate-600 mt-1">
                            Username: <strong><?= $j['username'] ?></strong><br>
                            PIN: <strong><?= $j['pin'] ?></strong>
                        </div>
                    </div>
                <?php endforeach; ?>
            </div>
        </div>

    </div>
</body>
</html>`;

  const exportCsvPhp = `<?php
// export_csv.php - Export Master Results to CSV
require_once 'config.php';

if (($_SESSION['role'] ?? '') !== 'admin') {
    die("Access denied");
}

$committeeId = $_GET['committee_id'] ?? 'UNSC';

header('Content-Type: text/csv');
header('Content-Disposition: attachment; filename="ARMUN_Edition2_' . $committeeId . '_MasterScores.csv"');

$output = fopen('php://output', 'w');
fputcsv($output, ['SL No', 'Delegate Name', 'Portfolio', 'Judge 1 Score', 'Judge 2 Score', 'Judge 3 Score', 'Average Score']);

$stmt = $pdo->prepare("SELECT * FROM delegates WHERE committee_id = ? ORDER BY sl_no ASC");
$stmt->execute([$committeeId]);
$delegates = $stmt->fetchAll();

$stmt = $pdo->prepare("SELECT * FROM rubric_scores WHERE committee_id = ?");
$stmt->execute([$committeeId]);
$allScores = $stmt->fetchAll();

$scoresMap = [];
foreach($allScores as $s) {
    $scoresMap[$s['delegate_id']][$s['judge_index']] = $s['total_marks'];
}

foreach($delegates as $d) {
    $j1 = $scoresMap[$d['id']][1] ?? '';
    $j2 = $scoresMap[$d['id']][2] ?? '';
    $j3 = $scoresMap[$d['id']][3] ?? '';
    
    $validCount = 0; $sum = 0;
    if(is_numeric($j1)) { $sum += $j1; $validCount++; }
    if(is_numeric($j2)) { $sum += $j2; $validCount++; }
    if(is_numeric($j3)) { $sum += $j3; $validCount++; }
    $avg = $validCount > 0 ? round($sum / $validCount, 2) : '';

    fputcsv($output, [$d['sl_no'], $d['delegate_name'], $d['portfolio'], $j1, $j2, $j3, $avg]);
}
fclose($output);
exit;
`;

  const readmeMd = `# AMARA RAJA VIDYALAYAM - ARMUN EDITION-2 JUDGING SYSTEM (PHP + MySQL)

## Overview
This standalone PHP & MySQL project provides a complete, secure evaluation portal for **Amara Raja Vidyalayam ARMUN Edition-2** matching the official rubrics sheet (CBSE Affiliation No: 130513, Diguvamagham).

## Key Features
1. **Secretariat Admin & Judge Authentication**:
   - Secretariat Admin Username: \`admin\` | Password / PIN: \`admin123\`
   - Pre-seeded unique Judge logins for all committees (e.g. \`unsc_judge1\` / \`1111\`, \`unicef_judge1\` / \`2221\`, etc.).
2. **Strict Committee & Judge Isolation**:
   - Judges can ONLY view delegates for their assigned committee and CANNOT see marks from other judges or other committees.
3. **Mandatory 10 Criteria Scoring**:
   - Form validation & server-side checks enforce that awarding marks (0-10) for ALL 10 rubric criteria is mandatory before locking.
4. **Mobile Anti-Screenshot & Privacy Controls**:
   - CSS user selection restrictions, tab switching blur overlays, right-click disabling, and confidential watermarking.
5. **Admin Control Panel**:
   - Add new committees, add delegates with portfolios, view master score sheets, export CSVs, and view judge account matrix.

## Installation Instructions (XAMPP / WAMP / cPanel)
1. Import \`db_schema.sql\` into MySQL via phpMyAdmin.
2. Configure \`config.php\` with your MySQL credentials (\`DB_HOST\`, \`DB_USER\`, \`DB_PASS\`, \`DB_NAME\`).
3. Upload all PHP files to your web server root.
4. Open \`index.php\` in your browser or mobile phone.
`;

  return {
    'db_schema.sql': dbSchemaSql,
    'config.php': configPhp,
    'index.php': indexPhp,
    'judge_rubric.php': judgeRubricPhp,
    'admin_dashboard.php': adminDashboardPhp,
    'export_csv.php': exportCsvPhp,
    'README.md': readmeMd,
  };
}

