# Firebase Studio / IDX configuration for SoftCodeSolution
# Auto-start: PostgreSQL + Go web backend + Angular frontend

{ pkgs, ... }: {
  channel = "unstable";

  packages = [
    pkgs.go
    pkgs.nodejs_22
    pkgs.git
    pkgs.bash
    pkgs.curl

    pkgs.gcc
    pkgs.pkg-config
    pkgs.gnumake

    pkgs.postgresql_16
    pkgs.sqlite-interactive
  ];

  env = {
    SOFTCODESOLUTION_MODE = "idx";

    SCS_IDX_MODE = "1";
    SCS_DB_HOST = "127.0.0.1";
    SCS_DB_PORT = "5432";
    SCS_DB_NAME = "softcodesolution";
    SCS_FAILOVER_PROMOTE_COMMAND = "pg_ctl -D /home/user/.softcodesolution-postgres promote";
    SCS_HOT_STANDBY_DSN = "";
    SCS_DB_SSLMODE = "disable";

    # =====================================================
    # SCS OFFSITE PROTECTION
    # Filesystem provider.
    # Keep outside project backup tree.
    # =====================================================
    SCS_OFFSITE_ROOT = "/home/user/.softcodesolution-offsite";
    SCS_OFFSITE_RETENTION_DAYS = "30";

    GO_API_PORT = "8080";
    SCS_ALLOWED_ORIGIN = "*";

    # Important: main.go default web-only mode me chal raha hai.
    SOFTCODE_WEB_ONLY = "1";
    SOFTCODE_LICENSE_REQUIRED = "false";
    SOFTCODE_PREVIEW_ADDR = "127.0.0.1:8080";
    SOFTCODE_POSTGRES_DB = "softcodesolution";
    SOFTCODE_POSTGRES_SCHEMA = "backend/auth/database/cloud_schema.sql";
    SOFTCODE_SQLITE_DB = "backend/auth/database/local_softcodesolution.db";
    SOFTCODE_SQLITE_SCHEMA = "backend/auth/database/local_schema.sql";
  };

  idx = {
    extensions = [
      "angular.ng-template"
      "golang.go"
    ];

    previews = {
      enable = true;

      previews = {
        web = {
          cwd = ".";

          command = [
            "bash"
            "-lc"
            ''
              set -e

              cd ~/softcodesolution

              echo "========================================"
              echo " SoftCodeSolution IDX AUTO START"
              echo " PostgreSQL + Go Web Backend + Angular"
              echo "========================================"

              export PORT="''${PORT:-9000}"

              echo "Node:"
              node -v

              echo "NPM:"
              npm -v

              echo "Go:"
              go version

              echo "PostgreSQL:"
              postgres --version

              echo "SQLite:"
              sqlite3 --version || true

              # =====================================================
              # 1. POSTGRESQL AUTO START
              # =====================================================

              export PGDATA="$HOME/.softcodesolution-postgres"
              export PGHOST="127.0.0.1"
              export PGPORT="5432"

              if [ ! -s "$PGDATA/PG_VERSION" ]; then
                echo "ERROR: PostgreSQL cluster does not exist:"
                echo "$PGDATA"
                echo "Refusing initdb or database deletion."
                exit 1
              fi


              if pg_isready -h 127.0.0.1 -p 5432 >/dev/null 2>&1; then
                echo "PostgreSQL already running."
              else
                echo "Starting PostgreSQL..."
                pg_ctl -D "$PGDATA" \
                  -l "$HOME/softcodesolution-postgres.log" \
                  -o "-h 127.0.0.1 -p 5432 -k /tmp" \
                  start || true
              fi

              sleep 2

              if ! pg_isready -h 127.0.0.1 -p 5432 >/dev/null 2>&1; then
                echo "PostgreSQL did not start. Showing log:"
                tail -100 "$HOME/softcodesolution-postgres.log" || true
                exit 1
              fi

              echo "PostgreSQL ready."

              # =====================================================
              # 2. DATABASE AUTO CREATE
              # =====================================================

              echo "Checking database softcodesolution..."

              if psql -h 127.0.0.1 -p 5432 -U "$(whoami)" -d postgres -tc "SELECT 1 FROM pg_database WHERE datname='softcodesolution'" | grep -q 1; then
                echo "Database softcodesolution already exists."
              else
                echo "Creating database softcodesolution..."
                createdb -h 127.0.0.1 -p 5432 -U "$(whoami)" softcodesolution
              fi

              # =====================================================
              # 3. POSTGRESQL CLOUD SCHEMA AUTO APPLY
              # =====================================================

              if [ -f backend/auth/database/cloud_schema.sql ]; then
                echo "Applying backend/auth/database/cloud_schema.sql..."
                psql -h 127.0.0.1 -p 5432 -U "$(whoami)" -d softcodesolution \
                  -f backend/auth/database/cloud_schema.sql || true
              else
                echo "Warning: backend/auth/database/cloud_schema.sql not found."
              fi

              # =====================================================
              # 4. SQLITE LOCAL DB AUTO APPLY
              # =====================================================

              if [ -f backend/auth/database/local_schema.sql ]; then
                echo "Applying backend/auth/database/local_schema.sql..."
                mkdir -p backend/auth/database
                sqlite3 backend/auth/database/local_softcodesolution.db \
                  < backend/auth/database/local_schema.sql || true
              else
                echo "Warning: backend/auth/database/local_schema.sql not found."
              fi

              # =====================================================
              # 5. FRONTEND INSTALL + BUILD
              # Go embed needs frontend/dist/softcode-ui/browser before go run .
              # =====================================================

              cd ~/softcodesolution/frontend

              if [ ! -f package.json ]; then
                echo "Error: frontend/package.json nahi mila"
                exit 1
              fi

              if [ ! -d node_modules ]; then
                echo "Installing frontend packages..."
                npm install
              fi

              echo "Building Angular frontend for Go embed..."
              npm run build

              # =====================================================
              # 6. ANGULAR PROXY AUTO CREATE
              # =====================================================

              cat > proxy.conf.json <<'EOF'
{
  "/api": {
    "target": "http://127.0.0.1:8080",
    "secure": false,
    "changeOrigin": true,
    "logLevel": "debug"
  },
  "/healthz": {
    "target": "http://127.0.0.1:8080",
    "secure": false,
    "changeOrigin": true,
    "logLevel": "debug"
  },
  "/readyz": {
    "target": "http://127.0.0.1:8080",
    "secure": false,
    "changeOrigin": true,
    "logLevel": "debug"
  }
}
EOF

              # =====================================================
              # 7. GO WEB BACKEND AUTO START
              # =====================================================

              cd ~/softcodesolution

              echo "Checking Go backend on port 8080..."

              if curl -s http://127.0.0.1:8080/healthz >/dev/null 2>&1; then
                echo "Go backend already running."
              else
                echo "Starting Go backend on port 8080..."

                nohup bash -lc '
                  cd ~/softcodesolution

                  export PGHOST="127.0.0.1"
                  export PGPORT="5432"

                  export SCS_IDX_MODE="1"
                  export SCS_DB_HOST="127.0.0.1"
                  export SCS_DB_PORT="5432"
                  export SCS_DB_USER="$(whoami)"
                  export SCS_DB_PASSWORD=""
                  export SCS_DB_NAME="softcodesolution"
                  export SCS_DB_SSLMODE="disable"

                  export SCS_OFFSITE_ROOT="$HOME/.softcodesolution-offsite"
                  export SCS_OFFSITE_RETENTION_DAYS="30"
                  export GO_API_PORT="8080"
                  export SCS_ALLOWED_ORIGIN="*"

                  export SOFTCODE_WEB_ONLY="1"
                  export SOFTCODE_LICENSE_REQUIRED="false"
                  export SOFTCODE_PREVIEW_ADDR="127.0.0.1:8080"
                  export SOFTCODE_POSTGRES_DB="softcodesolution"
                  export SOFTCODE_POSTGRES_SCHEMA="backend/auth/database/cloud_schema.sql"
                  export SOFTCODE_SQLITE_DB="backend/auth/database/local_softcodesolution.db"
                  export SOFTCODE_SQLITE_SCHEMA="backend/auth/database/local_schema.sql"

                  go mod tidy
                  go run .
                ' > "$HOME/softcodesolution-backend.log" 2>&1 &
              fi

              echo "Waiting for backend..."
              for i in 1 2 3 4 5 6 7 8 9 10 11 12 13 14 15; do
                if curl -s http://127.0.0.1:8080/healthz >/dev/null 2>&1; then
                  echo "Backend ready."
                  break
                fi
                echo "Backend not ready yet... $i"
                sleep 2
              done

              echo "Backend health check:"
              curl -s http://127.0.0.1:8080/healthz || true
              echo ""

              if ! curl -s http://127.0.0.1:8080/healthz >/dev/null 2>&1; then
                echo "Backend failed. Showing log:"
                tail -100 "$HOME/softcodesolution-backend.log" || true
                exit 1
              fi

              # =====================================================
              # 8. ANGULAR FRONTEND AUTO START
              # =====================================================

              cd ~/softcodesolution/frontend

              echo "Starting Angular frontend on IDX port: $PORT"
              echo "Frontend /api, /healthz, /readyz will proxy to Go backend 8080"

              npx ng serve \
                --host 0.0.0.0 \
                --port "$PORT" \
                --proxy-config proxy.conf.json
            ''
          ];

          manager = "web";

          env = {
            PORT = "$PORT";
          };
        };
      };
    };

    workspace = {
      onCreate = {
        frontend-install = "cd frontend && npm install";
        go-tidy = "go mod tidy || true";
      };

      onStart = {};
    };
  };
}
