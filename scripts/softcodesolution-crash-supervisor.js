#!/usr/bin/env node

/*
 * SCS_PHASE752G_CRASH_SUPERVISOR
 *
 * Independent process supervisor for SoftCodeSolution.
 *
 * Responsibilities:
 *
 * 1. Start the application.
 * 2. Monitor process health.
 * 3. Detect unexpected process exit.
 * 4. Detect health endpoint failure.
 * 5. Restart automatically.
 * 6. Apply bounded exponential backoff.
 *
 * It does NOT:
 *
 * - restore databases
 * - mutate PostgreSQL
 * - mutate SQLite
 * - bypass the Recovery Engine
 *
 * Recovery remains the responsibility of the existing
 * Guardian / Backup / Reconciliation layers.
 */

'use strict';

const { spawn } = require('child_process');
const http = require('http');

const HOST =
  process.env.SCS_HEALTH_HOST || '127.0.0.1';

const PORT =
  Number(
    process.env.SCS_HEALTH_PORT || '8080'
  );

const HEALTH_PATH =
  process.env.SCS_HEALTH_PATH || '/healthz';

const HEALTH_INTERVAL_MS =
  Number(
    process.env.SCS_SUPERVISOR_HEALTH_INTERVAL_MS ||
    '5000'
  );

const HEALTH_TIMEOUT_MS =
  Number(
    process.env.SCS_SUPERVISOR_HEALTH_TIMEOUT_MS ||
    '3000'
  );

const INITIAL_BACKOFF_MS =
  Number(
    process.env.SCS_SUPERVISOR_INITIAL_BACKOFF_MS ||
    '1000'
  );

const MAX_BACKOFF_MS =
  Number(
    process.env.SCS_SUPERVISOR_MAX_BACKOFF_MS ||
    '15000'
  );

const MAX_HEALTH_FAILURES =
  Number(
    process.env.SCS_SUPERVISOR_MAX_HEALTH_FAILURES ||
    '3'
  );

/*
 * Default development command.
 *
 * Production can override this with:
 *
 * SCS_SUPERVISED_COMMAND
 * SCS_SUPERVISED_ARGS
 */

const command =
  process.env.SCS_SUPERVISED_COMMAND ||
  'go';

const args =
  process.env.SCS_SUPERVISED_ARGS
    ? JSON.parse(
        process.env.SCS_SUPERVISED_ARGS
      )
    : ['run', '.'];

let child = null;
let stopping = false;
let restarting = false;

let backoff =
  INITIAL_BACKOFF_MS;

let healthFailures = 0;

let healthTimer = null;
let restartTimer = null;

function audit(event, message) {

  const line =
    '[SUPERVISOR] ' +
    new Date().toISOString() +
    ' ' +
    event +
    ' ' +
    message;

  console.log(line);
}

function healthCheck() {

  return new Promise((resolve) => {

    const request =
      http.get(
        {
          host: HOST,
          port: PORT,
          path: HEALTH_PATH,
          timeout: HEALTH_TIMEOUT_MS,
          headers: {
            Connection: 'close'
          }
        },
        (response) => {

          const healthy =
            response.statusCode >= 200 &&
            response.statusCode < 300;

          response.resume();

          resolve(
            healthy
          );
        }
      );

    request.on(
      'timeout',
      () => {

        request.destroy();

        resolve(false);
      }
    );

    request.on(
      'error',
      () => {

        resolve(false);
      }
    );
  });
}

function stopHealthMonitoring() {

  if (healthTimer) {

    clearInterval(
      healthTimer
    );

    healthTimer = null;
  }
}

function startHealthMonitoring() {

  stopHealthMonitoring();

  healthTimer =
    setInterval(
      async () => {

        if (
          stopping ||
          !child ||
          child.exitCode !== null
        ) {
          return;
        }

        const healthy =
          await healthCheck();

        if (healthy) {

          if (
            healthFailures !== 0
          ) {

            audit(
              'health_recovered',
              'application health endpoint recovered'
            );
          }

          healthFailures = 0;

          backoff =
            INITIAL_BACKOFF_MS;

          return;
        }

        healthFailures++;

        audit(
          'health_failure',
          'health check failed ' +
          healthFailures +
          '/' +
          MAX_HEALTH_FAILURES
        );

        if (
          healthFailures >=
          MAX_HEALTH_FAILURES
        ) {

          audit(
            'unhealthy_process',
            'application considered unhealthy; restart requested'
          );

          restartChild(
            'health_check_failure'
          );
        }

      },
      HEALTH_INTERVAL_MS
    );
}

