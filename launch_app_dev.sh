#!/bin/bash


# start the flask server
python3 gunicorn.conf.py &
python3 flask_server.py &
echo "flask_server running..." &

# assumes you've ran npm install already (dockerfile does this during build)
export NODE_OPTIONS=--openssl-legacy-provider && cd react_frontend && npm install && npm run start