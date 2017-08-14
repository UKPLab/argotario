#!/bin/sh
# you need to install ttab

# SHORT .SH TO START THE ENVIRONMET FOR ARGUTARIO
echo "Argutario development environment"
echo "Start Arguaturio for local development"

# CHECK IF ALL NEEDED LIBS EXIST
echo "Check necessary libs"
# TODO

# START MONGODB
echo "Start MongoDB"
ttab "mongod --auth --port 27017 --dbpath ./mongodb/"

# START ARGUTARIO CLIENT
echo "Start Argutario"
ttab "python3 ./argueserver/startServer.py"

# START IONIC
echo "Start for local test ionic"
cd arguegame
ttab "ionic serve --lab"