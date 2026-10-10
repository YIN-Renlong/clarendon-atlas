#!/usr/bin/env bash
set -euo pipefail

OWNER="${OWNER:-YIN-Renlong}"
REPO_NAME="${REPO_NAME:-clarendon-atlas}"
WORKSPACE="${WORKSPACE:-/Users/Renlong/Projects/GitHub/YIN-Renlong}"
PROJECT="$WORKSPACE/$REPO_NAME"
REPO="$OWNER/$REPO_NAME"
HTTPS_URL="https://github.com/${REPO}.git"
PACKAGE="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

for dependency in python3 git gh; do
  if ! command -v "$dependency" >/dev/null 2>&1; then
    echo "ERROR: $dependency is required. Install it, then run this command again."
    exit 1
  fi
done
if [ "$PACKAGE" = "$PROJECT" ]; then
  echo "ERROR: run the installer from the downloaded release, outside the target project."
  exit 1
fi
python3 "$PACKAGE/scripts/validate.py"
if ! gh auth status -h github.com; then
  gh auth login --hostname github.com --git-protocol https --web </dev/tty
fi
gh auth setup-git

TASK_TEMP="$(mktemp -d "${TMPDIR:-/tmp}/clarendon-install.XXXXXX")"
trap 'rm -rf "$TASK_TEMP"' EXIT
REMOTE_EXISTS=false
if gh api "repos/$REPO" --jq '.full_name' >"$TASK_TEMP/repo.txt" 2>"$TASK_TEMP/repo-error.txt"; then
  REMOTE_EXISTS=true
elif ! http_status="$(python3 - "$TASK_TEMP/repo-error.txt" <<'PY'
import sys
from pathlib import Path
text = Path(sys.argv[1]).read_text()
print('404' if 'HTTP 404' in text else 'OTHER')
PY
)" || [ "$http_status" != "404" ]; then
  echo "ERROR: unable to verify GitHub repository access."
  cat "$TASK_TEMP/repo-error.txt"
  exit 1
fi

mkdir -p "$WORKSPACE"
if [ -L "$PROJECT" ]; then
  echo "ERROR: project path is a symlink; no files were changed: $PROJECT"
  exit 1
fi
if [ ! -e "$PROJECT" ]; then
  if [ "$REMOTE_EXISTS" = true ]; then
    git clone "$HTTPS_URL" "$PROJECT"
  else
    mkdir -p "$PROJECT"
  fi
elif [ ! -d "$PROJECT" ]; then
  echo "ERROR: the project path is not a directory: $PROJECT"
  exit 1
fi
cd "$PROJECT"

if [ -d .git ] || [ -f .git ]; then
  ROOT="$(git rev-parse --show-toplevel)"
  if [ "$ROOT" != "$PROJECT" ]; then
    echo "ERROR: repository root differs from the project path: $ROOT"
    exit 1
  fi
  if [ -n "$(git status --porcelain)" ]; then
    echo "ERROR: the existing project has uncommitted files. Commit or stash them, then rerun."
    git status --short
    exit 1
  fi
  CURRENT_BRANCH="$(git branch --show-current)"
  if [ "$CURRENT_BRANCH" != main ]; then
    if git rev-parse --verify HEAD >/dev/null 2>&1; then
      echo "ERROR: existing repository is on '$CURRENT_BRANCH'. Switch to main, then rerun."
      exit 1
    fi
    git branch -M main
  fi
else
  PARENT_ROOT="$(git rev-parse --show-toplevel 2>/dev/null || true)"
  if [ -n "$PARENT_ROOT" ]; then
    echo "ERROR: the target is inside another repository: $PARENT_ROOT"
    exit 1
  fi
  if [ "$REMOTE_EXISTS" = true ]; then
    echo "ERROR: a remote repository exists, but this local folder is not its checkout."
    echo "Move or rename this folder and rerun so the remote can be cloned safely."
    exit 1
  fi
  git init -b main
fi

ORIGIN="$(git remote get-url origin 2>/dev/null || true)"
if [ -n "$ORIGIN" ]; then
  case "$ORIGIN" in
    "$HTTPS_URL"|"https://github.com/$REPO"|"git@github.com:$REPO.git") ;;
    *) echo "ERROR: origin points to a different repository; it was not changed."; exit 1 ;;
  esac
fi
if ! git var GIT_AUTHOR_IDENT >/dev/null 2>&1; then
  echo "ERROR: configure your Git name and email before publishing, then rerun."
  exit 1
