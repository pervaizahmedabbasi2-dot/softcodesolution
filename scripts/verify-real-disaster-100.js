const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const root = process.cwd();

const expectedTests = [
  'TestOfficeMirrorTamperAndAutoHeal',
  'TestOffsitePackageTamperAndAutoHeal',
  'TestGuardianSupervisionAndHealing',
  'TestEndToEndDisasterRecoverySimulation',
  'TestFiveLayer_Layer1_ArtifactFailureDetection',
  'TestFiveLayer_Layer2_MirrorFailureRecovery',
  'TestFiveLayer_Layer3_OffsiteTamperDetection',
  'TestFiveLayer_Layer4_ReconciliationEventContract',
  'TestFiveLayer_Layer5_ProcessFailureRecoveryContract',
  'TestFiveLayer_RecoveryEventPersistenceContract',
  'TestLayer1_ArtifactCorruptionDetection',
  'TestLayer2_OfficeMirrorCorruptionDetection',
  'TestLayer2_OfficeMirrorDeletionDetection',
  'TestLayer3_OffsiteTamperDetection',
  'TestLayer4_BrokenRecoveryPointDetection',
  'TestLayer5_ProcessFailureSimulation'
];

const criticalFiles = [
  'backend/backup/five_layer_disaster_test.go',
  'backend/backup/real_five_layer_disaster_test.go',
  'backend/backup/offsite_test.go',
  'backend/backup/reconciliation.go',
  'backend/backup/offsite.go',
  'backend/backup/office_mirror.go',
  'backend/backup/backup_service.go',
  'backend/backup/recovery_events.go'
];

