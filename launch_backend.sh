#!/bin/bash

# start backend index server
gunicorn --check_config flask_server:app
gunicorn flask_server:app
echo "flask_server running..."
