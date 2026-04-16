#!/bin/bash
echo "Starting LoanAI Services..."

# Activate python env (check both venv and vnev for typo)
if [ -d "venv" ]; then
    source venv/bin/activate
elif [ -d "vnev" ]; then
    source vnev/bin/activate
fi

cd backend
# Run backend on port 8000
python -m uvicorn app.main:app --reload --port 8000 &
BACKEND_PID=$!
cd ..

# Frontend is currently running on 5173, but we can restart if needed
cd frontend
npm run dev &
FRONTEND_PID=$!
cd ..

echo "Services started. Press Ctrl+C to stop."
wait
