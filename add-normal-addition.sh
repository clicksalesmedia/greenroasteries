#!/bin/bash

# Add the Normal variation addition option using the API
curl -X POST http://localhost:3000/api/variations/types \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Normal",
    "arabicName": "عادي",
    "description": "Default option for products without any additions",
    "isActive": true
  }'

echo -e "\n\nDone! Check the response above to verify the Normal option was added." 