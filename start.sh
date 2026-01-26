#!/bin/bash

# Start myst in the background on localhost
myst start --port 3000 &

# Wait a moment for myst to start
sleep 5

# Use socat to proxy from 0.0.0.0:$PORT to localhost:3000
socat TCP-LISTEN:$PORT,fork,bind=0.0.0.0 TCP:127.0.0.1:3000
