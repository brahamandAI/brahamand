#!/bin/bash

# Script to safely update OpenAI API key

echo "======================================"
echo "  OpenAI API Key Update Tool"
echo "======================================"
echo ""
echo "Current API key status: INVALID"
echo ""
echo "To update your API key:"
echo "1. Get your API key from: https://platform.openai.com/api-keys"
echo "2. Make sure your OpenAI account has credits"
echo "3. Run this command:"
echo ""
echo "   sed -i 's/^OPENAI_API_KEY=.*/OPENAI_API_KEY=YOUR_NEW_KEY_HERE/' /home/ubuntu/htdocs/brahamand/.env"
echo ""
echo "4. Then restart the Docker container:"
echo "   docker-compose restart brahamand"
echo ""
echo "======================================"
echo ""
echo "To test if API key works, run:"
echo "   curl https://api.openai.com/v1/models \\"
echo "     -H \"Authorization: Bearer YOUR_API_KEY\""
echo ""