function spawnApplication() {

  if (
    stopping ||
    restarting
  ) {
    return;
  }

  restarting = true;

  healthFailures = 0;

  audit(
    'starting',
    command +
    ' ' +
    args.join(' ')
  );

  child =
    spawn(
      command,
      args,
      {
        stdio: 'inherit',
        env: process.env
      }
    );

  child.on(
    'spawn',
    () => {

      restarting = false;

      backoff =
        INITIAL_BACKOFF_MS;

      audit(
        'started',
        'application process started'
      );

      startHealthMonitoring();
    }
  );

  child.on(
    'error',
    (error) => {

      restarting = false;

      audit(
        'process_error',
        error.message
      );

      scheduleRestart(
        'process_error'
      );
    }
  );

  child.on(
    'exit',
    (code, signal) => {

      stopHealthMonitoring();

      child = null;

      if (stopping) {

        audit(
          'stopped',
          'supervisor shutdown requested'
        );

        return;
      }

      audit(
        'unexpected_exit',
        'code=' +
        String(code) +
        ' signal=' +
        String(signal)
      );

      scheduleRestart(
        'unexpected_exit'
      );
    }
  );
}

function restartChild(reason) {

  if (
    stopping ||
    restarting
  ) {
    return;
  }

  restarting = true;

  stopHealthMonitoring();

  const current =
    child;

  child = null;

  audit(
    'restart',
    'reason=' +
    reason
  );

  if (!current) {

    restarting = false;

    scheduleRestart(
      reason
    );

    return;
  }

  current.once(
    'exit',
    () => {

      restarting = false;

      scheduleRestart(
        reason
      );
    }
  );

  try {

    current.kill(
      'SIGTERM'
    );

  } catch (error) {

    audit(
      'terminate_error',
      error.message
    );

    restarting = false;

    scheduleRestart(
      reason
    );
  }

  setTimeout(
    () => {

      if (
        current.exitCode === null
      ) {

        audit(
          'forced_termination',
          'process did not stop after SIGTERM'
        );

        try {
          current.kill('SIGKILL');
        } catch {}
      }

    },
    5000
  );
}

function scheduleRestart(reason) {

  if (
    stopping ||
    restartTimer
  ) {
    return;
  }

  const delay =
    backoff;

  audit(
    'restart_scheduled',
    'reason=' +
    reason +
    ' delay_ms=' +
    delay
  );

  restartTimer =
    setTimeout(
      () => {

        restartTimer = null;

        if (stopping) {
          return;
        }

        spawnApplication();

        backoff =
          Math.min(
            backoff * 2,
            MAX_BACKOFF_MS
          );

      },
      delay
    );
}

function shutdown(signal) {

  if (stopping) {
    return;
  }

  stopping = true;

  audit(
    'shutdown',
    'signal=' +
    signal
  );

  stopHealthMonitoring();

  if (restartTimer) {

    clearTimeout(
      restartTimer
    );

    restartTimer = null;
  }

  if (child) {

    try {
      child.kill('SIGTERM');
    } catch {}
  }

  setTimeout(
    () => {

      if (
        child &&
        child.exitCode === null
      ) {

        try {
          child.kill('SIGKILL');
        } catch {}
      }

      process.exit(0);

    },
    5000
  );
}

process.on(
  'SIGINT',
  () => shutdown('SIGINT')
);

process.on(
  'SIGTERM',
  () => shutdown('SIGTERM')
);

audit(
  'boot',
  'independent crash supervisor started'
);

audit(
  'configuration',
  'health=' +
  HOST +
  ':' +
  PORT +
  HEALTH_PATH +
  ' interval=' +
  HEALTH_INTERVAL_MS +
  'ms'
);

spawnApplication();
