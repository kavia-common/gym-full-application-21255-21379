#!/bin/bash
cd /home/kavia/workspace/code-generation/gym-full-application-21255-21379/WebApplication
npm run build
EXIT_CODE=$?
if [ $EXIT_CODE -ne 0 ]; then
   exit 1
fi

