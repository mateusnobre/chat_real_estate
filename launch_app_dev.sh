#!/bin/bash


# start the flask server
python ./flask_server.py &
echo "flask_server running..."

# assumes you've ran npm install already (dockerfile does this during build)
cd react_frontend && npm install && npm run start