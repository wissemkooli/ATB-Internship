activate env:
venv\Scripts\Activate.ps1

run server:
uvicorn backend.main:app --reload