fi
if [ "$REMOTE_EXISTS" = true ]; then
  REMOTE_HEADS="$(git ls-remote --heads "$HTTPS_URL")"
  HAS_MAIN="$(printf '%s' "$REMOTE_HEADS" | python3 -c 'import sys; print("yes" if any(line.endswith("refs/heads/main") for line in sys.stdin.read().splitlines()) else "no")')"
  if [ "$HAS_MAIN" = yes ]; then
    git fetch "$HTTPS_URL" main
    if git rev-parse --verify HEAD >/dev/null 2>&1; then
      if git merge-base --is-ancestor HEAD FETCH_HEAD; then
        git merge --ff-only FETCH_HEAD
      elif ! git merge-base --is-ancestor FETCH_HEAD HEAD; then
        echo "ERROR: local main and GitHub main have diverged. No package files were changed."
        exit 1
      fi
    fi
  elif [ -n "$REMOTE_HEADS" ]; then
    echo "ERROR: the existing GitHub repository has branches but no main branch."
    exit 1
  fi
fi

python3 "$PACKAGE/scripts/install_files.py" "$PACKAGE" "$PROJECT" "$WORKSPACE/_project_backups" "$TASK_TEMP/paths.txt"
python3 "$PROJECT/scripts/validate.py"

if [ "$ORIGIN" != "$HTTPS_URL" ]; then
    CONFIG_PATH="$(git rev-parse --git-path config)"
    python3 - "$CONFIG_PATH" "$WORKSPACE/_project_backups" "$REPO_NAME" <<'PY'
from pathlib import Path
from datetime import datetime, timezone
import shutil, sys
src = Path(sys.argv[1])
backup = Path(sys.argv[2]) / (sys.argv[3] + '-git-config-' + datetime.now(timezone.utc).strftime('%Y%m%d-%H%M%S-%fZ'))
backup.mkdir(parents=True)
shutil.copy2(src, backup / 'config')
print('Git configuration backup: ' + str(backup / 'config'))
PY
  if [ -n "$ORIGIN" ]; then
    git remote set-url origin "$HTTPS_URL"
  else
    git remote add origin "$HTTPS_URL"
  fi
fi

while IFS= read -r path; do
  git add -- "$path"
done <"$TASK_TEMP/paths.txt"
if git diff --cached --quiet; then
  echo "No changes to commit."
else
  git commit -m "Build Clarendon Atlas v0.2a"
fi
if [ "$REMOTE_EXISTS" = false ]; then
  gh repo create "$REPO" --public --description "An independent exploration of the published Clarendon scholar lists"
fi
git push -u origin main

if gh api --method POST "/repos/$REPO/pages" -f 'source[branch]=main' -f 'source[path]=/' >"$TASK_TEMP/pages.json" 2>"$TASK_TEMP/pages-error.txt"; then
  echo "GitHub Pages configured."
elif gh api --method PUT "/repos/$REPO/pages" -f 'source[branch]=main' -f 'source[path]=/' >"$TASK_TEMP/pages.json" 2>"$TASK_TEMP/pages-error.txt"; then
  echo "GitHub Pages configuration updated."
else
  echo "WARNING: the repository was pushed, but GitHub Pages setup did not succeed."
  cat "$TASK_TEMP/pages-error.txt"
fi

PREVIEW_URL="$(python3 - "$PROJECT" <<'PY'
from pathlib import Path
import json, os, socket, subprocess, sys, time
project = Path(sys.argv[1])
state_file = project / '.preview.json'
if state_file.is_file():
    try:
        old = json.loads(state_file.read_text())
        cmd = subprocess.check_output(['ps', '-p', str(int(old['pid'])), '-o', 'command='], text=True)
        if '-m http.server ' + str(int(old['port'])) in cmd and '--directory ' + str(project) in cmd:
            print(old['url'])
            raise SystemExit
    except (ValueError, KeyError, OSError, subprocess.CalledProcessError):
        pass
for port in range(8000, 8010):
    try:
        with socket.socket() as probe:
            probe.bind(('127.0.0.1', port))
        log = (project / ('.preview-' + str(port) + '.log')).open('a')
        process = subprocess.Popen([sys.executable, '-m', 'http.server', str(port), '--bind', '127.0.0.1', '--directory', str(project)],
                                   stdin=subprocess.DEVNULL, stdout=log, stderr=log, start_new_session=True)
        log.close()
        time.sleep(0.3)
        if process.poll() is not None:
            continue
        url = 'http://localhost:' + str(port)
        state_file.write_text(json.dumps({'pid': process.pid, 'port': port, 'url': url}) + '\n')
        print(url)
        break
    except OSError:
        continue
else:
    print('Preview not started: ports 8000–8009 are unavailable.')
PY
)"
OWNER_LOWER="$(printf '%s' "$OWNER" | tr '[:upper:]' '[:lower:]')"
echo ""
echo "Done: Clarendon Atlas v0.2a"
echo "Project: $PROJECT"
echo "Repository: https://github.com/$REPO"
echo "GitHub Pages: https://${OWNER_LOWER}.github.io/${REPO_NAME}/"
echo "Pages may take a few minutes to finish building."
echo "Local preview: $PREVIEW_URL"
echo "Git status:"
git status --short
case "$PREVIEW_URL" in
  http://*) if command -v open >/dev/null 2>&1; then open "$PREVIEW_URL" || true; fi ;;
esac