function banner(title) {
  console.log(\`
============================================================
\${title}
============================================================
\`);
}

function fail(message, code = 1) {
  console.error(\`
============================================================
🔴 HARD VERIFICATION FAILED
============================================================

\${message}

STOP.
No further validation will be performed.
============================================================
\`);

  process.exit(code);
}

function run(command, label, code = 2) {
  banner('🧪 ' + label);

  console.log('>>> ' + command + '\\n');

  try {
    return execSync(command, {
      cwd: root,
      shell: '/bin/bash',
      encoding: 'utf8',
      stdio: ['inherit', 'pipe', 'pipe'],
      maxBuffer: 100 * 1024 * 1024
    });
  } catch (error) {
    const stdout = String(error.stdout || '');
    const stderr = String(error.stderr || '');

    if (stdout) process.stdout.write(stdout);
    if (stderr) process.stderr.write(stderr);

    fail(
      \`\${label} failed.
Command:
\${command}\`,
      code
    );
  }
}

function assertContains(output, value, label) {
  if (!output.includes(value)) {
    fail(
      \`\${label}
Expected output token was not found:

\${value}\`,
      20
    );
  }

  console.log('🟢 ' + label);
}

function assertFile(file, label) {
  if (!fs.existsSync(file)) {
    fail(
      \`Missing critical file:
\${file}\`,
      21
    );
  }

  console.log('🟢 ' + label);
}

function verifyTestSet(output, label) {
  for (const testName of expectedTests) {
    if (!output.includes('=== RUN   ' + testName)) {
      fail(
        \`\${label}: expected disaster test did not execute:

\${testName}\`,
        22
      );
    }

    if (
      !output.includes(
        '--- PASS: ' + testName
      )
    ) {
      fail(
        \`\${label}: expected disaster test did not PASS:

\${testName}\`,
        23
      );
    }
  }

  console.log(
    \`🟢 \${label}: all required disaster tests executed and passed\`
  );
}

/*
============================================================
0. PREFLIGHT
============================================================
*/

banner('🛡️ REAL DISASTER 100% VERIFICATION GATE');

console.log(\`
Repository:
\${root}

Policy:

NO production database reset
NO production recovery deletion
NO live restore
NO initdb
NO DROP DATABASE
NO CREATE ROLE
NO source recovery logic modification
Tests must remain isolated
\`);

for (const rel of criticalFiles) {
  assertFile(
    path.join(root, rel),
    rel
  );
}

/*
============================================================
1. DISCOVER TESTS
============================================================
*/

const discovered = run(
  "go test ./backend/backup/... -list 'Test.*' 2>&1",
  'DISCOVER ALL BACKUP / DISASTER TESTS',
  3
);

for (const testName of expectedTests) {
  assertContains(
    discovered,
    testName,
    'Discovered ' + testName
  );
}

/*
============================================================
2. TARGETED AUTO-HEAL — FRESH RUN
============================================================
*/

const targeted = run(
  "env -u SCS_OFFSITE_RCLONE_REMOTE go test ./backend/backup/... -run 'TestOfficeMirrorTamperAndAutoHeal|TestOffsitePackageTamperAndAutoHeal|TestGuardianSupervisionAndHealing|TestEndToEndDisasterRecoverySimulation' -count=1 -v",
  'TARGETED REAL AUTO-HEAL / DISASTER RUN',
  4
);

assertContains(
  targeted,
  'PASS',
  'Targeted suite returned PASS'
);

verifyTestSet(
  targeted,
  'TARGETED REAL DISASTER SUITE'
);

/*
============================================================
3. FIVE-LAYER FRESH RUN
============================================================
*/

const fiveLayer = run(
  "go test ./backend/backup/... -run 'TestFiveLayer' -count=1 -v",
  'FIVE-LAYER DISASTER RUN',
  5
);

verifyTestSet(
  fiveLayer,
  'FIVE-LAYER DISASTER SUITE'
);

/*
============================================================
4. FULL DATA PROTECTION
============================================================
*/

const fullBackup = run(
  'go test ./backend/backup/... -count=1 -v',
  'FULL DATA PROTECTION FRESH RUN',
  6
);

verifyTestSet(
  fullBackup,
  'FULL DATA PROTECTION SUITE'
);

/*
============================================================
5. REPEATABILITY — RUN #2
============================================================
*/

const repeat2 = run(
  'go test ./backend/backup/... -count=1',
  'DATA PROTECTION REPEATABILITY RUN #2',
  7
);

assertContains(
  repeat2,
  'PASS',
  'Repeatability run #2 PASS'
);

/*
============================================================
6. REPEATABILITY — RUN #3
============================================================
*/

const repeat3 = run(
  'go test ./backend/backup/... -count=1',
  'DATA PROTECTION REPEATABILITY RUN #3',
  8
);

assertContains(
  repeat3,
  'PASS',
  'Repeatability run #3 PASS'
);

/*
============================================================
7. RACE DETECTOR
============================================================
*/

run(
  'go test -race ./backend/backup/... -count=1',
  'GO RACE DETECTOR — BACKUP PACKAGE',
  9
);

/*
============================================================
8. FULL GO PROJECT
============================================================
*/

run(
  'go test ./... -count=1',
  'FULL GO PROJECT FRESH TEST',
  10
);

/*
============================================================
9. FULL GO BUILD
============================================================
*/

run(
  'go build ./...',
  'FULL GO PROJECT BUILD',
  11
);

/*
============================================================
10. SOURCE CONTRACT
============================================================
*/

const reconFile =
  path.join(
    root,
    'backend',
    'backup',
    'reconciliation.go'
  );

const offsiteFile =
  path.join(
    root,
    'backend',
    'backup',
    'offsite.go'
  );

const recon =
  fs.readFileSync(reconFile, 'utf8');

const offsite =
  fs.readFileSync(offsiteFile, 'utf8');

const sourceContracts = [
  [
    'SCS_OFFSITE_ROOT',
    recon.includes('SCS_OFFSITE_ROOT')
  ],
  [
    'manifest.OffsitePath',
    recon.includes('manifest.OffsitePath')
  ],
  [
    'canonical offsite recovery path',
    recon.includes(
      'filepath.Join(cleanupRoot, id)'
    )
  ],
  [
    'cleanup deduplication',
    recon.includes('seenCleanupPaths')
  ],
  [
    'cleanup error propagation',
    recon.includes(
      'offsite stale tree cleanup failed'
    )
  ],
  [
    'offsite auto-healing',
    recon.includes(
      's.createOffsiteCopy('
    )
  ],
  [
    'offsite verification gate',
    recon.includes(
      'if !offsite.Verified'
    )
  ],
  [
    'rebuilt SHA mismatch protection',
    recon.includes(
      'rebuilt offsite SHA mismatch'
    )
  ],
  [
    'directory SHA-256',
    recon.includes(
      'directorySHA256'
    )
  ],
  [
    'offsite SHA-256',
    offsite.includes(
      'directorySHA256'
    )
  ]
];

banner('🔎 CRITICAL DATA PROTECTION SOURCE CONTRACT');

let sourceFailed = false;

for (const [name, ok] of sourceContracts) {
  console.log(
    (ok ? '🟢 ' : '🔴 ') + name
  );

  if (!ok) {
    sourceFailed = true;
  }
}

if (sourceFailed) {
  fail(
    'One or more critical Data Protection source contracts are missing.',
    12
  );
}

/*
============================================================
11. ANGULAR PRODUCTION BUILD
============================================================
*/

const packageFile =
  path.join(
    root,
    'frontend',
    'package.json'
  );

assertFile(
  packageFile,
  'frontend/package.json'
);

run(
  'npm --prefix frontend run build',
  'ANGULAR PRODUCTION BUILD',
  13
);

const dist =
  path.join(
    root,
    'frontend',
    'dist',
    'softcode-ui'
  );

const indexCandidates = [
  path.join(dist, 'index.html'),
  path.join(dist, 'browser', 'index.html')
];

const indexFile =
  indexCandidates.find(
    file => fs.existsSync(file)
  );

if (!indexFile) {
  fail(
    'Angular production build completed but index.html was not found.',
    14
  );
}

console.log(
  '🟢 Angular production index: ' +
  indexFile
);

/*
============================================================
12. FINAL HARD GATE
============================================================
*/

banner('🟢 REAL DISASTER VERIFICATION COMPLETE');

console.log(\`
Required disaster tests       ✅
Layer 1                       ✅
Layer 2                       ✅
Layer 3                       ✅
Layer 4                       ✅
Layer 5                       ✅

Office Mirror auto-heal       ✅
Offsite auto-heal             ✅
Guardian healing              ✅
End-to-end disaster           ✅
SHA integrity                 ✅
Recovery event contract       ✅

Fresh run                     ✅
Repeatability #2              ✅
Repeatability #3              ✅
Go race detector              ✅
Full Go tests                 ✅
Full Go build                 ✅
Source contracts              ✅
Angular production build      ✅

============================================================

IMPORTANT:

This verification proves the implemented disaster-test
scenarios execute successfully and repeatedly.

It does NOT claim mathematical "100% reliability" of every
possible production failure mode.

It DOES enforce that the repository's defined disaster
scenarios cannot silently disappear or be skipped.

NO production database reset.
NO production recovery deletion.
NO live restore.
NO destructive repository operation.

============================================================
🛡️ DATA PROTECTION VERIFICATION GATE = GREEN
============================================================
\`);
