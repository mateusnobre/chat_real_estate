#!/bin/bash

# start backend index server
gunicorn --check-config flask_server:app
gunicorn flask_server:app
echo "flask_server running..."
