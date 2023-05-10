#!/bin/bash

# start backend index server
gunicorn -c initialize_index.py flask_server:app &
echo "flask_server running..."
