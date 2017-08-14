#!/bin/sh
# you need to install konsole

# SHORT .SH TO START THE ENVIRONMENT FOR ARGUTARIO
echo "Argutario development environment"
echo "Start Arguaturio for local development"

# CHECK IF ALL NEEDED LIBS EXIST
echo "Check necessary libs"
# TODO

# START MONGODB
echo "Start MongoDB"
konsole --noclose -e "mongod --auth --port 27017 --dbpath ./mongodb/"
sleep 5s

# START ARGUTARIO CLIENT
echo "Start Argutario"
cd argueserver
konsole --noclose -e "python3 ./startServer.py"
sleep 1s

# START IONIC
echo "Start for local test ionic"
cd ..
cd arguegame
konsole --noclose -e "ionic serve --address localhost"


# GO BACK
cd ..
