#!/usr/bin/env bash

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
PYTHON_VENV_DIR=$SCRIPT_DIR/venv
PYTHON_VENV_REQUIREMENTS_FILE=$SCRIPT_DIR/requirements.txt

# Make script stop when an error happens
set -e

# Go to script directory even when run from another one
cd "$SCRIPT_DIR"

# Create/Update and enter virtual environment
if ! [ -d "$PYTHON_VENV_DIR" ]; then
    python3 -m venv "$PYTHON_VENV_DIR"
    source "$PYTHON_VENV_DIR/bin/activate"
    pip install --upgrade pip
    if ! [ -f "$PYTHON_VENV_REQUIREMENTS_FILE" ]; then
        pip install --upgrade Pillow
        pip freeze > "$PYTHON_VENV_REQUIREMENTS_FILE"
    else
        pip install -r "$PYTHON_VENV_REQUIREMENTS_FILE"
    fi
else
    source "$PYTHON_VENV_DIR/bin/activate"
fi

# Run
python3 -m create_icon_ico
