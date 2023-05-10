#!/bin/bash

# start backend index server
gunicorn flask_server:app
echo "flask_server running..."
