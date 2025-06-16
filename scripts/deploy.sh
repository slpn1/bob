#!/bin/bash

# Build the app
npm run build

# Add all changes to git
git add .

# Commit with the message passed as an argument
git commit -m "$1"

git push origin main

# Push to Heroku remote
git push heroku main
